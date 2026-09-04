import { describe, expect, it } from "vitest";
import { deriveLenaIntelligence } from "./index";
import type { LenaContextSituation } from "./context/types";
import {
  AVAILABLE_SIGNAL_SOURCE,
  chamberRoute,
  FIXED_NOW,
  makeGraph,
  makeRegistry,
  makeSignal,
  NAV,
  PUB_WORLD_IDS,
  returningMemory,
  stamp,
  worldFieldRoute,
} from "./testing/fixtures";

const REGISTRY = makeRegistry();

function situation(
  overrides: Partial<LenaContextSituation> = {},
): LenaContextSituation {
  return {
    now: FIXED_NOW,
    route: worldFieldRoute(),
    registry: REGISTRY,
    signals: [],
    signalSource: AVAILABLE_SIGNAL_SOURCE,
    worldIds: [...PUB_WORLD_IDS],
    ...overrides,
  };
}

describe("intelligence façade — canonical derivation", () => {
  it("answers the future-consumer questions in one result", () => {
    const result = deriveLenaIntelligence(
      situation({
        signals: [
          makeSignal({
            id: "crit1",
            sourceWorld: "recycling",
            severity: "critical",
            kind: "degraded",
            timestamp: stamp(2),
            lifecycle: "new",
          }),
        ],
      }),
      { graph: makeGraph(), now: FIXED_NOW },
    );

    expect(result.context.v).toBe(1);
    // What state am I in, and why?
    expect(result.core.state).toBe("critical");
    expect(result.core.stateReason).toBe("critical-unresolved");
    // How intense?
    expect(result.core.intensity).toBe(1);
    expect(result.core.urgency).toBe("critical");
    expect(result.core.pulse).toBe("urgent");
    // What owns the attention?
    expect(result.core.attentionOwner).toMatchObject({
      id: "crit1",
      sourceWorld: "recycling",
    });
    // Recommended target + why + structural path
    expect(result.guidance.mode).toBe("address-critical");
    expect(result.guidance.destination?.systemId).toBe("recycling");
    expect(result.guidance.reason).toBe("critical-unresolved-signal");
    expect(result.guidance.sourceId).toBe("crit1");
    expect(result.guidance.path).toEqual(["/world", "recycling"]);
    expect(result.core.guidanceTarget?.systemId).toBe("recycling");
  });

  it("calm continuation: core guiding mirrors guidance destination", () => {
    const result = deriveLenaIntelligence(
      situation({ memory: returningMemory() }),
      { now: FIXED_NOW },
    );
    expect(result.guidance.mode).toBe("continue-journey");
    expect(result.guidance.destination?.systemId).toBe("property");
    expect(result.core.state).toBe("guiding");
    expect(result.core.guidanceTarget).toEqual(result.guidance.destination);
  });

  it("the graph option is fused into context AND used by guidance (single observation)", () => {
    const result = deriveLenaIntelligence(
      situation({
        signals: [
          makeSignal({
            id: "crit1",
            sourceWorld: "recycling",
            severity: "critical",
            kind: "degraded",
            timestamp: stamp(2),
          }),
        ],
      }),
      { graph: makeGraph(), now: FIXED_NOW },
    );
    // Context read model reflects the connected adapter…
    expect(result.context.graph.available).toBe(true);
    expect(result.context.graph.currentNode).toBe("/world");
    expect(result.context.graph.currentNeighbors).toContain("recycling");
    // …and the planner used the same adapter for the structural path.
    expect(result.guidance.path).toEqual(["/world", "recycling"]);
  });

  it("no guidance → core guidance target is null", () => {
    const result = deriveLenaIntelligence(situation(), { now: FIXED_NOW });
    expect(result.guidance.mode).toBe("none");
    expect(result.core.guidanceTarget).toBeNull();
    expect(result.core.state).toBe("calm");
  });

  it("previousCoreState feeds the focused-hold stability rule", () => {
    // Returning visitor reloads their chamber without an arrival intent →
    // the raw derivation is calm, but the session was focused a frame ago.
    const reloadFrame = situation({
      route: chamberRoute("property"),
      memory: returningMemory(),
      signals: [],
    });
    const fresh = deriveLenaIntelligence(reloadFrame, {
      now: FIXED_NOW,
      previousCoreState: undefined,
    });
    expect(fresh.core.state).toBe("calm");

    const settled = deriveLenaIntelligence(reloadFrame, {
      now: FIXED_NOW,
      previousCoreState: "focused",
    });
    expect(settled.core.state).toBe("focused");
    expect(settled.core.stateReason).toBe("focused-hold");
    expect(settled.core.held).toBe(true);
  });

  it("an engaged visitor stays focused when ambient activity appears", () => {
    const engaged = situation({
      route: chamberRoute("property"),
      memory: returningMemory(),
      arrival: NAV.descend,
      transitionPhase: "idle",
      signals: [
        makeSignal({ id: "amb1", sourceWorld: "wellness", severity: "information" }),
      ],
    });
    const fresh = deriveLenaIntelligence(engaged, { now: FIXED_NOW });
    expect(fresh.core.state).toBe("focused");
    const next = deriveLenaIntelligence(engaged, {
      now: FIXED_NOW,
      previousCoreState: fresh.core.state,
    });
    expect(next.core.state).toBe("focused");
    expect(next.core.held).toBe(false);
  });

  it("identical inputs produce a deep-equal intelligence result", () => {
    const input = situation({
      memory: returningMemory(),
      signals: [
        makeSignal({
          id: "att1",
          sourceWorld: "rental",
          severity: "attention",
          timestamp: stamp(3),
        }),
      ],
    });
    const options = { graph: makeGraph(), previousCoreState: "calm" as const, now: FIXED_NOW };
    const a = deriveLenaIntelligence(input, options);
    for (let i = 0; i < 4; i += 1) {
      expect(deriveLenaIntelligence(input, options)).toEqual(a);
    }
  });

  it("never mutates its situation inputs", () => {
    const signals = [
      makeSignal({
        id: "crit1",
        sourceWorld: "recycling",
        severity: "critical",
        timestamp: stamp(2),
      }),
    ];
    const memory = returningMemory();
    const input = situation({ signals, memory });
    const signalsBefore = JSON.stringify(signals);
    const memoryBefore = JSON.stringify(memory);
    deriveLenaIntelligence(input, { graph: makeGraph(), now: FIXED_NOW });
    deriveLenaIntelligence(input, { graph: makeGraph(), now: FIXED_NOW });
    expect(JSON.stringify(signals)).toBe(signalsBefore);
    expect(JSON.stringify(memory)).toBe(memoryBefore);
  });
});

describe("intelligence façade — UI-neutral view contract", () => {
  const REASONS = new Set([
    "outside-lena",
    "no-pressure",
    "open-activity",
    "deep-engagement",
    "focused-hold",
    "attention-unresolved",
    "critical-unresolved",
    "spatial-transition",
    "guidance-available",
  ]);
  const STATES = new Set([
    "dormant",
    "calm",
    "aware",
    "focused",
    "attention",
    "critical",
    "guiding",
    "transitioning",
  ]);
  const PULSES = new Set(["off", "soft", "steady", "urgent"]);
  const URGENCIES = new Set(["none", "low", "medium", "high", "critical"]);

  it("core view exposes only semantic vocabulary (no CSS/artwork leakage)", () => {
    const view = deriveLenaIntelligence(
      situation({
        signals: [
          makeSignal({
            id: "att1",
            sourceWorld: "rental",
            severity: "attention",
            timestamp: stamp(3),
          }),
        ],
      }),
      { now: FIXED_NOW },
    ).core;

    expect(STATES.has(view.state)).toBe(true);
    expect(REASONS.has(view.stateReason)).toBe(true);
    expect(PULSES.has(view.pulse)).toBe(true);
    expect(URGENCIES.has(view.urgency)).toBe(true);
    expect(view.intensity).toBeGreaterThanOrEqual(0);
    expect(view.intensity).toBeLessThanOrEqual(1);

    // The rendered result must be JSON-safe (no functions, no DOM refs).
    const json = JSON.parse(JSON.stringify(view));
    expect(json.state).toBe(view.state);
    expect(json.attentionOwner).toEqual(view.attentionOwner);
  });

  it("exposes the same information for a dormant state safely", () => {
    const result = deriveLenaIntelligence(
      { now: FIXED_NOW },
      { now: FIXED_NOW },
    );
    expect(result.core.state).toBe("dormant");
    expect(result.guidance.mode).toBe("none");
    expect(result.context.spatial.inLena).toBe(false);
  });
});
