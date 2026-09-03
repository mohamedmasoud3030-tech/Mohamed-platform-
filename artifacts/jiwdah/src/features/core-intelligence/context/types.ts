/**
 * LENA Intelligence — canonical context contracts.
 *
 * `LenaContextSnapshot` is the normalized READ MODEL of the intelligence
 * kernel: a compact, deterministic description of *what is happening, where
 * the visitor is, and what currently matters* — derived from canonical LENA
 * runtimes through the context fusion layer.
 *
 * Hard rules (shared by every consumer):
 *   - READ-ONLY: the snapshot observes and derives. It never acknowledges or
 *     resolves signals, never writes memory, never navigates, never mutates
 *     the graph, and never triggers presentation.
 *   - No duplicated product registries: the snapshot carries resolved
 *     projections (ids, paths, presence), never a second copy of world
 *     metadata or content.
 *   - Deterministic: identical input produces a deep-equal snapshot.
 *
 * Canonical LENA types are reused here via `import type` only — the kernel
 * reads the same shapes the runtimes define, and never imports their
 * React/browser implementations at runtime.
 */

import type {
  GlobalWorldState,
  SignalKind,
  SignalLifecycle,
  SignalSeverity,
  WorldPresence,
  WorldSignal,
} from "@/features/world/signals/types";
import type {
  LenaSpace,
  SpatialIntent,
  SpatialNavState,
  SpatialPhase,
  SpatialRoute,
} from "@/lib/spatial/types";
import type { NavigationDirection } from "@/lib/spatial/navigation/context";
import type {
  SpatialEntryContext,
  SpatialInnerDestination,
  SpatialMemory,
} from "@/lib/spatial/memory/types";
import type { Continuation, WorldRegistry } from "@/lib/spatial/continuation";
import type {
  GraphContextAdapter,
  GraphNodeId,
} from "../graph/GraphContextAdapter";

/** Bump only when the snapshot shape changes. */
export const LENA_CONTEXT_VERSION = 1 as const;

/** Route-level spatial depth: home threshold = 0, world field = 1, chamber = 2. */
export type SpatialDepth = 0 | 1 | 2;

/** One resolved world in the intelligence catalog. */
export interface LenaWorldReference {
  systemId: string;
  /** Router-relative chamber path, resolved from the canonical registry. */
  path: string;
}

/** Spatial facts — "where am I, and how did I get here?" */
export interface SpatialFacts {
  /** True when the visitor is on a LENA spatial route. */
  inLena: boolean;
  space: LenaSpace | null;
  /** Chamber system id when `space === "chamber"`. */
  systemId: string | null;
  /** Router-relative path of the current route ("" when outside LENA). */
  path: string;
  depth: SpatialDepth;
  /** Intent that brought the visitor to this entry, when known. */
  arrivalIntent: SpatialIntent | null;
  direction: NavigationDirection;
  /** Router-relative path we moved from, when known. */
  originPath: string | null;
  /** True when this entry has no spatial arrival state (direct URL/reload). */
  isDirectEntry: boolean;
  /** Raw transition phase of the current scene, when observed. */
  transitionPhase: SpatialPhase | null;
  /** True while a semantic spatial move is actively resolving. */
  transitioning: boolean;
}

/** Memory facts — "what does continuity know?" (canonical record projection). */
export interface MemoryFacts {
  /** A usable spatial memory record exists. */
  present: boolean;
  /** Canonical first-visit semantics: no memory record at all. */
  firstVisit: boolean;
  /** The visitor has been here before (a record exists). */
  returning: boolean;
  lastSpace: LenaSpace | null;
  lastSystemId: string | null;
  lastChamberPath: string | null;
  lastInner: SpatialInnerDestination | null;
  lastNavigation: { to: string; intent: SpatialIntent; at: number } | null;
  entryContext: SpatialEntryContext;
  lastInteractionAt: number | null;
}

/** One unresolved world signal projected for ranking (compact, no copies). */
export interface WorldUnresolvedSummary {
  id: string;
  sourceWorld: string;
  kind: SignalKind;
  severity: SignalSeverity;
  lifecycle: SignalLifecycle;
  /** Epoch ms of the signal timestamp. */
  at: number;
}

/** Signal facts — "what is happening across the worlds?" */
export interface SignalFacts {
  /** A signal snapshot was supplied (may be empty). */
  present: boolean;
  globalState: GlobalWorldState;
  presence: WorldPresence;
  /** Open signals of any severity. */
  openCount: number;
  /** Canonical attention pressure (severity + new-lifecycle weighting). */
  attentionPressure: number;
  unresolved: {
    /** Open critical signals, urgency-ordered (canonical derivation). */
    critical: readonly WorldSignal[];
    /** Open attention (non-critical) signals, urgency-ordered. */
    attention: readonly WorldSignal[];
  };
  /** The single most urgent unresolved signal, when any. */
  highestUnresolved: WorldSignal | null;
  /** Compact summaries of every unresolved signal (ranked, deterministic). */
  unresolvedSummaries: readonly WorldUnresolvedSummary[];
  /** Per-world presence for the requested world ids. */
  byWorld: Readonly<Record<string, WorldPresence>>;
  /** Epoch ms of the newest open signal, when any. */
  newestOpenAt: number | null;
}

/** Focus facts — "what is the visitor currently engaged with?" */
export interface FocusFacts {
  /** Chamber system id when currently inside a chamber. */
  currentSystemId: string | null;
  inChamber: boolean;
  atWorldField: boolean;
  atHome: boolean;
  /** The arrival intent when it is an engagement intent (enter/descend/focus). */
  engagementIntent: SpatialIntent | null;
  /** Settled deep engagement: inside a chamber with no transition running. */
  deepEngaged: boolean;
  /** Presence of the current chamber/world, when inside one. */
  currentWorldPresence: WorldPresence | null;
  /** Remembered system focus resolved through the canonical registry. */
  rememberedSystemId: string | null;
}

/** Catalog facts — resolved chamber references (never a second registry). */
export interface CatalogFacts {
  worlds: readonly LenaWorldReference[];
}

/** Graph facts — structural position, observed through the adapter seam. */
export interface GraphFacts {
  /** A graph adapter is connected and usable. */
  available: boolean;
  /** Structural node of the current route, when the route has one. */
  currentNode: GraphNodeId | null;
  /** Neighbors of the current node, when the graph knows it. */
  currentNeighbors: readonly GraphNodeId[] | null;
}

/** Continuity facts — safe continuation resolved through the registry. */
export interface ContinuityFacts {
  available: boolean;
  kind: Continuation["kind"] | null;
  systemId: string | null;
  path: string | null;
  reachedChamber: boolean;
  at: number | null;
}

/** The canonical LENA context snapshot (normalized read model). */
export interface LenaContextSnapshot {
  readonly v: typeof LENA_CONTEXT_VERSION;
  /** Clock used for derivation (input `now`, else `Date.now()`). */
  readonly at: number;
  readonly spatial: SpatialFacts;
  readonly memory: MemoryFacts;
  readonly signals: SignalFacts;
  readonly focus: FocusFacts;
  readonly catalog: CatalogFacts;
  readonly graph: GraphFacts;
  readonly continuity: ContinuityFacts;
}

/**
 * Everything the fusion layer may observe. Every field is optional — callers
 * supply only what they own; fusion degrades gracefully and deterministically
 * when data is missing (missing graph adapter, incomplete optional data, …).
 * All referenced canonical values are consumed read-only.
 */
export interface LenaContextSituation {
  /** Optional explicit clock (epoch ms). Omit only when realtime is desired. */
  now?: number;
  /** Current LENA route, when inside one. */
  route?: SpatialRoute | null;
  /** Typed spatial arrival state (router location state), when present. */
  arrival?: SpatialNavState | null;
  direction?: NavigationDirection;
  /** Scene transition phase, when observed. */
  transitionPhase?: SpatialPhase | null;
  /** Canonical spatial memory record (read-only). Null = first visit. */
  memory?: SpatialMemory | null;
  /** Canonical live registry (read-only) — validates memory and worlds. */
  registry?: WorldRegistry | null;
  /** Canonical signal snapshot (read-only). */
  signals?: readonly WorldSignal[] | null;
  /** World ids considered for per-world presence and the catalog. */
  worldIds?: readonly string[];
  /** Connected graph adapter, when the World Graph runtime is available. */
  graph?: GraphContextAdapter | null;
}
