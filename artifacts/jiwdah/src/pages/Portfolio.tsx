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
  return <PublicShell>
    <SeoHead title={seo.title} description={seo.description} path="/portfolio" />
    <section className="lena-page lena-container lena-portfolio-intro"><p className="lena-kicker">{copy.portfolio.eyebrow}</p><h1 className="lena-page-title">{copy.portfolio.title}</h1><p className="lena-lead">{copy.portfolio.intro}</p></section>
    {publicProjects().length > 0 ? <PortfolioShowcase /> : (
      <section className="lena-section">
        <div className="lena-container">
          <article className="lena-glass lena-portfolio-preparing">
            <h2>{locale === "ar" ? "دراسات المشاريع قيد التجهيز" : "Case studies are being prepared"}</h2>
            <p>{locale === "ar"
              ? "الأنظمة التالية مبنية وتعمل، ونجهّز الآن توثيقها بالشاشات والتفاصيل. حتى ذلك الحين، اطلب جولة مباشرة على أي نظام يخص قطاعك."
              : "The systems below are built and running; their documentation and screens are being prepared. Until then, ask for a live walkthrough of whichever one fits your trade."}</p>
            <ul className="lena-system-does">
              {publicSystems().map((system) => <li key={system.id}>{system.industry[locale]}</li>)}
            </ul>
            <Link className="lena-primary" to="/contact">
              {locale === "ar" ? "اطلب جولة مباشرة" : "Request a live walkthrough"}
              <ArrowUpRight size={16} />
            </Link>
          </article>
        </div>
      </section>
    )}
    {published.data?.length ? <section className="lena-section"><div className="lena-container"><p className="lena-kicker">{locale === "ar" ? "مشاريع منشورة" : "Published work"}</p><h2 className="lena-section-title">{locale === "ar" ? "أعمال إضافية متاحة للاستكشاف" : "Additional published work"}</h2><div className="lena-bento">{published.data.map((project) => <article className="lena-glass lena-service-card" key={project.id}>{project.imageUrl && <img className="lena-cms-portfolio-cover" src={project.imageUrl} alt="" />}<h3>{project.title}</h3><p>{project.summary || project.description || project.slug}</p><Link className="lena-more" to={`/work/${project.slug}`}>{locale === "ar" ? "افتح دراسة المشروع" : "Open case study"}<ArrowUpRight size={15} /></Link></article>)}</div></div></section> : null}
    <LenaCta />
  </PublicShell>;
}
