import type { AppLocale } from "@/providers/preferences";
import { findSystem, publicSystems, type SystemId } from "@/content/systems";

/**
 * LENA World presentation model.
 *
 * Factual product truth and public membership/order are owned by
 * `content/systems.ts`. This file owns presentation metadata only:
 * visual state and Digital DNA. Routes are deterministically derived from the
 * canonical system id, so World/Atlas/Signals cannot drift into a second
 * portfolio registry.
 */

/** Visual state vocabulary for World entities (LENA_WORLD_FOUNDATION.md §6). */
export type WorldState = "live" | "beta" | "forming";

/** Controlled variation inside one LENA visual universe (foundation §7). */
export type DigitalDNA =
  | "architectural"
  | "organic"
  | "crafted"
  | "ceremonial"
  | "systemic"
  | "industrial";

export type WorldEntity = {
  /** Stable canonical id — factual truth stays in content/systems.ts. */
  systemId: SystemId;
  state: WorldState;
  dna: DigitalDNA;
  /** Enter the calm World chamber for this system. */
  detailPath: string;
};

type WorldPresentation = Pick<WorldEntity, "state" | "dna">;

/**
 * Founder-controlled presentation metadata only.
 *
 * This is intentionally NOT a membership registry. A system appears in the
 * World only when `publicSystems()` says it is public. Adding a new public
 * system therefore requires presentation metadata, but never a second
 * membership/order/route declaration.
 */
const WORLD_PRESENTATION: Partial<Record<SystemId, WorldPresentation>> = {
  wellness: { state: "beta", dna: "organic" },
  rental: { state: "beta", dna: "crafted" },
  property: { state: "live", dna: "architectural" },
  hospitality: { state: "forming", dna: "ceremonial" },
  investment: { state: "beta", dna: "systemic" },
  recycling: { state: "forming", dna: "industrial" },
};

export function worldPathFor(systemId: SystemId): string {
  return `/world/${systemId}`;
}

function buildWorldEntities(): WorldEntity[] {
  return publicSystems().map((system) => {
    const presentation = WORLD_PRESENTATION[system.id];
    if (!presentation) {
      throw new Error(
        `Missing LENA World presentation metadata for public system "${system.id}"`,
      );
    }

    return {
      systemId: system.id,
      ...presentation,
      detailPath: worldPathFor(system.id),
    };
  });
}

/**
 * Canonical public constellation.
 *
 * Membership + order come from `publicSystems()`; state/DNA come from the
 * presentation map above; route comes from the stable system id.
 */
export const WORLD_ENTITIES: WorldEntity[] = buildWorldEntities();

/**
 * World state is internal canonical truth (evidence of operating depth), never
 * rendered as public lifecycle status. The public experience describes
 * capability only.
 */
export function worldEntities(): WorldEntity[] {
  return WORLD_ENTITIES;
}

export function findWorldEntity(systemId: string | undefined): WorldEntity | undefined {
  return WORLD_ENTITIES.find((entity) => entity.systemId === systemId);
}

/** Resolve the canonical system for a World entity, if it is public. */
export function worldSystem(entity: WorldEntity) {
  return findSystem(entity.systemId);
}
