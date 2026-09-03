/**
 * LENA Spatial Memory — the canonical runtime.
 *
 * One small store, one writer, many readers:
 *
 *   - `worldMemory.read()`     — the current record, or null (first visit /
 *                                 corrupted / cleared). Never throws.
 *   - `worldMemory.remember()` — merge the latest interaction state.
 *   - `worldMemory.reset()`    — the seam for tests, demos and user control.
 *
 * The store is synchronous and non-blocking: reads are cached after the
 * first parse; writes are a single localStorage set. It never decides
 * routing — it only supplies context the UI may offer.
 */

import type { SpatialIntent } from "../types";
import {
  SPATIAL_MEMORY_KEY,
  createLocalStorageStorage,
  parseStoredMemory,
  serializeMemory,
  type SpatialMemoryStorage,
} from "./storage";
import {
  emptySpatialMemory,
  type SpatialMemory,
  type SpatialMemoryInput,
} from "./types";

type Listener = () => void;

export interface WorldMemoryRuntime {
  /** The current record, or null when there is none. */
  read(): SpatialMemory | null;
  /** True when the visitor has no usable memory (first visit, reset, corrupt). */
  isFirstVisit(): boolean;
  /** True when the spatial introduction has already been experienced. */
  hasIntroBeenSeen(): boolean;
  /**
   * Merge the latest interaction state into memory and persist it.
   * Deterministic: same input, same result. Never throws.
   */
  remember(input: SpatialMemoryInput): SpatialMemory;
  /** Record a meaningful navigation (used by the navigation layer). */
  recordNavigation(to: string, intent: SpatialIntent, at?: number): SpatialMemory;
  /** Mark the first-time spatial introduction as experienced. */
  markIntroSeen(): SpatialMemory;
  /** Erase everything. The world continues; the memory does not. */
  reset(): void;
  /** Subscribe to changes (storage events across tabs + local writes). */
  subscribe(listener: Listener): () => void;
}

export function createWorldMemory(
  storage: SpatialMemoryStorage = createLocalStorageStorage(),
): WorldMemoryRuntime {
  let cache: SpatialMemory | null = null;
  let loaded = false;
  const listeners = new Set<Listener>();

  const emit = () => {
    for (const listener of [...listeners]) listener();
  };

  const load = (): SpatialMemory | null => {
    if (!loaded) {
      loaded = true;
      try {
        const parsed = parseStoredMemory(storage.read());
        if (parsed) cache = parsed;
      } catch {
        cache = null; // a hostile storage degrades to first-visit, never to an error
      }
    }
    return cache;
  };

  const write = (next: SpatialMemory) => {
    cache = next;
    try {
      storage.write(serializeMemory(next));
    } catch {
      /* keep the in-memory copy; persistence is best-effort by contract */
    }
  };

  const runtime: WorldMemoryRuntime = {
    read: load,

    isFirstVisit: () => load() === null,

    hasIntroBeenSeen: () => load()?.introSeen ?? false,

    remember(input) {
      const at = typeof input.at === "number" ? input.at : Date.now();
      const current = load() ?? emptySpatialMemory(at);
      const next: SpatialMemory = {
        ...current,
        lastSpace: input.space ?? current.lastSpace,
        lastSystemId:
          input.systemId !== undefined ? input.systemId : current.lastSystemId,
        lastChamberPath:
          input.chamberPath !== undefined
            ? input.chamberPath
            : current.lastChamberPath,
        lastInner: input.inner !== undefined ? input.inner : current.lastInner,
        lastNavigation:
          input.navigation !== undefined
            ? input.navigation
            : current.lastNavigation,
        lastInteractionAt: at,
        entryContext:
          input.entryContext !== undefined
            ? input.entryContext
            : current.entryContext,
        introSeen: input.introSeen ?? current.introSeen,
      };
      write(next);
      emit();
      return next;
    },

    recordNavigation(to, intent, at) {
      return runtime.remember({
        navigation: { to, intent, at: at ?? Date.now() },
        at,
      });
    },

    markIntroSeen() {
      return runtime.remember({ introSeen: true });
    },

    reset() {
      cache = null;
      loaded = true; // already parsed once; a reset is terminal until the next remember
      try {
        storage.clear();
      } catch {
        /* nothing to clear that we cannot ignore */
      }
      emit();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  // Cross-tab continuity: another tab writing or clearing the record
  // refreshes this tab's cache. Storage events only fire in *other* tabs,
  // which is exactly the case that needs refreshing.
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("storage", (event: StorageEvent) => {
      if (event.key !== SPATIAL_MEMORY_KEY) return;
      cache = parseStoredMemory(event.newValue);
      emit();
    });
  }

  return runtime;
}

/** The app-wide spatial memory. One instance, one writer, many readers.
 *  Tests use `createWorldMemory(createMemoryStorage())` instead. */
export const worldMemory = createWorldMemory();
