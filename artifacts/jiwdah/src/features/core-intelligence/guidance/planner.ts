/**
 * LENA Intelligence — Next Best Place planner.
 *
 * Deterministic, explainable operational guidance. The planner consumes the
 * canonical context snapshot ONLY (never signals/memory/graph directly) plus
 * the optional structural graph through the GraphContextAdapter seam.
 *
 * # Scoring model (documented, no magic numbers)
 * Scores are integers in strict dominance bands so that the priority model
 * is explainable and order-stable:
 *
 *   critical unresolved   base 60_000   (> any attention stack)
 *   attention unresolved  base 40_000   (> any continuation/activity stack)
 *   continuation journey  base 20_000   (visitor intent; + recency ladder,
 *                                        stale journeys > 7 days decay −3_000)
 *   ordinary activity     base 20_000   (presence snapshot carries no
 *                                        per-world clock → no recency points)
 *   quiet world           base  0
 *
 * Within a band, recency is additive from one ladder:
 *   newest open signal / continuation age
 *     ≤ 10 min → +12_000   ≤ 1 h → +8_000   ≤ 6 h → +5_000
 *     ≤ 24 h   → +2_500    ≤ 7 d → +800     older → +0
 * An unresolved signal still in lifecycle "new" adds +5_000 (fresh,
 * unacknowledged conditions outrank acknowledged ones inside their band).
 *
 * Deliberate consequences (documented decisions):
 *   - critical always beats attention always beats continuation/activity
 *   - recent unresolved beats stale unresolved inside the same band
 *   - a fresh continuation (≤ 7 days) beats ambient activity; a stale
 *     continuation (> 7 days) yields to any current activity
 *   - structural distance ONLY breaks score ties — it never overrides severity
 *   - the chamber the visitor is already deep inside is never re-recommended
 *     (that would be noise, not guidance)
 *
 * Determinism: identical (snapshot, graph) inputs produce an identical
 * result. Ranking is a pure sort over stable candidate order.
 */

import type { LenaContextSnapshot } from "../context/types";
import {
  emptyGraphContextAdapter,
  graphNodeFor,
  type GraphContextAdapter,
  type GraphNodeId,
} from "../graph/GraphContextAdapter";
import type { WorldSignal } from "@/features/world/signals/types";
import type {
  GuidanceMode,
  GuidanceReasonCode,
  GuidanceResult,
} from "./types";

/** Strict dominance bases (see module docs). */
const BASE_CRITICAL = 60_000;
const BASE_ATTENTION = 40_000;
const BASE_CONTINUATION = 20_000;
const BASE_ACTIVITY = 20_000;
/** Continuation journeys older than 7 days lose their pull. */
const CONTINUATION_STALE_MS = 7 * 86_400_000;
const CONTINUATION_STALE_DECAY = 3_000;

/** Fresh unacknowledged conditions inside a band. */
const NEW_LIFECYCLE_BONUS = 5_000;

/** Recency ladder: newest open signal age (or continuation age) → points. */
const RECENCY_LADDER: readonly { withinMs: number; points: number }[] = [
  { withinMs: 10 * 60_000, points: 12_000 },
  { withinMs: 60 * 60_000, points: 8_000 },
  { withinMs: 6 * 3_600_000, points: 5_000 },
  { withinMs: 24 * 3_600_000, points: 2_500 },
  { withinMs: 7 * 86_400_000, points: 800 },
];

/** Score contribution of an age, from the documented recency ladder. */
export function recencyPoints(ageMs: number): number {
  if (ageMs < 0) return 0;
  for (const tier of RECENCY_LADDER) {
    if (ageMs <= tier.withinMs) return tier.points;
  }
  return 0;
}

interface CandidateFacts {
  systemId: string;
  path: string;
  presence: string;
  criticalSignals: readonly WorldSignal[];
  attentionSignals: readonly WorldSignal[];
  isContinuation: boolean;
  continuationAt: number | null;
}

interface CandidateScore {
  score: number;
  reason: GuidanceReasonCode;
  source: WorldSignal | null;
}

interface RankedCandidate {
  facts: CandidateFacts;
  score: CandidateScore;
  distance: number | null;
  catalogIndex: number;
}

function collectCandidates(snapshot: LenaContextSnapshot): CandidateFacts[] {
  const { signals, continuity, catalog } = snapshot;
  const candidates: CandidateFacts[] = [];
  for (const world of catalog.worlds) {
    const { systemId, path } = world;
    const criticalSignals = signals.unresolved.critical.filter(
      (s) => s.sourceWorld === systemId,
    );
    const attentionSignals = signals.unresolved.attention.filter(
      (s) => s.sourceWorld === systemId,
    );
    candidates.push({
      systemId,
      path,
      presence: signals.byWorld[systemId] ?? "quiet",
      criticalSignals,
      attentionSignals,
      isContinuation:
        continuity.kind === "chamber" && continuity.systemId === systemId,
      continuationAt: continuity.kind === "chamber" ? continuity.at : null,
    });
  }
  return candidates;
}

/** The newest unresolved signal of a candidate world, when any. */
function newestUnresolved(facts: CandidateFacts): WorldSignal | null {
  const all = [...facts.criticalSignals, ...facts.attentionSignals];
  if (all.length === 0) return null;
  return all.reduce((newest, signal) =>
    Date.parse(signal.timestamp) > Date.parse(newest.timestamp)
      ? signal
      : newest,
  );
}

/** Score one candidate world. Pure function of the facts + clock. */
function scoreCandidate(
  facts: CandidateFacts,
  now: number,
): CandidateScore {
  const criticalCount = facts.criticalSignals.length;
  const attentionCount = facts.attentionSignals.length;

  // Critical band.
  if (criticalCount > 0) {
    const newest = newestUnresolved(facts);
    const age = newest ? Math.max(0, now - Date.parse(newest.timestamp)) : 0;
    const fresh = facts.criticalSignals.some((s) => s.lifecycle === "new")
      ? NEW_LIFECYCLE_BONUS
      : 0;
    return {
      score: BASE_CRITICAL + recencyPoints(age) + fresh,
      reason: "critical-unresolved-signal",
      source: newest ?? null,
    };
  }

  // Attention band.
  if (attentionCount > 0) {
    const newest = newestUnresolved(facts);
    const age = newest ? Math.max(0, now - Date.parse(newest.timestamp)) : 0;
    const fresh = facts.attentionSignals.some((s) => s.lifecycle === "new")
      ? NEW_LIFECYCLE_BONUS
      : 0;
    return {
      score: BASE_ATTENTION + recencyPoints(age) + fresh,
      reason: "attention-unresolved-signal",
      source: newest ?? null,
    };
  }

  // Continuation band — the visitor's own journey intent.
  if (facts.isContinuation && facts.continuationAt !== null) {
    const age = Math.max(0, now - facts.continuationAt);
    const stale = age > CONTINUATION_STALE_MS ? CONTINUATION_STALE_DECAY : 0;
    return {
      score: Math.max(0, BASE_CONTINUATION + recencyPoints(age) - stale),
      reason: "continuation-available",
      source: null,
    };
  }

  // Ordinary activity band.
  if (facts.presence === "active") {
    return {
      score: BASE_ACTIVITY,
      reason: "open-activity",
      source: null,
    };
  }

  return { score: 0, reason: "no-destination", source: null };
}

/** Distance through the graph adapter; null when the graph cannot answer. */
function structuralDistance(
  graph: GraphContextAdapter,
  currentNode: GraphNodeId | null,
  target: string,
): number | null {
  if (!graph.available || currentNode === null) return null;
  const path = graph.shortestPath(currentNode, target);
  if (!path) return null;
  return path.length;
}

function rankCandidates(
  candidates: CandidateFacts[],
  snapshot: LenaContextSnapshot,
  graph: GraphContextAdapter,
): RankedCandidate[] {
  const now = snapshot.at;
  const currentChamber = snapshot.focus.inChamber
    ? snapshot.focus.currentSystemId
    : null;
  const currentNode = graphNodeFor(
    snapshot.spatial.space,
    snapshot.spatial.systemId,
  );

  const ranked: RankedCandidate[] = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const facts = candidates[index];
    // Never recommend the chamber the visitor is already deep inside.
    if (currentChamber !== null && facts.systemId === currentChamber) continue;
    const score = scoreCandidate(facts, now);
    if (score.score <= 0) continue;
    ranked.push({
      facts,
      score,
      distance: structuralDistance(graph, currentNode, facts.systemId),
      catalogIndex: index,
    });
  }

  // Deterministic order: score desc → structural distance asc (ties only) →
  // canonical catalog order asc.
  ranked.sort((a, b) => {
    if (b.score.score !== a.score.score) return b.score.score - a.score.score;
    const da = a.distance ?? Number.POSITIVE_INFINITY;
    const db = b.distance ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.catalogIndex - b.catalogIndex;
  });
  return ranked;
}

function modeAndPriorityFor(
  reason: GuidanceReasonCode,
): { mode: GuidanceMode; priority: GuidanceResult["priority"] } {
  switch (reason) {
    case "critical-unresolved-signal":
      return { mode: "address-critical", priority: "critical" };
    case "attention-unresolved-signal":
      return { mode: "address-attention", priority: "attention" };
    case "continuation-available":
      return { mode: "continue-journey", priority: "normal" };
    case "open-activity":
    case "open-activity-recent":
      return { mode: "inspect-activity", priority: "normal" };
    default:
      return { mode: "none", priority: "none" };
  }
}

function emptyResult(
  reason: GuidanceReasonCode,
  considered: number,
): GuidanceResult {
  return {
    mode: "none",
    destination: null,
    reason,
    sourceId: null,
    sourceAt: null,
    priority: "none",
    score: 0,
    path: null,
    candidatesConsidered: considered,
  };
}

/**
 * Plan the Next Best Place from the canonical context snapshot.
 *
 * Pure and deterministic. The optional graph adapter is used ONLY for
 * score-tie structural distance and for reporting the winning structural
 * path — severity decisions never depend on it.
 */
export function planNextBestPlace(
  snapshot: LenaContextSnapshot,
  graph: GraphContextAdapter = emptyGraphContextAdapter,
): GuidanceResult {
  const candidates = collectCandidates(snapshot);
  const currentNode = graphNodeFor(
    snapshot.spatial.space,
    snapshot.spatial.systemId,
  );

  // How many candidates were meaningful including the current chamber —
  // distinguishes "nothing exists anywhere" (no-destination) from
  // "everything meaningful is exactly where the visitor already is"
  // (at-destination).
  let beforeExclusion = 0;
  for (const candidate of candidates) {
    const { score } = scoreCandidate(candidate, snapshot.at);
    if (score > 0) beforeExclusion += 1;
  }

  const ranked = rankCandidates(candidates, snapshot, graph);
  if (ranked.length === 0) {
    return emptyResult(
      beforeExclusion > 0 ? "at-destination" : "no-destination",
      beforeExclusion,
    );
  }

  const winner = ranked[0];
  const { mode, priority } = modeAndPriorityFor(winner.score.reason);
  const source = winner.score.source;
  const structural =
    graph.available && currentNode !== null
      ? graph.shortestPath(currentNode, winner.facts.systemId)
      : null;

  return {
    mode,
    destination: { systemId: winner.facts.systemId, path: winner.facts.path },
    reason: winner.score.reason,
    sourceId: source?.id ?? null,
    sourceAt: source ? Date.parse(source.timestamp) : null,
    priority,
    score: winner.score.score,
    path: structural && structural.length > 0 ? structural : null,
    candidatesConsidered: ranked.length,
  };
}

export type {
  GuidanceMode,
  GuidanceReasonCode,
  GuidanceResult,
} from "./types";
