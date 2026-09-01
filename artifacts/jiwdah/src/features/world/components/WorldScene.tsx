import { useLayoutEffect, type CSSProperties } from "react";
import { usePreferences } from "@/providers/preferences";
import { useSpatialScene } from "../spatial/useSpatialScene";
import { buildStars } from "../spatial/ambientField";
import {
  worldSystem,
  WORLD_ACTION_LABEL,
  WORLD_STATE_LABEL,
  WORLD_STATE_NOTE,
  type WorldEntity,
} from "../content/world";

/**
 * LENA World scene.
 *
 * LENA is the gravitational identity; the three systems are spatial entities,
 * not cards. Each entity carries its own Digital DNA (architectural / organic /
 * industrial) and encodes its state (live / beta / forming) through form and
 * behavior, not just a label.
 *
 * Layout: the three entities orbit the LENA center as a flat constellation on
 * desktop (an intentional departure from the homepage's tilted planes — the
 * World is a "map", the Orbit is a "machine"). On mobile the scene is a single
 * focused entity with explicit accessible prev/next controls.
 *
 * Focus: the selected entity approaches (grows, sharpens), the others recede
 * but remain spatially present, and a calm information layer resolves beside
 * it. Pointer, keyboard and touch all select.
 *
 * Motion discipline: transforms/opacity only, no per-frame React state, rAF
 * writes frozen offscreen and under reduced-motion, IntersectionObserver gating.
 */

export type WorldSceneProps = {
  entities: WorldEntity[];
  /** Active entity systemId. */
  selectedId: string | null;
  onSelect: (systemId: string) => void;
};
/**
 * Constellation geometry (desktop, centered on the scene's 0,0).
 * Positions keep the entities clear of the reserved info-panel band at the
 * bottom-center of the scene, so a selected entity's info layer never covers
 * (or blocks) another entity.
 */
const ENTITY_POS = [
  // architectural (MALEK) — lower-left
  { x: -220, y: 112 },
  // organic (LenaBeauty) — upper-right
  { x: 232, y: -82 },
  // industrial (Kayyal) — lower-right
  { x: 268, y: 172 },
] as const;
export default function WorldScene({ entities, selectedId, onSelect }: WorldSceneProps) {
  const { locale } = usePreferences();
  const { rootRef } = useSpatialScene();

  // Ambient field paint (once).
  useLayoutEffect(() => {
    const field = rootRef.current?.querySelector<HTMLElement>(".lena-world-field");
    if (field) field.style.setProperty("--lena-stars", buildStars(22, 760, 2701));
  }, []);

  // Focus / approach state: selecting an entity slows the system, brings it
  // forward and recedes the others. Toggled via class so CSS owns the motion.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.toggle("is-focus", selectedId !== null);
  }, [selectedId]);

  return (
    <div className="lena-world" ref={rootRef}>
      <div className="lena-world-field" />
      <div className="lena-world-halo" />
      {/* LENA gravitational center */}
      <div className="lena-world-core" aria-hidden="true">
        <span className="lena-world-core-orb" />
        <strong>LENA</strong>
        <small>{locale === "ar" ? "عالم واحد" : "One world"}</small>
      </div>

      {/* Constellation rings (atmospheric, decorative) */}
      <i className="lena-world-ring wr-1" aria-hidden="true" />
      <i className="lena-world-ring wr-2" aria-hidden="true" />
      <i className="lena-world-ring wr-3" aria-hidden="true" />

      {entities.map((entity, i) => {
        const system = worldSystem(entity);
        if (!system) return null;
        const dna = entity.dna;
        const pos = ENTITY_POS[i];
        const selected = selectedId === entity.systemId;
        return (
          <button
            key={entity.systemId}
            type="button"
            className={`lena-world-entity dna-${dna} state-${entity.state}${selected ? " is-selected" : ""}`}
            style={
              {
                "--ex": `${pos.x}px`,
                "--ey": `${pos.y}px`,
                "--i": `${i * 0.09}s`,
              } as CSSProperties
            }
            onClick={() => onSelect(entity.systemId)}
            aria-pressed={selected}
            aria-label={`${system.name[locale]} — ${system.industry[locale]} — ${WORLD_STATE_LABEL[entity.state][locale]}`}
          >
            <span className="lena-world-entity-figure" aria-hidden="true">
              <span className="lena-world-entity-marks" />
            </span>
            <span className="lena-world-entity-caption">
              <strong>{system.name[locale]}</strong>
              <em>{system.industry[locale]}</em>
              <span className="lena-world-entity-state">
                {WORLD_STATE_LABEL[entity.state][locale]}
              </span>
            </span>
          </button>
        );
      })}

      {/* Calm spatial information layer for the selected entity */}
      {(() => {
        const selected = entities.find((entity) => entity.systemId === selectedId);
        if (!selected) return null;
        const system = worldSystem(selected);
        if (!system) return null;
        return (
          <aside
            className={`lena-world-info dna-${selected.dna}`}
            style={{ "--info-x": "0px", "--info-y": "280px" } as CSSProperties}
            aria-live="polite"
          >
            <p className="lena-world-info-state">
              {WORLD_STATE_LABEL[selected.state][locale]}
            </p>
            <h2>{system.name[locale]}</h2>
            <p className="lena-world-info-industry">{system.industry[locale]}</p>
            <p className="lena-world-info-problem">{system.problem[locale]}</p>
            <p className="lena-world-info-note">
              {WORLD_STATE_NOTE[selected.state][locale]}
            </p>
            <a className="lena-world-info-action" href={selected.detailPath}>
              <span>{WORLD_ACTION_LABEL[selected.state][locale]}</span>
              <span aria-hidden="true">→</span>
            </a>
          </aside>
        );
      })()}

      {/* Mobile: explicit accessible prev/next selection */}
      <nav className="lena-world-mobile-nav" aria-label={locale === "ar" ? "اختيار النظام" : "Choose a system"}>
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