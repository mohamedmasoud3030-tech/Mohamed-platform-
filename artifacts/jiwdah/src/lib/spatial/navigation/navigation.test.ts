import { describe, expect, it } from "vitest";
import {
  buildSpatialState,
  detectDirection,
  parentPathOf,
  parseSpatialRoute,
  readSpatialState,
} from "./context";
import { planBack, planGo } from "./plan";

describe("spatial navigation — route parsing", () => {
  it("resolves the three LENA spaces and nothing else", () => {
    expect(parseSpatialRoute("/")).toEqual({ space: "home", path: "/" });
    expect(parseSpatialRoute("/world")).toEqual({ space: "world", path: "/world" });
    expect(parseSpatialRoute("/world/property")).toEqual({
      space: "chamber",
      systemId: "property",
      path: "/world/property",
    });
    // Non-LENA routes are not spatial: the layer simply does not apply.
    expect(parseSpatialRoute("/services")).toBeNull();
    expect(parseSpatialRoute("/world/property/extra")).toBeNull();
  });

  it("derives the canonical parent of each space", () => {
    expect(parentPathOf(parseSpatialRoute("/world/rental"))).toBe("/world");
    expect(parentPathOf(parseSpatialRoute("/world"))).toBe("/");
    expect(parentPathOf(parseSpatialRoute("/"))).toBeNull();
    expect(parentPathOf(null)).toBeNull();
  });
});

describe("spatial navigation — typed state", () => {
  it("reads a valid spatial state from location.state", () => {
    const state = buildSpatialState({ origin: "/world", intent: "descend", systemId: "property" });
    const read = readSpatialState(state);
    expect(read).toEqual({
      spatial: { origin: "/world", intent: "descend", systemId: "property", mode: "forward" },
    });
  });

  it("tolerates the legacy portal state from older history entries", () => {
    const read = readSpatialState({ fromWorldPortal: true, systemId: "rental" });
    expect(read).toEqual({
      spatial: { origin: "/world", intent: "descend", systemId: "rental", mode: "forward" },
    });
  });

  it("returns null for unknown state — direct URL entries stay safe", () => {
    expect(readSpatialState(null)).toBeNull();
    expect(readSpatialState(undefined)).toBeNull();
    expect(readSpatialState("portal")).toBeNull();
    expect(readSpatialState({ fromWorldPortal: false })).toBeNull();
    expect(readSpatialState({ spatial: { origin: "world", intent: "descend", mode: "forward" } })).toBeNull();
    expect(readSpatialState({ spatial: { origin: "/world", intent: "warp", mode: "forward" } })).toBeNull();
  });
});

describe("spatial navigation — forward intent", () => {
  it("plans a forward move with origin, intent, system and memory", () => {
    const plan = planGo({
      currentPath: "/world",
      currentHash: "",
      to: "/world/property",
      intent: "descend",
    });
    expect(plan).toMatchObject({
      kind: "go",
      to: "/world/property",
      path: "/world/property",
      scene: "chamber",
      memory: { space: "chamber", systemId: "property", chamberPath: "/world/property" },
    });
    if (plan.kind === "go") {
      expect(plan.state).toEqual({
        spatial: { origin: "/world", intent: "descend", systemId: "property", mode: "forward" },
      });
    }
  });

  it("keeps hashes as scroll targets, not route changes", () => {
    const plan = planGo({
      currentPath: "/world/property",
      currentHash: "",
      to: "/services#property",
      intent: "emerge",
    });
    expect(plan).toMatchObject({
      kind: "go",
      to: "/services#property",
      path: "/services",
      scene: "home",
      memory: null,
    });
  });

  it("refuses duplicate route pushes: same path and hash is a no-op", () => {
    expect(planGo({ currentPath: "/world", currentHash: "", to: "/world", intent: "enter" })).toEqual({
      kind: "noop",
      reason: "same-location",
    });
    expect(
      planGo({ currentPath: "/services", currentHash: "#property", to: "/services#property", intent: "emerge" }),
    ).toEqual({ kind: "noop", reason: "same-location" });
  });

  it("records the world focus even when the destination is the field itself", () => {
    const plan = planGo({
      currentPath: "/",
      currentHash: "",
      to: "/world",
      intent: "enter",
      systemId: "rental",
    });
    if (plan.kind === "go") {
      expect(plan.memory).toEqual({ space: "world", systemId: "rental", chamberPath: null });
      expect(plan.state.spatial.systemId).toBe("rental");
    }
  });
});

describe("spatial navigation — return intent", () => {
  it("follows browser history when the entry is a known spatial move", () => {
    const state = buildSpatialState({ origin: "/world", intent: "descend", systemId: "property" });
    expect(
      planBack({
        currentPath: "/world/property",
        navState: readSpatialState(state),
        historyIndex: 3,
      }),
    ).toEqual({ kind: "history" });
  });

  it("steps to the canonical parent when the entry is deep-linked", () => {
    const plan = planBack({
      currentPath: "/world/property",
      navState: null, // direct URL entry: nothing known behind us
      historyIndex: 0,
    });
    expect(plan).toEqual({
      kind: "fallback",
      to: "/world",
      state: {
        spatial: { origin: "/world/property", intent: "emerge", systemId: "property", mode: "forward" },
      },
    });
  });

  it("does not follow history at index zero even with state (a reload)", () => {
    const state = buildSpatialState({ origin: "/world", intent: "descend", systemId: "rental" });
    const plan = planBack({
      currentPath: "/world/rental",
      navState: readSpatialState(state),
      historyIndex: 0,
    });
    expect(plan.kind).toBe("fallback");
  });

  it("honours an explicit outward intent on the fallback", () => {
    const plan = planBack({
      currentPath: "/world",
      navState: null,
      historyIndex: 0,
      intent: "emerge",
    });
    if (plan.kind === "fallback") {
      expect(plan.to).toBe("/");
      expect(plan.state.spatial.intent).toBe("emerge");
    }
  });

  it("has no parent to fall back to at the threshold", () => {
    expect(
      planBack({ currentPath: "/", navState: null, historyIndex: 0 }),
    ).toEqual({ kind: "none" });
  });
});

describe("spatial navigation — direction detection", () => {
  it("classifies the movement between history entries", () => {
    expect(detectDirection(null, 0)).toBe("initial"); // direct entry
    expect(detectDirection(0, 1)).toBe("forward");
    expect(detectDirection(1, 0)).toBe("back");
    expect(detectDirection(2, 2)).toBe("initial"); // same entry (state replace)
    expect(detectDirection(null, 5)).toBe("initial");
  });
});
