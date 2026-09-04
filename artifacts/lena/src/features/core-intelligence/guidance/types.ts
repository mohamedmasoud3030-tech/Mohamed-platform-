/**
 * LENA Intelligence — guidance (Next Best Place) contracts.
 *
 * Deterministic operational guidance — NOT an LLM, NOT machine learning.
 * Given the canonical context snapshot, the planner answers:
 * "Where is the most useful place to go next?" — and can always explain why.
 *
 * Explanations are stable reason codes (not prose) so future consumers
 * (Living Sacred Core, LENA Operator, World Command) can localize or
 * reason over them without domain logic reconstruction.
 */

/** What kind of guidance this is. */
export type GuidanceMode =
  | "none"
  | "continue-journey"
  | "inspect-activity"
  | "address-attention"
  | "address-critical";

/** Stable explanation codes for every recommendation. */
export type GuidanceReasonCode =
  | "no-destination"
  | "at-destination"
  | "critical-unresolved-signal"
  | "attention-unresolved-signal"
  | "open-activity-recent"
  | "open-activity"
  | "continuation-available";

/** Deterministic priority ladder of a recommendation. */
export type GuidancePriority = "none" | "normal" | "attention" | "critical";

/** A recommended structural destination (a world chamber). */
export interface GuidanceDestination {
  systemId: string;
  /** Router-relative chamber path, resolved from the canonical registry. */
  path: string;
}

/** The explainable result of Next Best Place planning. */
export interface GuidanceResult {
  mode: GuidanceMode;
  destination: GuidanceDestination | null;
  reason: GuidanceReasonCode;
  /** Signal id driving the recommendation, when a signal drives it. */
  sourceId: string | null;
  /** Timestamp of the driving source, when one exists. */
  sourceAt: number | null;
  priority: GuidancePriority;
  /** Deterministic explainable score (see planner constants). */
  score: number;
  /** Structural path from the current node, when the graph provides one. */
  path: readonly string[] | null;
  /** How many candidate worlds were actually considered. */
  candidatesConsidered: number;
}
