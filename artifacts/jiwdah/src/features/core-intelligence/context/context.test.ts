import { describe, expect, it } from "vitest";
import { fuseLenaContext } from "./fusion";
import type { LenaContextSituation } from "./types";
import {
  FIXED_NOW,
  chamberRoute,
  homeRoute,
  makeGraph,
  makeRegistry,
  makeSignal,
  NAV,
  PUB_WORLD_IDS,
  returningMemory,
  stamp,
  worldFieldRoute,
} from "../testing/fixtures";
import { situationFromSignals, situationFromSpatial } from "./adapters";

const REGISTRY = makeRegistry();

function fuse(situation: LenaContextSituation) {
  return fuseLenaContext({ now: FIXED_NOW, registry: REGISTRY, ...situation });
}

describe("context fusion — calm context", () => {
  it("derives a quiet, continuation-free snapshot at the world field", () => {
    const snapshot = fuse({
      route: worldFieldRoute(),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
      graph: makeGraph(),
    });
    expect(snapshot.v).toBe(1);
    expect(snapshot.at).toBe(FIXED_NOW);
    expect(snapshot.spatial).toMatchObject({
      inLena: true,
      space: "world",
      depth: 1,
      path: "/world",
      transitioning: false,
    });
    expect(snapshot.signals.globalState).toBe("calm");
    expect(snapshot.signals.presence).toBe("quiet");
    expect(snapshot.signals.openCount).toBe(0);
    expect(snapshot.signals.unresolved.critical).toEqual([]);
    expect(snapshot.signals.unresolved.attention).toEqual([]);
    expect(snapshot.signals.highestUnresolved).toBeNull();
    expect(snapshot.continuity.available).toBe(false);
    expect(snapshot.memory.firstVisit).toBe(true);
    expect(snapshot.catalog.worlds).toHaveLength(PUB_WORLD_IDS.length);
    expect(snapshot.catalog.worlds[0]).toEqual({
      systemId: "wellness",
      path: "/world/wellness",
    });
    expect(snapshot.graph).toMatchObject({
      available: true,
      currentNode: "/world",
    });
    expect(snapshot.graph.currentNeighbors).toEqual(["/", ...PUB_WORLD_IDS]);
  });
});

describe("context fusion — active context", () => {
  it("derives an active presence from ordinary open signals", () => {
    const snapshot = fuse({
      route: worldFieldRoute(),
      signals: [
        makeSignal({
          id: "s1",
          sourceWorld: "property",
          severity: "information",
          kind: "operational-change",
          timestamp: stamp(10),
        }),
        makeSignal({
          id: "s2",
          sourceWorld: "wellness",
          severity: "ambient",
          kind: "activity",
          timestamp: stamp(45),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.signals.globalState).toBe("active");
    expect(snapshot.signals.presence).toBe("active");
    expect(snapshot.signals.openCount).toBe(2);
    expect(snapshot.signals.attentionPressure).toBe(0);
    expect(snapshot.signals.byWorld.property).toBe("active");
    expect(snapshot.signals.byWorld.wellness).toBe("active");
    expect(snapshot.signals.byWorld.hospitality).toBe("quiet");
    expect(snapshot.signals.highestUnresolved).toBeNull();
    expect(snapshot.signals.newestOpenAt).toBe(Date.parse(stamp(10)));
  });
});

describe("context fusion — attention context", () => {
  it("ranks the attention signal as highest unresolved and tags its world", () => {
    const signals = [
      makeSignal({
        id: "s-old",
        sourceWorld: "rental",
        severity: "attention",
        kind: "attention-needed",
        timestamp: stamp(120),
      }),
      makeSignal({
        id: "s-new",
        sourceWorld: "wellness",
        severity: "attention",
        kind: "attention-needed",
        timestamp: stamp(5),
        lifecycle: "new",
      }),
    ];
    const snapshot = fuse({
      route: chamberRoute("property"),
      signals,
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.signals.globalState).toBe("attention");
    expect(snapshot.signals.presence).toBe("attention");
    expect(snapshot.signals.unresolved.critical).toEqual([]);
    expect(snapshot.signals.unresolved.attention).toHaveLength(2);
    expect(snapshot.signals.unresolved.attention[0].id).toBe("s-new");
    expect(snapshot.signals.highestUnresolved?.id).toBe("s-new");
    expect(snapshot.signals.attentionPressure).toBeGreaterThan(0);
    expect(snapshot.signals.byWorld.wellness).toBe("attention");
    expect(snapshot.signals.byWorld.rental).toBe("attention");
    expect(snapshot.focus.currentWorldPresence).toBe("quiet");
  });
});

describe("context fusion — critical context", () => {
  it("derives global critical state and separates critical from attention", () => {
    const signals = [
      makeSignal({
        id: "s-crit",
        sourceWorld: "recycling",
        severity: "critical",
        kind: "degraded",
        timestamp: stamp(3),
        lifecycle: "new",
      }),
      makeSignal({
        id: "s-att",
        sourceWorld: "rental",
        severity: "attention",
        kind: "attention-needed",
        timestamp: stamp(8),
      }),
    ];
    const snapshot = fuse({
      route: worldFieldRoute(),
      signals,
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.signals.globalState).toBe("critical");
    expect(snapshot.signals.presence).toBe("critical");
    expect(snapshot.signals.unresolved.critical.map((s) => s.id)).toEqual(["s-crit"]);
    expect(snapshot.signals.unresolved.attention.map((s) => s.id)).toEqual(["s-att"]);
    expect(snapshot.signals.highestUnresolved?.id).toBe("s-crit");
    expect(snapshot.signals.byWorld.recycling).toBe("critical");
    expect(snapshot.signals.unresolvedSummaries[0]).toMatchObject({
      id: "s-crit",
      severity: "critical",
      lifecycle: "new",
      sourceWorld: "recycling",
    });
  });
});

describe("context fusion — returning visitor context", () => {
  it("resolves continuation, remembered focus and returning facts", () => {
    const snapshot = fuse({
      route: worldFieldRoute(),
      memory: returningMemory(),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.memory).toMatchObject({
      present: true,
      firstVisit: false,
      returning: true,
      lastSpace: "chamber",
      lastSystemId: "property",
      lastChamberPath: "/world/property",
    });
    expect(snapshot.focus.rememberedSystemId).toBe("property");
    expect(snapshot.continuity).toMatchObject({
      available: true,
      kind: "chamber",
      systemId: "property",
      path: "/world/property",
      reachedChamber: true,
    });
    expect(snapshot.continuity.at).toBe(FIXED_NOW - 3_600_000);
  });

  it("never suggests a continuation without the live registry", () => {
    const snapshot = fuseLenaContext({
      now: FIXED_NOW,
      route: worldFieldRoute(),
      memory: returningMemory(),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
      // no registry
    });
    expect(snapshot.continuity.available).toBe(false);
    expect(snapshot.focus.rememberedSystemId).toBeNull();
    expect(snapshot.catalog.worlds).toEqual([]);
  });

  it("falls back one level when the remembered destination left the registry", () => {
    // Canonical continuation semantics: a stale chamber degrades to the
    // world field — the snapshot must mirror that, never a dead room.
    const snapshot = fuse({
      route: worldFieldRoute(),
      memory: returningMemory({ lastSystemId: "vapor", lastChamberPath: "/world/vapor" }),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.continuity.available).toBe(true);
    expect(snapshot.continuity).toMatchObject({
      kind: "world",
      path: "/world",
      reachedChamber: false,
    });
    expect(snapshot.focus.rememberedSystemId).toBeNull();
  });
});

describe("context fusion — deep spatial context", () => {
  it("captures depth, arrival intent and transition state", () => {
    const snapshot = fuse({
      route: chamberRoute("property"),
      arrival: NAV.descend,
      direction: "forward",
      transitionPhase: "moving",
      memory: returningMemory(),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
      graph: makeGraph(),
    });
    expect(snapshot.spatial).toMatchObject({
      inLena: true,
      space: "chamber",
      systemId: "property",
      depth: 2,
      arrivalIntent: "descend",
      originPath: "/world",
      isDirectEntry: false,
      transitioning: true,
      transitionPhase: "moving",
    });
    expect(snapshot.focus).toMatchObject({
      currentSystemId: "property",
      inChamber: true,
      engagementIntent: "descend",
      deepEngaged: false,
      atWorldField: false,
    });
    expect(snapshot.graph).toMatchObject({
      available: true,
      currentNode: "property",
    });
    expect(snapshot.graph.currentNeighbors).toEqual(["/world"]);
  });

  it("treats a settled chamber as deep engagement", () => {
    const snapshot = fuse({
      route: chamberRoute("wellness"),
      arrival: NAV.enter,
      transitionPhase: "idle",
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.spatial.transitioning).toBe(false);
    expect(snapshot.focus.deepEngaged).toBe(true);
    expect(snapshot.spatial.depth).toBe(2);
  });
});

describe("context fusion — missing graph adapter", () => {
  it("degrades to unavailable graph facts without throwing", () => {
    const snapshot = fuse({
      route: chamberRoute("property"),
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(snapshot.graph).toEqual({
      available: false,
      currentNode: "property",
      currentNeighbors: null,
    });
  });
});

describe("context fusion — incomplete optional data", () => {
  it("defaults every missing section safely", () => {
    const snapshot = fuseLenaContext({ now: FIXED_NOW });
    expect(snapshot.spatial).toMatchObject({
      inLena: false,
      space: null,
      systemId: null,
      path: "",
      depth: 0,
      arrivalIntent: null,
      transitioning: false,
    });
    expect(snapshot.memory.present).toBe(false);
    expect(snapshot.signals.present).toBe(false);
    expect(snapshot.signals.globalState).toBe("calm");
    expect(snapshot.catalog.worlds).toEqual([]);
    expect(snapshot.continuity.available).toBe(false);
    expect(snapshot.graph.available).toBe(false);
    expect(snapshot.graph.currentNode).toBeNull();
    expect(snapshot.focus.currentSystemId).toBeNull();
    expect(snapshot.focus.rememberedSystemId).toBeNull();
  });

  it("handles a partial situation (route only) gracefully", () => {
    const snapshot = fuse({ route: homeRoute() });
    expect(snapshot.spatial.space).toBe("home");
    expect(snapshot.spatial.depth).toBe(0);
    expect(snapshot.signals.present).toBe(false);
  });
});

describe("context fusion — deterministic output & read-only contract", () => {
  it("produces deep-equal snapshots for identical input", () => {
    const signals = [
      makeSignal({
        id: "s-crit",
        sourceWorld: "recycling",
        severity: "critical",
        timestamp: stamp(3),
      }),
    ];
    const situation: LenaContextSituation = {
      now: FIXED_NOW,
      route: chamberRoute("property"),
      arrival: NAV.descend,
      memory: returningMemory(),
      signals,
      worldIds: [...PUB_WORLD_IDS],
      registry: makeRegistry(),
      graph: makeGraph(),
    };
    const first = fuseLenaContext(situation);
    const second = fuseLenaContext(situation);
    expect(second).toEqual(first);
    // Calling twice on the same situation never changes either result.
    expect(fuseLenaContext(situation)).toEqual(first);
  });

  it("never mutates its inputs (signals, memory, registry, graph)", () => {
    const signals = [
      makeSignal({
        id: "s-crit",
        sourceWorld: "recycling",
        severity: "critical",
        kind: "degraded",
        timestamp: stamp(3),
        lifecycle: "new",
      }),
      makeSignal({
        id: "s-open",
        sourceWorld: "rental",
        severity: "ambient",
        kind: "activity",
        timestamp: stamp(90),
      }),
    ];
    const memory = returningMemory();
    const registry = makeRegistry();
    const graph = makeGraph();
    const beforeSignals = JSON.stringify(signals);
    const beforeMemory = JSON.stringify(memory);
    const registryBefore = [...PUB_WORLD_IDS].map((id) => registry.chamberPathFor(id));

    fuseLenaContext({
      now: FIXED_NOW,
      route: chamberRoute("property"),
      arrival: NAV.descend,
      memory,
      registry,
      signals,
      worldIds: [...PUB_WORLD_IDS],
      graph,
    });

    expect(JSON.stringify(signals)).toBe(beforeSignals);
    expect(JSON.stringify(memory)).toBe(beforeMemory);
    expect([...PUB_WORLD_IDS].map((id) => registry.chamberPathFor(id))).toEqual(registryBefore);
    // Graph queries remain stable after fusion observed them.
    expect(graph.neighbors("property")).toEqual(["/world"]);
  });

  it("catalog only includes worlds known to the canonical registry", () => {
    const snapshot = fuse({
      route: worldFieldRoute(),
      signals: [],
      worldIds: [...PUB_WORLD_IDS, "materials", "ghost-system"],
    });
    const ids = snapshot.catalog.worlds.map((w) => w.systemId);
    expect(ids).toEqual([...PUB_WORLD_IDS]);
    expect(ids).not.toContain("materials");
    expect(ids).not.toContain("ghost-system");
    // byWorld mirrors the requested ids (presence of unknown = quiet).
    expect(snapshot.signals.byWorld["ghost-system"]).toBe("quiet");
  });
});

describe("context adapters (canonical mappers)", () => {
  it("situationFromSpatial maps route/nav state/phase onto the situation", () => {
    const mapped = situationFromSpatial({
      route: chamberRoute("property"),
      navState: NAV.descend,
      direction: "forward",
      transitionPhase: "moving",
    });
    expect(mapped.arrival?.spatial.intent).toBe("descend");
    const snapshot = fuse({ ...mapped, signals: [], worldIds: [...PUB_WORLD_IDS] });
    expect(snapshot.spatial.arrivalIntent).toBe("descend");
    expect(snapshot.spatial.isDirectEntry).toBe(false);
    expect(snapshot.spatial.transitioning).toBe(true);
  });

  it("situationFromSignals passes the store snapshot and world ids", () => {
    const signals = [
      makeSignal({ id: "a1", sourceWorld: "rental", severity: "attention" }),
    ];
    const mapped = situationFromSignals(signals, [...PUB_WORLD_IDS]);
    const snapshot = fuse({
      route: worldFieldRoute(),
      registry: REGISTRY,
      ...mapped,
    });
    expect(snapshot.signals.byWorld.rental).toBe("attention");
  });
});
