/**
 * LENA Intelligence — context fusion.
 *
 * Fuses whatever canonical runtimes currently expose into one compact,
 * deterministic, READ-ONLY `LenaContextSnapshot`. This module is the only
 * place where raw runtime state becomes intelligence input — Core State and
 * Guidance consume the snapshot, never the runtimes.
 *
 * Rules enforced here:
 *   - observe + derive only (no signal ack/resolve, no memory writes, no
 *     navigation, no graph mutation, no presentation)
 *   - canonical derivations are reused (`signals/derive`, spatial
 *     continuation), never re-implemented
 *   - absent optional data degrades to safe deterministic defaults
 */

import {
  attentionPressure as canonicalAttentionPressure,
  attentionSignals,
  globalStateFromSignals,
  isOpen,
  presenceByWorld,
  presenceFromSignals,
} from "@/features/world/signals/derive";
import {
  UNAVAILABLE_SIGNAL_SOURCE,
  type SignalSourceState,
  type WorldSignal,
} from "@/features/world/signals/types";
import {
  resolveContinuation,
  resolveRememberedFocus,
} from "@/lib/spatial/continuation";
import type { SpatialMemory } from "@/lib/spatial/memory/types";
import { graphNodeFor } from "../graph/GraphContextAdapter";
import type {
  ContinuityFacts,
  GraphFacts,
  LenaContextSnapshot,
  LenaContextSituation,
  LenaWorldReference,
  MemoryFacts,
  SignalFacts,
  SpatialFacts,
  WorldUnresolvedSummary,
} from "./types";

const CHAMBER_SPACE = "chamber";
const WORLD_SPACE = "world";
const HOME_SPACE = "home";

/** Route-level depth ladder. */
export function spatialDepthOf(space: string | null | undefined): 0 | 1 | 2 {
  if (space === HOME_SPACE) return 0;
  if (space === WORLD_SPACE || space === "command" || space === "atlas") return 1;
  if (space === CHAMBER_SPACE) return 2;
  return 0;
}

function memoryFacts(
  memory: SpatialMemory | null | undefined,
  registry: LenaContextSituation["registry"],
): MemoryFacts {
  const m = memory ?? null;
  if (!m) {
    return {
      present: false,
      firstVisit: true,
      returning: false,
      lastSpace: null,
      lastSystemId: null,
      lastChamberPath: null,
      lastInner: null,
      lastNavigation: null,
      entryContext: null,
      lastInteractionAt: null,
    };
  }
  return {
    present: true,
    firstVisit: false,
    returning: true,
    lastSpace: m.lastSpace,
    lastSystemId: m.lastSystemId,
    lastChamberPath: m.lastChamberPath,
    lastInner: m.lastInner,
    lastNavigation: m.lastNavigation
      ? {
          to: m.lastNavigation.to,
          intent: m.lastNavigation.intent,
          at: m.lastNavigation.at,
        }
      : null,
    entryContext: m.entryContext,
    lastInteractionAt: m.lastInteractionAt,
  };
}

function continuityFacts(
  memory: SpatialMemory | null | undefined,
  registry: LenaContextSituation["registry"],
): ContinuityFacts {
  // Continuation requires the live registry: a remembered destination can
  // never be suggested without validating it against the canonical worlds.
  if (!memory || !registry) {
    return {
      available: false,
      kind: null,
      systemId: null,
      path: null,
      reachedChamber: false,
      at: null,
    };
  }
  const resolved = resolveContinuation(memory, registry);
  if (!resolved) {
    return {
      available: false,
      kind: null,
      systemId: null,
      path: null,
      reachedChamber: false,
      at: null,
    };
  }
  return {
    available: true,
    kind: resolved.kind,
    systemId: resolved.systemId ?? null,
    path: resolved.path,
    reachedChamber: resolved.reachedChamber,
    at: resolved.at,
  };
}

function signalFacts(
  signals: readonly WorldSignal[] | null | undefined,
  sourceInput: SignalSourceState | null | undefined,
  worldIds: readonly string[] | undefined,
): SignalFacts {
  // Missing source authority is not an empty observation. Ignore any stray
  // signal list when the source explicitly says unavailable so fabricated or
  // stale data cannot become live intelligence by accident.
  const source = sourceInput ?? UNAVAILABLE_SIGNAL_SOURCE;
  const available = source.availability === "available";
  const list: WorldSignal[] = available && signals ? [...signals] : [];
  const present = available;

  const openList = list.filter(isOpen);
  // Canonical urgency-ordered attention set (critical first, then recency).
  const rankedAttention = attentionSignals(list);
  const critical = rankedAttention.filter(
    (s) => s.severity === "critical",
  );
  const attention = rankedAttention.filter((s) => s.severity === "attention");

  let newestOpenAt: number | null = null;
  for (const s of openList) {
    const parsed = Date.parse(s.timestamp);
    if (Number.isNaN(parsed)) continue;
    if (newestOpenAt === null || parsed > newestOpenAt) newestOpenAt = parsed;
  }

  const summaries: WorldUnresolvedSummary[] = rankedAttention.map((s) => ({
    id: s.id,
    sourceWorld: s.sourceWorld,
    kind: s.kind,
    severity: s.severity,
    lifecycle: s.lifecycle,
    at: Date.parse(s.timestamp),
  }));

  const byWorld =
    worldIds && worldIds.length > 0
      ? available
        ? presenceByWorld(list, [...worldIds])
        : Object.fromEntries(worldIds.map((id) => [id, "unavailable" as const]))
      : {};

  return {
    present,
    source,
    globalState: available ? globalStateFromSignals(list) : null,
    presence: available ? presenceFromSignals(list) : "unavailable",
    openCount: available ? openList.length : null,
    attentionPressure: available ? canonicalAttentionPressure(list) : null,
    unresolved: { critical, attention },
    highestUnresolved: rankedAttention[0] ?? null,
    unresolvedSummaries: summaries,
    byWorld,
    newestOpenAt,
  };
}

function catalogFacts(
  worldIds: readonly string[] | undefined,
  registry: LenaContextSituation["registry"],
): { worlds: readonly LenaWorldReference[] } {
  if (!registry || !worldIds) return { worlds: [] };
  const worlds: LenaWorldReference[] = [];
  for (const systemId of worldIds) {
    if (!registry.isKnownSystem(systemId)) continue;
    const path = registry.chamberPathFor(systemId);
    // Same guard the canonical continuation resolver uses: chamber paths are
    // always inside /world/.
    if (!path || !path.startsWith("/world/")) continue;
    worlds.push({ systemId, path });
  }
  return { worlds };
}

/**
 * Fuse canonical runtime state into one deterministic context snapshot.
 * Pure and read-only: identical input → deep-equal output. When `now` is
 * omitted the wall clock is used (non-deterministic by caller choice);
 * deterministic callers always pass `now`.
 */
export function fuseLenaContext(
  situation: LenaContextSituation,
): LenaContextSnapshot {
  const at =
    typeof situation.now === "number" ? situation.now : Date.now();
  const route = situation.route ?? null;
  const space = route?.space ?? null;
  const systemId = route && route.space === CHAMBER_SPACE ? (route.systemId ?? null) : null;
  const arrival = situation.arrival?.spatial ?? null;
  const phase = situation.transitionPhase ?? null;
  const registry = situation.registry ?? null;

  const spatial: SpatialFacts = {
    inLena: route !== null && space !== "other",
    space,
    systemId,
    path: route?.path ?? "",
    depth: spatialDepthOf(space),
    arrivalIntent: arrival?.intent ?? null,
    direction: situation.direction ?? "initial",
    originPath: arrival?.origin ?? null,
    isDirectEntry: arrival === null,
    transitionPhase: phase,
    transitioning:
      route !== null &&
      space !== "other" &&
      phase !== null &&
      phase !== "idle",
  };

  const memory = memoryFacts(situation.memory, registry);
  const continuity = continuityFacts(situation.memory, registry);
  const signals = signalFacts(
    situation.signals,
    situation.signalSource,
    situation.worldIds,
  );
  const catalog = catalogFacts(situation.worldIds, registry);

  const inChamber = space === CHAMBER_SPACE;
  const engagementIntent =
    arrival && ["enter", "descend", "focus"].includes(arrival.intent)
      ? arrival.intent
      : null;
  // Confirmed deep engagement: settled inside a chamber AND the entry was an
  // explicit engagement move (enter/descend/focus). Direct URL reloads or
  // history-back arrivals carry no arrival intent, so they are not treated
  // as confirmed engagement until the visitor interacts again.
  const deepEngaged =
    inChamber &&
    (phase === null || phase === "idle") &&
    engagementIntent !== null;
  const rememberedSystemId = registry
    ? resolveRememberedFocus(situation.memory ?? null, registry)
    : null;

  const focus = {
    currentSystemId: systemId,
    inChamber,
    atWorldField: space === WORLD_SPACE,
    atHome: space === HOME_SPACE,
    engagementIntent,
    deepEngaged,
    currentWorldPresence:
      systemId !== null
        ? (signals.byWorld[systemId] ?? signals.presence)
        : null,
    rememberedSystemId,
  };

  const currentNode = graphNodeFor(space, systemId);
  const adapter = situation.graph ?? null;
  const graph: GraphFacts = {
    available: adapter !== null && adapter.available,
    currentNode,
    currentNeighbors:
      adapter !== null && currentNode !== null
        ? adapter.neighbors(currentNode)
        : null,
  };

  return {
    v: 1,
    at,
    spatial,
    memory,
    signals,
    focus,
    catalog,
    graph,
    continuity,
  };
}
