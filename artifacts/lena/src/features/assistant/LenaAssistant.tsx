import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Globe, Send, Sparkles, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { usePreferences } from "@/providers/preferences";
import { track, trackOnce } from "@/lib/analytics";
import { SITE_CONFIG } from "@/config/site";
import { HELP_ARTICLES } from "@/content/help";

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
    greeting:
      "مرحبًا! أنا مساعد لينا الآلي. أجيب عن الأسئلة العامة من محتوى المساعدة الموثق فقط — اسألني عن طريقة البدء، الرد، بياناتك، أو قنوات التواصل.",
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
    greeting:
      "Welcome! I am LENA's automated assistant. I answer general questions from the verified help content only — ask me about getting started, replies, your data, or contact channels.",
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

  return (
    <>
      <button
        type="button"
        className="lena-assistant-fab"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? copy.closeLabel : copy.fabLabel}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>
      {open && <AssistantPanel locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}

function AssistantPanel({ locale, onClose }: { locale: "ar" | "en"; onClose: () => void }) {
  const copy = COPY[locale];
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: copy.greeting }]);
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
