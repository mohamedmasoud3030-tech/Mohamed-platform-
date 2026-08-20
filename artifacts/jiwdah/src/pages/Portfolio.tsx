import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PortfolioShowcase from "@/features/projects/PortfolioShowcase";
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
    <PortfolioShowcase />
    {published.data?.length ? <section className="lena-section"><div className="lena-container"><p className="lena-kicker">{locale === "ar" ? "مشاريع منشورة" : "Published work"}</p><h2 className="lena-section-title">{locale === "ar" ? "أعمال إضافية متاحة للاستكشاف" : "Additional published work"}</h2><div className="lena-bento">{published.data.map((project) => <article className="lena-glass lena-service-card" key={project.id}>{project.imageUrl && <img className="lena-cms-portfolio-cover" src={project.imageUrl} alt="" />}<h3>{project.title}</h3><p>{project.summary || project.description || project.slug}</p><Link className="lena-more" to={`/work/${project.slug}`}>{locale === "ar" ? "افتح دراسة المشروع" : "Open case study"}<ArrowUpRight size={15} /></Link></article>)}</div></div></section> : null}
    <LenaCta />
  </PublicShell>;
}
