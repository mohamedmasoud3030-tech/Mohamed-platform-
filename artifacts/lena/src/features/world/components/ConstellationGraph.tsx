import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import type { AppLocale } from "@/providers/preferences";
import type {
  BusinessSystem,
  OperatingPrimitiveId,
  SystemId,
} from "@/content/systems";
import { useSpatialScene } from "../spatial/useSpatialScene";
import {
  buildConstellationRoots,
  type ConstellationRoot,
} from "../content/operating-primitives";

type Point = { x: number; y: number };

// Positions only for worlds currently shown in the graph; hidden canonical
// products have no position and are simply not plotted.
const SYSTEM_POSITIONS: Partial<Record<SystemId, Point>> = {
  wellness: { x: 16, y: 18 },
  rental: { x: 50, y: 8 },
  property: { x: 84, y: 18 },
  hospitality: { x: 84, y: 82 },
  investment: { x: 50, y: 92 },
  recycling: { x: 16, y: 82 },
};

const ROOT_POSITIONS: Record<OperatingPrimitiveId, Point> = {
  relationships: { x: 32, y: 31 },
  time: { x: 50, y: 24 },
  money: { x: 68, y: 31 },
  assets: { x: 74, y: 50 },
  workflow: { x: 68, y: 69 },
  documents: { x: 50, y: 76 },
  insight: { x: 32, y: 69 },
  people: { x: 26, y: 50 },
  integrity: { x: 50, y: 63 },
};

export type ConstellationGraphProps = {
  systems: BusinessSystem[];
  locale: AppLocale;
};

function rootStatus(root: ConstellationRoot, locale: AppLocale) {
  if (root.maturity === "shared") {
    return locale === "ar" ? "جذر مشترك مثبت" : "Proven shared root";
  }
  return locale === "ar" ? "إشارة ناشئة" : "Emerging signal";
}

/**
 * World v6 — the factual bridge from vertical products to LENA OS.
 *
 * Systems remain independent. The graph only reveals repeated operating roots
 * explicitly assigned in canonical content. Selecting a root explains the
 * evidence behind it and highlights exactly the products connected to it.
 */
export default function ConstellationGraph({
  systems,
  locale,
}: ConstellationGraphProps) {
  const { rootRef } = useSpatialScene<HTMLElement>({ margin: "120px" });
  const roots = useMemo(() => buildConstellationRoots(systems), [systems]);
  const initialId =
    roots.find((root) => root.id === "money")?.id ?? roots[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<OperatingPrimitiveId | null>(
    initialId,
  );
  const selectedRoot = roots.find((root) => root.id === selectedId) ?? roots[0];
  const sharedCount = roots.filter((root) => root.maturity === "shared").length;

  if (!selectedRoot) return null;

  const selectedSystems = systems.filter((system) =>
    selectedRoot.systemIds.includes(system.id),
  );
  const graphLabel =
    locale === "ar"
      ? "خريطة الجذور التشغيلية المشتركة بين أنظمة LENA"
      : "Map of shared operating roots across LENA systems";

  return (
    <section
      id="lena-os"
      className="lena-os-reveal"
      aria-labelledby="lena-os-title"
      ref={rootRef}
    >
      <header className="lena-os-heading">
        <div>
          <p className="lena-kicker">WORLD V6 · LENA CONSTELLATION GRAPH</p>
          <h2 id="lena-os-title">
            {locale === "ar"
              ? "ستة أنظمة من الخارج. جذور تشغيلية مشتركة في العمق."
              : "Six systems outside. Shared operating roots underneath."}
          </h2>
          <p>
            {locale === "ar"
              ? "هذه ليست ادعاءً بأن المنتجات صارت منصة واحدة؛ إنها خريطة للتكرار المثبت الذي يمكن أن ينمو، خطوة بخطوة، إلى LENA OS."
              : "This does not claim the products already share one platform. It maps proven repetition that can grow, step by step, into LENA OS."}
          </p>
        </div>
        <dl
          className="lena-os-proof"
          aria-label={locale === "ar" ? "ملخص الخريطة" : "Graph summary"}
        >
          <div>
            <dt>{locale === "ar" ? "أنظمة" : "Systems"}</dt>
            <dd>{systems.length}</dd>
          </div>
          <div>
            <dt>{locale === "ar" ? "جذور مشتركة" : "Shared roots"}</dt>
            <dd>{sharedCount}</dd>
          </div>
          <div>
            <dt>{locale === "ar" ? "قاعدة الترقية" : "Promotion rule"}</dt>
            <dd>2+</dd>
          </div>
        </dl>
      </header>

      <div className="lena-os-graph-stage" role="group" aria-label={graphLabel}>
        <div className="lena-os-field" aria-hidden="true" />
        <svg
          className="lena-os-edges"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {roots.flatMap((root) => {
            const rootPoint = ROOT_POSITIONS[root.id];
            return root.systemIds.map((systemId) => {
              const systemPoint = SYSTEM_POSITIONS[systemId];
              if (!systemPoint) return null;
              return (
                <line
                  key={`${systemId}-${root.id}`}
                  x1={systemPoint.x}
                  y1={systemPoint.y}
                  x2={rootPoint.x}
                  y2={rootPoint.y}
                  className={
                    selectedRoot.id === root.id ? "is-active" : undefined
                  }
                  data-root={root.id}
                />
              );
            });
          })}
          {roots.map((root) => {
            const point = ROOT_POSITIONS[root.id];
            return (
              <line
                key={`core-${root.id}`}
                x1={point.x}
                y1={point.y}
                x2="50"
                y2="50"
                className={`lena-os-core-edge${selectedRoot.id === root.id ? " is-active" : ""}`}
                data-root={root.id}
              />
            );
          })}
        </svg>

        <div className="lena-os-core" aria-hidden="true">
          <span />
          <strong>LENA OS</strong>
          <small>{locale === "ar" ? "طبقة تتكوّن" : "FORMING LAYER"}</small>
        </div>

        {systems.map((system) => {
          const point = SYSTEM_POSITIONS[system.id];
          if (!point) return null;
          const connected = selectedRoot.systemIds.includes(system.id);
          return (
            <Link
              key={system.id}
              to={`/world/${system.id}`}
              className={`lena-os-system${connected ? " is-connected" : ""}`}
              style={
                {
                  "--os-x": `${point.x}%`,
                  "--os-y": `${point.y}%`,
                } as CSSProperties
              }
              aria-label={`${system.name[locale]} — ${connected ? rootStatus(selectedRoot, locale) : graphLabel}`}
            >
              <i aria-hidden="true" />
              <strong>{system.name[locale]}</strong>
              <small>{system.industry[locale]}</small>
            </Link>
          );
        })}

        {roots.map((root) => {
          const point = ROOT_POSITIONS[root.id];
          const selected = root.id === selectedRoot.id;
          return (
            <button
              key={root.id}
              type="button"
              className={`lena-os-root is-${root.maturity}${selected ? " is-selected" : ""}`}
              style={
                {
                  "--os-x": `${point.x}%`,
                  "--os-y": `${point.y}%`,
                } as CSSProperties
              }
              onClick={() => setSelectedId(root.id)}
              aria-pressed={selected}
              aria-label={`${root.label[locale]} — ${rootStatus(root, locale)} — ${root.systemIds.length}`}
            >
              <span>{root.label[locale]}</span>
              <small>{root.systemIds.length}</small>
            </button>
          );
        })}
      </div>

      <div className="lena-os-mobile-roots" aria-label={graphLabel}>
        <div className="lena-os-mobile-core" aria-hidden="true">
          <strong>LENA OS</strong>
          <span>
            {locale === "ar"
              ? "الجذور تحت الأنظمة"
              : "Roots beneath the systems"}
          </span>
        </div>
        <div className="lena-os-root-grid">
          {roots.map((root) => (
            <button
              key={root.id}
              type="button"
              className={`lena-os-root-card is-${root.maturity}${selectedRoot.id === root.id ? " is-selected" : ""}`}
              onClick={() => setSelectedId(root.id)}
              aria-pressed={selectedRoot.id === root.id}
            >
              <span>
                <i aria-hidden="true" />
                {root.label[locale]}
              </span>
              <small>
                {root.systemIds.length} {locale === "ar" ? "أنظمة" : "systems"}
              </small>
            </button>
          ))}
        </div>
      </div>

      <aside
        className={`lena-os-explanation is-${selectedRoot.maturity}`}
        aria-live="polite"
      >
        <div className="lena-os-explanation-title">
          <span>{rootStatus(selectedRoot, locale)}</span>
          <h3>{selectedRoot.label[locale]}</h3>
          <p>{selectedRoot.meaning[locale]}</p>
        </div>
        <div className="lena-os-connected-systems">
          <small>{locale === "ar" ? "مثبت داخل" : "PROVEN INSIDE"}</small>
          <div>
            {selectedSystems.map((system) => (
              <Link key={system.id} to={`/world/${system.id}`}>
                {system.name[locale]}
              </Link>
            ))}
          </div>
        </div>
        <p className="lena-os-boundary">
          {selectedRoot.maturity === "shared"
            ? locale === "ar"
              ? "مرشح حقيقي لطبقة مشتركة — لا يُستخرج تقنيًا إلا عندما يثبت أن المشاركة تضيف قوة دون إضعاف تخصص كل نظام."
              : "A real shared-layer candidate — extracted technically only when sharing adds leverage without weakening each system's specialization."
            : locale === "ar"
              ? "إشارة حقيقية داخل نظام واحد، لكنها لا تُقدَّم بعد كقدرة مشتركة."
              : "A real signal inside one system, but not yet presented as a shared capability."}
        </p>
      </aside>
    </section>
  );
}
