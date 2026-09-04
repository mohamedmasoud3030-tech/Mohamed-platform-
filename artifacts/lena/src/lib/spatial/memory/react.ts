/**
 * LENA Spatial Memory — React binding.
 *
 * A single subscription over the shared runtime. The getter returns a stable
 * reference until the memory actually changes, so components re-render only
 * when the world truly remembers something new.
 */

import { useSyncExternalStore } from "react";
import { worldMemory } from "./worldMemory";
import type { SpatialMemory } from "./types";

function subscribe(listener: () => void): () => void {
  return worldMemory.subscribe(listener);
}

/** The runtime returns a stable reference until the memory actually changes,
 *  which is exactly the contract `useSyncExternalStore` needs. */
function getSnapshot(): SpatialMemory | null {
  return worldMemory.read();
}

/** The current spatial memory, or null. Re-renders on change (including
 *  cross-tab updates and resets). */
export function useWorldMemory(): SpatialMemory | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Whether this visitor is first-time (no usable memory). */
export function useIsFirstVisit(): boolean {
  return useWorldMemory() === null;
}
