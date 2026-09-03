/**
 * LENA Intelligence — Sacred Core logical state contracts.
 *
 * This is the BRAIN contract, not the rendering: a UI-neutral view model a
 * future Sacred Core visual layer (or the LENA Operator) can consume
 * directly. It deliberately exposes no CSS class names, no animation
 * durations, no pixel/glow vocabulary — only semantics. The presentation
 * layer decides how a "steady pulse" or "high urgency" looks.
 */

import type { LenaContextSnapshot } from "../context/types";

/**
 * The logical states of the Sacred Core intelligence.
 *
 * Minimal by design — no dozens of states. Semantics (see `classify`):
 *   dormant       — outside LENA routes; no stage to observe
 *   calm          — inside LENA with no operational pressure
 *   aware         — activity exists but needs no intervention
 *   focused       — visitor deeply engaged in one chamber
 *   attention     — an unresolved condition needs attention
 *   critical      — high-priority unresolved state exists
 *   guiding       — a meaningful recommended destination exists
 *   transitioning — a semantic spatial move is actively resolving
 */
export type CoreState =
  | "dormant"
  | "calm"
  | "aware"
  | "focused"
  | "attention"
  | "critical"
  | "guiding"
  | "transitioning";

/** Why the machine chose a state. Stable codes, not prose. */
export type CoreStateReason =
  | "outside-lena"
  | "no-pressure"
  | "open-activity"
  | "deep-engagement"
  | "focused-hold"
  | "attention-unresolved"
  | "critical-unresolved"
  | "spatial-transition"
  | "guidance-available";

/** Semantic attention ladder (severity of unresolved conditions). */
export type CoreAttentionLevel = "none" | "low" | "moderate" | "high" | "severe";

/** Semantic urgency ladder. */
export type CoreUrgency = "none" | "low" | "medium" | "high" | "critical";

/** Semantic pulse vocabulary — rhythm only, never durations. */
export type CorePulse = "off" | "soft" | "steady" | "urgent";

/** What currently owns the visitor's attention, when anything does. */
export interface CoreAttentionOwner {
  id: string;
  kind: string;
  severity: string;
  lifecycle: string;
  sourceWorld: string;
}

/**
 * Guidance availability fact, passed by the orchestrator. Kept as a plain
 * semantic (no guidance module import) so the machine never depends on the
 * planner; the façade wires them together.
 */
export interface CoreGuidanceInput {
  available: boolean;
  /** The recommended destination, when one exists. */
  target?: { systemId: string; path: string } | null;
}

/** Options for the pure state derivation. */
export interface CoreStateOptions {
  /**
   * Previous core state, when the caller wants hysteresis semantics:
   * deep engagement is held across insignificant ambient changes so the
   * state does not oscillate while a visitor is reading a chamber.
   */
  previous?: CoreState;
  guidance?: CoreGuidanceInput;
}

/** The UI-neutral Sacred Core view model. */
export interface CoreView {
  state: CoreState;
  stateReason: CoreStateReason;
  /** 0..1 semantic intensity of the state. */
  intensity: number;
  attentionLevel: CoreAttentionLevel;
  urgency: CoreUrgency;
  pulse: CorePulse;
  /** The chamber the visitor is currently engaged with, when any. */
  focusTarget: string | null;
  /** The recommended destination from the planner, when any. */
  guidanceTarget: { systemId: string; path: string } | null;
  /** The single most urgent unresolved signal, when any. */
  attentionOwner: CoreAttentionOwner | null;
  /** Unresolved critical + attention signals. */
  activeThreats: number;
  /** Open signals of any severity. */
  openSignals: number;
  continuationAvailable: boolean;
  graphAvailable: boolean;
  /** True when the previous-state stability rule held the state. */
  held: boolean;
}

/**
 * Semantic constants per state — documented, deterministic, and
 * presentation-agnostic. The visual layer maps these to its own look/feel.
 */
export const CORE_STATE_SEMANTICS: Record<
  CoreState,
  { intensity: number; urgency: CoreUrgency; pulse: CorePulse }
> = {
  dormant: { intensity: 0, urgency: "none", pulse: "off" },
  calm: { intensity: 0.1, urgency: "none", pulse: "soft" },
  aware: { intensity: 0.25, urgency: "low", pulse: "soft" },
  focused: { intensity: 0.4, urgency: "low", pulse: "soft" },
  transitioning: { intensity: 0.5, urgency: "medium", pulse: "steady" },
  guiding: { intensity: 0.6, urgency: "medium", pulse: "steady" },
  attention: { intensity: 0.8, urgency: "high", pulse: "steady" },
  critical: { intensity: 1, urgency: "critical", pulse: "urgent" },
};
