import type { SystemId } from "@/content/systems";
import type { AppLocale } from "@/providers/preferences";

/** Lifecycle of a world-level signal. */
export type SignalLifecycle = "new" | "active" | "acknowledged" | "resolved";

/** Importance of a signal — spatial energy, not a badge colour. */
export type SignalSeverity = "ambient" | "information" | "attention" | "critical";

/** What kind of event this is, independent of product internals. */
export type SignalKind =
  | "activity"
  | "operational-change"
  | "attention-needed"
  | "milestone"
  | "degraded"
  | "resolved";

export type LocalizedText = Record<AppLocale, string>;

export type WorldSignal = {
  id: string;
  sourceWorld: SystemId;
  kind: SignalKind;
  severity: SignalSeverity;
  timestamp: string;
  title: LocalizedText;
  description: LocalizedText;
  /** Existing spatial destination, typically `/world/:systemId`. */
  targetPath?: string;
  context?: Record<string, string>;
  lifecycle: SignalLifecycle;
};

export type WorldPresence = "quiet" | "active" | "attention" | "critical";

export type GlobalWorldState = "calm" | "active" | "attention" | "critical";

export const SEVERITY_RANK: Record<SignalSeverity, number> = {
  ambient: 0,
  information: 1,
  attention: 2,
  critical: 3,
};

export const PRESENCE_RANK: Record<WorldPresence, number> = {
  quiet: 0,
  active: 1,
  attention: 2,
  critical: 3,
};
