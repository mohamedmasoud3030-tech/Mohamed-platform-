import type { WorldSignal, SignalSourceState } from "./types.ts";
import { UNAVAILABLE_SIGNAL_SOURCE } from "./types.ts";
import { acknowledgeSignal, resolveSignal } from "./derive.ts";

export type SignalStore = {
  getSnapshot: () => WorldSignal[];
  getSource: () => SignalSourceState;
  subscribe: (listener: () => void) => () => void;
  emit: (signal: WorldSignal) => void;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
  reset: (signals?: WorldSignal[]) => void;
};

/**
 * Client-only signal store.
 *
 * The default is intentionally an empty, unavailable source. Demo signals are
 * never imported here, so a fresh production runtime cannot present simulated
 * activity or attention. Tests and an explicitly named harness can pass both a
 * seed and an available source contract.
 */
export function createSignalStore(
  seed: WorldSignal[] = [],
  source: SignalSourceState = UNAVAILABLE_SIGNAL_SOURCE,
): SignalStore {
  const initialSeed = seed.map((s) => ({ ...s }));
  let signals = initialSeed.map((s) => ({ ...s }));
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => signals,
    getSource: () => source,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (signal) => {
      if (!source.writable) return;
      const rest = signals.filter((s) => s.id !== signal.id);
      signals = [signal, ...rest];
      notify();
    },
    acknowledge: (id) => {
      if (!source.writable) return;
      let changed = false;
      signals = signals.map((s) => {
        if (s.id !== id) return s;
        changed = true;
        return acknowledgeSignal(s);
      });
      if (changed) notify();
    },
    resolve: (id) => {
      if (!source.writable) return;
      let changed = false;
      signals = signals.map((s) => {
        if (s.id !== id) return s;
        changed = true;
        return resolveSignal(s);
      });
      if (changed) notify();
    },
    reset: (next = initialSeed) => {
      if (!source.writable) return;
      signals = next.map((s) => ({ ...s }));
      notify();
    },
  };
}

/** Production composition: no seed and no authorized source. */
export const worldSignalStore = createSignalStore();
