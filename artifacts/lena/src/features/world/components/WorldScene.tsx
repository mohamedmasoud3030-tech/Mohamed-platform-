import { useLayoutEffect, type CSSProperties } from "react";
import { SystemLogo } from "@/design-system/brand/SystemLogo";
import type { SystemId } from "@/content/systems";
import { usePreferences } from "@/providers/preferences";
import { useSpatialScene } from "../spatial/useSpatialScene";
import { buildStars } from "../spatial/ambientField";
import { useWorldPortalTransition } from "../WorldPortalTransition";
import { worldSystem, type WorldEntity } from "../content/world";
import { useSignalRuntime } from "../signals";
import { useLenaIntelligence } from "@/features/core-intelligence/useLenaIntelligence";

export type WorldSceneProps = {
  entities: WorldEntity[];
  selectedId: string | null;
  onSelect: (systemId: string) => void;
};

/**
 * Full-constellation geometry. The six systems form a wide hexagonal field
 * around the Sacred Core, while the lower band remains reserved for the calm
 * selected-system information layer.
 */
const ENTITY_POS = [
  { x: -250, y: -160 },
  { x: 0, y: -250 },
  { x: 250, y: -160 },
  { x: -285, y: 70 },
  { x: 285, y: 70 },
  { x: 0, y: 130 },
] as const;

export default function WorldScene({ entities, selectedId, onSelect }: WorldSceneProps) {
  const { locale } = usePreferences();
  const { rootRef } = useSpatialScene();
  const enterPortal = useWorldPortalTransition();
  const { presence, globalState, source } = useSignalRuntime();
  const { core, guidance } = useLenaIntelligence();

  useLayoutEffect(() => {
    const field = rootRef.current?.querySelector<HTMLElement>(".lena-world-field");
    if (field) field.style.setProperty("--lena-stars", buildStars(34, 840, 2701));
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.toggle("is-focus", selectedId !== null);
    if (selectedId) root.dataset.focus = selectedId;
    else delete root.dataset.focus;
  }, [selectedId]);

  return (
    <div
      className={`lena-world lena-world-v2 world-${globalState ?? "unavailable"}`}
      ref={rootRef}
      data-core-state={core.state}
      data-core-urgency={core.urgency}
      data-guidance-world={guidance.destination?.systemId ?? undefined}
      data-signal-availability={source.availability}
    >
      <div className="lena-world-field" />
      <div className="lena-world-halo" />

      {/* Shared Sacred Core: the same gravitational identity used on Home. */}
      <div
        className={`lena-world-core core-${core.state} urgency-${core.urgency}`}
        aria-hidden="true"
        data-core-state={core.state}
        data-core-pulse={core.pulse}
        data-core-attention={core.attentionLevel}
        data-core-intensity={core.intensity}
      >
        <span className="lena-world-core-orb" />
        <strong>LENA</strong>
        <small>{locale === "ar" ? "عالم واحد" : "One world"}</small>
      </div>

      {/* Constellation rings stay atmospheric; systems are not locked to them. */}
      <i className="lena-world-ring wr-1" aria-hidden="true" />
      <i className="lena-world-ring wr-2" aria-hidden="true" />
      <i className="lena-world-ring wr-3" aria-hidden="true" />
      <i className="lena-world-ring wr-4" aria-hidden="true" />

      {/* Energy paths make the relationship explicit: every system belongs to
          one world and resolves back to the same center. */}
      <div className="lena-world-paths" aria-hidden="true">
        {entities.map((entity, i) => {
          const pos = ENTITY_POS[i] ?? { x: 0, y: 0 };
          const len = Math.hypot(pos.x, pos.y);
          const angle = (Math.atan2(pos.y, pos.x) * 180) / Math.PI;
          const pathPresence = presence[entity.systemId] ?? "unavailable";
          return (
            <i
              key={`path-${entity.systemId}`}
              className={`lena-world-path presence-${pathPresence}${selectedId === entity.systemId ? " is-active" : ""}`}
              style={
                {
                  "--path-l": `${len.toFixed(1)}px`,
                  "--path-a": `${angle.toFixed(2)}deg`,
                  "--path-i": `${i * 0.08}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>

      {entities.map((entity, i) => {
        const system = worldSystem(entity);
        if (!system) return null;
        const pos = ENTITY_POS[i] ?? { x: 0, y: 0 };
        const selected = selectedId === entity.systemId;
        const entityPresence = presence[entity.systemId] ?? "unavailable";
        return (
          <button
            key={entity.systemId}
            type="button"
            className={`lena-world-entity dna-${entity.dna} state-${entity.state} presence-${entityPresence}${selected ? " is-selected" : ""}`}
            style={
              {
                "--ex": `${pos.x}px`,
                "--ey": `${pos.y}px`,
                "--portal-x": `${(pos.x * 0.34).toFixed(1)}px`,
                "--portal-y": `${(pos.y * 0.34).toFixed(1)}px`,
                "--i": `${i * 0.09}s`,
              } as CSSProperties
            }
            onClick={() => onSelect(entity.systemId)}
            aria-pressed={selected}
            aria-label={`${system.name[locale]} — ${system.industry[locale]}`}
          >
            <span className="lena-world-entity-figure" aria-hidden="true">
              <SystemLogo systemId={entity.systemId as SystemId} size={40} />
              <span className="lena-world-entity-marks" />
            </span>
            <span className="lena-world-entity-caption">
              <strong>{system.name[locale]}</strong>
              <em>{system.industry[locale]}</em>
              <span className="lena-world-entity-roots">
                {system.operatingPrimitives.length}{" "}
                {locale === "ar" ? "جذور تشغيل" : "operating roots"}
              </span>
            </span>
          </button>
        );
      })}

      {(() => {
        const selected = entities.find((entity) => entity.systemId === selectedId);
        if (!selected) return null;
        const system = worldSystem(selected);
        if (!system) return null;
        return (
          <aside
            className={`lena-world-info dna-${selected.dna}`}
            style={{ "--info-x": "0px", "--info-y": "430px" } as CSSProperties}
            aria-live="polite"
          >
            <p className="lena-world-info-roots">
              {system.operatingPrimitives.length}{" "}
              {locale === "ar" ? "جذور تشغيل مشتركة مع أنظمة LENA" : "operating roots shared with LENA systems"}
            </p>
            <h2>{system.name[locale]}</h2>
            <p className="lena-world-info-industry">{system.industry[locale]}</p>
            <p className="lena-world-info-problem">{system.problem[locale]}</p>
            <p className="lena-world-info-note">{system.usage[locale]}</p>
            <a
              className="lena-world-info-action"
              href={selected.detailPath}
              onClick={(event) => enterPortal(selected.detailPath, selected.systemId, event)}
            >
              <span>{locale === "ar" ? "افتح غرفة النظام" : "Open the system chamber"}</span>
              <span aria-hidden="true">→</span>
            </a>
          </aside>
        );
      })()}

      <nav
        className="lena-world-mobile-nav"
        aria-label={locale === "ar" ? "اختيار النظام" : "Choose a system"}
      >
        {entities.map((entity) => {
          const system = worldSystem(entity);
          if (!system) return null;
          return (
            <button
              key={entity.systemId}
              type="button"
              className={`lena-world-mobile-dot${selectedId === entity.systemId ? " is-active" : ""}`}
              onClick={() => onSelect(entity.systemId)}
              aria-label={system.name[locale]}
              aria-pressed={selectedId === entity.systemId}
            >
              <span>{system.name[locale]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
