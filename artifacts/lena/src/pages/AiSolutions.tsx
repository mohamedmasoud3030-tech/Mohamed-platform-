import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { publicSystems } from "@/content/systems";
import PublicShell from "@/layouts/PublicShell";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";

/**
 * Public operating-intelligence surface.
 *
 * This page explains the live intelligence layer. It must not publish the
 * hidden creative catalog, invent operational activity, or render demo signals.
 * Worlds come from `publicSystems()`; the runtime lives in World / Atlas / Command.
 */
export default function AiSolutions() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const seo = pageSeo("ai", locale);
  const systems = publicSystems();
  const principles = [
    { title: copy.ai.readsTitle, body: copy.ai.reads },
    { title: copy.ai.honestyTitle, body: copy.ai.honesty },
    { title: copy.ai.whereTitle, body: copy.ai.where },
  ] as const;

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/ai-solutions" />

      <section className="lena-page lena-container">
        <p className="lena-kicker">{copy.ai.eyebrow}</p>
        <h1 className="lena-page-title">{copy.ai.title}</h1>
        <p className="lena-lead">{copy.ai.intro}</p>
        <div className="lena-actions">
          <Link className="lena-primary" to="/world">
            {copy.ai.enterWorld}
            <ArrowUpRight size={16} />
          </Link>
          <Link className="lena-secondary" to="/world/atlas">
            {copy.ai.openAtlas}
          </Link>
          <Link className="lena-secondary" to="/world/command">
            {copy.ai.openCommand}
          </Link>
        </div>
      </section>

      <section className="lena-section">
        <div className="lena-container lena-bento">
          {principles.map((principle, index) => (
            <article className={`lena-glass lena-principle${index === 0 ? " wide" : ""}`} key={principle.title}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <CheckCircle2 size={18} />
              <h2>{principle.title}</h2>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lena-section">
        <div className="lena-container">
          <p className="lena-kicker">{copy.ai.empty}</p>
          <h2 className="lena-section-title">{copy.ai.worldsTitle}</h2>
          <p className="lena-section-lead">{copy.ai.worldsIntro}</p>
          <div className="lena-bento">
            {systems.map((system) => (
              <article className="lena-glass lena-service-card lena-system-card" key={system.id}>
                <h3>{system.name[locale]}</h3>
                <p className="lena-system-industry">{system.industry[locale]}</p>
                <span className="lena-roots-chip">
                  {system.operatingPrimitives.length}{" "}
                  {locale === "ar" ? "جذور تشغيل" : "operating roots"}
                </span>
                <Link className="lena-more" to={`/world/${system.id}`}>
                  {locale === "ar" ? "افتح غرفة النظام" : "Open the system chamber"}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LenaCta />
    </PublicShell>
  );
}
