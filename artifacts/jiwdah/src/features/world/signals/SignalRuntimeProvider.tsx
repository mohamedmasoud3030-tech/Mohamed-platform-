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
import type { GlobalWorldState, WorldPresence, WorldSignal } from "./types.ts";

export type SignalRuntimeView = {
  signals: WorldSignal[];
  globalState: GlobalWorldState;
  presence: Record<string, WorldPresence>;
  recent: WorldSignal[];
  attention: WorldSignal[];
  resolved: WorldSignal[];
  activeWorlds: number;
  pressure: number;
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
};

const SignalRuntimeContext = createContext<SignalRuntimeView | null>(null);

export function SignalRuntimeProvider({ children }: { children: ReactNode }) {
  const signals = useSyncExternalStore(
    worldSignalStore.subscribe,
    worldSignalStore.getSnapshot,
    worldSignalStore.getSnapshot,
  );

  const value = useMemo<SignalRuntimeView>(() => {
    const worldIds = WORLD_ENTITIES.map((e) => e.systemId);
    const presence = presenceByWorld(signals, worldIds);
    return {
      signals,
      globalState: globalStateFromSignals(signals),
      presence,
      recent: recentSignals(signals),
      attention: attentionSignals(signals),
      resolved: resolvedSignals(signals),
      activeWorlds: activeWorldCount(presence),
      pressure: attentionPressure(signals),
      acknowledge: worldSignalStore.acknowledge,
      resolve: worldSignalStore.resolve,
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
