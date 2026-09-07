/**
 * Gemini adapter — the only file in this repository that talks to a model
 * provider. Plain `fetch`, no provider SDK, no types or model names escape it.
 *
 * Contract (AI_FEATURE_SYSTEM.md §3, adopted §10):
 * - The API key is read from the server environment only (GEMINI_API_KEY).
 * - The model identifier is configuration (GEMINI_MODEL), never a caller's choice.
 * - Failures are classified, never thrown with provider detail, and never
 *   include the key. Callers react with the deterministic fallback instead.
 */

export type GeminiFailureKind =
  | "missing_key" // GEMINI_API_KEY not set — deterministic mode
  | "invalid_key" // key rejected (expired, deleted, unrestricted-and-blocked)
  | "forbidden" // key valid but API not enabled / restriction mismatch / region
  | "quota" // rate limit or budget exhausted
  | "safety" // provider refused the content
  | "timeout"
  | "network"
  | "bad_response";

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; kind: GeminiFailureKind; status?: number };

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 12_000;
const API_ORIGIN = "https://generativelanguage.googleapis.com";

export function geminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_MODEL;
}

/** True only when a key is present. Never logs or returns the key. */
export function geminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

type GeminiTurn = { role: "user" | "model"; parts: Array<{ text: string }> };

export type GenerateTextInput = {
  systemInstruction: string;
  contents: GeminiTurn[];
  timeoutMs?: number;
};

function classifyStatus(status: number, body: { error?: { status?: string; message?: string } }): GeminiFailureKind {
  if (status === 400 && /api key not valid|api_key_invalid/i.test(body.error?.message ?? "")) return "invalid_key";
  if (status === 401 || status === 403) return "forbidden";
  if (status === 429) return "quota";
  if (status === 400) return "bad_response";
  if (status >= 500) return "network";
  return "bad_response";
}

export async function generateText({ systemInstruction, contents, timeoutMs = DEFAULT_TIMEOUT_MS }: GenerateTextInput): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return { ok: false, kind: "missing_key" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_ORIGIN}/v1beta/models/${encodeURIComponent(geminiModel())}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
      return { ok: false, kind: classifyStatus(response.status, body), status: response.status };
    }

    const data = (await response.json().catch(() => null)) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      promptFeedback?: { blockReason?: string };
    } | null;

    if (!data) return { ok: false, kind: "bad_response", status: response.status };
    if (data.promptFeedback?.blockReason) return { ok: false, kind: "safety" };

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && /safety|prohibited|recitation/i.test(candidate.finishReason)) {
      return { ok: false, kind: "safety" };
    }

    const text = (candidate?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) return { ok: false, kind: "bad_response", status: response.status };
    return { ok: true, text };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { ok: false, kind: "timeout" };
    return { ok: false, kind: "network" };
  } finally {
    clearTimeout(timer);
  }
}
