import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { publicSystems } from "@/content/systems";
import { SystemLogo } from "@/design-system/brand/SystemLogo";
import { usePreferences } from "@/providers/preferences";

/** Industry-first entry points, as decided in PRODUCT_DECISIONS.md D4. */
export default function SystemGrid({
  limit,
  visitedSystemId,
}: {
  limit?: number;
  /** The system the visitor was last in, when world memory says so.
   *  Renders a quiet "remembered" mark; no behavior change. */
  visitedSystemId?: string | null;
}) {
  const { locale } = usePreferences();
  const systems = limit ? publicSystems().slice(0, limit) : publicSystems();

  return (
    <div className="lena-bento lena-showcase-grid">
      {systems.map((system, index) => (
        <article
          className={`lena-glass lena-service-card${index === 0 || index === 3 ? " wide" : ""}${
            system.id === visitedSystemId ? " is-visited" : ""
          }`}
          key={system.id}
          data-system={system.id}
        >
          <i className="lena-card-glow" />
          <div className="lena-card-top">
            <small>{String(index + 1).padStart(2, "0")}</small>
            <SystemLogo systemId={system.id} size={32} />
          </div>
          {system.id === visitedSystemId ? (
            <span className="lena-visited-mark">
              {locale === "ar" ? "آخر نظام زرتَه" : "LAST VISITED"}
            </span>
          ) : null}
          <h3>{system.name[locale]}</h3>
          {system.tagline ? <p className="lena-system-tagline">{system.tagline[locale]}</p> : null}
          <p className="lena-system-industry">{system.industry[locale]}</p>
          <span className="lena-roots-chip">
            {system.operatingPrimitives.length}{" "}
            {locale === "ar" ? "جذور تشغيل" : "operating roots"}
          </span>
          <p>{system.problem[locale]}</p>

          {system.trustHighlights ? (
            <div className="lena-system-highlights" aria-label={locale === "ar" ? "ضمانات التشغيل" : "Operational highlights"}>
              {system.trustHighlights[locale].slice(0, 3).map((item) => (
                <span key={item} className="lena-trust-chip">
                  <ShieldCheck size={12} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "12px", marginTop: "auto", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <Link className="lena-more" to={`/world/${system.id}`}>
              {locale === "ar" ? "افتح غرفة النظام" : "Open system chamber"}
              <ArrowUpRight size={15} />
            </Link>
            <Link style={{ fontSize: "11px", color: "var(--lena-muted)", textDecoration: "none" }} to={`/services#${system.id}`}>
              {locale === "ar" ? "المواصفات" : "Specs"}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
