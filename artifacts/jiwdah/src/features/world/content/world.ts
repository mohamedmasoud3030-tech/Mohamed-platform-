import type { AppLocale } from "@/providers/preferences";
import { findSystem, type SystemId } from "@/content/systems";

/**
 * LENA World presentation model.
 *
 * The World is a curated entrance into the LENA ecosystem. Everything factual
 * (names, industries, problems, destinations) is read from canonical
 * `content/systems.ts`; this file owns presentation metadata only: visual state,
 * Digital DNA and the calm exit path. These are explicit world-building choices,
 * never runtime inference or invented telemetry.
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
  /** Stable canonical id — the single source of truth for every fact. */
  systemId: SystemId;
  state: WorldState;
  dna: DigitalDNA;
  /** Enter the calm World chamber for this system. */
  detailPath: string;
};

/**
 * Full public constellation v2+.
 *
 * Presentation order follows the canonical public family rather than creating a
 * second portfolio taxonomy. State/DNA are explicit founder-controlled visual
 * metadata. The underlying product stage remains owned by `content/systems.ts`.
 */
export const WORLD_ENTITIES: WorldEntity[] = [
  { systemId: "wellness", state: "beta", dna: "organic", detailPath: "/world/wellness" },
  { systemId: "rental", state: "beta", dna: "crafted", detailPath: "/world/rental" },
  { systemId: "property", state: "live", dna: "architectural", detailPath: "/world/property" },
  { systemId: "hospitality", state: "forming", dna: "ceremonial", detailPath: "/world/hospitality" },
  { systemId: "investment", state: "beta", dna: "systemic", detailPath: "/world/investment" },
  { systemId: "recycling", state: "forming", dna: "industrial", detailPath: "/world/recycling" },
];

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
