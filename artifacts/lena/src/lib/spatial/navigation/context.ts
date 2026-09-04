/**
 * LENA Spatial Navigation — context.
 *
 * Resolves "where am I, how did I get here, and which way am I moving" for
 * any route. The URL is always canonical; the spatial state in
 * `location.state` and the world memory are enhancements that pages may use —
 * and may be absent — without ever breaking the page.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import type { SpatialIntent, SpatialNavState, SpatialRoute } from "../types";

const KNOWN_INTENTS: readonly string[] = [
  "approach",
  "enter",
  "descend",
  "focus",
  "return",
  "emerge",
];

/**
 * Resolve the complete route taxonomy from a router-relative pathname.
 *
 * Ordering is intentional: Atlas and Command must be classified before the
 * generic `/world/:segment` chamber shape. Non-LENA paths remain explicit
 * `other` so the intelligence layer cannot mistake them for a chamber.
 */
export function parseSpatialRoute(pathname: string): SpatialRoute {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return { space: "home", path: "/" };
  if (path === "/world") return { space: "world", path: "/world" };
  if (path === "/world/command") return { space: "command", path };
  if (path === "/world/atlas") return { space: "atlas", path };
  const chamber = /^\/world\/([^/]+)$/.exec(path);
  if (chamber) return { space: "chamber", systemId: chamber[1], path };
  return { space: "other", path };
}

/**
 * Read the typed spatial state from router location.state. Tolerates the
 * legacy `{ fromWorldPortal, systemId }` shape so older history entries keep
 * working, and returns null for anything it does not understand.
 */
export function readSpatialState(state: unknown): SpatialNavState | null {
  if (typeof state !== "object" || state === null) return null;
  const s = state as Record<string, unknown>;

  if (typeof s.spatial === "object" && s.spatial !== null) {
    const spatial = s.spatial as Record<string, unknown>;
    if (
      typeof spatial.origin === "string" &&
      spatial.origin.startsWith("/") &&
      typeof spatial.intent === "string" &&
      KNOWN_INTENTS.includes(spatial.intent) &&
      (spatial.mode === "forward" || spatial.mode === "back")
    ) {
      const result: SpatialNavState = {
        spatial: {
          origin: spatial.origin,
          intent: spatial.intent as SpatialIntent,
          mode: spatial.mode,
        },
      };
      if (typeof spatial.systemId === "string") result.spatial.systemId = spatial.systemId;
      return result;
    }
    return null;
  }

  // Legacy portal state, still present in history entries from before v1.
  if (s.fromWorldPortal === true && typeof s.systemId === "string") {
    return {
      spatial: { origin: "/world", intent: "descend", systemId: s.systemId, mode: "forward" },
    };
  }
  return null;
}

/** React Router keeps its history index in `history.state.idx`. */
export function readHistoryIndex(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const state = window.history.state as { idx?: unknown } | null;
    return typeof state?.idx === "number" ? (state.idx as number) : null;
  } catch {
    return null;
  }
}

export type NavigationDirection = "forward" | "back" | "initial";

/** Pure direction comparison, exported for tests. */
export function detectDirection(
  previous: number | null,
  next: number | null,
): NavigationDirection {
  if (previous === null || next === null) return "initial";
  if (next > previous) return "forward";
  if (next < previous) return "back";
  return "initial";
}

/**
 * Direction of the most recent route change, derived from the history index.
 *
 * Direction is a property of the *transition into* an entry, not of the entry
 * itself — the same entry read forward and later read back has a different
 * direction — so it is always computed fresh from the previous history
 * index, never cached per entry.
 *
 * The previous index is owned by the app-wide `SpatialCleanup` component
 * (mounted for every route), which reports every location change. That makes
 * the tracking independent of which pages are mounted, and keeps this hook a
 * pure read — stable under Strict Mode's double render.
 */
let lastSeenIndex: number | null = null;

/** Report the current history index after a location change. */
export function trackNavigationIndex(index: number | null): void {
  if (index !== null) lastSeenIndex = index;
}

export function useNavigationDirection(): NavigationDirection {
  void useLocation(); // subscribe to location changes
  return detectDirection(lastSeenIndex, readHistoryIndex());
}

/** Test seam: forget which history index was last seen. */
export function resetNavigationDirectionTracking(): void {
  lastSeenIndex = null;
}

/** `prefers-reduced-motion`, live. Reduced motion is a first-class mode in
 *  every spatial decision — never an afterthought in CSS. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

export interface SpatialContext {
  /** The resolved route taxonomy; `space === "other"` means outside LENA. */
  route: SpatialRoute;
  /** The typed spatial state on this history entry, when present. */
  navState: SpatialNavState | null;
  /** Which way the visitor just moved. */
  direction: NavigationDirection;
  /** The spatial origin carried on this entry, when any. */
  origin: string | null;
  /** No spatial origin: direct URL entry, reload, or a non-LENA arrival. */
  isDirectEntry: boolean;
  /** The intent that brought the visitor here, when known. */
  arrivalIntent: SpatialNavState["spatial"]["intent"] | null;
  /** True when this entry was created by a spatial forward move — the
   *  browser's previous entry is a known LENA entry. */
  canFollowHistory: boolean;
}

/** The full spatial context of the current route, in one hook. */
export function useSpatialContext(): SpatialContext {
  const location = useLocation();
  const route = parseSpatialRoute(location.pathname);
  const navState = readSpatialState(location.state);
  const direction = useNavigationDirection();
  return {
    route,
    navState,
    direction,
    origin: navState?.spatial.origin ?? null,
    isDirectEntry: navState === null,
    arrivalIntent: navState?.spatial.intent ?? null,
    canFollowHistory: navState !== null && direction !== "back",
  };
}

/** Rebuild the typed spatial state for a forward move. */
export function buildSpatialState(input: {
  origin: string;
  intent: SpatialNavState["spatial"]["intent"];
  systemId?: string;
  mode?: "forward" | "back";
}): SpatialNavState {
  return {
    spatial: {
      origin: input.origin,
      intent: input.intent,
      systemId: input.systemId,
      mode: input.mode ?? "forward",
    },
  };
}

/** The canonical parent of a LENA route. */
export function parentPathOf(route: SpatialRoute | null): string | null {
  if (!route) return null;
  if (
    route.space === "chamber" ||
    route.space === "command" ||
    route.space === "atlas"
  ) {
    return "/world";
  }
  if (route.space === "world") return "/";
  return null;
}

/** A stable-identity version of the route parse: re-renders only when the
 *  resolved route actually changes, not on unrelated location churn. */
export function useSpatialRoute(): SpatialRoute | null {
  const location = useLocation();
  const parsed = parseSpatialRoute(location.pathname);
  const ref = useRef<SpatialRoute | null>(parsed);
  if (ref.current && parsed && ref.current.path === parsed.path) {
    return ref.current;
  }
  ref.current = parsed;
  return parsed;
}
