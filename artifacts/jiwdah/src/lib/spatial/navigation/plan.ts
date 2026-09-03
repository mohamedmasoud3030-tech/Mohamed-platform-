/**
 * LENA Spatial Navigation — pure planning.
 *
 * The decisions behind every spatial move, separated from React and the
 * browser so they can be tested as contracts:
 *
 *   - does this move happen at all? (duplicate-route guard)
 *   - what typed state does it carry? (origin / intent / system)
 *   - what does world memory record?
 *   - which scene runs the choreography?
 *   - and for a back move: follow history, or step to the canonical parent?
 */

import type {
  LenaSpace,
  SpatialIntent,
  SpatialNavState,
  SpatialScene,
} from "../types";
import { buildSpatialState, parentPathOf, parseSpatialRoute } from "./context";

export interface GoPlanArgs {
  /** Router-relative path we are on now. */
  currentPath: string;
  /** Hash we are on now ("" when none). */
  currentHash: string;
  /** Destination, with an optional hash. */
  to: string;
  intent: SpatialIntent;
  systemId?: string;
}

export type GoPlan =
  | { kind: "noop"; reason: "same-location" }
  | {
      kind: "go";
      to: string;
      /** The destination path without hash. */
      path: string;
      state: SpatialNavState;
      scene: SpatialScene;
      memory: {
        space: LenaSpace;
        systemId: string | null;
        chamberPath: string | null;
      } | null;
    };

/**
 * Plan a forward spatial move.
 *
 * The duplicate-route guard is deliberate: spatial memory and the typed
 * state are written *after* this plan says "go", so a refused move leaves
 * the world exactly as it was.
 */
export function planGo(args: GoPlanArgs): GoPlan {
  const hashIndex = args.to.indexOf("#");
  const toPath = hashIndex === -1 ? args.to : args.to.slice(0, hashIndex);
  const toHash = hashIndex === -1 ? "" : args.to.slice(hashIndex);

  if (toPath === args.currentPath && toHash === args.currentHash) {
    return { kind: "noop", reason: "same-location" };
  }

  const destination = parseSpatialRoute(toPath);
  const systemId = args.systemId ?? destination?.systemId;
  const scene: SpatialScene = destination?.space ?? "home";

  return {
    kind: "go",
    to: args.to,
    path: toPath,
    state: buildSpatialState({
      origin: args.currentPath,
      intent: args.intent,
      systemId,
    }),
    scene,
    memory:
      destination || systemId
        ? {
            space: destination?.space ?? "home",
            systemId: systemId ?? null,
            chamberPath: destination?.space === "chamber" ? toPath : null,
          }
        : null,
  };
}

export interface BackPlanArgs {
  /** Router-relative path we are on now. */
  currentPath: string;
  /** The typed spatial state on this history entry, when any. */
  navState: SpatialNavState | null;
  /** The router history index, when known. */
  historyIndex: number | null;
  /** Outward intent for the fallback. Default "emerge". */
  intent?: SpatialIntent;
  /** Override the canonical parent. */
  fallbackTo?: string;
}

export type BackPlan =
  | { kind: "history" }
  | { kind: "fallback"; to: string; state: SpatialNavState }
  | { kind: "none" };

/**
 * Plan a back move.
 *
 * Follow history only when this entry was created by a spatial forward move
 * (it carries typed state) and there is a previous entry — then the entry
 * behind us is a known LENA entry. Anything else steps to the canonical
 * parent with an outward intent, so a deep link can never send the visitor
 * to an unknown previous page through the visible control.
 */
export function planBack(args: BackPlanArgs): BackPlan {
  const canFollow =
    args.navState !== null && args.historyIndex !== null && args.historyIndex > 0;
  if (canFollow) return { kind: "history" };

  const route = parseSpatialRoute(args.currentPath);
  const parent = args.fallbackTo ?? parentPathOf(route);
  if (!parent) return { kind: "none" };

  return {
    kind: "fallback",
    to: parent,
    state: buildSpatialState({
      origin: args.currentPath,
      intent: args.intent ?? "emerge",
      systemId: route?.systemId,
    }),
  };
}
