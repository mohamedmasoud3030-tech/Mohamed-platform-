/**
 * LENA Intelligence — canonical context adapters.
 *
 * Thin pure mappers that translate canonical LENA runtime state into the
 * `LenaContextSituation` envelope the fusion layer consumes. They exist so
 * the kernel never touches React hooks, router state, or storage directly;
 * the app's integration layer can compose a situation from exactly what it
 * already holds:
 *
 *   fuseLenaContext({
 *     ...situationFromSpatial(route, navState, direction, phase),
 *     ...situationFromMemory(memory, registry),
 *     ...situationFromSignals(storeSnapshot, worldIds),
 *     graph,
 *     now,
 *   })
 */

import type {
  SpatialNavState,
  SpatialPhase,
  SpatialRoute,
} from "@/lib/spatial/types";
import type { NavigationDirection } from "@/lib/spatial/navigation/context";
import type { SpatialMemory } from "@/lib/spatial/memory/types";
import type { WorldRegistry } from "@/lib/spatial/continuation";
import type { WorldSignal } from "@/features/world/signals/types";
import type { LenaContextSituation } from "./types";

/** Spatial contribution: route + arrival state + transition phase. */
export function situationFromSpatial(input: {
  route?: SpatialRoute | null;
  /** Typed router location state, when this history entry carries one. */
  navState?: SpatialNavState | null;
  direction?: NavigationDirection;
  transitionPhase?: SpatialPhase | null;
}): Pick<
  LenaContextSituation,
  "route" | "arrival" | "direction" | "transitionPhase"
> {
  const route = input.route ?? null;
  return {
    route,
    arrival: input.navState ?? null,
    direction: input.direction ?? "initial",
    transitionPhase: input.transitionPhase ?? null,
  };
}

/** Memory contribution: canonical record + the live registry (read-only). */
export function situationFromMemory(
  memory: SpatialMemory | null,
  registry: WorldRegistry | null,
): Pick<LenaContextSituation, "memory" | "registry"> {
  return { memory, registry };
}

/** Signals contribution: canonical store snapshot + requested world ids. */
export function situationFromSignals(
  signals: readonly WorldSignal[],
  worldIds: readonly string[],
): Pick<LenaContextSituation, "signals" | "worldIds"> {
  return { signals, worldIds };
}
