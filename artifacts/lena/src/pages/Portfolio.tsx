import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PortfolioShowcase from "@/features/projects/PortfolioShowcase";
import { publicProjects } from "@/content/projects";
import { publicSystems } from "@/content/systems";
import PublicShell from "@/layouts/PublicShell";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

export default function Portfolio() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const published = trpc.projects.listPublished.useQuery();
  const seo = pageSeo("portfolio", locale);
  const isAr = locale === "ar";

  return (
    <PublicShell>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/portfolio"
      />

      {/* Intro */}
      <section className="lena-page lena-container lena-portfolio-intro">
        <p className="lena-kicker">{copy.portfolio.eyebrow}</p>
        <h1 className="lena-page-title">{copy.portfolio.title}</h1>
        <p className="lena-lead">{copy.portfolio.intro}</p>
      </section>

      {/* Main showcase or fallback */}
      {publicProjects().length > 0 ? (
        <PortfolioShowcase />
      ) : (
        <section className="lena-section">
          <div className="lena-container">
            <article className="lena-glass lena-portfolio-preparing">
              <h2>
                {isAr
                  ? "أنظمة تدير قطاعات كاملة"
                  : "Systems that run whole operations"}
              </h2>
              <p>
                {isAr
                  ? "كل نظام هنا يدير قطاعًا متكاملًا — عقارات، سبا، تأجير، استثمار، ضيافة، إعادة تدوير. افتح عالم LENA لترى كيف يعمل كل نظام من الداخل، أو تحدثنا عن النظام الذي يناسب قطاعك."
                  : "Each system here runs a complete operation — property, spa, rental, investment, hospitality, recycling. Open LENA World to see how each system works from the inside, or talk to us about the one that fits your trade."}
              </p>
              <ul className="lena-system-does">
                {publicSystems().map((system) => (
                  <li key={system.id}>
                    {system.name[locale]} — {system.industry[locale]}{" "}
                    <span className="lena-roots-chip">
                      {system.operatingPrimitives.length}{" "}
                      {isAr ? "جذور تشغيل" : "operating roots"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link className="lena-primary" to="/world">
                {isAr ? "ادخل إلى عالم LENA" : "Enter LENA World"}
                <ArrowUpRight size={16} />
              </Link>
            </article>
          </div>
        </section>
      )}

      {/* Published CMS projects */}
      {published.data?.length ? (
        <section className="lena-section">
          <div className="lena-container">
            <p className="lena-kicker">
              {isAr ? "مشاريع منشورة" : "Published work"}
            </p>
            <h2 className="lena-section-title">
              {isAr
                ? "أعمال إضافية متاحة للاستكشاف"
                : "Additional published work"}
            </h2>
            <div className="lena-bento">
              {published.data.map((project) => (
                <article
                  className="lena-glass lena-service-card"
                  key={project.id}
                >
                  {project.imageUrl && (
                    <img
                      className="lena-cms-portfolio-cover"
                      src={project.imageUrl}
                      alt=""
                    />
                  )}
                  <h3>{project.title}</h3>
                  <p>
                    {project.summary || project.description || project.slug}
                  </p>
                  <Link className="lena-more" to={`/work/${project.slug}`}>
                    {isAr ? "افتح دراسة المشروع" : "Open case study"}
                    <ArrowUpRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <LenaCta />
    </PublicShell>
  );
}
