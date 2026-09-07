import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG } from "@/config/site";
import { usePreferences } from "@/providers/preferences";

/**
 * Call-to-action section.
 *
 * Adapts messaging based on context:
 * - Default: general CTA for any visitor
 * - `project`: tailored for project detail pages
 * - `service` / `work`: passes context to the contact form via query params
 */
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
  const isAr = locale === "ar";
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const contactHref = service
    ? `/contact?service=${encodeURIComponent(service)}`
    : work
      ? `/contact?work=${encodeURIComponent(work)}`
      : "/contact";

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`lena-section scroll-animate ${isVisible ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <article className="lena-glass lena-cta">
          <div>
            <p className="lena-kicker">LENA DIGITAL HOUSE</p>
            <h2>
              {project
                ? isAr
                  ? "لديك مشروع يحتاج إلى نظام مشابه؟"
                  : "Need a similar operating system for your business?"
                : isAr
                  ? "هل عملك يحتاج نظام تشغيل أوضح؟"
                  : "Does your business need a clearer operating system?"}
            </h2>
            <p>
              {isAr
                ? "صف لنا كيف يعمل يومك الآن. نحدد أين يتكرر العمل اليدوي، وما الذي يحتاج أن يصبح مسارًا واحدًا واضحًا."
                : "Show us how the work runs today. We identify where manual repetition lives and what should become one clear operating flow."}
            </p>
          </div>

          <div className="lena-actions">
            <Link className="lena-primary" to={contactHref}>
              {isAr ? "ابدأ من سير العمل" : "Start from the workflow"}
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
