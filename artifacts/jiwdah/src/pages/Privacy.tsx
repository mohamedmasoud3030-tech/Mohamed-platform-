import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { SITE_CONFIG } from "@/config/site";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/content/privacy";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

export default function Privacy() {
  const { locale } = usePreferences();
  const seo = pageSeo("privacy", locale);
  const intro = PRIVACY_INTRO[locale];

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/privacy" />

      <section className="lena-page lena-container">
        <p className="lena-kicker">{locale === "ar" ? "بياناتك" : "Your data"}</p>
        <h1 className="lena-page-title">{seo.title}</h1>
        <p className="lena-lead">{intro.note}</p>
      </section>

      <section className="lena-section">
        <div className="lena-container lena-privacy">
          {PRIVACY_SECTIONS.map((section) => (
            <article className="lena-glass lena-privacy-card" key={section.id} id={section.id}>
              <h2>{section.title[locale]}</h2>
              <ul>
                {section.body[locale].map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}

          <aside className="lena-glass lena-privacy-card">
            <ShieldCheck size={20} />
            <h2>{intro.contact}</h2>
            <div className="lena-actions">
              <a className="lena-primary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <a className="lena-secondary" href={SITE_CONFIG.emailUrl}>
                <Mail size={15} />
                {SITE_CONFIG.email}
              </a>
              <Link className="lena-secondary" to="/help">
                {locale === "ar" ? "الأسئلة الشائعة" : "Frequently asked questions"}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
