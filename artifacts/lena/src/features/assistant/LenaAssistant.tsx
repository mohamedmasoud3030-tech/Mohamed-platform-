import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Globe, Send, Sparkles, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { usePreferences } from "@/providers/preferences";
import { track, trackOnce } from "@/lib/analytics";
import { SITE_CONFIG } from "@/config/site";
import { HELP_ARTICLES } from "@/content/help";
import { greetingAudioUrl } from "./greeting-audio";

/**
 * LENA Assistant — the visitor help bot.
 *
 * The assistant answers from the verified help corpus only (see
 * AI_FEATURE_SYSTEM.md §11). The API keys are server-side; this widget knows
 * nothing about Gemini and works identically in both modes (generative and
 * deterministic fallback) — the mode is an operational detail, not a UI state.
 *
 * All tRPC hooks live inside the panel component, which mounts only when the
 * visitor opens the assistant: the FAB stays provider-free, and pages rendered
 * outside the app's TRPCProvider (isolated route tests, embeds) never touch it.
 */

const COPY = {
  ar: {
    fabLabel: "افتح مساعد لينا",
    closeLabel: "أغلق مساعد لينا",
    title: "مساعد لينا",
    subtitle: "يجيب من صفحات المساعدة الموثقة",
    greetingTime: { morning: "صباح الخير ☀️", afternoon: "مساء الخير 👋", evening: "مساء الخير 🌙" },
    greeting:
      "أنا مساعد لينا الآلي، ويسعدني وجودك هنا. اسألني عن طريقة البدء، التكلفة، موعد الرد، أو بياناتك — وسأجيبك من المحتوى الموثق. جرّب أحد الأسئلة التالية أو اكتب سؤالك:",
    teaser: "أهلاً بك في LENA 👋\nأنا المساعد الآلي — تفضل اسألني عن أي شيء عن أنظمتنا وطريقة العمل.",
    teaserClose: "إخفاء الترحيب",
    inputLabel: "اكتب سؤالك",
    inputPlaceholder: "اكتب سؤالك هنا…",
    send: "إرسال",
    disclosure: "مساعد آلي — للرد المؤكد من إنسان، تواصل عبر واتساب.",
    whatsapp: "واتساب",
    rateLimited: "وصلت إلى الحد المؤقت للمحادثة. تواصل معنا على واتساب مباشرة وسنرد فورًا.",
    error: "تعذّر إرسال الرسالة الآن. أعد المحاولة أو تواصل معنا على واتساب.",
    sourceLabel: "من المساعدة:",
  },
  en: {
    fabLabel: "Open the LENA assistant",
    closeLabel: "Close the LENA assistant",
    title: "LENA assistant",
    subtitle: "Answers from the verified help pages",
    greetingTime: { morning: "Good morning ☀️", afternoon: "Good afternoon 👋", evening: "Good evening 🌙" },
    greeting:
      "I am LENA's automated assistant, and I am glad you are here. Ask me about getting started, cost, reply times, or your data — I answer from the verified content. Try one of these or write your own question:",
    teaser: "Welcome to LENA 👋\nI'm the automated assistant — ask me anything about our systems and how we work.",
    teaserClose: "Dismiss the welcome",
    inputLabel: "Write your question",
    inputPlaceholder: "Type your question…",
    send: "Send",
    disclosure: "Automated assistant — for a confirmed human reply, reach us on WhatsApp.",
    whatsapp: "WhatsApp",
    rateLimited: "You have reached the temporary conversation limit. Message us on WhatsApp and we will reply right away.",
    error: "The message could not be sent right now. Try again or reach us on WhatsApp.",
    sourceLabel: "From the help pages:",
  },
} as const;

/** Time-of-day opening line — the visitor's local clock: morning / afternoon / evening. */
function greetingTime(copy: (typeof COPY)["ar" | "en"]): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return copy.greetingTime.morning;
  if (hour >= 12 && hour < 17) return copy.greetingTime.afternoon;
  return copy.greetingTime.evening;
}

/** Welcome teaser: once per browser session, a few seconds after arrival. */
const TEASER_DELAY_MS = 2_600;
const TEASER_SESSION_KEY = "lena-digital-house.assistant-teaser";

/** Spoken welcome: also once per session, at the same moment as the teaser. */
const GREETING_SESSION_KEY = "lena-digital-house.assistant-greeting";

function sessionFlagged(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage unavailable — the greeting may replay on the next visit */
  }
}

/** Curated starter questions — the ones the help page organises its answers around. */
const SUGGESTED_IDS = ["how-to-start", "pricing", "response-time", "languages"] as const;

type AssistantSource = { id: string; question: string; to?: string; label?: string };

type ChatMessage = {
  role: "visitor" | "assistant";
  text: string;
  sources?: AssistantSource[];
};

export default function LenaAssistant() {
  const { locale } = usePreferences();
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);

  // Spoken welcome: the assistant greets the visitor out loud as soon as the
  // browser allows. Autoplay policies block sound before the visitor's first
  // interaction, so a refused attempt arms one-shot fallback listeners — the
  // greeting then plays on the visitor's very first tap or key press. Either
  // way it happens at most once per session.
  useEffect(() => {
    if (typeof window.Audio !== "function") return;
    if (sessionFlagged(GREETING_SESSION_KEY)) return;

    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let played = false;
    let blocked = false;

    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    const play = () => {
      if (cancelled || played || sessionFlagged(GREETING_SESSION_KEY)) return;
      audio ??= new Audio(greetingAudioUrl(locale));
      const attempt = audio.play();
      if (!attempt) {
        blocked = true;
        return;
      }
      attempt.then(
        () => {
          if (cancelled) {
            audio?.pause();
            return;
          }
          played = true;
          removeInteractionListeners();
          setSessionFlag(GREETING_SESSION_KEY);
          track("assistant_greeting_played", { locale, outcome: "success" });
        },
        () => {
          blocked = true;
        },
      );
    };

    const onFirstInteraction = () => {
      if (!blocked) return;
      blocked = false;
      play();
    };

    const timer = setTimeout(() => {
      if (cancelled) return;
      play();
      window.addEventListener("pointerdown", onFirstInteraction);
      window.addEventListener("keydown", onFirstInteraction);
    }, TEASER_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      removeInteractionListeners();
      audio?.pause();
    };
  }, [locale]);

  // Proactive welcome bubble: a short, dismissible greeting at the same
  // moment as the spoken one — once per browser session, never while the
  // panel is open.
  useEffect(() => {
    if (sessionFlagged(TEASER_SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setTeaserVisible(true);
      trackOnce("assistant_teaser_shown", "assistant_teaser_shown", { locale });
    }, TEASER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [locale]);

  function dismissTeaser() {
    setTeaserVisible(false);
    setSessionFlag(TEASER_SESSION_KEY);
  }

  function openPanel() {
    setOpen(true);
    dismissTeaser();
  }

  return (
    <>
      <button
        type="button"
        className="lena-assistant-fab"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? copy.closeLabel : copy.fabLabel}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>
      {!open && teaserVisible && (
        <div className="lena-assistant-teaser" dir={locale === "ar" ? "rtl" : "ltr"} role="status">
          <button type="button" className="lena-assistant-teaser-close" onClick={dismissTeaser} aria-label={copy.teaserClose}>
            <X size={13} />
          </button>
          <button type="button" className="lena-assistant-teaser-body" onClick={openPanel}>
            {copy.teaser}
          </button>
        </div>
      )}
      {open && <AssistantPanel locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}

function AssistantPanel({ locale, onClose }: { locale: "ar" | "en"; onClose: () => void }) {
  const copy = COPY[locale];
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: `${greetingTime(copy)} ${copy.greeting}` },
  ]);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () =>
      SUGGESTED_IDS.map((id) => HELP_ARTICLES.find((article) => article.id === id)).filter(
        (article) => article !== undefined,
      ),
    [],
  );

  const status = trpc.assistant.status.useQuery(undefined, { staleTime: 60_000 });
  const ask = trpc.assistant.ask.useMutation();

  useEffect(() => {
    trackOnceOpened();
    function trackOnceOpened() {
      track("assistant_opened", { locale });
    }
  }, [locale]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || ask.isPending) return;
    const history = messages.slice(-6).map((message) => ({ role: message.role, content: message.text }));
    setMessages((current) => [...current, { role: "visitor", text: trimmed }]);
    setDraft("");
    ask.mutate(
      { message: trimmed, locale, history },
      {
        onSuccess: (data) => {
          setMessages((current) => [...current, { role: "assistant", text: data.answer, sources: data.sources }]);
          track("assistant_asked", { locale, query_length: trimmed.length, outcome: "success", context: data.mode });
        },
        onError: (error) => {
          const rateLimited = error.data?.code === "TOO_MANY_REQUESTS";
          setMessages((current) => [...current, { role: "assistant", text: rateLimited ? copy.rateLimited : copy.error }]);
          track("assistant_asked", {
            locale,
            query_length: trimmed.length,
            outcome: "failure",
            reason: rateLimited ? "rate_limited" : "server",
          });
        },
      },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  return (
    <section className="lena-assistant-panel" dir={locale === "ar" ? "rtl" : "ltr"} aria-label={copy.title}>
      <header className="lena-assistant-head">
        <span className="lena-assistant-orb" aria-hidden="true">
          <Sparkles size={16} />
        </span>
        <div className="lena-assistant-titles">
          <strong>{copy.title}</strong>
          <small>
            {status.data?.model ? (
              <>
                <Globe size={10} /> {copy.subtitle}
              </>
            ) : (
              copy.subtitle
            )}
          </small>
        </div>
        <button type="button" className="lena-assistant-close" onClick={onClose} aria-label={copy.closeLabel}>
          <X size={16} />
        </button>
      </header>

      <div className="lena-assistant-log" ref={logRef}>
        {messages.map((message, index) => (
          <div key={index} className={`lena-assistant-msg ${message.role === "visitor" ? "is-visitor" : "is-assistant"}`}>
            <p>{message.text}</p>
            {message.sources && message.sources.length > 0 && (
              <div className="lena-assistant-sources">
                <small>{copy.sourceLabel}</small>
                {message.sources.slice(0, 2).map((source) =>
                  source.to && source.label ? (
                    <Link key={source.id} to={source.to}>
                      {source.label}
                    </Link>
                  ) : (
                    <span key={source.id}>{source.question}</span>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
        {ask.isPending && (
          <div className="lena-assistant-msg is-assistant is-pending">
            <p>…</p>
          </div>
        )}
        {messages.length <= 1 && (
          <div className="lena-assistant-chips">
            {suggestions.map((article) => (
              <button key={article.id} type="button" onClick={() => send(article.question[locale])}>
                {article.question[locale]}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="lena-assistant-input" onSubmit={onSubmit}>
        <label className="lena-assistant-sr" htmlFor="lena-assistant-field">
          {copy.inputLabel}
        </label>
        <input
          id="lena-assistant-field"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.inputPlaceholder}
          maxLength={800}
          autoComplete="off"
        />
        <button type="submit" disabled={ask.isPending || draft.trim().length === 0} aria-label={copy.send}>
          <Send size={16} />
        </button>
      </form>

      <footer className="lena-assistant-note">
        <small>{copy.disclosure}</small>
        <a
          href={SITE_CONFIG.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("contact_channel_opened", { channel: "whatsapp", surface: "assistant" })}
        >
          {copy.whatsapp}
        </a>
      </footer>
    </section>
  );
}
