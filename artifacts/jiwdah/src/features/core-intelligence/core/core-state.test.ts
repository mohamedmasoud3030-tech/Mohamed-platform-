import { describe, expect, it } from "vitest";
import { fuseLenaContext } from "../context/fusion";
import type { LenaContextSituation } from "../context/types";
import { deriveCoreState } from "./state";
import type { CoreState } from "./types";
import {
  chamberRoute,
  FIXED_NOW,
  makeRegistry,
  makeSignal,
  NAV,
  PUB_WORLD_IDS,
  returningMemory,
  stamp,
  worldFieldRoute,
} from "../testing/fixtures";

const REGISTRY = makeRegistry();

function fuse(situation: LenaContextSituation) {
  return fuseLenaContext({ now: FIXED_NOW, registry: REGISTRY, ...situation });
}

function calmWorld(situation: LenaContextSituation = {}) {
  return fuse({ route: worldFieldRoute(), signals: [], worldIds: [...PUB_WORLD_IDS], ...situation });
}

const noGuidance = { available: false };
const guidanceTo = (systemId: string, path = `/world/${systemId}`) => ({
  available: true,
  target: { systemId, path },
});

describe("core state machine — calm", () => {
  it("a quiet world field with no signals is calm", () => {
    const view = deriveCoreState(calmWorld());
    expect(view.state).toBe("calm");
    expect(view.stateReason).toBe("no-pressure");
    expect(view.intensity).toBe(0.1);
    expect(view.urgency).toBe("none");
    expect(view.pulse).toBe("soft");
    expect(view.attentionLevel).toBe("none");
    expect(view.focusTarget).toBeNull();
    expect(view.guidanceTarget).toBeNull();
    expect(view.activeThreats).toBe(0);
    expect(view.held).toBe(false);
  });
});

describe("core state machine — aware", () => {
  it("ordinary open activity without attention is aware", () => {
    const view = deriveCoreState(
      calmWorld({
        signals: [
          makeSignal({ id: "a1", sourceWorld: "rental", severity: "information" }),
          makeSignal({ id: "a2", sourceWorld: "wellness", severity: "ambient" }),
        ],
      }),
    );
    expect(view.state).toBe("aware");
    expect(view.stateReason).toBe("open-activity");
    expect(view.intensity).toBe(0.25);
    expect(view.attentionLevel).toBe("none");
    expect(view.attentionOwner).toBeNull();
  });
});

describe("core state machine — focused", () => {
  it("settled deep engagement in a calm chamber is focused", () => {
    const view = deriveCoreState(
      fuse({
        route: chamberRoute("property"),
        arrival: NAV.descend,
        transitionPhase: "idle",
        signals: [],
        worldIds: [...PUB_WORLD_IDS],
      }),
    );
    expect(view.state).toBe("focused");
    expect(view.stateReason).toBe("deep-engagement");
    expect(view.focusTarget).toBe("property");
    expect(view.intensity).toBe(0.4);
  });
});

describe("core state machine — attention", () => {
  it("an unresolved attention signal anywhere is attention", () => {
    const view = deriveCoreState(
      calmWorld({
        signals: [
          makeSignal({
            id: "att1",
            sourceWorld: "rental",
            severity: "attention",
            kind: "attention-needed",
            timestamp: stamp(6),
          }),
        ],
      }),
    );
    expect(view.state).toBe("attention");
    expect(view.stateReason).toBe("attention-unresolved");
    expect(view.attentionLevel).toBe("low");
    expect(view.attentionOwner).toMatchObject({
      id: "att1",
      sourceWorld: "rental",
      severity: "attention",
    });
    expect(view.urgency).toBe("high");
    expect(view.pulse).toBe("steady");
    expect(view.activeThreats).toBe(1);
  });
});

describe("core state machine — critical", () => {
  it("an unresolved critical signal is critical", () => {
    const view = deriveCoreState(
      calmWorld({
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
    );
    expect(view.state).toBe("critical");
    expect(view.stateReason).toBe("critical-unresolved");
    expect(view.intensity).toBe(1);
    expect(view.urgency).toBe("critical");
    expect(view.pulse).toBe("urgent");
    expect(view.attentionLevel).toBe("severe");
    expect(view.attentionOwner?.id).toBe("crit1");
  });
});

describe("core state machine — guiding", () => {
  it("a recommendation for an unengaged visitor is guiding", () => {
    const view = deriveCoreState(calmWorld(), {
      guidance: guidanceTo("property"),
    });
    expect(view.state).toBe("guiding");
    expect(view.stateReason).toBe("guidance-available");
    expect(view.guidanceTarget).toEqual({
      systemId: "property",
      path: "/world/property",
    });
    expect(view.intensity).toBe(0.6);
  });

  it("guidance pointing at the current chamber is not guiding", () => {
    const view = deriveCoreState(
      fuse({
        route: chamberRoute("property"),
        transitionPhase: "idle",
        signals: [],
        worldIds: [...PUB_WORLD_IDS],
      }),
      { guidance: guidanceTo("property") },
    );
    expect(view.guidanceTarget).toBeNull();
    expect(["calm", "aware", "focused"]).toContain(view.state);
  });
});

describe("core state machine — transitioning", () => {
  it("an actively resolving spatial move is transitioning", () => {
    const view = deriveCoreState(
      fuse({
        route: chamberRoute("wellness"),
        arrival: NAV.enter,
        transitionPhase: "moving",
        signals: [],
        worldIds: [...PUB_WORLD_IDS],
      }),
    );
    expect(view.state).toBe("transitioning");
    expect(view.stateReason).toBe("spatial-transition");
    expect(view.focusTarget).toBeNull(); // not settled yet
    expect(view.pulse).toBe("steady");
  });
});

describe("core state machine — precedence collisions", () => {
  it("critical beats attention beats ordinary activity", () => {
    const signals = [
      makeSignal({
        id: "crit1",
        sourceWorld: "recycling",
        severity: "critical",
        timestamp: stamp(2),
      }),
      makeSignal({
        id: "att1",
        sourceWorld: "rental",
        severity: "attention",
        timestamp: stamp(1),
      }),
      makeSignal({ id: "amb1", sourceWorld: "wellness", severity: "information" }),
    ];
    const base = { route: worldFieldRoute(), signals, worldIds: [...PUB_WORLD_IDS] };
    expect(deriveCoreState(fuse(base)).state).toBe("critical");

    const noCritical = signals.filter((s) => s.severity !== "critical");
    expect(
      deriveCoreState(fuse({ ...base, signals: noCritical })).state,
    ).toBe("attention");

    const onlyAmbient = signals.filter((s) => s.severity === "information");
    expect(
      deriveCoreState(fuse({ ...base, signals: onlyAmbient })).state,
    ).toBe("aware");
  });

  it("threats beat transitioning and deep focus", () => {
    const threats = [
      makeSignal({
        id: "att1",
        sourceWorld: "rental",
        severity: "attention",
        timestamp: stamp(4),
      }),
    ];
    const moving = fuse({
      route: chamberRoute("wellness"),
      arrival: NAV.enter,
      transitionPhase: "moving",
      signals: threats,
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(deriveCoreState(moving).state).toBe("attention");

    const reading = fuse({
      route: chamberRoute("property"),
      transitionPhase: "idle",
      signals: threats,
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(deriveCoreState(reading).state).toBe("attention");
  });

  it("transitioning beats focused framing while the move resolves", () => {
    const moving = fuse({
      route: chamberRoute("wellness"),
      arrival: NAV.enter,
      transitionPhase: "resolving",
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    expect(deriveCoreState(moving).state).toBe("transitioning");
  });

  it("focused beats guiding: a settled visitor is not interrupted", () => {
    const reading = fuse({
      route: chamberRoute("property"),
      arrival: NAV.descend,
      transitionPhase: "idle",
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    const view = deriveCoreState(reading, {
      guidance: guidanceTo("wellness"),
    });
    expect(view.state).toBe("focused");
    // The guidance target is still surfaced as a fact, not a state override.
    expect(view.guidanceTarget?.systemId).toBe("wellness");
  });
});

describe("core state machine — stability (focused-hold)", () => {
  const engagedReadingWithAmbientElsewhere = () =>
    fuse({
      route: chamberRoute("property"),
      arrival: NAV.descend,
      transitionPhase: "idle",
      signals: [
        makeSignal({ id: "amb1", sourceWorld: "wellness", severity: "information" }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });

  it("an engaged visitor stays focused despite ambient activity elsewhere", () => {
    const fresh = deriveCoreState(engagedReadingWithAmbientElsewhere());
    expect(fresh.state).toBe("focused");
    expect(fresh.stateReason).toBe("deep-engagement");
    expect(fresh.held).toBe(false);

    const continued = deriveCoreState(engagedReadingWithAmbientElsewhere(), {
      previous: "focused",
      guidance: noGuidance,
    });
    expect(continued.state).toBe("focused");
    expect(continued.held).toBe(false); // never needed a hold: no flap exists
  });

  it("a returning visitor reload frame (calm raw) is held focused", () => {
    const reloadFrame = () =>
      fuse({
        route: chamberRoute("property"),
        transitionPhase: "idle",
        memory: returningMemory(),
        signals: [],
        worldIds: [...PUB_WORLD_IDS],
      });
    const fresh = deriveCoreState(reloadFrame());
    expect(fresh.state).toBe("calm"); // no arrival intent → not confirmed engaged

    const settled = deriveCoreState(reloadFrame(), {
      previous: "focused",
      guidance: noGuidance,
    });
    expect(settled.state).toBe("focused");
    expect(settled.stateReason).toBe("focused-hold");
    expect(settled.held).toBe(true);
  });

  it("focused-hold never applies to first-time visitors (no memory)", () => {
    const anonymousReload = fuse({
      route: chamberRoute("property"),
      transitionPhase: "idle",
      signals: [],
      worldIds: [...PUB_WORLD_IDS],
    });
    const view = deriveCoreState(anonymousReload, { previous: "focused" });
    expect(view.state).toBe("calm");
    expect(view.held).toBe(false);
  });

  it("focused-hold releases when the visitor leaves the chamber", () => {
    const afterLeaving = calmWorld();
    const view = deriveCoreState(afterLeaving, { previous: "focused" });
    expect(view.state).toBe("calm");
    expect(view.held).toBe(false);
  });

  it("focused-hold never masks a real threat", () => {
    const withThreat = fuse({
      route: chamberRoute("property"),
      arrival: NAV.descend,
      transitionPhase: "idle",
      signals: [
        makeSignal({
          id: "att1",
          sourceWorld: "rental",
          severity: "attention",
          timestamp: stamp(3),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    });
    const view = deriveCoreState(withThreat, { previous: "focused" });
    expect(view.state).toBe("attention");
    expect(view.held).toBe(false);
  });
});

describe("core state machine — repeated identical context", () => {
  it("identical inputs produce identical views every time", () => {
    const situation = {
      route: worldFieldRoute(),
      signals: [
        makeSignal({
          id: "att1",
          sourceWorld: "rental",
          severity: "attention",
          timestamp: stamp(5),
        }),
      ],
      worldIds: [...PUB_WORLD_IDS],
    };
    const options = { previous: "calm" as CoreState, guidance: noGuidance };
    const a = deriveCoreState(fuse(situation), options);
    for (let i = 0; i < 5; i += 1) {
      expect(deriveCoreState(fuse(situation), options)).toEqual(a);
    }
  });
});

describe("core state machine — safe fallback", () => {
  it("an empty snapshot yields dormant without throwing", () => {
    const snapshot = fuseLenaContext({ now: FIXED_NOW });
    const view = deriveCoreState(snapshot);
    expect(view.state).toBe("dormant");
    expect(view.stateReason).toBe("outside-lena");
    expect(view.intensity).toBe(0);
    expect(view.pulse).toBe("off");
    expect(view.attentionOwner).toBeNull();
    expect(view.activeThreats).toBe(0);
  });

  it("never throws on partially-populated snapshots", () => {
    const view = deriveCoreState(
      fuse({
        route: chamberRoute("property"),
        transitionPhase: "idle",
        signals: undefined,
        worldIds: undefined,
      }),
      { guidance: noGuidance },
    );
    expect(["focused", "calm", "dormant", "aware"]).toContain(view.state);
  });
});
