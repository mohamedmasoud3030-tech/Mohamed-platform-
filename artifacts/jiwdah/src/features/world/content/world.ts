import type { AppLocale } from "@/providers/preferences";
import { findSystem, type SystemId } from "@/content/systems";

/**
 * LENA World presentation model.
 *
 * The World is a curated entrance into the LENA ecosystem. Everything factual
 * (names, industries, problems, destinations) is read from the canonical
 * `content/systems.ts` — this file never duplicates product facts. What it adds
 * is founder-controlled *presentation* metadata: which systems appear in the
 * World v1, their visual state, their Digital DNA, and where they exit into
 * detailed content. These are world-building choices, not runtime inference.
 */

/** Visual state vocabulary for World entities (see LENA_WORLD_FOUNDATION.md §6). */
export type WorldState = "live" | "beta" | "forming";

/** Controlled variation inside one LENA visual universe (foundation §7). */
export type DigitalDNA = "architectural" | "organic" | "industrial";

export type WorldEntity = {
  /** Stable canonical id — the single source of truth for every fact. */
  systemId: SystemId;
  state: WorldState;
  dna: DigitalDNA;
  /** Exit into the calm, detailed product content. */
  detailPath: string;
};

/**
 * v1 constellation. MALEK (property) is live and architectural; LenaBeauty
 * (wellness) is beta and organic; Kayyal (recycling) is forming and industrial.
 * This mapping is explicit and stable — it is not derived from runtime data.
 */
export const WORLD_ENTITIES: WorldEntity[] = [
  { systemId: "property", state: "live", dna: "architectural", detailPath: "/services#property" },
  { systemId: "wellness", state: "beta", dna: "organic", detailPath: "/services#wellness" },
  { systemId: "recycling", state: "forming", dna: "industrial", detailPath: "/services#recycling" },
];

/** Stage labels used by the World surface. Real stage vocabulary, not telemetry. */
export const WORLD_STATE_LABEL: Record<WorldState, Record<AppLocale, string>> = {
  live: { ar: "مباشر", en: "Live" },
  beta: { ar: "تجريبي", en: "Beta" },
  forming: { ar: "قيد التكوين", en: "Forming" },
};

/** Short non-claim explanation of what each state means. */
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

/** Resolve the canonical system for a World entity, if it is public. */
export function worldSystem(entity: WorldEntity) {
  return findSystem(entity.systemId);
}
