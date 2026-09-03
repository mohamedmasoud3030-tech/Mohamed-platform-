import {
  WORLD_GRAPH_IDS,
  neighborsOf,
  shortestPath as shortestWorldGraphPath,
  worldGraph,
  type WorldGraph,
} from "@/graph";
import {
  GRAPH_HOME_NODE,
  GRAPH_WORLD_NODE,
  type GraphContextAdapter,
  type GraphNodeId,
} from "./GraphContextAdapter";

/**
 * Read-only adapter from the canonical LENA World Graph to the compact node
 * vocabulary consumed by Core Intelligence.
 *
 * Intelligence deliberately reasons at world-navigation granularity:
 *   "/"        -> home threshold (not a World Graph node)
 *   "/world"   -> canonical LENA root
 *   "property" -> canonical `world:property`
 *
 * Chambers, operations and capabilities stay owned by the World Graph; the
 * adapter never copies their data or creates a second topology.
 */
export class CanonicalWorldGraphAdapter implements GraphContextAdapter {
  readonly available = true;

  constructor(private readonly graph: WorldGraph = worldGraph()) {}

  neighbors(nodeId: GraphNodeId): readonly GraphNodeId[] | null {
    if (nodeId === GRAPH_HOME_NODE) return [GRAPH_WORLD_NODE];

    const canonicalId = this.toCanonicalId(nodeId);
    if (!canonicalId) return null;

    const mapped = neighborsOf(this.graph, canonicalId, {
      nodeTypes: ["root", "world"],
    })
      .map(({ node }) => this.fromCanonicalId(node.id))
      .filter((id): id is GraphNodeId => id !== null);

    return [...new Set(mapped)];
  }

  shortestPath(from: GraphNodeId, to: GraphNodeId): readonly GraphNodeId[] | null {
    if (from === to) return this.isKnownNode(from) ? [from] : null;

    if (from === GRAPH_HOME_NODE) {
      if (to === GRAPH_WORLD_NODE) return [GRAPH_HOME_NODE, GRAPH_WORLD_NODE];
      const tail = this.shortestPath(GRAPH_WORLD_NODE, to);
      return tail ? [GRAPH_HOME_NODE, ...tail] : null;
    }

    if (to === GRAPH_HOME_NODE) {
      if (from === GRAPH_WORLD_NODE) return [GRAPH_WORLD_NODE, GRAPH_HOME_NODE];
      const head = this.shortestPath(from, GRAPH_WORLD_NODE);
      return head ? [...head, GRAPH_HOME_NODE] : null;
    }

    const canonicalFrom = this.toCanonicalId(from);
    const canonicalTo = this.toCanonicalId(to);
    if (!canonicalFrom || !canonicalTo) return null;

    const path = shortestWorldGraphPath(this.graph, canonicalFrom, canonicalTo);
    if (!path.ok) return null;

    const mapped = path.nodeIds
      .map((id) => this.fromCanonicalId(id))
      .filter((id): id is GraphNodeId => id !== null);

    return mapped.length > 0 ? mapped : null;
  }

  private isKnownNode(nodeId: GraphNodeId): boolean {
    if (nodeId === GRAPH_HOME_NODE) return true;
    return this.toCanonicalId(nodeId) !== null;
  }

  private toCanonicalId(nodeId: GraphNodeId): string | null {
    if (nodeId === GRAPH_WORLD_NODE) return this.graph.rootId;
    if (nodeId === GRAPH_HOME_NODE) return null;
    const worldId = WORLD_GRAPH_IDS.world(nodeId);
    return this.graph.nodesById.has(worldId) ? worldId : null;
  }

  private fromCanonicalId(nodeId: string): GraphNodeId | null {
    if (nodeId === this.graph.rootId) return GRAPH_WORLD_NODE;
    const node = this.graph.nodesById.get(nodeId);
    if (node?.type !== "world" || !node.systemId) return null;
    return node.systemId;
  }
}

/** Canonical runtime instance for consumers that want the live LENA topology. */
export const canonicalWorldGraphAdapter: GraphContextAdapter =
  new CanonicalWorldGraphAdapter();
