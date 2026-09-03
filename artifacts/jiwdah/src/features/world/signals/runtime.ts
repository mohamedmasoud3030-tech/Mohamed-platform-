import type { WorldSignal } from "./types.ts";
import { acknowledgeSignal, resolveSignal } from "./derive.ts";
import { DEMO_SIGNALS } from "./fixtures.ts";

export type SignalStore = {
  getSnapshot: () => WorldSignal[];
  subscribe: (listener: () => void) => () => void;
  emit: (signal: WorldSignal) => void;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
  reset: (signals?: WorldSignal[]) => void;
};

export function createSignalStore(seed: WorldSignal[] = DEMO_SIGNALS): SignalStore {
  let signals = seed.map((s) => ({ ...s }));
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => signals,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (signal) => {
      const rest = signals.filter((s) => s.id !== signal.id);
      signals = [signal, ...rest];
      notify();
    },
    acknowledge: (id) => {
      let changed = false;
      signals = signals.map((s) => {
        if (s.id !== id) return s;
        changed = true;
        return acknowledgeSignal(s);
      });
      if (changed) notify();
    },
    resolve: (id) => {
      let changed = false;
      signals = signals.map((s) => {
        if (s.id !== id) return s;
        changed = true;
        return resolveSignal(s);
      });
      if (changed) notify();
    },
    reset: (next = DEMO_SIGNALS) => {
      signals = next.map((s) => ({ ...s }));
      notify();
    },
  };
}

export const worldSignalStore = createSignalStore();
