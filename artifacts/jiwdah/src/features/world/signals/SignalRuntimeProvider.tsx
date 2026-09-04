import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { WORLD_ENTITIES } from "../content/world";
import {
  activeWorldCount,
  attentionPressure,
  attentionSignals,
  globalStateFromSignals,
  presenceByWorld,
  recentSignals,
  resolvedSignals,
} from "./derive.ts";
import { worldSignalStore } from "./runtime.ts";
import type {
  GlobalWorldState,
  SignalSourceState,
  WorldPresence,
  WorldSignal,
} from "./types.ts";

export type SignalRuntimeView = {
  /** Signals are withheld when the source is unavailable. */
  signals: WorldSignal[];
  /** Source authority must be checked before reading derived values. */
  source: SignalSourceState;
  globalState: GlobalWorldState | null;
  presence: Record<string, WorldPresence>;
  recent: WorldSignal[];
  attention: WorldSignal[];
  resolved: WorldSignal[];
  activeWorlds: number | null;
  pressure: number | null;
  /** UI may offer mutations only when the authorized source is writable. */
  canMutate: boolean;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
};

const SignalRuntimeContext = createContext<SignalRuntimeView | null>(null);

function unavailablePresence(worldIds: readonly string[]): Record<string, WorldPresence> {
  return Object.fromEntries(worldIds.map((id) => [id, "unavailable"]));
}

export function SignalRuntimeProvider({ children }: { children: ReactNode }) {
  const signals = useSyncExternalStore(
    worldSignalStore.subscribe,
    worldSignalStore.getSnapshot,
    worldSignalStore.getSnapshot,
  );

  const value = useMemo<SignalRuntimeView>(() => {
    const worldIds = WORLD_ENTITIES.map((e) => e.systemId);
    const source = worldSignalStore.getSource();
    const available = source.availability === "available";
    const observedSignals = available ? signals : [];
    const presence = available
      ? presenceByWorld(observedSignals, worldIds)
      : unavailablePresence(worldIds);

    const canMutate = available && source.writable;
    return {
      signals: observedSignals,
      source,
      globalState: available ? globalStateFromSignals(observedSignals) : null,
      presence,
      recent: available ? recentSignals(observedSignals) : [],
      attention: available ? attentionSignals(observedSignals) : [],
      resolved: available ? resolvedSignals(observedSignals) : [],
      activeWorlds: available ? activeWorldCount(presence) : null,
      pressure: available ? attentionPressure(observedSignals) : null,
      canMutate,
      // Do not hand mutation authority to presentation consumers until the
      // source proves both availability and writability. The store also gates
      // these methods defensively for non-React callers.
      acknowledge: canMutate ? worldSignalStore.acknowledge : () => {},
      resolve: canMutate ? worldSignalStore.resolve : () => {},
    };
  }, [signals]);

  return <SignalRuntimeContext.Provider value={value}>{children}</SignalRuntimeContext.Provider>;
}

export function useSignalRuntime(): SignalRuntimeView {
  const ctx = useContext(SignalRuntimeContext);
  if (!ctx) {
    throw new Error("useSignalRuntime must be used within SignalRuntimeProvider");
  }
  return ctx;
}
