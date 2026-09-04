import { useState } from "react";
import { usePreferences } from "@/providers/preferences";
import { withBase } from "@/lib/base-path";
import { evidenceFor, type EvidenceSurface } from "@/features/world/content/evidence";
import type { SystemId } from "@/content/systems";

/**
 * Operating Surfaces — Chamber Layer C.
 *
 * The real application surfaces of a system, presented as floating dimensional
 * planes rather than a screenshots gallery. One surface is in focus at a time;
 * visitors step through the evidence with arrow controls or by selecting a
 * named capability from the rail. Every surface is real product UI from the
 * actual repository — this section is rendered only when real evidence exists,
 * and each surface states the capability it proves.
 *
 * Layout mirrors the constellation language: an orbit of labeled nodes
 * (capability markers) around the focused operational window.
 */

const motionQuery = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function OperatingSurfaces({
  systemId,
  brand,
  evidence,
}: {
  systemId: SystemId;
  /** Canonical product brand shown in the window chrome, e.g. "MALEK". */
  brand?: string;
  /** Optional ProductContractV1 projection; the authority remains evidence.ts. */
  evidence?: readonly EvidenceSurface[];
}) {
  const { locale } = usePreferences();
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(motionQuery());

  const surfaces = evidence ?? evidenceFor(systemId) ?? [];
  if (surfaces.length === 0) return null;

  const current = (surfaces[active] ?? surfaces[0]) as EvidenceSurface;

  const step = (dir: 1 | -1) => {
    if (reduced !== motionQuery()) setReduced(motionQuery());
    setActive((prev) => (prev + dir + surfaces.length) % surfaces.length);
  };

  const go = (index: number) => setActive(index);

  return (
    <section
      className="lena-surfaces"
      aria-labelledby="lena-surfaces-heading"
      data-reduced-motion={reduced || undefined}
    >
      <header className="lena-surfaces-head">
        <p className="lena-surfaces-kicker">
          {locale === "ar" ? "سطح التشغيل — واجهة النظام الفعلية" : "OPERATING SURFACE — THE REAL SYSTEM INTERFACE"}
        </p>
        <h3 id="lena-surfaces-heading">
          {locale === "ar" ? "أدلة من داخل النظام" : "Evidence from inside the system"}
        </h3>
        <p className="lena-surfaces-note">
          {locale === "ar"
            ? "كل سطح حقيقي من واجهة النظام الفعلية، ويُظهر قدرة مختلفة: التشغيل، الأصول، العقود، المال، الصيانة، الأتمتة."
            : "Every surface is real UI from the actual system, each showing a different capability: operations, assets, contracts, money, maintenance, automation."}
        </p>
      </header>

      <div className="lena-surfaces-stage">
        {/* Orbit rail of capability markers */}
        <div className="lena-surfaces-rail" role="tablist" aria-label={locale === "ar" ? "أدلة النظام" : "System evidence"}>
          {surfaces.map((surface, index) => (
            <button
              key={surface.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls="lena-surfaces-window"
              className={`lena-surface-marker${index === active ? " is-active" : ""}`}
              onClick={() => go(index)}
            >
              <span className="lena-surface-marker-ring" aria-hidden="true" />
              <span className="lena-surface-marker-name">
                {surface.capability[locale]}
              </span>
            </button>
          ))}
        </div>

        {/* Focused operational window */}
        <div
          className="lena-surfaces-window"
          id="lena-surfaces-window"
          role="tabpanel"
          aria-live="polite"
        >
          <figure className="lena-surface-figure" key={current.id}>
            <div className="lena-surface-frame">
              <div className="lena-surface-frame-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{brand ?? systemId}</span>
              </div>
              <img
                src={withBase(current.src)}
                alt={current.alt[locale]}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.classList.add("is-missing");
                }}
              />
            </div>
            <figcaption>
              <strong>{current.capability[locale]}</strong>
              <span>{current.alt[locale]}</span>
            </figcaption>
          </figure>

          <div className="lena-surfaces-arrows">
            <button type="button" className="lena-surface-arrow is-prev" onClick={() => step(-1)} aria-label={locale === "ar" ? "السطح السابق" : "Previous surface"}>
              <span aria-hidden="true">‹</span>
            </button>
            <span className="lena-surfaces-count" aria-hidden="true">
              {String(active + 1).padStart(2, "0")} / {String(surfaces.length).padStart(2, "0")}
            </span>
            <button type="button" className="lena-surface-arrow is-next" onClick={() => step(1)} aria-label={locale === "ar" ? "السطح التالي" : "Next surface"}>
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
