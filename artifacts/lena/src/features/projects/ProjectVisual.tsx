import type { CaseStudyAsset } from "@/content/caseStudies";
import type { StudioProject } from "@/content/projects";

export default function ProjectVisual({ project, asset, dense = false }: { project: StudioProject; asset?: CaseStudyAsset; dense?: boolean }) {
  const visualKind = asset?.kind ?? "platform";
  return <div className={`lena-project-visual ${project.tone}${dense ? " dense" : ""} visual-${visualKind}`} aria-hidden="true">
    <div className="lena-visual-window"><i /><i /><i /><b /><b /><b /></div>
    <div className="lena-visual-stack"><span /><span /><span /></div>
    <div className="lena-visual-nodes"><i /><i /><i /><i /></div>
    <div className="lena-visual-orb" />
  </div>;
}
