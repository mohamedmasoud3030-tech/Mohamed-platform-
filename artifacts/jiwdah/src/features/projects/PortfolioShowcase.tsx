import { publicProjects } from "@/content/projects";
import { findCaseStudy } from "@/content/caseStudies";
import { usePreferences } from "@/providers/preferences";
import ProjectCard from "@/features/projects/ProjectCard";

export default function PortfolioShowcase() {
  const { locale } = usePreferences();
  const featured = publicProjects().filter((project) => findCaseStudy(project.id)?.featured);
  const archive = publicProjects().filter((project) => !findCaseStudy(project.id)?.featured);
  return <>
    <section className="lena-section"><div className="lena-container"><p className="lena-kicker">SIGNATURE CASE STUDIES</p><h2 className="lena-section-title">{locale === "ar" ? "مشاريع مختارة تُعرض كأنظمة متكاملة" : "Selected projects presented as complete systems"}</h2><p className="lena-section-lead">{locale === "ar" ? "كل دراسة تبدأ من المشكلة وتشرح الاتجاه والحل والمخرجات والنماذج البصرية داخل رحلة واضحة." : "Each study moves from problem to direction, solution, outputs, and visual mockups inside a clear journey."}</p><div className="lena-bento lena-project-grid lena-signature-grid">{featured.map((project, index) => <ProjectCard key={project.id} project={project} featured={index === 0} />)}</div></div></section>
    <section className="lena-section"><div className="lena-container"><p className="lena-kicker">LENA ORIGINALS</p><h2 className="lena-section-title">{locale === "ar" ? "المزيد من الأنظمة والتجارب القابلة للاستكشاف" : "More systems and experiences ready to explore"}</h2><div className="lena-bento lena-project-grid">{archive.map((project) => <ProjectCard key={project.id} project={project} />)}</div></div></section>
  </>;
}
