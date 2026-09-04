import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { publicSystems } from "@/content/systems";
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
        >
          <i className="lena-card-glow" />
          <div className="lena-card-top">
            <small>{String(index + 1).padStart(2, "0")}</small>
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
          <Link className="lena-more" to={`/services#${system.id}`}>
            {locale === "ar" ? "تعرّف على النظام" : "See how it runs"}
            <ArrowUpRight size={15} />
          </Link>
        </article>
      ))}
    </div>
  );
}
