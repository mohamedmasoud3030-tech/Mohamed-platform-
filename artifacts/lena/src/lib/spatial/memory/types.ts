/**
 * LENA Spatial Memory — the canonical model.
 *
 * One small, typed record of where the visitor last was in LENA. It exists
 * for continuity, not surveillance: it stores interaction state useful for
 * continuing the journey, nothing more. No identifiers, no profiling, no
 * business data. The visitor's browser owns it and the visitor can erase it.
 *
 * Rules this model is built around:
 *   - deterministic: same input → same stored value
 *   - versioned: a future schema bump invalidates old records cleanly
 *   - resilient: a remembered destination may vanish; consumers must be able
 *     to fall back, so the model never encodes a destination as required
 *   - small: if it does not help "continue where you left off", it does not
 *     belong here
 */

import type { LenaSpace, SpatialIntent } from "../types";

/** Bump when the shape changes. Any other version is treated as absent. */
export const SPATIAL_MEMORY_VERSION = 1 as const;

/** The inner destination inside a chamber, when the visitor went that deep. */
export type SpatialInnerDestination = "constellation" | null;

/** How the visitor is expected to want to enter LENA, when we know. */
export type SpatialEntryContext = "gateway" | "deep-link" | "return" | "direct" | null;

export interface SpatialNavigationRecord {
  /** Router-relative destination. */
  to: string;
  /** The intent of that movement. */
  intent: SpatialIntent;
  /** Epoch ms of the movement. */
  at: number;
}

/** The whole of what LENA remembers. Deliberately nothing else. */
export interface SpatialMemory {
  /** Schema version — currently the only field that may gate parsing. */
  v: typeof SPATIAL_MEMORY_VERSION;
  /** Last LENA space visited (home threshold, the world field, a chamber). */
  lastSpace: LenaSpace;
  /** Last visited world/system. Null when the visit never reached one. */
  lastSystemId: string | null;
  /** Last chamber entered, router-relative ("/world/property"), or null. */
  lastChamberPath: string | null;
  /** Last inner destination, when useful. */
  lastInner: SpatialInnerDestination;
  /** Most recent meaningful navigation. */
  lastNavigation: SpatialNavigationRecord | null;
  /** Epoch ms of the last interaction worth remembering. */
  lastInteractionAt: number;
  /** Preferred entry context, when known. */
  entryContext: SpatialEntryContext;
  /** The first-time spatial introduction has already been experienced. */
  introSeen: boolean;
}

/** A fresh memory, before anything has been experienced. */
export function emptySpatialMemory(now = Date.now()): SpatialMemory {
  return {
    v: SPATIAL_MEMORY_VERSION,
    lastSpace: "home",
    lastSystemId: null,
    lastChamberPath: null,
    lastInner: null,
    lastNavigation: null,
    lastInteractionAt: now,
    entryContext: null,
    introSeen: false,
  };
}

/** Input accepted by `remember` — everything optional so the caller only
 *  states what actually changed. */
export interface SpatialMemoryInput {
  space?: LenaSpace;
  systemId?: string | null;
  chamberPath?: string | null;
  inner?: SpatialInnerDestination;
  navigation?: SpatialNavigationRecord | null;
  entryContext?: SpatialEntryContext;
  introSeen?: boolean;
  /** Epoch ms. Defaults to now. */
  at?: number;
}
