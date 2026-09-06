/**
 * LENA Intelligence — canonical façade.
 *
 * One small entry point future consumers use:
 *
 *   const { context, core, guidance } = deriveLenaIntelligence(situation, {
 *     previousCoreState,   // optional: state-machine hysteresis
 *     graph,               // optional: connected World Graph adapter
 *   });
 *
 * Consumers (Living Sacred Core rendering, LENA Operator, World Command
 * enhancements) never reconstruct domain logic: the result answers
 *   - What state am I in?            → core.state / core.stateReason
 *   - How intense is it?             → core.intensity / core.urgency / core.pulse
 *   - What owns current attention?   → core.attentionOwner
 *   - Is there a recommended target? → guidance.destination / core.guidanceTarget
 *   - Why?                           → guidance.reason (+ guidance.sourceId)
 *   - What path leads there?         → guidance.path (via graph adapter)
 *
 * This module is the ONLY orchestrator: it fuses context once, plans
 * guidance from that snapshot, and feeds guidance availability into the
 * core state machine. Dependency direction stays:
 *
 *   canonical runtimes → context adapters → snapshot → {core state, guidance}
 */

import { fuseLenaContext } from "./context/fusion";
import type {
  LenaContextSnapshot,
  LenaContextSituation,
} from "./context/types";
import { deriveCoreState } from "./core/state";
import type {
  CoreState,
  CoreStateOptions,
  CoreView,
} from "./core/types";
import { emptyGraphContextAdapter } from "./graph/GraphContextAdapter";
import type { GraphContextAdapter } from "./graph/GraphContextAdapter";
import { planNextBestPlace } from "./guidance/planner";
import type { GuidanceResult } from "./guidance/types";

/** Options accepted by the canonical façade. */
export interface LenaIntelligenceOptions {
  /** World Graph adapter. Production React seam supplies CanonicalWorldGraphAdapter. */
  graph?: GraphContextAdapter;
  /** Previous core state — enables the focused-hold stability rule. */
  previousCoreState?: CoreState;
  /** Optional explicit clock (epoch ms); defaults to `Date.now()`. */
  now?: number;
}

/** The complete intelligence result: context + core view + guidance. */
export interface LenaIntelligence {
  context: LenaContextSnapshot;
  core: CoreView;
  guidance: GuidanceResult;
}

/**
 * Derive LENA intelligence from the observed situation.
 *
 * Pure with respect to its arguments: identical situation + options produce
 * a deep-equal result. Deterministic callers pass `now` explicitly.
 */
export function deriveLenaIntelligence(
  situation: LenaContextSituation,
  options: LenaIntelligenceOptions = {},
): LenaIntelligence {
  // One graph observation for the whole derivation: the same adapter is
  // fused into the context read model AND handed to the planner, so
  // context.graph facts and guidance.path can never contradict each other.
  const graph = options.graph ?? situation.graph ?? emptyGraphContextAdapter;
  const fused = fuseLenaContext({
    ...situation,
    graph,
    ...(options.now !== undefined ? { now: options.now } : {}),
  });

  const guidance = planNextBestPlace(fused, graph);

  const coreOptions: CoreStateOptions = {
    previous: options.previousCoreState,
    guidance: {
      available: guidance.mode !== "none",
      target: guidance.destination ?? null,
    },
  };
  const core = deriveCoreState(fused, coreOptions);

  return { context: fused, core, guidance };
}

// ── Public barrel of the intelligence kernel ─────────────────────────────
export type { LenaContextSnapshot, LenaContextSituation } from "./context/types";
export type { CoreView, CoreState } from "./core/types";
export type { GuidanceResult } from "./guidance/types";
export type { GraphContextAdapter } from "./graph/GraphContextAdapter";
export {
  CanonicalWorldGraphAdapter,
  canonicalWorldGraphAdapter,
} from "./graph/CanonicalWorldGraphAdapter";
