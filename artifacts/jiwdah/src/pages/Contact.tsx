import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Mail, MessageCircle, Phone, RotateCcw, Send } from "lucide-react";
import { Link, useLocation } from "react-router";
import SeoHead from "@/components/SeoHead";
import { SITE_CONFIG, whatsappUrlFor } from "@/config/site";
import { pageSeo } from "@/content/seo";
import { findService } from "@/content/services";
import { publicSystems } from "@/content/systems";
import PublicShell from "@/layouts/PublicShell";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";
import { clearDraft, emptyDraft, readDraft, writeDraft, type InquiryDraft } from "@/lib/inquiryDraft";
import { track, trackOnce } from "@/lib/analytics";

type Inquiry = InquiryDraft & {
  website: string;
  submittedAt: number;
};

function createEmptyInquiry(): Inquiry {
  return { ...emptyDraft(), website: "", submittedAt: Date.now() };
}

const FORM = {
  ar: {
    title: "أرسل نقطة البداية",
    intro: "اكتب احتياجك الأساسي وسنراجع الاستفسار لتحديد الخطوة التالية.",
    required: "الاسم وتفاصيل الفكرة فقط مطلوبان — البقية اختيارية.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    service: "المسار الأقرب للمشروع",
    message: "تفاصيل الفكرة",
    optional: "اختياري",
    choose: "اختر عند الحاجة",
    submit: "إرسال الاستفسار",
    sending: "جارٍ الإرسال...",
    retry: "إعادة المحاولة",
    about: "بخصوص",
    draftRestored: "استعدنا ما كتبته سابقًا على هذا الجهاز.",
    draftClear: "مسح المسودة",
    successTitle: "وصلنا استفسارك",
    successRef: "رقم المرجع",
    successNext: "نرد خلال يوم عمل واحد على القناة التي تركتها. إن كان الأمر عاجلًا، راسلنا على واتساب مباشرة.",
    successAnother: "إرسال استفسار آخر",
    whatsapp: "المتابعة عبر واتساب",
    errors: {
      rate: "استلمنا عدة رسائل من هذا الاتصال خلال وقت قصير. انتظر قليلًا أو راسلنا على واتساب.",
      rejected: "لم نتمكن من قبول النموذج. تأكد من تعبئة الاسم والتفاصيل ثم أعد الإرسال، أو راسلنا على واتساب.",
      offline: "يبدو أن الاتصال بالإنترنت منقطع. نصك محفوظ على جهازك — أعد المحاولة بعد عودة الاتصال.",
      server: "تعذر الإرسال الآن. نصك محفوظ على جهازك، ويمكنك إعادة المحاولة أو مراسلتنا على واتساب.",
    },
  },
  en: {
    title: "Share the starting point",
    intro: "Describe the core requirement and we will review the inquiry to define the next step.",
    required: "Only your name and the project details are required — everything else is optional.",
    name: "Name",
    email: "Email",
    phone: "Phone number",
    service: "Closest project track",
    message: "Project details",
    optional: "Optional",
    choose: "Choose when relevant",
    submit: "Send inquiry",
    sending: "Sending...",
    retry: "Try again",
    about: "About",
    draftRestored: "We restored what you had written on this device.",
    draftClear: "Clear draft",
    successTitle: "Your inquiry reached us",
    successRef: "Reference",
    successNext: "We reply within one business day on the channel you left. If it is urgent, message us on WhatsApp.",
    successAnother: "Send another inquiry",
    whatsapp: "Continue on WhatsApp",
    errors: {
      rate: "We received several messages from this connection in a short time. Please wait a moment or message us on WhatsApp.",
      rejected: "We could not accept the form. Check the name and details, then send again — or reach us on WhatsApp.",
      offline: "You appear to be offline. Your text is saved on this device — try again once you reconnect.",
      server: "Sending failed just now. Your text is saved on this device; retry or message us on WhatsApp.",
    },
  },
} as const;

type ErrorKind = keyof (typeof FORM)["ar"]["errors"];

function classifyError(error: { data?: { code?: string } | null } | null): ErrorKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const code = error?.data?.code;
  if (code === "TOO_MANY_REQUESTS") return "rate";
  if (code === "BAD_REQUEST") return "rejected";
  return "server";
}

export default function Contact() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const { search } = useLocation();
  const text = FORM[locale];
  const seo = pageSeo("contact", locale);

  const params = new URLSearchParams(search);
  const requestedService = findService(params.get("service") ?? undefined);
  const requestedWork = (params.get("work") ?? "").match(/^[a-z0-9-]{1,40}$/)?.[0];
  const entrySource = requestedService
    ? `service:${requestedService.id}`
    : requestedWork
      ? `work:${requestedWork}`
      : "contact";

  const [form, setForm] = useState<Inquiry>(createEmptyInquiry);
  const [draftRestored, setDraftRestored] = useState(false);
  const [reference, setReference] = useState<number | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);

  const mutation = trpc.inquiries.create.useMutation({
    onSuccess: (inquiry) => {
      track("inquiry_submitted", { locale, context: entrySource.split(":")[0] });
      setReference(inquiry?.id ?? null);
      setDraftRestored(false);
      setForm(createEmptyInquiry());
      clearDraft();
    },
  });

  // Restore an abandoned draft, and pre-select the track the visitor came from.
  useEffect(() => {
    const draft = readDraft();
    setForm((current) => ({
      ...current,
      ...(draft ?? {}),
      service: draft?.service || requestedService?.id || current.service,
      submittedAt: Date.now(),
    }));
    if (draft) {
      setDraftRestored(true);
      trackOnce("draft-restored", "inquiry_draft_restored", { locale });
    }
  }, [requestedService?.id]);

  useEffect(() => {
    if (reference !== null) successRef.current?.focus();
  }, [reference]);

  function update(patch: Partial<Inquiry>) {
    // First keystroke is intent, which is what the funnel needs — not arrival.
    trackOnce("inquiry-started", "inquiry_started", { locale, context: entrySource.split(":")[0] });
    setForm((current) => {
      const next = { ...current, ...patch };
      writeDraft(next);
      return next;
    });
    setDraftRestored(false);
  }

  function resetDraft() {
    clearDraft();
    setForm(createEmptyInquiry());
    setDraftRestored(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReference(null);
    mutation.mutate({
      name: form.name,
      message: form.message,
      website: form.website,
      submittedAt: form.submittedAt,
      email: form.email || undefined,
      phone: form.phone || undefined,
      service: form.service || undefined,
      source: entrySource,
    });
  }

  const errorKind = mutation.error ? classifyError(mutation.error) : null;
  if (errorKind) trackOnce(`inquiry-failed:${errorKind}`, "inquiry_failed", { locale, reason: errorKind });

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/contact" />
      <section className="lena-page lena-container">
        <p className="lena-kicker">{copy.contact.eyebrow}</p>
        <h1 className="lena-page-title">{copy.contact.title}</h1>
        <p className="lena-lead">{copy.contact.intro}</p>
      </section>

      <section className="lena-section">
        <div className="lena-container">
        <p className="lena-contact-reach">{SITE_CONFIG.reachLabel[locale]}</p>
        <div className="lena-contact-grid">
          {SITE_CONFIG.channels.map((channel) => (
            <article className="lena-glass lena-contact-card" key={channel.id}>
              <MessageCircle />
              <h2>{channel.region[locale]}</h2>
              <p dir="ltr">{channel.display}</p>
              <a
                className="lena-primary"
                href={whatsappUrlFor(channel)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("contact_channel_opened", { channel: "whatsapp", surface: "section" })}
              >
                <MessageCircle size={15} />
                {copy.contact.whatsapp}
              </a>
              <a
                className="lena-secondary"
                href={`tel:${channel.tel}`}
                onClick={() => track("contact_channel_opened", { channel: "phone", surface: "section" })}
              >
                <Phone size={15} />
                {copy.contact.call}
              </a>
            </article>
          ))}
          <article className="lena-glass lena-contact-card">
            <Mail />
            <h2>{copy.contact.email}</h2>
            <p dir="ltr">{SITE_CONFIG.email}</p>
            <a
              className="lena-secondary"
              href={SITE_CONFIG.emailUrl}
              onClick={() => track("contact_channel_opened", { channel: "email", surface: "section" })}
            >
              <Mail size={15} />
              {copy.contact.email}
            </a>
          </article>
        </div>
        </div>
      </section>

      <section className="lena-section">
        <div className="lena-container">
          {reference !== null ? (
            <div
              className="lena-glass lena-form lena-inquiry-success"
              ref={successRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={26} />
              <h2>{text.successTitle}</h2>
              <p className="lena-inquiry-reference">
                {text.successRef} <strong dir="ltr">#{reference}</strong>
              </p>
              <p>{text.successNext}</p>
              <div className="lena-actions">
                <a className="lena-primary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} />
                  {text.whatsapp}
                </a>
                <button type="button" className="lena-secondary" onClick={() => setReference(null)}>
                  {text.successAnother}
                </button>
                <Link className="lena-secondary" to="/portfolio">
                  {locale === "ar" ? "تصفّح الأعمال" : "Browse the work"}
                </Link>
              </div>
            </div>
          ) : (
            <form className="lena-glass lena-form" onSubmit={submit}>
              <h2>{text.title}</h2>
              <p>{text.intro}</p>
              <p className="lena-form-hint">{text.required}</p>

              {requestedService && (
                <p className="lena-form-context">
                  {text.about}: <strong>{requestedService.title[locale]}</strong>
                </p>
              )}

              {draftRestored && (
                <p className="lena-form-draft" role="status">
                  <RotateCcw size={14} />
                  {text.draftRestored}
                  <button type="button" onClick={resetDraft}>
                    {text.draftClear}
                  </button>
                </p>
              )}

              <label
                aria-hidden="true"
                style={{ position: "absolute", insetInlineStart: "-10000px", width: 1, height: 1, overflow: "hidden" }}
              >
                <span>Website</span>
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })}
                />
              </label>

              <div className="lena-form-grid">
                <label>
                  <span>{text.name}</span>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => update({ name: event.target.value })}
                  />
                </label>
                <label>
                  <span>
                    {text.email} <small>{text.optional}</small>
                  </span>
                  <input
                    name="email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    inputMode="email"
                    value={form.email}
                    onChange={(event) => update({ email: event.target.value })}
                  />
                </label>
                <label>
                  <span>
                    {text.phone} <small>{text.optional}</small>
                  </span>
                  <input
                    name="phone"
                    dir="ltr"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) => update({ phone: event.target.value })}
                  />
                </label>
                <label>
                  <span>
                    {text.service} <small>{text.optional}</small>
                  </span>
                  <select name="service" value={form.service} onChange={(event) => update({ service: event.target.value })}>
                    <option value="">{text.choose}</option>
                    {publicSystems().map((system) => (
                      <option value={system.id} key={system.id}>
                        {system.industry[locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wide">
                  <span>{text.message}</span>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(event) => update({ message: event.target.value })}
                  />
                </label>
              </div>

              {errorKind && (
                <div className="lena-error lena-form-error" role="alert">
                  <p>{text.errors[errorKind]}</p>
                  <a className="lena-secondary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} />
                    {text.whatsapp}
                  </a>
                </div>
              )}

              <button type="submit" className="lena-primary" disabled={mutation.isPending}>
                <Send size={16} />
                {mutation.isPending ? text.sending : errorKind ? text.retry : text.submit}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
