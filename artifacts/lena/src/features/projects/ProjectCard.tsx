import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { PROVENANCE_LABEL, type StudioProject } from "@/content/projects";
import { usePreferences } from "@/providers/preferences";
import ProjectVisual from "./ProjectVisual";
export default function ProjectCard({ project, featured = false }: { project: StudioProject; featured?: boolean }) { const { locale } = usePreferences(); return <article className={`lena-glass lena-project-card ${project.tone}${featured ? " featured" : ""}`}><ProjectVisual project={project} dense /><div className="lena-project-copy"><p className="lena-kicker">{project.category[locale]}</p><span className="lena-provenance">{PROVENANCE_LABEL[project.provenance][locale]}</span><h3>{project.title[locale]}</h3><p>{project.summary[locale]}</p><div className="lena-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link className="lena-more" to={`/work/${project.id}`}>{locale === "ar" ? "افتح دراسة المشروع" : "Open project story"}<ArrowUpRight size={15} /></Link></div></article>; }
