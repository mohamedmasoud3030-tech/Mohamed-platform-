import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link, Navigate } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { LENA_SERVICES } from "@/content/services";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

export default function CmsProjectDetails({ slug }: { slug: string }) {
  const { locale } = usePreferences();
  const project = trpc.projects.getPublishedBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  if (project.isLoading) return <PublicShell><section className="lena-page lena-container lena-cms-case-state"><Loader2 className="lena-cms-loading-icon" />{locale === "ar" ? "جارٍ تحميل المشروع..." : "Loading project..."}</section></PublicShell>;
  if (!project.data) return <Navigate to="/portfolio" replace />;
  const blocks = project.data.contentBlocks;
  const narrative: Array<[string, string]> = [];
  const addNarrative = (title: string, body?: string | null) => { if (body) narrative.push([title, body]); };
  addNarrative(locale === "ar" ? "نظرة عامة" : "Overview", blocks.overview?.[locale] || project.data.description || project.data.summary);
  addNarrative(locale === "ar" ? "المشكلة" : "Challenge", blocks.challenge?.[locale]);
  addNarrative(locale === "ar" ? "الاتجاه الإبداعي" : "Creative direction", blocks.direction?.[locale]);
  addNarrative(locale === "ar" ? "الحل" : "Solution", blocks.solution?.[locale]);
  const features = blocks.features?.[locale] ?? [];
  const journey = blocks.journey?.[locale] ?? [];
  const related = LENA_SERVICES.filter((service) => project.data.relatedServices.includes(service.id));
  return <PublicShell>
    <SeoHead title={project.data.title} description={project.data.summary || project.data.description || project.data.title} path={`/work/${project.data.slug}`} image={project.data.imageUrl || undefined} type="article" />
    <section className="lena-page lena-container lena-case-hero"><div><p className="lena-kicker">LENA CASE STUDY</p><h1 className="lena-page-title">{project.data.title}</h1><p className="lena-lead">{project.data.summary || project.data.description}</p></div>{project.data.imageUrl ? <img className="lena-cms-case-cover" src={project.data.imageUrl} alt="" /> : <div className="lena-project-visual blue" aria-hidden="true"><div className="lena-visual-window"><i /><i /><i /><b /><b /><b /></div><div className="lena-visual-stack"><span /><span /><span /></div><div className="lena-visual-nodes"><i /><i /><i /><i /></div><div className="lena-visual-orb" /></div>}</section>
    {narrative.length > 0 && <section className="lena-section"><div className="lena-container lena-case-narrative">{narrative.map(([title, body], index) => <article className={`lena-glass lena-case-story${index === 0 || index === 3 ? " wide" : ""}`} key={title}><small>{String(index + 1).padStart(2, "0")}</small><h2>{title}</h2><p>{body}</p></article>)}</div></section>}
    {features.length > 0 && <section className="lena-section"><div className="lena-container lena-case-panels"><article className="lena-glass lena-info-panel"><p className="lena-kicker">{locale === "ar" ? "ملامح النظام" : "System features"}</p><ul>{features.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></article></div></section>}
    {journey.length > 0 && <section className="lena-section"><div className="lena-container"><p className="lena-kicker">{locale === "ar" ? "رحلة البناء" : "Build journey"}</p><h2 className="lena-section-title">{locale === "ar" ? "من المشكلة إلى نظام قابل للاستخدام" : "From problem to a usable system"}</h2><div className="lena-case-journey">{journey.map((item, index) => <article className="lena-glass" key={item}><small>{String(index + 1).padStart(2, "0")}</small><h3>{item}</h3></article>)}</div></div></section>}
    {project.data.gallery.length > 0 && <section className="lena-section"><div className="lena-container"><p className="lena-kicker">GALLERY / MOCKUPS</p><h2 className="lena-section-title">{locale === "ar" ? "صور ونماذج المشروع" : "Project images and mockups"}</h2><div className="lena-case-gallery">{project.data.gallery.map((asset, index) => <article className={`lena-glass lena-gallery-card ${asset.layout ?? (index === 0 ? "wide" : "standard")}`} key={`${asset.url}-${index}`}><img className="lena-cms-gallery-image" src={asset.url} alt="" /><div className="lena-gallery-copy"><p className="lena-kicker">{asset.label?.[locale] || `${locale === "ar" ? "صورة" : "Image"} ${index + 1}`}</p>{asset.caption?.[locale] && <p>{asset.caption[locale]}</p>}</div></article>)}</div></div></section>}
    {related.length > 0 && <section className="lena-section"><div className="lena-container"><p className="lena-kicker">{locale === "ar" ? "الخدمات المرتبطة" : "Related services"}</p><h2 className="lena-section-title">{locale === "ar" ? "المسارات التي تكوّن هذا المشروع" : "The tracks shaping this project"}</h2><div className="lena-bento lena-related-services">{related.map((service) => <article className={`lena-glass lena-service-card ${service.tone}`} key={service.id}><i className="lena-card-glow" /><h3>{service.title[locale]}</h3><p>{service.description[locale]}</p><Link className="lena-more" to={`/services/${service.id}`}>{locale === "ar" ? "استكشف الخدمة" : "Explore service"}<ArrowUpRight size={15} /></Link></article>)}</div></div></section>}
    <LenaCta project work={project.data.slug} />
  </PublicShell>;
}
