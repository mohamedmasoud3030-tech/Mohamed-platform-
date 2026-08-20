import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { STAGE_LABEL, STAGE_NOTE, publicSystems } from "@/content/systems";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

/**
 * Organised by the industry that buys the system, not by creative discipline.
 * A warehouse owner does not browse "visual identity"; he looks for his own trade.
 */
export default function Services() {
  const { locale } = usePreferences();
  const seo = pageSeo("services", locale);
  const systems = publicSystems();
  const isArabic = locale === "ar";

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/services" />

      <section className="lena-page lena-container">
        <p className="lena-kicker">{isArabic ? "الأنظمة" : "The systems"}</p>
        <h1 className="lena-page-title">{seo.title}</h1>
        <p className="lena-lead">{seo.description}</p>
      </section>

      <section className="lena-section">
        <div className="lena-container lena-bento">
          {systems.map((system, index) => (
            <article className="lena-glass lena-service-card lena-system-card wide" key={system.id}>
              <i className="lena-card-glow" />
              <div className="lena-card-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
              </div>
              <h2>{system.name[locale]}</h2>
              <p className="lena-system-industry">{system.industry[locale]}</p>
              <p className={`lena-stage lena-stage-${system.stage}`} title={STAGE_NOTE[system.stage][locale]}>
                {STAGE_LABEL[system.stage][locale]}
              </p>

              <h3 className="lena-system-heading">{isArabic ? "المشكلة" : "The problem"}</h3>
              <p>{system.problem[locale]}</p>

              <h3 className="lena-system-heading">{isArabic ? "كيف يُستخدم" : "How it is used"}</h3>
              <p>{system.usage[locale]}</p>

              <h3 className="lena-system-heading">{isArabic ? "من المستفيد" : "Who benefits"}</h3>
              <ul className="lena-system-does">
                {system.beneficiaries[locale].map((who) => (
                  <li key={who}>
                    <CheckCircle2 size={15} />
                    {who}
                  </li>
                ))}
              </ul>

              <h3 className="lena-system-heading">{isArabic ? "ما الذي يديره" : "What it runs"}</h3>
              <ul className="lena-system-does">
                {system.does[locale].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link className="lena-more" to={`/contact?service=${system.id}`}>
                {isArabic ? "تحدث عن نظام لقطاعك" : "Talk about a system for your trade"}
                <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <LenaCta />
    </PublicShell>
  );
}
