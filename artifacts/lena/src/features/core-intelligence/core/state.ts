/**
 * LENA Intelligence — Sacred Core logical state machine.
 *
 * Deterministic, pure, testable state derivation from the canonical context
 * snapshot. The machine never touches signals, memory, the graph or the UI:
 * it classifies what fusion already observed.
 *
 * # Precedence (highest first) — documented decisions
 *   1. critical      — any open critical signal (global critical state)
 *   2. attention     — any open attention signal
 *   3. transitioning — a semantic spatial move is resolving; the visitor is
 *                      between contexts, so transient framing beats steady
 *                      engagement but never beats a real threat
 *   4. focused       — confirmed deep engagement (settled inside a chamber
 *                      after an explicit engagement move) with no unresolved
 *                      threats. Ordinary ambient activity in other worlds
 *                      does not demote a genuinely engaged visitor.
 *   5. guiding       — the planner holds a meaningful recommendation and the
 *                      visitor is not already deep inside that destination
 *   6. aware         — open activity with no intervention needed
 *   7. calm          — inside LENA, no pressure
 *   8. dormant       — outside LENA routes (no stage to observe)
 *
 * # Stability (previous-state input)
 * Derivation is a pure function of (snapshot, previous?, guidance?). The
 * only temporal input is `previous`, used for ONE documented rule:
 *
 *   focused-hold — returning visitors reload or settle into a chamber with
 *   no arrival intent on the frame (deep links, history restores, Strict
 *   Mode double-renders). Those frames derive calm/aware even though the
 *   session was focused a frame earlier. When the previous state was
 *   focused and the raw derivation only degraded to calm/aware while the
 *   visitor is still inside their remembered chamber, the machine holds
 *   focused so the core does not blink. Real threats (attention/critical),
 *   leaving the chamber, or an absent memory always release the hold.
 *
 * All other states re-derive from the snapshot alone; identical inputs
 * always produce identical outputs.
 */

import type { LenaContextSnapshot } from "../context/types";
import type {
  CoreAttentionLevel,
  CoreAttentionOwner,
  CoreGuidanceInput,
  CoreState,
  CoreStateOptions,
  CoreStateReason,
  CoreView,
} from "./types";
import { CORE_STATE_SEMANTICS } from "./types";

interface Classification {
  state: CoreState;
  reason: CoreStateReason;
}

function guidanceTargetOf(
  guidance: CoreGuidanceInput | undefined,
  snapshot: LenaContextSnapshot,
): { systemId: string; path: string } | null {
  const target = guidance?.target ?? null;
  if (!guidance || !guidance.available || !target) return null;
  // A recommendation pointing at the chamber the visitor is already deep
  // inside is not guidance — it is the current reality.
  if (snapshot.focus.inChamber && target.systemId === snapshot.focus.currentSystemId) {
    return null;
  }
  return target;
}

/** Raw classification following the documented precedence chain. */
function classify(
  snapshot: LenaContextSnapshot,
  guidance: CoreGuidanceInput | undefined,
): Classification {
  // 8. dormant — no LENA stage.
  if (!snapshot.spatial.inLena) {
    return { state: "dormant", reason: "outside-lena" };
  }

  // 1. critical — an open critical signal exists.
  if (snapshot.signals.unresolved.critical.length > 0) {
    return { state: "critical", reason: "critical-unresolved" };
  }

  // 2. attention — an open attention signal exists.
  if (snapshot.signals.unresolved.attention.length > 0) {
    return { state: "attention", reason: "attention-unresolved" };
  }

  // 3. transitioning — a semantic move is actively resolving.
  if (snapshot.spatial.transitioning) {
    return { state: "transitioning", reason: "spatial-transition" };
  }

  // 4. focused — confirmed deep engagement, no unresolved threats.
  if (
    snapshot.focus.deepEngaged &&
    snapshot.signals.unresolved.critical.length === 0 &&
    snapshot.signals.unresolved.attention.length === 0
  ) {
    return { state: "focused", reason: "deep-engagement" };
  }

  // 5. guiding — meaningful recommendation exists for an unengaged visitor.
  const target = guidanceTargetOf(guidance, snapshot);
  if (target !== null) {
    return { state: "guiding", reason: "guidance-available" };
  }

  // 6. aware — ordinary open activity.
  if (
    snapshot.signals.present &&
    snapshot.signals.openCount !== null &&
    snapshot.signals.openCount > 0 &&
    snapshot.signals.presence === "active"
  ) {
    return { state: "aware", reason: "open-activity" };
  }

  // 7. calm.
  return { state: "calm", reason: "no-pressure" };
}

/**
 * Stability rule: damp settle/reload frames for returning visitors.
 * Reachable when a returning visitor's chamber frame carries no arrival
 * intent (reload, deep link, history restore) — raw derivation degrades to
 * calm/aware although the session was focused a frame earlier.
 */
function applyStability(
  raw: Classification,
  snapshot: LenaContextSnapshot,
  previous: CoreState | undefined,
): Classification {
  if (previous !== "focused") return raw;
  if (raw.state !== "calm" && raw.state !== "aware") return raw;
  if (snapshot.spatial.space !== "chamber") return raw;
  if (snapshot.focus.currentSystemId === null) return raw;
  if (!snapshot.memory.returning) return raw;
  return { state: "focused", reason: "focused-hold" };
}

function attentionLevelOf(
  criticalCount: number,
  attentionCount: number,
): CoreAttentionLevel {
  if (criticalCount > 0) return "severe";
  if (attentionCount === 0) return "none";
  if (attentionCount === 1) return "low";
  if (attentionCount === 2) return "moderate";
  return "high";
}

function attentionOwnerOf(
  snapshot: LenaContextSnapshot,
): CoreAttentionOwner | null {
  const signal = snapshot.signals.highestUnresolved;
  if (!signal) return null;
  return {
    id: signal.id,
    kind: signal.kind,
    severity: signal.severity,
    lifecycle: signal.lifecycle,
    sourceWorld: signal.sourceWorld,
  };
}

/**
 * Derive the Sacred Core view model from the canonical context snapshot.
 *
 * Pure: identical (snapshot, previous, guidance) inputs always produce an
 * identical view. `previous` only feeds the focused-hold stability rule.
 */
export function deriveCoreState(
  snapshot: LenaContextSnapshot,
  options: CoreStateOptions = {},
): CoreView {
  const raw = classify(snapshot, options.guidance);
  const classification = applyStability(raw, snapshot, options.previous);
  const semantics = CORE_STATE_SEMANTICS[classification.state];
  const criticalCount = snapshot.signals.unresolved.critical.length;
  const attentionCount = snapshot.signals.unresolved.attention.length;
  const held = classification !== raw;

  return {
    state: classification.state,
    stateReason: classification.reason,
    intensity: semantics.intensity,
    urgency: semantics.urgency,
    pulse: semantics.pulse,
    attentionLevel: attentionLevelOf(criticalCount, attentionCount),
    focusTarget: snapshot.focus.deepEngaged
      ? snapshot.focus.currentSystemId
      : null,
    guidanceTarget: guidanceTargetOf(options.guidance, snapshot),
    attentionOwner: attentionOwnerOf(snapshot),
    activeThreats: criticalCount + attentionCount,
    openSignals: snapshot.signals.openCount,
    continuationAvailable: snapshot.continuity.available,
    graphAvailable: snapshot.graph.available,
    held,
  };
}
