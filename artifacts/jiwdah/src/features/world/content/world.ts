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

/** Stage labels used by the World surface. Real vocabulary, not telemetry. */
export const WORLD_STATE_LABEL: Record<WorldState, Record<AppLocale, string>> = {
  live: { ar: "مباشر", en: "Live" },
  beta: { ar: "تجريبي", en: "Beta" },
  forming: { ar: "قيد التكوين", en: "Forming" },
};

/** Short non-claim explanation of what each visual state means. */
export const WORLD_STATE_NOTE: Record<WorldState, Record<AppLocale, string>> = {
  live: {
    ar: "نظام مستقر يعمل اليوم داخل عمل حقيقي.",
    en: "A stable system running today inside a real business.",
  },
  beta: {
    ar: "شبه مكتمل، يُضبط باستمرار قبل التشغيل الواسع.",
    en: "Nearly complete, still being calibrated before wider rollout.",
  },
  forming: {
    ar: "هيكل يبدأ في التكوّن ويُبنى قطعة قطعة.",
    en: "A structure beginning to assemble, built piece by piece.",
  },
};

/** Short labeled action for the selected entity. */
export const WORLD_ACTION_LABEL: Record<WorldState, Record<AppLocale, string>> = {
  live: { ar: "ادخل إلى النظام", en: "Enter the system" },
  beta: { ar: "تعرف على النظام", en: "Explore the system" },
  forming: { ar: "شاهد ما يُبنى", en: "See what is forming" },
};

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
