import { useParams } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { findCaseStudy } from "@/content/caseStudies";
import { findStudioProject } from "@/content/projects";
import CaseStudySections from "@/features/projects/CaseStudySections";
import CmsProjectDetails from "@/features/projects/CmsProjectDetails";
import ProjectGallery from "@/features/projects/ProjectGallery";
import ProjectVisual from "@/features/projects/ProjectVisual";
import RelatedServices from "@/features/projects/RelatedServices";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

export default function ProjectDetails() {
  const { projectId = "" } = useParams();
  const { locale } = usePreferences();
  const project = findStudioProject(projectId);
  const study = findCaseStudy(projectId);
  if (!project || !study) return <CmsProjectDetails slug={projectId} />;
  return <PublicShell>
    <SeoHead title={project.title[locale]} description={project.summary[locale]} path={`/work/${project.id}`} type="article" />
    <section className="lena-page lena-container lena-case-hero"><div><p className="lena-kicker">LENA CASE STUDY</p><p className="lena-kicker">{project.category[locale]}</p><h1 className="lena-page-title">{project.title[locale]}</h1><p className="lena-lead">{project.summary[locale]}</p><div className="lena-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><ProjectVisual project={project} asset={study.gallery[0]} /></section>
    <CaseStudySections project={project} study={study} />
    <ProjectGallery project={project} study={study} />
    <RelatedServices project={project} />
    <LenaCta project />
  </PublicShell>;
}
