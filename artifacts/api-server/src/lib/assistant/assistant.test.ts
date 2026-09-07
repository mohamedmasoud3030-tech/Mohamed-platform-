import { describe, expect, it, vi, afterEach } from "vitest";
import { HELP_ARTICLES } from "@workspace/content";
import { normaliseText, retrieveArticles, scoreArticle, tokenize } from "./retrieval";
import {
  ASSISTANT_SYSTEM_PROMPT,
  buildContents,
  composeFallbackAnswer,
  sanitiseModelAnswer,
} from "./prompt";
import { generateText, geminiEnabled, geminiModel } from "./gemini";
import { SlidingWindowLimiter } from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
});

describe("retrieval", () => {
  it("normalises Arabic skeletons: diacritics, alef variants, ta-marbuta", () => {
    expect(normaliseText("كيف أبدَأ مشروعًا؟")).toBe(normaliseText("كيف ابدأ مشروعا؟"));
  });

  it("stems morphology so ال-prefix and pricing/price still match", () => {
    expect(tokenize("الأسعار")).toEqual(tokenize("اسعار"));
    expect(tokenize("pricing")).toEqual(tokenize("price"));
  });

  it("matches an Arabic question to its article", () => {
    const [best] = retrieveArticles("كيف أبدأ مشروع معكم؟", "ar");
    expect(best?.article.id).toBe("how-to-start");
  });

  it("matches an English question to its article", () => {
    const [best] = retrieveArticles("When should I expect a reply?", "en");
    expect(best?.article.id).toBe("response-time");
  });

  it("matches across languages: an English message finds the pricing article", () => {
    const [best] = retrieveArticles("how much does it cost, what is your pricing?", "ar");
    expect(best?.article.id).toBe("pricing");
  });

  it("returns nothing for a question the corpus does not cover", () => {
    expect(retrieveArticles("ما رأيكم في الطقس اليوم", "ar")).toHaveLength(0);
  });

  it("weights question tokens above answer tokens", () => {
    const article = HELP_ARTICLES.find((entry) => entry.id === "pricing");
    expect(article).toBeDefined();
    if (article) {
      const questionTokens = tokenize("التكلفة");
      const answerOnlyTokens = tokenize("اشتراكًا");
      expect(scoreArticle(article, questionTokens)).toBeGreaterThan(scoreArticle(article, answerOnlyTokens));
    }
  });
});

describe("prompt", () => {
  it("grounds the model on the full verified corpus in both languages", () => {
    const contents = buildContents("كيف أبدأ؟", "ar", []);
    const knowledge = contents[0].parts[0].text;
    for (const article of HELP_ARTICLES) {
      expect(knowledge).toContain(article.id);
      expect(knowledge).toContain(article.answer.ar.slice(0, 20));
      expect(knowledge).toContain(article.answer.en.slice(0, 20));
    }
  });

  it("maps history roles and appends the current message last", () => {
    const contents = buildContents("السؤال الأخير", "ar", [
      { role: "visitor", content: "أول سؤال" },
      { role: "assistant", content: "أول جواب" },
    ]);
    // knowledge turn + acknowledgement turn + 2 history turns + current message
    expect(contents).toHaveLength(5);
    expect(contents[1]).toEqual({ role: "model", parts: [{ text: expect.any(String) }] });
    expect(contents[2]).toEqual({ role: "user", parts: [{ text: "أول سؤال" }] });
    expect(contents[3]).toEqual({ role: "model", parts: [{ text: "أول جواب" }] });
    expect(contents[contents.length - 1].parts[0].text).toBe("السؤال الأخير");
  });

  it("system contract forbids invention, prices beyond the corpus, and personal data", () => {
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/لا تخترع/);
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/سعر/);
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/بيانات شخصية/);
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/واتساب/);
  });

  it("system contract asks for a warm, welcoming tone", () => {
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/ودودة/);
    expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/ترحيب/);
  });

  it("fallback quotes the verified answer verbatim with sources", () => {
    const { answer, sources } = composeFallbackAnswer("ar", retrieveArticles("متى أتوقع الرد؟", "ar"));
    expect(answer).toContain(HELP_ARTICLES.find((a) => a.id === "response-time")!.answer.ar);
    expect(sources[0]?.id).toBe("response-time");
  });

  it("fallback without matches points to a human channel and never invents", () => {
    const { answer, sources } = composeFallbackAnswer("en", []);
    expect(answer).toMatch(/WhatsApp/);
    expect(sources).toHaveLength(0);
  });

  it("sanitises markdown out of model output and caps length", () => {
    const clean = sanitiseModelAnswer("**سعر** الخدمة [هنا](https://example.com) `كود`\n\n\n\nتم");
    expect(clean).toBe("سعر الخدمة هنا كود\n\nتم");
    expect(sanitiseModelAnswer("ط".repeat(2000))).toHaveLength(1600);
  });
});

describe("gemini adapter", () => {
  it("is disabled without a key and reports missing_key", async () => {
    expect(geminiEnabled()).toBe(false);
    const result = await generateText({ systemInstruction: "s", contents: [] });
    expect(result).toEqual({ ok: false, kind: "missing_key" });
  });

  it("uses the configured model and never leaks the key in the URL", async () => {
    process.env.GEMINI_API_KEY = "test-key-123";
    process.env.GEMINI_MODEL = "gemini-test-model";
    let requestedUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        requestedUrl = String(url);
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "جواب" }] } }] }), { status: 200 });
      }),
    );
    const result = await generateText({ systemInstruction: "s", contents: [{ role: "user", parts: [{ text: "مرحبا" }] }] });
    expect(result).toEqual({ ok: true, text: "جواب" });
    expect(geminiModel()).toBe("gemini-test-model");
    expect(requestedUrl).toContain("/v1beta/models/gemini-test-model:generateContent");
    expect(requestedUrl).not.toContain("test-key-123");
  });

  it("classifies an invalid key", async () => {
    process.env.GEMINI_API_KEY = "bad";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { status: "INVALID_ARGUMENT", message: "API key not valid. Please pass a valid API key." } }), { status: 400 }),
      ),
    );
    const result = await generateText({ systemInstruction: "s", contents: [] });
    expect(result).toEqual({ ok: false, kind: "invalid_key", status: 400 });
  });

  it("classifies quota exhaustion", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "quota" } }), { status: 429 })));
    const result = await generateText({ systemInstruction: "s", contents: [] });
    expect(result).toEqual({ ok: false, kind: "quota", status: 429 });
  });

  it("classifies a safety refusal", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }), { status: 200 }),
      ),
    );
    const result = await generateText({ systemInstruction: "s", contents: [] });
    expect(result).toEqual({ ok: false, kind: "safety" });
  });

  it("classifies timeouts", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            });
          }),
      ),
    );
    const result = await generateText({ systemInstruction: "s", contents: [], timeoutMs: 20 });
    expect(result).toEqual({ ok: false, kind: "timeout" });
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then refuses inside the window", () => {
    const limiter = new SlidingWindowLimiter(3, 60_000);
    expect(limiter.check("ip", 1_000)).toBe(true);
    expect(limiter.check("ip", 2_000)).toBe(true);
    expect(limiter.check("ip", 3_000)).toBe(true);
    expect(limiter.check("ip", 4_000)).toBe(false);
  });

  it("forgets hits that fall outside the window", () => {
    const limiter = new SlidingWindowLimiter(2, 60_000);
    limiter.check("ip", 1_000);
    limiter.check("ip", 2_000);
    expect(limiter.check("ip", 3_000)).toBe(false);
    expect(limiter.check("ip", 61_001)).toBe(true);
  });

  it("tracks identities independently", () => {
    const limiter = new SlidingWindowLimiter(1, 60_000);
    expect(limiter.check("a", 1_000)).toBe(true);
    expect(limiter.check("b", 1_001)).toBe(true);
    expect(limiter.check("a", 1_002)).toBe(false);
  });
});
