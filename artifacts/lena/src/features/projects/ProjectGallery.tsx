import type { CaseStudyDefinition } from "@/content/caseStudies";
import type { StudioProject } from "@/content/projects";
import { usePreferences } from "@/providers/preferences";
import ProjectVisual from "./ProjectVisual";

export default function ProjectGallery({ project, study }: { project: StudioProject; study: CaseStudyDefinition }) {
  const { locale } = usePreferences();
  return <section className="lena-section"><div className="lena-container">
    <p className="lena-kicker">GALLERY / MOCKUPS</p>
    <h2 className="lena-section-title">{locale === "ar" ? "نماذج توضح كيف يعمل النظام بصريًا" : "Mockups showing how the system works visually"}</h2>
    <div className="lena-case-gallery">{study.gallery.map((asset) => <article className={`lena-glass lena-gallery-card ${asset.layout ?? "standard"}`} key={asset.id}><ProjectVisual project={project} asset={asset} /><div className="lena-gallery-copy"><p className="lena-kicker">{asset.label[locale]}</p><p>{asset.caption[locale]}</p></div></article>)}</div>
  </div></section>;
}
