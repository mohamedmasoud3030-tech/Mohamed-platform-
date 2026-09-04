/**
 * LENA Spatial Memory — storage contract.
 *
 * The lightest reliable persistence for this application is the browser's
 * local storage, behind a typed contract so:
 *   - parsing is safe and versioned (corrupt/stale → null, never a throw)
 *   - writes are best-effort (private mode / quota → silently skipped)
 *   - the memory runtime can be tested with an in-memory store
 *
 * This is spatial continuity, not business data: nothing here is ever sent
 * anywhere, and nothing here can make routing wrong — the URL remains the
 * single source of truth for where the visitor is.
 */

import type { SpatialIntent } from "../types";
import {
  SPATIAL_MEMORY_VERSION,
  emptySpatialMemory,
  type SpatialMemory,
} from "./types";

/** Key under the existing LENA namespace. */
export const SPATIAL_MEMORY_KEY = "lena-digital-house.spatial-memory";

/** Versioned wire shape: `{ v, data }` so a future bump can invalidate
 *  cleanly without touching the data fields. */
interface StoredSpatialMemory {
  v: number;
  data: SpatialMemory;
}

/** The storage contract the memory runtime depends on. */
export interface SpatialMemoryStorage {
  read(): string | null;
  write(raw: string): void;
  clear(): void;
}

/** In-memory storage for tests and for any non-browser host. */
export function createMemoryStorage(initial?: Record<string, string>): SpatialMemoryStorage {
  const map = new Map(Object.entries(initial ?? {}));
  return {
    read: () => (map.has(SPATIAL_MEMORY_KEY) ? (map.get(SPATIAL_MEMORY_KEY) as string) : null),
    write: (raw) => {
      map.set(SPATIAL_MEMORY_KEY, raw);
    },
    clear: () => {
      map.delete(SPATIAL_MEMORY_KEY);
    },
  };
}

/** The default: localStorage, wrapped so private mode / quota / SSR never
 *  surface as an error to the page. */
export function createLocalStorageStorage(key: string = SPATIAL_MEMORY_KEY): SpatialMemoryStorage {
  const safe = {
    getItem: (): string | null => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (value: string): void => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable or full: continuity degrades, the world does not */
      }
    },
    removeItem: (): void => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* same as above */
      }
    },
  };
  return {
    read: () => safe.getItem(),
    write: (raw) => safe.setItem(raw),
    clear: () => safe.removeItem(),
  };
}

const SPACES: readonly string[] = ["home", "world", "chamber"];
const INNER: readonly (string | null)[] = ["constellation", null];
const ENTRY: readonly (string | null)[] = ["gateway", "deep-link", "return", "direct", null];
const INTENTS: readonly string[] = ["approach", "enter", "descend", "focus", "return", "emerge"];

/**
 * Parse and validate a stored record. Returns null — never throws — when the
 * payload is missing, corrupt, the wrong version, or structurally invalid.
 */
export function parseStoredMemory(raw: string | null | undefined): SpatialMemory | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const wire = parsed as Partial<StoredSpatialMemory>;
  if (wire.v !== SPATIAL_MEMORY_VERSION) return null; // stale schema: start fresh
  if (typeof wire.data !== "object" || wire.data === null) return null;

  const d = wire.data as unknown as Record<string, unknown>;
  if (d.v !== SPATIAL_MEMORY_VERSION) return null;
  if (!SPACES.includes(d.lastSpace as string)) return null;
  if (d.lastSystemId !== null && typeof d.lastSystemId !== "string") return null;
  if (
    d.lastChamberPath !== null &&
    (typeof d.lastChamberPath !== "string" || !(d.lastChamberPath as string).startsWith("/"))
  )
    return null;
  if (!INNER.includes(d.lastInner as string | null)) return null;
  if (typeof d.lastInteractionAt !== "number" || !Number.isFinite(d.lastInteractionAt)) return null;
  if (!ENTRY.includes(d.entryContext as string | null)) return null;
  if (typeof d.introSeen !== "boolean") return null;

  let lastNavigation: SpatialMemory["lastNavigation"] = null;
  if (d.lastNavigation !== null && d.lastNavigation !== undefined) {
    const n = d.lastNavigation as Record<string, unknown>;
    if (
      typeof n.to === "string" &&
      n.to.startsWith("/") &&
      INTENTS.includes(n.intent as string) &&
      typeof n.at === "number" &&
      Number.isFinite(n.at)
    ) {
      lastNavigation = { to: n.to, intent: n.intent as SpatialIntent, at: n.at };
    }
  }

  return {
    v: SPATIAL_MEMORY_VERSION,
    lastSpace: d.lastSpace as SpatialMemory["lastSpace"],
    lastSystemId: d.lastSystemId as string | null,
    lastChamberPath: d.lastChamberPath as string | null,
    lastInner: d.lastInner as SpatialMemory["lastInner"],
    lastNavigation,
    lastInteractionAt: d.lastInteractionAt as number,
    entryContext: d.entryContext as SpatialMemory["entryContext"],
    introSeen: d.introSeen as boolean,
  };
}

/** Serialize a memory into the versioned wire shape. Deterministic. */
export function serializeMemory(memory: SpatialMemory): string {
  const wire: StoredSpatialMemory = { v: SPATIAL_MEMORY_VERSION, data: memory };
  return JSON.stringify(wire);
}

export { emptySpatialMemory };
