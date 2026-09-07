import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { publicSystems } from "@/content/systems";
import { usePreferences } from "@/providers/preferences";

/**
 * Industry-first entry points.
 * Each card animates in when scrolled into view with staggered timing.
 */
export default function SystemGrid({
  limit,
  visitedSystemId,
}: {
  limit?: number;
  visitedSystemId?: string | null;
}) {
  const { locale } = usePreferences();
  const systems = limit ? publicSystems().slice(0, limit) : publicSystems();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = gridRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gridRef}
      className={`lena-bento lena-showcase-grid scroll-stagger ${isVisible ? "is-visible" : ""}`}
    >
      {systems.map((system, index) => (
        <article
          className={`lena-glass lena-service-card ${system.id}${
            index === 0 || index === 3 ? " wide" : ""
          }${system.id === visitedSystemId ? " is-visited" : ""}`}
          key={system.id}
          data-system={system.id}
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
          {system.tagline ? (
            <p className="lena-system-tagline">{system.tagline[locale]}</p>
          ) : null}
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
