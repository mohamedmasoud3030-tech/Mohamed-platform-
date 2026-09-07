import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { publicSystems } from "@/content/systems";
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
  const isAr = locale === "ar";

  return (
    <PublicShell>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/services"
      />

      {/* Hero */}
      <section className="lena-page lena-container">
        <p className="lena-kicker">{isAr ? "الأنظمة" : "The systems"}</p>
        <h1 className="lena-page-title">{seo.title}</h1>
        <p className="lena-lead">{seo.description}</p>
      </section>

      {/* Systems grid */}
      <section className="lena-section">
        <div className="lena-container lena-bento">
          {systems.map((system, index) => (
            <article
              className={`lena-glass lena-service-card lena-system-card ${system.id}`}
              id={system.id}
              key={system.id}
              data-system={system.id}
            >
              <i className="lena-card-glow" />

              <div className="lena-system-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span className="lena-roots-chip">
                  {system.operatingPrimitives.length}{" "}
                  {isAr ? "جذور تشغيل" : "operating roots"}
                </span>
              </div>

              <h2>{system.name[locale]}</h2>

              {system.tagline && (
                <p className="lena-system-tagline">{system.tagline[locale]}</p>
              )}

              <p className="lena-system-industry">{system.industry[locale]}</p>

              <dl className="lena-system-rows">
                <div>
                  <dt>{isAr ? "المشكلة" : "The problem"}</dt>
                  <dd>{system.problem[locale]}</dd>
                </div>
                <div>
                  <dt>{isAr ? "كيف يُستخدم" : "How it is used"}</dt>
                  <dd>{system.usage[locale]}</dd>
                </div>
              </dl>

              <div className="lena-system-lists">
                <div>
                  <h3>{isAr ? "من المستفيد" : "Who benefits"}</h3>
                  <ul>
                    {system.beneficiaries[locale].map((who) => (
                      <li key={who}>
                        <CheckCircle2 size={15} />
                        {who}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>{isAr ? "ما الذي يديره" : "What it runs"}</h3>
                  <ul>
                    {system.does[locale].map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={15} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                className="lena-more"
                to={`/contact?service=${system.id}`}
              >
                {isAr
                  ? "تحدث عن نظام لقطاعك"
                  : "Talk about a system for your trade"}
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
