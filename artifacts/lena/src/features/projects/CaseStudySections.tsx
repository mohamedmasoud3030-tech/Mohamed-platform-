import { CheckCircle2 } from "lucide-react";
import type { CaseStudyDefinition } from "@/content/caseStudies";
import type { StudioProject } from "@/content/projects";
import { usePreferences } from "@/providers/preferences";

export default function CaseStudySections({ project, study }: { project: StudioProject; study: CaseStudyDefinition }) {
  const { locale } = usePreferences();
  const narrative = [
    [locale === "ar" ? "نظرة عامة" : "Overview", study.overview[locale]],
    [locale === "ar" ? "المشكلة" : "Challenge", study.challenge[locale]],
    [locale === "ar" ? "الاتجاه الإبداعي" : "Creative direction", study.direction[locale]],
    [locale === "ar" ? "الحل" : "Solution", study.solution[locale]],
  ];
  return <>
    <section className="lena-section"><div className="lena-container lena-case-narrative">{narrative.map(([title, body], index) => <article className={`lena-glass lena-case-story${index === 0 || index === 3 ? " wide" : ""}`} key={title}><small>{String(index + 1).padStart(2, "0")}</small><h2>{title}</h2><p>{body}</p></article>)}</div></section>
    <section className="lena-section"><div className="lena-container lena-case-panels"><article className="lena-glass lena-info-panel"><p className="lena-kicker">{locale === "ar" ? "المخرجات" : "Deliverables"}</p><ul>{project.deliverables[locale].map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></article><article className="lena-glass lena-info-panel"><p className="lena-kicker">{locale === "ar" ? "ملامح النظام" : "System features"}</p><ul>{study.features[locale].map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></article></div></section>
    <section className="lena-section"><div className="lena-container"><p className="lena-kicker">{locale === "ar" ? "رحلة البناء" : "Build journey"}</p><h2 className="lena-section-title">{locale === "ar" ? "من المشكلة إلى نظام قابل للاستخدام" : "From problem to a usable system"}</h2><div className="lena-case-journey">{study.journey[locale].map((item, index) => <article className="lena-glass" key={item}><small>{String(index + 1).padStart(2, "0")}</small><h3>{item}</h3></article>)}</div></div></section>
  </>;
}
