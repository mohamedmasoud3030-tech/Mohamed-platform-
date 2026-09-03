/**
 * LENA Spatial Continuation — where does a returning visitor want to go?
 *
 * Resolves the stored memory into a *suggestion*. It is always optional,
 * always cancellable by the visitor, and always validated against the live
 * world registry: a remembered destination that no longer exists simply
 * falls back one level. Continuation never routes — it only points.
 */

import type { SpatialMemory } from "./memory/types";

/** The live world registry: which systems exist and where their chambers are.
 *  Injected by the app (from `WORLD_ENTITIES`) so the resolver stays pure. */
export interface WorldRegistry {
  isKnownSystem(systemId: string): boolean;
  chamberPathFor(systemId: string): string | null;
  nameFor(systemId: string, locale: "ar" | "en"): string | null;
}

export interface Continuation {
  kind: "chamber" | "world";
  /** The system the continuation is about, when known and still valid. */
  systemId?: string;
  /** Router-relative path to continue into. */
  path: string;
  /** When the memory says the visitor reached a chamber. */
  reachedChamber: boolean;
  /** Epoch ms of the last interaction behind this continuation. */
  at: number;
}

/**
 * Resolve a safe continuation from memory.
 *
 *   - no memory                    → null (first visit; nothing to continue)
 *   - chamber remembered, system ok → continue into that chamber
 *   - chamber remembered, system gone → fall back to the world field
 *   - world/system remembered       → continue to the world (focus restored
 *                                     by the world page itself)
 *   - nothing LENA-specific         → null
 */
export function resolveContinuation(
  memory: SpatialMemory | null,
  registry: WorldRegistry,
): Continuation | null {
  if (!memory) return null;

  const { lastSpace, lastSystemId, lastChamberPath, lastInteractionAt } = memory;

  if (lastSpace === "chamber" && lastSystemId && registry.isKnownSystem(lastSystemId)) {
    const path = registry.chamberPathFor(lastSystemId) ?? lastChamberPath;
    if (path && path.startsWith("/world/")) {
      return {
        kind: "chamber",
        systemId: lastSystemId,
        path,
        reachedChamber: true,
        at: lastInteractionAt,
      };
    }
  }

  if (lastSpace === "world") {
    return {
      kind: "world",
      systemId: lastSystemId ?? undefined,
      path: "/world",
      reachedChamber: false,
      at: lastInteractionAt,
    };
  }

  if (lastSpace === "chamber" && lastSystemId && !registry.isKnownSystem(lastSystemId)) {
    // Stale destination: fall back to the field, never into a dead room.
    return {
      kind: "world",
      path: "/world",
      reachedChamber: false,
      at: lastInteractionAt,
    };
  }

  return null;
}

/** A remembered system focus for the world page, when it still exists. */
export function resolveRememberedFocus(
  memory: SpatialMemory | null,
  registry: WorldRegistry,
): string | null {
  const id = memory?.lastSystemId ?? null;
  if (!id) return null;
  return registry.isKnownSystem(id) ? id : null;
}
