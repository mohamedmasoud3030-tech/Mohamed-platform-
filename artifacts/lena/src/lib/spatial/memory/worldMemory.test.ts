import { describe, expect, it } from "vitest";
import { resolveContinuation, resolveRememberedFocus } from "../continuation";
import {
  createMemoryStorage,
  parseStoredMemory,
  serializeMemory,
  SPATIAL_MEMORY_KEY,
  type SpatialMemoryStorage,
} from "./storage";
import { emptySpatialMemory, SPATIAL_MEMORY_VERSION } from "./types";
import { createWorldMemory } from "./worldMemory";

const registry = {
  isKnownSystem(id: string) {
    return ["property", "wellness", "rental"].includes(id);
  },
  chamberPathFor(id: string) {
    return registry.isKnownSystem(id) ? `/world/${id}` : null;
  },
  nameFor(id: string, _locale: "ar" | "en") {
    return id;
  },
};

function freshStorage(): { storage: SpatialMemoryStorage; map: Map<string, string> } {
  const map = new Map<string, string>();
  const storage: SpatialMemoryStorage = {
    read: () => (map.has(SPATIAL_MEMORY_KEY) ? map.get(SPATIAL_MEMORY_KEY)! : null),
    write: (raw) => void map.set(SPATIAL_MEMORY_KEY, raw),
    clear: () => void map.delete(SPATIAL_MEMORY_KEY),
  };
  return { storage, map };
}

describe("world memory — persistence", () => {
  it("saves a valid destination and restores it from storage", () => {
    const { storage } = freshStorage();
    const memory = createWorldMemory(storage);

    memory.remember({
      space: "chamber",
      systemId: "property",
      chamberPath: "/world/property",
      navigation: { to: "/world/property", intent: "descend", at: 1000 },
      at: 1000,
    });

    const raw = storage.read();
    expect(raw).toBeTypeOf("string");
    const wire = JSON.parse(raw as string) as { v: number; data: unknown };
    expect(wire.v).toBe(SPATIAL_MEMORY_VERSION);

    // A brand-new runtime on the same storage sees the same record.
    const again = createWorldMemory(storage);
    const restored = again.read();
    expect(restored).not.toBeNull();
    expect(restored?.lastSpace).toBe("chamber");
    expect(restored?.lastSystemId).toBe("property");
    expect(restored?.lastChamberPath).toBe("/world/property");
    expect(restored?.lastNavigation).toEqual({
      to: "/world/property",
      intent: "descend",
      at: 1000,
    });
    expect(restored?.lastInteractionAt).toBe(1000);
  });

  it("serialization is deterministic", () => {
    const a = emptySpatialMemory(42);
    const b: typeof a = { ...a, lastSystemId: "rental" };
    expect(serializeMemory(b)).toBe(
      JSON.stringify({ v: SPATIAL_MEMORY_VERSION, data: b }),
    );
    expect(parseStoredMemory(serializeMemory(b))).toEqual(b);
  });
});

describe("world memory — resilience", () => {
  it("falls back to first-visit state on corrupted storage (never throws)", () => {
    const { storage } = freshStorage();
    const garbage = ["{nope", "null", "42", "[1,2]", '"hello"'];
    for (const raw of garbage) {
      storage.write(raw);
      const memory = createWorldMemory(storage);
      expect(memory.read()).toBeNull();
      expect(memory.isFirstVisit()).toBe(true);
    }
  });

  it("falls back when the schema version is stale", () => {
    const { storage } = freshStorage();
    storage.write(JSON.stringify({ v: 999, data: { ...emptySpatialMemory(1) } }));
    const memory = createWorldMemory(storage);
    expect(memory.read()).toBeNull();
    expect(memory.isFirstVisit()).toBe(true);
  });

  it("falls back when fields are structurally invalid", () => {
    const valid = emptySpatialMemory(10);
    const broken = (patch: Record<string, unknown>) =>
      JSON.stringify({ v: SPATIAL_MEMORY_VERSION, data: { ...valid, ...patch } });
    expect(parseStoredMemory(broken({ lastSpace: "moonbase" }))).toBeNull();
    expect(parseStoredMemory(broken({ lastSystemId: 7 }))).toBeNull();
    expect(parseStoredMemory(broken({ lastChamberPath: "world/property" }))).toBeNull();
    expect(parseStoredMemory(broken({ lastInteractionAt: "yesterday" }))).toBeNull();
    expect(parseStoredMemory(broken({ introSeen: "yes" }))).toBeNull();
    expect(parseStoredMemory(broken({ entryContext: "somewhere-else" }))).toBeNull();
  });

  it("degrades a bad navigation record to null instead of dropping the journey", () => {
    const valid = emptySpatialMemory(10);
    const broken = JSON.stringify({
      v: SPATIAL_MEMORY_VERSION,
      data: { ...valid, lastNavigation: { to: "/x", intent: "teleport", at: 1 } },
    });
    const parsed = parseStoredMemory(broken);
    expect(parsed).not.toBeNull();
    expect(parsed?.lastNavigation).toBeNull();
    // The rest of the journey is preserved.
    expect(parsed?.lastSpace).toBe("home");
  });

  it("resolves a stale destination one level outward, never into a dead room", () => {
    const memory = createWorldMemory(freshStorage().storage);
    memory.remember({
      space: "chamber",
      systemId: "materials", // exists in memory but no longer in the world
      chamberPath: "/world/materials",
      at: 500,
    });

    const continuation = resolveContinuation(memory.read(), registry);
    expect(continuation).not.toBeNull();
    expect(continuation?.kind).toBe("world"); // fell back, not chamber
    expect(continuation?.path).toBe("/world");
    expect(continuation?.reachedChamber).toBe(false);

    expect(resolveRememberedFocus(memory.read(), registry)).toBeNull();
  });

  it("resolves a valid remembered chamber into a continuation", () => {
    const memory = createWorldMemory(freshStorage().storage);
    memory.remember({
      space: "chamber",
      systemId: "wellness",
      chamberPath: "/world/wellness",
      at: 700,
    });

    const continuation = resolveContinuation(memory.read(), registry);
    expect(continuation).toEqual({
      kind: "chamber",
      systemId: "wellness",
      path: "/world/wellness",
      reachedChamber: true,
      at: 700,
    });
    expect(resolveRememberedFocus(memory.read(), registry)).toBe("wellness");
  });

  it("returns no continuation for a memory that never left the threshold", () => {
    const memory = createWorldMemory(freshStorage().storage);
    memory.remember({ space: "home", at: 1 });
    expect(resolveContinuation(memory.read(), registry)).toBeNull();
  });
});

describe("world memory — reset and visit state", () => {
  it("reset erases the record and returns the world to first-visit state", () => {
    const { storage, map } = freshStorage();
    const memory = createWorldMemory(storage);
    memory.remember({ space: "chamber", systemId: "property", chamberPath: "/world/property", at: 5 });
    expect(memory.isFirstVisit()).toBe(false);
    expect(map.size).toBe(1);

    memory.reset();
    expect(memory.read()).toBeNull();
    expect(memory.isFirstVisit()).toBe(true);
    expect(map.size).toBe(0);

    // A second runtime on the same storage agrees.
    expect(createWorldMemory(storage).read()).toBeNull();
  });

  it("distinguishes first visit from returning visit, and the intro flag", () => {
    const { storage } = freshStorage();
    const memory = createWorldMemory(storage);

    // First visit: no memory, no intro.
    expect(memory.isFirstVisit()).toBe(true);
    expect(memory.hasIntroBeenSeen()).toBe(false);

    // Move into a chamber: the introduction is experienced.
    memory.remember({ space: "chamber", systemId: "property", chamberPath: "/world/property", at: 10 });
    memory.markIntroSeen();

    // Returning visit: remembered, intro already seen.
    const returning = createWorldMemory(storage);
    expect(returning.isFirstVisit()).toBe(false);
    expect(returning.hasIntroBeenSeen()).toBe(true);
    expect(returning.read()?.introSeen).toBe(true);
    expect(returning.read()?.lastSpace).toBe("chamber");
  });

  it("writes are best-effort: a failing storage never throws", () => {
    let calls = 0;
    const failing: SpatialMemoryStorage = {
      read: () => {
        calls += 1;
        throw new Error("denied");
      },
      write: () => {
        throw new Error("quota");
      },
      clear: () => {
        throw new Error("denied");
      },
    };
    const memory = createWorldMemory(failing);
    expect(memory.read()).toBeNull();
    expect(() => memory.remember({ space: "world", systemId: "rental", at: 1 })).not.toThrow();
  });
});
