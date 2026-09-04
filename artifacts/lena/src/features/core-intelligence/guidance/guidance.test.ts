import { describe, expect, it } from "vitest";
import { fuseLenaContext } from "../context/fusion";
import type { LenaContextSituation } from "../context/types";
import { planNextBestPlace, recencyPoints } from "./planner";
import type { GuidanceResult } from "./types";
import {
  AVAILABLE_SIGNAL_SOURCE,
  chamberRoute,
  FIXED_NOW,
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
import { InMemoryGraphContextAdapter } from "../graph/GraphContextAdapter";

const REGISTRY = makeRegistry();

function fuse(situation: LenaContextSituation) {
  const hasSignals = situation.signals !== undefined && situation.signals !== null;
  return fuseLenaContext({
    now: FIXED_NOW,
    registry: REGISTRY,
    ...(hasSignals ? { signalSource: AVAILABLE_SIGNAL_SOURCE } : {}),
    ...situation,
  });
}

function plan(situation: LenaContextSituation, graph = makeGraph()) {
  return planNextBestPlace(fuse(situation), graph);
}

describe("guidance — critical beats attention", () => {
  it("recommends the critical world over any attention world", () => {
    const result = plan({
      route: worldFieldRoute(),
      signals: [
        makeSignal({
          id: "crit1",
          sourceWorld: "recycling",
          severity: "critical",
          kind: "degraded",
          timestamp: stamp(2),
          lifecycle: "new",
        }),
        makeSignal({
          id: "att1",
          sourceWorld: "rental",
          severity: "attention",
          kind: "attention-needed",
          timestamp: stamp(1), // fresher than the critical one
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(result.mode).toBe("address-critical");
    expect(result.destination?.systemId).toBe("recycling");
    expect(result.reason).toBe("critical-unresolved-signal");
    expect(result.priority).toBe("critical");
    expect(result.sourceId).toBe("crit1");
    expect(result.score).toBeGreaterThan(60_000);
  });
});

describe("guidance — attention beats ambient activity", () => {
  it("recommends the attention world over active-but-ordinary worlds", () => {
    const result = plan({
      route: worldFieldRoute(),
      signals: [
        makeSignal({
          id: "att1",
          sourceWorld: "property",
          severity: "attention",
          kind: "attention-needed",
          timestamp: stamp(4),
        }),
        makeSignal({
          id: "act1",
          sourceWorld: "wellness",
          severity: "information",
          timestamp: stamp(3), // activity is fresher
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(result.mode).toBe("address-attention");
    expect(result.destination?.systemId).toBe("property");
    expect(result.priority).toBe("attention");
    expect(result.sourceId).toBe("att1");
  });
});

describe("guidance — recent vs stale", () => {
  it("fresher attention signal outranks a stale one inside the band", () => {
    const result = plan({
      route: worldFieldRoute(),
      signals: [
        makeSignal({
          id: "stale",
          sourceWorld: "rental",
          severity: "attention",
          kind: "attention-needed",
          timestamp: stamp(60 * 24 * 5), // 5 days old
        }),
        makeSignal({
          id: "fresh",
          sourceWorld: "wellness",
          severity: "attention",
          kind: "attention-needed",
          timestamp: stamp(3),
          lifecycle: "new",
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(result.destination?.systemId).toBe("wellness");
    expect(result.sourceId).toBe("fresh");
  });

  it("recencyPoints follows the documented ladder monotonically", () => {
    expect(recencyPoints(5 * 60_000)).toBe(12_000);
    expect(recencyPoints(30 * 60_000)).toBe(8_000);
    expect(recencyPoints(2 * 3_600_000)).toBe(5_000);
    expect(recencyPoints(10 * 3_600_000)).toBe(2_500);
    expect(recencyPoints(3 * 86_400_000)).toBe(800);
    expect(recencyPoints(30 * 86_400_000)).toBe(0);
  });
});

describe("guidance — continuation when the world is calm", () => {
  it("recommends continuing the journey when nothing demands attention", () => {
    const result = plan({
      route: homeRoute(),
      memory: returningMemory(), // last at property, ~1h ago
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(result.mode).toBe("continue-journey");
    expect(result.destination?.systemId).toBe("property");
    expect(result.destination?.path).toBe("/world/property");
    expect(result.reason).toBe("continuation-available");
    expect(result.priority).toBe("normal");
    expect(result.score).toBeGreaterThan(20_000);
  });

  it("a fresh continuation beats ambient activity", () => {
    const withFreshActivity = plan({
      route: worldFieldRoute(),
      memory: returningMemory(), // continuation ~1h old
      signals: [
        makeSignal({
          id: "act1",
          sourceWorld: "wellness",
          severity: "information",
          timestamp: stamp(5),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(withFreshActivity.mode).toBe("continue-journey");
    expect(withFreshActivity.destination?.systemId).toBe("property");
  });

  it("a stale continuation (> 7 days) yields to fresh activity", () => {
    const result = plan({
      route: worldFieldRoute(),
      memory: returningMemory({ lastInteractionAt: FIXED_NOW - 40 * 86_400_000 }),
      signals: [
        makeSignal({
          id: "act1",
          sourceWorld: "wellness",
          severity: "information",
          timestamp: stamp(5),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(result.mode).toBe("inspect-activity");
    expect(result.destination?.systemId).toBe("wellness");
    expect(result.reason).toBe("open-activity");
  });
});

describe("guidance — no-op at the recommended destination", () => {
  it("does not recommend the chamber the visitor is already inside", () => {
    const result = plan(
      {
        route: chamberRoute("recycling"),
        arrival: NAV.descend,
        transitionPhase: "idle",
        signals: [
          makeSignal({
            id: "crit1",
            sourceWorld: "recycling",
            severity: "critical",
            kind: "degraded",
            timestamp: stamp(2),
          }),
        ],
        worldIds: [...PUB_WORLD_IDS],
      },
      makeGraph(),
    );
    // The critical world is where the visitor already is → no guidance.
    expect(result.mode).toBe("none");
    expect(result.reason).toBe("at-destination");
    expect(result.destination).toBeNull();
  });
});

describe("guidance — structural distance tie-breaking", () => {
  it("prefers the closer world when scores tie, without overriding severity", () => {
    // Two worlds with identical ordinary-activity presence → identical score.
    // wellness appears first in catalog order; rental is structurally closer
    // to the current property chamber.
    const graph = new InMemoryGraphContextAdapter();
    graph.addBidirectionalEdge("/", "/world");
    for (const id of PUB_WORLD_IDS) graph.addBidirectionalEdge("/world", id);
    graph.addBidirectionalEdge("property", "rental"); // structural shortcut

    const result = plan(
      {
        route: chamberRoute("property"),
        transitionPhase: "idle",
        signals: [
          makeSignal({ id: "a1", sourceWorld: "wellness", severity: "information" }),
          makeSignal({ id: "a2", sourceWorld: "rental", severity: "information" }),
        ],
        worldIds: [...PUB_WORLD_IDS],
      },
      graph,
    );
    expect(result.mode).toBe("inspect-activity");
    expect(result.destination?.systemId).toBe("rental");
    // The structural path is reported with the recommendation.
    expect(result.path).toEqual(["property", "rental"]);
  });

  it("distance never overrides severity", () => {
    const graph = new InMemoryGraphContextAdapter();
    graph.addBidirectionalEdge("/", "/world");
    for (const id of PUB_WORLD_IDS) graph.addBidirectionalEdge("/world", id);
    graph.addBidirectionalEdge("property", "rental"); // closer by one hop

    const result = plan(
      {
        route: chamberRoute("property"),
        transitionPhase: "idle",
        signals: [
          makeSignal({
            id: "att1",
            sourceWorld: "rental", // attention + structurally close
            severity: "attention",
            timestamp: stamp(2),
          }),
          makeSignal({
            id: "crit1",
            sourceWorld: "wellness", // critical + farther
            severity: "critical",
            timestamp: stamp(2),
          }),
        ],
        worldIds: [...PUB_WORLD_IDS],
      },
      graph,
    );
    expect(result.mode).toBe("address-critical");
    expect(result.destination?.systemId).toBe("wellness");
  });
});

describe("guidance — no destination available", () => {
  it("returns none when nothing meaningful exists", () => {
    const result = plan(
      { route: worldFieldRoute(), signals: [], worldIds: [...PUB_WORLD_IDS] },
      makeGraph(),
    );
    expect(result.mode).toBe("none");
    expect(result.reason).toBe("no-destination");
    expect(result.destination).toBeNull();
    expect(result.score).toBe(0);
    expect(result.candidatesConsidered).toBe(0);
  });

  it("keeps working without a graph adapter (path metadata absent)", () => {
    const result = planNextBestPlace(
      fuse({
        route: worldFieldRoute(),
        signals: [
          makeSignal({
            id: "att1",
            sourceWorld: "rental",
            severity: "attention",
            timestamp: stamp(4),
          }),
        ],
        worldIds: [...PUB_WORLD_IDS],
      }),
    );
    expect(result.mode).toBe("address-attention");
    expect(result.destination?.systemId).toBe("rental");
    expect(result.path).toBeNull();
  });
});

describe("guidance — deterministic ordering", () => {
  it("identical input produces identical results repeatedly", () => {
    const situation: LenaContextSituation = {
      route: worldFieldRoute(),
      memory: returningMemory(),
      signals: [
        makeSignal({
          id: "att1",
          sourceWorld: "rental",
          severity: "attention",
          kind: "attention-needed",
          timestamp: stamp(6),
        }),
        makeSignal({
          id: "amb1",
          sourceWorld: "wellness",
          severity: "ambient",
          timestamp: stamp(2),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    };
    const graph = makeGraph();
    const a = planNextBestPlace(fuse(situation), graph);
    for (let i = 0; i < 5; i += 1) {
      expect(planNextBestPlace(fuse(situation), graph)).toEqual(a);
    }
    expect(a.mode).toBe("address-attention");
  });

  it("ranking stays stable when extra quiet worlds are added", () => {
    const signals = [
      makeSignal({
        id: "crit1",
        sourceWorld: "recycling",
        severity: "critical",
        timestamp: stamp(2),
      }),
    ];
    const small = plan({
      route: worldFieldRoute(),
      signals,
      worldIds: ["recycling", "wellness"],
    });
    const full = plan({
      route: worldFieldRoute(),
      signals,
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(small.destination).toEqual(full.destination);
    expect(small.reason).toBe(full.reason);
  });
});

