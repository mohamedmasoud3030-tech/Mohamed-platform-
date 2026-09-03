/**
 * LENA Spatial Navigation — the canonical navigation layer.
 *
 * A small LENA-specific layer on top of React Router (which remains the
 * router). It gives spatial destinations four guarantees:
 *
 *   1. navigate normally        — the URL is always pushed exactly once
 *   2. preserve spatial origin  — the move carries typed state forward
 *   3. restore context on return — selections are pinned to the current
 *                                 history entry so Back finds them again
 *   4. never duplicate          — same-document destinations and in-flight
 *                                 transitions are no-ops
 *
 * And one coherent back:
 *   - when the current entry was created by a spatial forward move, the
 *     previous entry is a known LENA entry, so Back follows history —
 *     exactly what the browser Back button would do;
 *   - a deep-linked entry does not know what is behind it, so Back returns
 *     to the canonical parent with an outward (`emerge`) intent.
 *
 * The decisions live in `plan.ts` (pure, tested); this file is the thin
 * React/browser binding.
 */

import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { worldMemory } from "../memory/worldMemory";
import { spatialRuntime } from "../runtime";
import type { SpatialIntent, SpatialTargets } from "../types";
import {
  buildSpatialState,
  readSpatialState,
  useReducedMotion,
} from "./context";
import { planBack, planGo } from "./plan";

export interface SpatialGoOptions {
  intent: SpatialIntent;
  /** Which system the move is about. Defaults to the destination's. */
  systemId?: string;
  /** Elements of the current scene for the choreography. When absent, the
   *  navigation happens directly (no choreography). */
  targets?: SpatialTargets;
  /** Mark the first-time spatial introduction as experienced (first chamber entry). */
  markIntroSeen?: boolean;
}

export interface SpatialBackOptions {
  /** The outward intent when falling back to the parent. Default: "emerge". */
  intent?: SpatialIntent;
  /** Override the canonical parent. */
  fallbackTo?: string;
}

export type SpatialBackResult = "history" | "navigated" | "none";

export function useSpatialNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();

  /**
   * A forward spatial move.
   *
   * Returns false when the move was intentionally not made (already there,
   * or another transition is in flight) so callers can stay calm.
   */
  const go = useCallback(
    (to: string, options: SpatialGoOptions): boolean => {
      const plan = planGo({
        currentPath: location.pathname,
        currentHash: location.hash,
        to,
        intent: options.intent,
        systemId: options.systemId,
      });

      if (plan.kind === "noop") return false;

      // World memory: this is the record a returning visitor will inherit.
      if (plan.memory) {
        worldMemory.remember({
          space: plan.memory.space,
          systemId: plan.memory.systemId,
          chamberPath: plan.memory.chamberPath,
          at: Date.now(),
        });
        if (options.markIntroSeen) worldMemory.markIntroSeen();
      }
      worldMemory.recordNavigation(plan.path, options.intent);

      const state = plan.state;
      if (!options.targets) {
        navigate(to, { state });
        return true;
      }

      const handle = spatialRuntime.run({
        intent: options.intent,
        scene: plan.scene,
        targets: options.targets,
        systemId: plan.state.spatial.systemId,
        reducedMotion: reduced,
        action: () => navigate(to, { state }),
      });
      return handle !== null;
    },
    [navigate, location.pathname, location.hash, reduced],
  );

  /**
   * The LENA back move. One behavior for the visible control and the
   * browser: follow history when the entry behind us is known LENA,
   * otherwise step outward to the canonical parent.
   */
  const back = useCallback(
    (options: SpatialBackOptions = {}): SpatialBackResult => {
      const plan = planBack({
        currentPath: location.pathname,
        navState: readSpatialState(location.state),
        historyIndex: typeof window !== "undefined" ? readHistoryIndexSafe() : null,
        intent: options.intent,
        fallbackTo: options.fallbackTo,
      });

      if (plan.kind === "history") {
        navigate(-1);
        return "history";
      }
      if (plan.kind === "fallback") {
        navigate(plan.to, { state: plan.state });
        return "navigated";
      }
      return "none";
    },
    [navigate, location.pathname, location.state],
  );

  /**
   * Pin the current selection onto this history entry (replace, no new
   * entry). When the visitor later steps back out, this is what restores
   * their spatial context.
   */
  const pinContext = useCallback(
    (input: { systemId?: string | null }) => {
      const existing = readSpatialState(location.state);
      navigate(location.pathname, {
        replace: true,
        state: buildSpatialState({
          origin: existing?.spatial.origin ?? "/",
          intent: existing?.spatial.intent ?? "approach",
          systemId: input.systemId ?? undefined,
          mode: existing?.spatial.mode ?? "forward",
        }),
      });
    },
    [navigate, location.pathname, location.state],
  );

  return { go, back, pinContext };
}

/** History index read that never throws (sandboxed iframes, etc.). */
function readHistoryIndexSafe(): number | null {
  try {
    const state = window.history.state as { idx?: unknown } | null;
    return typeof state?.idx === "number" ? (state.idx as number) : null;
  } catch {
    return null;
  }
}

/**
 * Record how the visitor entered LENA this session (deep link, direct page,
 * return). Called once at startup and by the continuation affordance.
 */
export function recordEntryContext(context: "deep-link" | "direct" | "return"): void {
  worldMemory.remember({ entryContext: context });
}
