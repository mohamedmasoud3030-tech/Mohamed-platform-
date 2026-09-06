/**
 * LENA Intelligence — Graph Context Adapter (seam).
 *
 * The intelligence kernel must NEVER import Atlas, React, or a second World
 * Graph topology. It depends on this small interface — the structural face
 * intelligence needs. Production wiring is `CanonicalWorldGraphAdapter` over
 * the live `@/graph` World Graph. This module stays dependency-free so the
 * kernel remains testable with the in-memory double below.
 *
 * # Node addressing contract
 * Graph nodes are canonical strings:
 *   - "/"          — the home threshold
 *   - "/world"     — the world field
 *   - <systemId>   — a world chamber node, e.g. "property", "wellness"
 *   Command and Atlas resolve to the "/world" structural node; "other" has
 *   no LENA graph node. This mirrors route semantics without importing React.
 */

/** Node identifier inside the structural graph. */
export type GraphNodeId = string;

/** Reserved node id for the home threshold. */
export const GRAPH_HOME_NODE = "/";
/** Reserved node id for the world field. */
export const GRAPH_WORLD_NODE = "/world";

/**
 * Read-only structural graph face consumed by the intelligence kernel.
 *
 * `null` means "unknown for this graph": the adapter is absent, the node is
 * not present in the graph, or no path exists. An empty array means the node
 * is known but has no neighbors. This keeps absence and emptiness distinct
 * and deterministic.
 */
export interface GraphContextAdapter {
  /** True when a real graph implementation is connected. */
  readonly available: boolean;
  /** Structural neighbors of a node, or null when unknown/absent. */
  neighbors(nodeId: GraphNodeId): readonly GraphNodeId[] | null;
  /**
   * Deterministic shortest structural path between two nodes (inclusive),
   * or null when the graph is unavailable, a node is unknown, or the nodes
   * are unreachable. Never used to override severity — only to break ties.
   */
  shortestPath(
    from: GraphNodeId,
    to: GraphNodeId,
  ): readonly GraphNodeId[] | null;
}

/** The canonical absent graph: every query safely answers null. */
export const emptyGraphContextAdapter: GraphContextAdapter = {
  available: false,
  neighbors: () => null,
  shortestPath: () => null,
};

/**
 * Deterministic in-memory graph for intelligence tests. Production uses
 * CanonicalWorldGraphAdapter; this double exposes the same two queries.
 */
export class InMemoryGraphContextAdapter implements GraphContextAdapter {
  readonly available = true;
  private readonly adjacency: Map<GraphNodeId, GraphNodeId[]> = new Map();

  /** Add a directed edge `from → to` (idempotent, keeps insertion order). */
  addEdge(from: GraphNodeId, to: GraphNodeId): this {
    const list = this.adjacency.get(from);
    if (!list) {
      this.adjacency.set(from, [to]);
      return this;
    }
    if (!list.includes(to)) list.push(to);
    return this;
  }

  /** Add both directions of an edge. */
  addBidirectionalEdge(a: GraphNodeId, b: GraphNodeId): this {
    this.addEdge(a, b);
    this.addEdge(b, a);
    return this;
  }

  neighbors(nodeId: GraphNodeId): readonly GraphNodeId[] | null {
    const found = this.adjacency.get(nodeId);
    return found === undefined ? null : [...found];
  }

  shortestPath(
    from: GraphNodeId,
    to: GraphNodeId,
  ): readonly GraphNodeId[] | null {
    if (from === to) return [from];
    if (!this.adjacency.has(from) || !this.adjacency.has(to)) return null;
    // Breadth-first search over insertion-ordered adjacency → deterministic.
    const queue: GraphNodeId[] = [from];
    const previous = new Map<GraphNodeId, GraphNodeId | null>([[from, null]]);
    for (let head = 0; head < queue.length; head += 1) {
      const node = queue[head];
      if (node === to) break;
      const next = this.adjacency.get(node);
      if (!next) continue;
      for (const candidate of next) {
        if (previous.has(candidate)) continue;
        previous.set(candidate, node);
        queue.push(candidate);
      }
    }
    if (!previous.has(to)) return null;
    const path: GraphNodeId[] = [];
    let cursor: GraphNodeId | null = to;
    while (cursor !== null) {
      path.unshift(cursor);
      cursor = previous.get(cursor) ?? null;
    }
    return path;
  }
}

/**
 * Resolve the graph node for the current route facts. Command and Atlas are
 * world-level structural surfaces, while `other` has no LENA node.
 */
export function graphNodeFor(
  space: "home" | "world" | "chamber" | "command" | "atlas" | "other" | null | undefined,
  systemId?: string | null,
): GraphNodeId | null {
  if (space === "home") return GRAPH_HOME_NODE;
  if (
    space === "world" ||
    space === "command" ||
    space === "atlas"
  ) {
    return GRAPH_WORLD_NODE;
  }
  if (space === "chamber") return systemId ?? null;
  return null;
}
