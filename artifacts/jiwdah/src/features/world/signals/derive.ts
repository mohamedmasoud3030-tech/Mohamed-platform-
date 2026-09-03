import type {
  GlobalWorldState,
  SignalLifecycle,
  WorldPresence,
  WorldSignal,
} from "./types.ts";
import { PRESENCE_RANK, SEVERITY_RANK } from "./types.ts";

const OPEN: SignalLifecycle[] = ["new", "active", "acknowledged"];

export function isOpen(signal: WorldSignal): boolean {
  return OPEN.includes(signal.lifecycle);
}

export function needsAttention(signal: WorldSignal): boolean {
  if (!isOpen(signal)) return false;
  return signal.severity === "attention" || signal.severity === "critical";
}

export function presenceFromSignals(signals: WorldSignal[]): WorldPresence {
  const open = signals.filter(isOpen);
  if (open.some((s) => s.severity === "critical")) return "critical";
  if (open.some((s) => s.severity === "attention")) return "attention";
  if (open.length > 0) return "active";
  return "quiet";
}

export function globalStateFromSignals(signals: WorldSignal[]): GlobalWorldState {
  const presence = presenceFromSignals(signals);
  if (presence === "quiet") return "calm";
  return presence;
}

export function signalsForWorld(signals: WorldSignal[], worldId: string): WorldSignal[] {
  return signals.filter((s) => s.sourceWorld === worldId);
}

export function presenceByWorld(
  signals: WorldSignal[],
  worldIds: string[],
): Record<string, WorldPresence> {
  const map: Record<string, WorldPresence> = {};
  for (const id of worldIds) {
    map[id] = presenceFromSignals(signalsForWorld(signals, id));
  }
  return map;
}

export function attentionSignals(signals: WorldSignal[]): WorldSignal[] {
  return signals.filter(needsAttention).sort(byUrgency);
}

export function recentSignals(signals: WorldSignal[], limit = 12): WorldSignal[] {
  return [...signals].sort(byRecency).slice(0, limit);
}

export function resolvedSignals(signals: WorldSignal[], limit = 6): WorldSignal[] {
  return signals.filter((s) => s.lifecycle === "resolved").sort(byRecency).slice(0, limit);
}

export function activeWorldCount(
  presence: Record<string, WorldPresence>,
): number {
  return Object.values(presence).filter((p) => p !== "quiet").length;
}

export function attentionPressure(signals: WorldSignal[]): number {
  return attentionSignals(signals).reduce(
    (sum, s) => sum + SEVERITY_RANK[s.severity] + (s.lifecycle === "new" ? 1 : 0),
    0,
  );
}

export function strongestPresence(values: WorldPresence[]): WorldPresence {
  return values.reduce<WorldPresence>(
    (acc, next) => (PRESENCE_RANK[next] > PRESENCE_RANK[acc] ? next : acc),
    "quiet",
  );
}

function byRecency(a: WorldSignal, b: WorldSignal): number {
  return Date.parse(b.timestamp) - Date.parse(a.timestamp);
}

function byUrgency(a: WorldSignal, b: WorldSignal): number {
  const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sev !== 0) return sev;
  return byRecency(a, b);
}

export function acknowledgeSignal(signal: WorldSignal, at = new Date().toISOString()): WorldSignal {
  if (signal.lifecycle === "resolved") return signal;
  return { ...signal, lifecycle: "acknowledged", timestamp: at };
}

export function resolveSignal(signal: WorldSignal, at = new Date().toISOString()): WorldSignal {
  return {
    ...signal,
    lifecycle: "resolved",
    kind: "resolved",
    severity: "ambient",
    timestamp: at,
  };
}
