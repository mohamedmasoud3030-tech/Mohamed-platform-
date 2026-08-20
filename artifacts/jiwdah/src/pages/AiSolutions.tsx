import LenaCta from "@/components/LenaCta";
import { STUDIO_PROJECTS } from "@/content/projects";
import ProjectCard from "@/features/projects/ProjectCard";
import PublicShell from "@/layouts/PublicShell";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
export default function AiSolutions() { const copy = useSiteCopy(); const { locale } = usePreferences(); const projects = STUDIO_PROJECTS.filter((project) => project.services.includes("ai-automation")); const seo = pageSeo("ai", locale); return <PublicShell><SeoHead title={seo.title} description={seo.description} path="/ai-solutions" /><section className="lena-page lena-container"><p className="lena-kicker">{copy.ai.eyebrow}</p><h1 className="lena-page-title">{copy.ai.title}</h1><p className="lena-lead">{copy.ai.intro}</p></section><section className="lena-section"><div className="lena-container"><p className="lena-kicker">LENA SYSTEMS</p><h2 className="lena-section-title">{copy.ai.empty}</h2><div className="lena-bento lena-project-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} featured={index === 0} />)}</div></div></section><LenaCta /></PublicShell>; }
