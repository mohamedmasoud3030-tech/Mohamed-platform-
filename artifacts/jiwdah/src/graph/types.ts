import type { AppLocale } from "@/providers/preferences";
import type { DigitalDNA, WorldState } from "@/features/world/content/world";
import type { OperatingPrimitiveId, SystemId } from "@/content/systems";

/**
 * LENA World Graph — the structural contract.
 *
 * One typed model of what LENA *is* structurally: the root, its worlds, each
 * world's chamber, that chamber's inner space, the operations inside it, and
 * the operating roots those worlds share. The graph never stores product
 * facts of its own — labels, state, DNA and destinations are read from the
 * canonical registries at build time (see `builder.ts`). If a fact is not in a
 * registry, it is not in the graph.
 *
 * Nothing here is decorative: every node maps to a surface a visitor can reach
 * (or a canonical unit of meaning that already appears on one), and every edge
 * carries a verb.
 */

/** The kinds of structural positions LENA actually has. */
export type WorldGraphNodeType =
  /** LENA itself — the single operating identity above every world. */
  | "root"
  /** A world/system entrance in the LENA World field. */
  | "world"
  /** The calm chamber route a world opens into. */
  | "chamber"
  /** The inner space of a chamber (spatial focus, not a separate URL). */
  | "inner"
  /** One operation inside an inner constellation. */
  | "operation"
  /** A shared operating root (the beginning of LENA OS). */
  | "capability";

/** Edge verbs. Each one means something specific; none is decorative. */
export type WorldGraphEdgeKind =
  /** Structural containment: the parent owns the child's existence. */
  | "contains"
  /** A spatial move between depths that is not pure containment. */
  | "enters"
  /** The child is reachable *through* the destination of the parent. */
  | "leads-to"
  /** Ownership of a shared root by a world. */
  | "belongs-to"
  /** Two worlds draw on the same operating root. */
  | "shares-root"
  /** Meaningful adjacency derived from canonical data. */
  | "related-to";

/** Which world a node belongs to. `null` means it is above every single world. */
export type WorldGraphOwner = SystemId | null;

/** A canonical, localized label. Registry strings are used verbatim. */
export type LocalizedLabel = Record<AppLocale, string>;

/**
 * Structural metadata an Atlas surface needs. Deliberately small: presence and
 * counts are derived, long-form copy stays on the pages that own it.
 */
export interface WorldGraphAtlasMeta {
  /** Digital DNA of the world, where the canonical registry defines one. */
  dna?: DigitalDNA;
  /** Canonical world visual state (never rendered as public lifecycle copy). */
  state?: WorldState;
  /** Canonical product stage, where a chamber/world exposes it. */
  status?: "in-use" | "trial";
  /** Shared-root maturity: 2+ products prove it, 1 is an emerging signal. */
  maturity?: "shared" | "signal";
  /** Number of worlds drawing on this operating root. */
  holderCount?: number;
  /** Number of operations contained by this node, when it contains operations. */
  operationCount?: number;
  /** Canonical operating roots this world claims, in registry order. */
  primitiveIds?: OperatingPrimitiveId[];
  /** Canonical copy for an in-scene focus panel, keyed by locale so the
   *  graph stays a pure transform of the registries (which are bilingual). */
  summary?: LocalizedLabel;
  /** For an operation node: the exact registry string it was derived from
   *  (`BusinessSystem.does`), so a UI can address the source data if needed. */
  operationLabel?: LocalizedLabel;
}

export interface WorldGraphNode {
  /** Stable structural id. Never derived from translated copy. */
  id: string;
  type: WorldGraphNodeType;
  label: LocalizedLabel;
  /** The containing node, `null` for the LENA root. */
  parentId: string | null;
  /** The world this node lives inside, `null` for cross-world structure. */
  worldId: WorldGraphOwner;
  /** Canonical router-relative route, when this node *is* navigable. */
  route: string | null;
  /** Canonical system this node belongs to, when one exists. */
  systemId?: SystemId;
  /** Stable id of the primitive, for capability nodes. */
  primitiveId?: OperatingPrimitiveId;
  /** The registry string this node was derived from, for capability nodes. */
  meaning?: LocalizedLabel;
  meta: WorldGraphAtlasMeta;
}

export interface WorldGraphEdge {
  /** `from -> to`, read as `<kind>`. */
  from: string;
  to: string;
  kind: WorldGraphEdgeKind;
}

export interface WorldGraphIntegrityIssue {
  code:
    | "duplicate-node-id"
    | "orphan-node"
    | "missing-parent"
    | "missing-edge-target"
    | "edge-to-self"
    | "duplicate-destination"
    | "invalid-destination"
    | "missing-world"
    | "missing-chamber"
    | "missing-inner"
    | "unreachable-destination"
    | "cycle"
    | "empty-graph";
  message: string;
  nodeId?: string;
  edge?: WorldGraphEdge;
}

export interface WorldGraphValidation {
  ok: boolean;
  issues: WorldGraphIntegrityIssue[];
}

/**
 * The graph itself. `nodesById` and `adjacency` are derived indexes so queries
 * never rescan; the arrays are the canonical, ordered truth.
 */
export interface WorldGraph {
  nodes: WorldGraphNode[];
  edges: WorldGraphEdge[];
  nodesById: ReadonlyMap<string, WorldGraphNode>;
  /** Undirected incidence, used for traversal and path finding. */
  adjacency: ReadonlyMap<string, readonly WorldGraphEdge[]>;
  rootId: string;
}

/** A node plus the edge that connected it — how Atlas explains a neighbor. */
export interface WorldGraphNeighbor {
  node: WorldGraphNode;
  via: WorldGraphEdge;
  /** True when the edge points away from the queried node. */
  outgoing: boolean;
}

export type WorldGraphPathStep =
  | { kind: "node"; node: WorldGraphNode }
  | { kind: "edge"; edge: WorldGraphEdge };

/** A structural route: the nodes crossed, in order, with the verbs between. */
export interface WorldGraphPath {
  ok: boolean;
  fromId: string;
  toId: string;
  nodeIds: string[];
  steps: WorldGraphPathStep[];
  /** Edge hops; `-1` when unreachable. */
  distance: number;
  reason?: "unknown-node" | "unreachable";
}

/** What a node resolves to when a visitor commits to it. */
export interface WorldGraphDestination {
  /** `route` — the node itself is navigable; `inherited` — enter its parent. */
  kind: "route" | "inherited" | "none";
  path: string | null;
  /** The node that owns the route, which may be an ancestor. */
  ownerId: string | null;
  /** The spatial intent that fits entering this destination from its parent. */
  intent: "enter" | "descend" | "focus" | "approach";
}
