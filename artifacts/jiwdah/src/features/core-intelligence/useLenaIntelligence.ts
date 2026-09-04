import { useEffect, useMemo, useRef } from "react";
import { WORLD_ENTITIES } from "@/features/world/content/world";
import { worldRegistry } from "@/features/world/registry";
import { useSignalRuntime } from "@/features/world/signals";
import { useSpatialContext, useWorldMemory } from "@/lib/spatial";
import {
  canonicalWorldGraphAdapter,
  deriveLenaIntelligence,
  type CoreState,
  type LenaIntelligence,
} from "./index";

/**
 * Canonical React seam for LENA Intelligence.
 *
 * UI consumers never assemble signals, memory, spatial state or graph context
 * themselves. They read one derived, read-only intelligence result.
 */
export function useLenaIntelligence(): LenaIntelligence {
  const spatial = useSpatialContext();
  const memory = useWorldMemory();
  const { signals } = useSignalRuntime();
  const previousCoreState = useRef<CoreState>();

  const routePath = spatial.route?.path ?? "";
  const routeSpace = spatial.route?.space ?? null;
  const routeSystemId =
    spatial.route?.space === "chamber" ? (spatial.route.systemId ?? null) : null;
  const arrivalOrigin = spatial.navState?.spatial.origin ?? null;
  const arrivalIntent = spatial.navState?.spatial.intent ?? null;
  const arrivalMode = spatial.navState?.spatial.mode ?? null;
  const arrivalSystemId = spatial.navState?.spatial.systemId ?? null;

  const result = useMemo(() => {
    const route =
      routeSpace === null
        ? null
        : routeSpace === "chamber"
          ? { space: "chamber" as const, systemId: routeSystemId ?? "", path: routePath }
          : { space: routeSpace, path: routePath };

    const arrival =
      arrivalOrigin && arrivalIntent && arrivalMode
        ? {
            spatial: {
              origin: arrivalOrigin,
              intent: arrivalIntent,
              mode: arrivalMode,
              ...(arrivalSystemId ? { systemId: arrivalSystemId } : {}),
            },
          }
        : null;

    return deriveLenaIntelligence(
      {
        now: Date.now(),
        route,
        arrival,
        direction: spatial.direction,
        memory,
        registry: worldRegistry,
        signals,
        worldIds: WORLD_ENTITIES.map((entity) => entity.systemId),
        graph: canonicalWorldGraphAdapter,
      },
      {
        graph: canonicalWorldGraphAdapter,
        previousCoreState: previousCoreState.current,
      },
    );
  }, [
    arrivalIntent,
    arrivalMode,
    arrivalOrigin,
    arrivalSystemId,
    memory,
    routePath,
    routeSpace,
    routeSystemId,
    signals,
    spatial.direction,
  ]);

  useEffect(() => {
    previousCoreState.current = result.core.state;
  }, [result.core.state]);

  return result;
}
