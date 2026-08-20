import { useState, type FormEvent } from "react";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { SITE_CONFIG } from "@/config/site";
import { pageSeo } from "@/content/seo";
import { LENA_SERVICES } from "@/content/services";
import PublicShell from "@/layouts/PublicShell";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

type Inquiry = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  website: string;
  submittedAt: number;
};

function createEmptyInquiry(): Inquiry {
  return {
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
    website: "",
    submittedAt: Date.now(),
  };
}

const FORM = {
  ar: {
    title: "أرسل نقطة البداية",
    intro: "اكتب احتياجك الأساسي وسنراجع الاستفسار لتحديد الخطوة التالية.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    service: "المسار الأقرب للمشروع",
    message: "تفاصيل الفكرة",
    optional: "اختياري",
    choose: "اختر عند الحاجة",
    submit: "إرسال الاستفسار",
    sending: "جارٍ الإرسال...",
    success: "تم إرسال استفسارك بنجاح. سنراجع التفاصيل ونتواصل معك.",
    failed: "تعذر الإرسال. استخدم واتساب أو البريد المباشر.",
  },
  en: {
    title: "Share the starting point",
    intro: "Describe the core requirement and we will review the inquiry to define the next step.",
    name: "Name",
    email: "Email",
    phone: "Phone number",
    service: "Closest project track",
    message: "Project details",
    optional: "Optional",
    choose: "Choose when relevant",
    submit: "Send inquiry",
    sending: "Sending...",
    success: "Your inquiry has been sent. We will review the details and get back to you.",
    failed: "Could not send. Use WhatsApp or direct email.",
  },
} as const;

export default function Contact() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const text = FORM[locale];
  const [form, setForm] = useState(createEmptyInquiry);
  const [done, setDone] = useState(false);
  const mutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      setDone(true);
      setForm(createEmptyInquiry());
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(false);
    mutation.mutate({
      ...form,
      email: form.email || undefined,
      phone: form.phone || undefined,
      service: form.service || undefined,
      source: "contact",
    });
  }

  const seo = pageSeo("contact", locale);

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/contact" />
      <section className="lena-page lena-container">
        <p className="lena-kicker">{copy.contact.eyebrow}</p>
        <h1 className="lena-page-title">{copy.contact.title}</h1>
        <p className="lena-lead">{copy.contact.intro}</p>
      </section>

      <section className="lena-section">
        <div className="lena-container lena-contact-grid">
          <article className="lena-glass lena-contact-card">
            <MessageCircle />
            <h2>WhatsApp</h2>
            <p dir="ltr">{SITE_CONFIG.phone.display}</p>
            <a className="lena-primary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
              {copy.contact.whatsapp}
            </a>
          </article>
          <article className="lena-glass lena-contact-card">
            <Mail />
            <h2>{copy.contact.email}</h2>
            <p dir="ltr">{SITE_CONFIG.email}</p>
            <a className="lena-secondary" href={SITE_CONFIG.emailUrl}>
              {copy.contact.email}
            </a>
          </article>
          <article className="lena-glass lena-contact-card">
            <Phone />
            <h2>{copy.contact.call}</h2>
            <p dir="ltr">{SITE_CONFIG.phone.display}</p>
            <a className="lena-secondary" href={`tel:${SITE_CONFIG.phone.tel}`}>
              {copy.contact.call}
            </a>
          </article>
        </div>
      </section>

      <section className="lena-section">
        <div className="lena-container">
          <form className="lena-glass lena-form" onSubmit={submit}>
            <p className="lena-kicker">{copy.contact.eyebrow}</p>
            <h2>{text.title}</h2>
            <p>{text.intro}</p>
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
                <input name="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span>{text.email} <small>{text.optional}</small></span>
                <input name="email" type="email" dir="ltr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                <span>{text.phone} <small>{text.optional}</small></span>
                <input name="phone" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                <span>{text.service} <small>{text.optional}</small></span>
                <select name="service" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
                  <option value="">{text.choose}</option>
                  {LENA_SERVICES.map((service) => <option value={service.id} key={service.id}>{service.title[locale]}</option>)}
                </select>
              </label>
              <label className="wide">
                <span>{text.message}</span>
                <textarea name="message" required rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
              </label>
            </div>
            {done && <p className="lena-success" role="status">{text.success}</p>}
            {mutation.error && <p className="lena-error" role="alert">{text.failed}</p>}
            <button type="submit" className="lena-primary" disabled={mutation.isPending}>
              <Send size={16} />
              {mutation.isPending ? text.sending : text.submit}
            </button>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
