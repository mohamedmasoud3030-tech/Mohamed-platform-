import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  parseSpatialRoute,
  readHistoryIndex,
  readSpatialState,
  spatialRuntime,
  stripSpatialClasses,
  trackNavigationIndex,
  worldMemory,
  type SpatialElement,
} from "@/lib/spatial";

const SCENE_SELECTORS = [
  ".lena-public",
  ".lena-world",
  ".lena-world-page",
  ".lena-system-chamber",
] as const;

/**
 * Route-level interruption safety + entry context.
 *
 * Whatever just happened — a fast double click, a Back pressed mid-flight, a
 * direct URL entry over a running transition — the moment a new route lands,
 * every class the spatial runtime ever touched is stripped from the scene
 * roots and the runtime is guaranteed idle. The world can never be left with
 * a stale `is-portal`, a ghost overlay, or a trapped transition.
 *
 * On the very first route of the session it also records how the visitor
 * entered LENA (a deep link into the world/chamber, or a direct page) — the
 * "preferred entry context" of world memory.
 */
export default function SpatialCleanup() {
  const location = useLocation();
  const firstRun = useRef(true);

  // Report every location change into the direction tracker before any page
  // renders its arrival decision (layout effects run in tree order, and this
  // component mounts ahead of the routes).
  useLayoutEffect(() => {
    trackNavigationIndex(readHistoryIndex());
  }, [location.key]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      const route = parseSpatialRoute(location.pathname);
      // A deep entry into the world or a chamber is remembered as a place the
      // visitor was in. Arriving at the home threshold is not a place — it is
      // the doorway — so it records nothing: a home-only visit has no journey
      // to continue, and creating a memory record would turn a first-time
      // visitor into a "returning" one mid-visit.
      if (route && route.space !== "home" && !readSpatialState(location.state)) {
        worldMemory.remember({
          space: route.space,
          systemId: route.systemId ?? undefined,
          chamberPath: route.space === "chamber" ? location.pathname : undefined,
          entryContext: "deep-link",
        });
      }
    }

    spatialRuntime.cancelActive();
    for (const selector of SCENE_SELECTORS) {
      const root = document.querySelector(selector);
      if (root instanceof Element) {
        stripSpatialClasses(root as unknown as SpatialElement);
      }
    }
  }, [location.pathname, location.key, location.state]);

  return null;
}
