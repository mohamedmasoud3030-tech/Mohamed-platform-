/**
 * LENA Intelligence — deterministic shared test fixtures.
 *
 * One set of builders shared by the context, core-state and guidance test
 * suites so every suite reasons about the same canonical worlds and clock.
 * This module is deliberately NOT a vitest file: it is plain TypeScript used
 * by tests (and excluded from app typecheck like all test files).
 *
 * All fixtures reference the canonical public worlds of the LENA registry
 * (property, wellness, rental, investment, hospitality, recycling) and a
 * fixed clock so derivations are reproducible.
 */

import type {
  SignalSourceState,
  WorldSignal,
} from "@/features/world/signals/types";
import type { SpatialMemory } from "@/lib/spatial/memory/types";
import type { WorldRegistry } from "@/lib/spatial/continuation";
import type { SpatialIntent } from "@/lib/spatial/types";
import { InMemoryGraphContextAdapter } from "../graph/GraphContextAdapter";

/** Canonical public world ids, in canonical presentation order. */
export const PUB_WORLD_IDS = [
  "wellness",
  "rental",
  "property",
  "hospitality",
  "investment",
  "recycling",
] as const;

/** Fixed clock shared by all fixtures (2026-09-03T09:00:00.000Z). */
export const FIXED_NOW = Date.parse("2026-09-03T09:00:00.000Z");

/** Explicitly authorized fixture source; never used by production composition. */
export const AVAILABLE_SIGNAL_SOURCE: SignalSourceState = {
  availability: "available",
  observedAt: "2026-09-03T09:00:00.000Z",
  writable: true,
};

/** Deterministic ISO timestamp offset from FIXED_NOW, in minutes. */
export function stamp(minutesBeforeNow: number): string {
  return new Date(FIXED_NOW - minutesBeforeNow * 60_000).toISOString();
}

/** Test double of the canonical world registry (validate + resolve only). */
export function makeRegistry(
  worldIds: readonly string[] = PUB_WORLD_IDS,
): WorldRegistry {
  const known = new Set(worldIds);
  return {
    isKnownSystem(systemId: string): boolean {
      return known.has(systemId);
    },
    chamberPathFor(systemId: string): string | null {
      return known.has(systemId) ? `/world/${systemId}` : null;
    },
    nameFor(systemId: string, _locale: "ar" | "en"): string | null {
      return known.has(systemId) ? systemId : null;
    },
  };
}

type SignalOverrides = Partial<WorldSignal> & {
  id: string;
  sourceWorld: string;
};

const localeText = (text: string): WorldSignal["title"] =>
  ({ en: text, ar: text }) as WorldSignal["title"];

/** Deterministic signal builder. Defaults: kind activity, ambient, active. */
export function makeSignal(overrides: SignalOverrides): WorldSignal {
  const { id, sourceWorld } = overrides;
  const defaults = {
    kind: "activity" as const,
    severity: "ambient" as const,
    timestamp: stamp(30),
    title: localeText(`Signal ${id}`),
    description: localeText(`Description of ${id}`),
    lifecycle: "active" as const,
    targetPath: `/world/${sourceWorld}`,
  };
  const merged: WorldSignal = {
    ...defaults,
    ...overrides,
    id,
    sourceWorld,
    title: overrides.title ?? defaults.title,
    description: overrides.description ?? defaults.description,
  };
  // Prevent accidental fixture drift: severity/kind/lifecycle stay in-domain.
  if (!["ambient", "information", "attention", "critical"].includes(merged.severity)) {
    throw new Error(`makeSignal: bad severity ${merged.severity}`);
  }
  return merged;
}

/** Deterministic spatial memory record. */
export function makeMemory(
  overrides: Partial<SpatialMemory> = {},
): SpatialMemory {
  return {
    v: 1,
    lastSpace: "home",
    lastSystemId: null,
    lastChamberPath: null,
    lastInner: null,
    lastNavigation: null,
    lastInteractionAt: FIXED_NOW - 3_600_000,
    entryContext: null,
    introSeen: false,
    ...overrides,
  };
}

/** A returning visitor who last reached the property chamber. */
export function returningMemory(
  overrides: Partial<SpatialMemory> = {},
): SpatialMemory {
  return makeMemory({
    lastSpace: "chamber",
    lastSystemId: "property",
    lastChamberPath: "/world/property",
    lastInner: "constellation",
    lastNavigation: {
      to: "/world/property",
      intent: "descend",
      at: FIXED_NOW - 3_600_000,
    },
    entryContext: "return",
    introSeen: true,
    ...overrides,
  });
}

/** Deterministic constellation-style graph over the canonical worlds. */
export function makeGraph(): InMemoryGraphContextAdapter {
  const graph = new InMemoryGraphContextAdapter();
  graph.addBidirectionalEdge("/", "/world");
  for (const id of PUB_WORLD_IDS) {
    graph.addBidirectionalEdge("/world", id);
  }
  // A structural shortcut used by distance tie-break tests.
  graph.addBidirectionalEdge("rental", "recycling");
  return graph;
}

/** Typed helpers for route fixtures. */
export function chamberRoute(systemId: string) {
  return { space: "chamber" as const, systemId, path: `/world/${systemId}` };
}
export function worldFieldRoute() {
  return { space: "world" as const, path: "/world" };
}
export function homeRoute() {
  return { space: "home" as const, path: "/" };
}

export const NAV = {
  descend: {
    spatial: { origin: "/world", intent: "descend" as SpatialIntent, mode: "forward" as const, systemId: "property" },
  },
  enter: {
    spatial: { origin: "/", intent: "enter" as SpatialIntent, mode: "forward" as const, systemId: "wellness" },
  },
};

