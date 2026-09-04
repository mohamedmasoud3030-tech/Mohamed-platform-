import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG } from "@/config/site";
import { usePreferences } from "@/providers/preferences";

export default function LenaCta({
  project = false,
  service,
  work,
}: {
  project?: boolean;
  service?: string;
  work?: string;
}) {
  const { locale } = usePreferences();
  const contactHref = service
    ? `/contact?service=${encodeURIComponent(service)}`
    : work
      ? `/contact?work=${encodeURIComponent(work)}`
      : "/contact";

  return (
    <section className="lena-section">
      <div className="lena-container">
        <article className="lena-glass lena-cta">
          <div>
            <p className="lena-kicker">LENA DIGITAL HOUSE</p>
            <h2>
              {project
                ? locale === "ar"
                  ? "لديك مشروع يحتاج إلى نظام مشابه؟"
                  : "Need a similar operating system for your business?"
                : locale === "ar"
                  ? "هل عملك يحتاج نظام تشغيل أوضح؟"
                  : "Does your business need a clearer operating system?"}
            </h2>
            <p>
              {locale === "ar"
                ? "صف لنا كيف يعمل يومك الآن. نحدد أين يتكرر العمل اليدوي، وما الذي يحتاج أن يصبح مسارًا واحدًا واضحًا."
                : "Show us how the work runs today. We identify where manual repetition lives and what should become one clear operating flow."}
            </p>
          </div>
          <div className="lena-actions">
            <Link className="lena-primary" to={contactHref}>
              {locale === "ar" ? "ابدأ من سير العمل" : "Start from the workflow"}
              <ArrowUpRight size={16} />
            </Link>
            <a
              className="lena-secondary"
              href={SITE_CONFIG.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
              <MessageCircle size={15} />
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
