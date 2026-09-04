import { WORLD_GRAPH_IDS } from "./builder";
import type {
  WorldGraph,
  WorldGraphDestination,
  WorldGraphEdge,
  WorldGraphEdgeKind,
  WorldGraphNode,
  WorldGraphNeighbor,
  WorldGraphNodeType,
  WorldGraphPath,
  WorldGraphPathStep,
} from "./types";

/**
 * LENA World Graph — queries.
 *
 * Plain functions over an immutable `WorldGraph`. No database, no cache layer,
 * no async: the shipped graph is ~60 nodes, so an index map plus BFS is the
 * right amount of machinery. Atlas and every later consumer (AI navigation,
 * World Memory continuation, signal routing) ask the same questions here, so
 * nobody re-implements traversal.
 */

/** Edge kinds that carry structural meaning for a route between places.
 *  `belongs-to` is deliberately absent: it is the declared inverse of
 *  `shares-root`, and counting both would fabricate a second hop. */
export const TRAVERSAL_EDGE_KINDS: readonly WorldGraphEdgeKind[] = [
  "contains",
  "enters",
  "leads-to",
  "shares-root",
  "related-to",
];

export function nodeById(graph: WorldGraph, id: string | null | undefined): WorldGraphNode | null {
  if (!id) return null;
  return graph.nodesById.get(id) ?? null;
}

export function parentOf(graph: WorldGraph, id: string): WorldGraphNode | null {
  const node = nodeById(graph, id);
  return node ? nodeById(graph, node.parentId) : null;
}

/** Containment children, in graph (registry) order. */
export function childrenOf(graph: WorldGraph, id: string): WorldGraphNode[] {
  const children: WorldGraphNode[] = [];
  for (const node of graph.nodes) {
    if (node.parentId === id) children.push(node);
  }
  return children;
}

/** Root-ward chain, nearest parent first. Empty for the LENA root. */
export function ancestorsOf(graph: WorldGraph, id: string): WorldGraphNode[] {
  const chain: WorldGraphNode[] = [];
  const seen = new Set<string>([id]);
  let current = parentOf(graph, id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = parentOf(graph, current.id);
  }
  return chain;
}

/** The full chain from LENA down to this node, inclusive. */
export function pathFromRoot(graph: WorldGraph, id: string): WorldGraphNode[] {
  return [...ancestorsOf(graph, id)].reverse().concat(nodeById(graph, id) ?? []);
}

export interface NeighborOptions {
  /** Restrict to specific verbs. Both directions are still considered. */
  kinds?: readonly WorldGraphEdgeKind[];
  /** Restrict to specific node types. */
  nodeTypes?: readonly WorldGraphNodeType[];
}

/** Every node connected by a meaningful edge, with the verb that explains it. */
export function neighborsOf(
  graph: WorldGraph,
  id: string,
  options: NeighborOptions = {},
): WorldGraphNeighbor[] {
  const kindFilter = options.kinds ? new Set(options.kinds) : null;
  const typeFilter = options.nodeTypes ? new Set(options.nodeTypes) : null;
  const out: WorldGraphNeighbor[] = [];
  const seen = new Set<string>();

  for (const edge of graph.adjacency.get(id) ?? []) {
    if (kindFilter && !kindFilter.has(edge.kind)) continue;
    const isOutgoing = edge.from === id;
    const otherId = isOutgoing ? edge.to : edge.from;
    if (otherId === id || seen.has(otherId)) continue;
    const node = nodeById(graph, otherId);
    if (!node) continue;
    if (typeFilter && !typeFilter.has(node.type)) continue;
    seen.add(otherId);
    out.push({ node, via: edge, outgoing: isOutgoing });
  }
  return out;
}

export function nodesOfType(graph: WorldGraph, type: WorldGraphNodeType): WorldGraphNode[] {
  return graph.nodes.filter((node) => node.type === type);
}

/**
 * Everything that lives inside one world, including that world's node itself.
 * Shared operating roots are cross-world structure, so they are returned only
 * through `sharedRootsOf`, never by pretending they belong to one world.
 */
export function nodesInWorld(graph: WorldGraph, systemId: string): WorldGraphNode[] {
  return graph.nodes.filter((node) => node.worldId === systemId);
}

export function worldsOf(graph: WorldGraph): WorldGraphNode[] {
  return nodesOfType(graph, "world");
}

/** Structural depth from the LENA root: root 0, world 1, chamber 2, inner 3. */
export function depthOf(graph: WorldGraph, id: string): number {
  return pathFromRoot(graph, id).length - 1;
}

export function isNavigable(graph: WorldGraph, id: string): boolean {
  return Boolean(nodeById(graph, id)?.route);
}

/** Canonical edges, deduplicated across both endpoint keys. */
function uniqueEdges(graph: WorldGraph, id: string): WorldGraphEdge[] {
  const seen = new Set<string>();
  const out: WorldGraphEdge[] = [];
  for (const edge of graph.adjacency.get(id) ?? []) {
    const key = `${edge.kind}:${edge.from}->${edge.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }
  return out;
}

/**
 * Shortest structural path, BFS over traversal edges.
 *
 * Deterministic: neighbors are visited in graph (registry) order, so ties
 * resolve the same way on every run — which is what makes the result usable as
 * navigation infrastructure rather than a drawing hint.
 */
export interface ShortestPathOptions {
  /** Restrict which verbs may be crossed. Atlas uses `hierarchy` semantics
   *  (`contains`/`enters`/`leads-to`) when it must show containment rather than
   *  a lateral shortcut, and the full traversal set when it wants the truth. */
  kinds?: readonly WorldGraphEdgeKind[];
}

export const HIERARCHY_EDGE_KINDS: readonly WorldGraphEdgeKind[] = [
  "contains",
  "enters",
  "leads-to",
];

export function shortestPath(
  graph: WorldGraph,
  fromId: string,
  toId: string,
  options: ShortestPathOptions = {},
): WorldGraphPath {
  const empty: WorldGraphPath = {
    ok: false,
    fromId,
    toId,
    nodeIds: [],
    steps: [],
    distance: -1,
  };
  if (!nodeById(graph, fromId) || !nodeById(graph, toId)) {
    return { ...empty, reason: "unknown-node" };
  }
  const traversalKinds = new Set(options.kinds ?? TRAVERSAL_EDGE_KINDS);

  if (fromId === toId) {
    const node = nodeById(graph, fromId)!;
    return {
      ok: true,
      fromId,
      toId,
      nodeIds: [fromId],
      steps: [{ kind: "node", node }],
      distance: 0,
    };
  }

  const previous = new Map<string, { nodeId: string; edge: WorldGraphEdge }>();
  const visited = new Set<string>([fromId]);
  let frontier: string[] = [fromId];
  let found = false;

  while (frontier.length > 0 && !found) {
    const next: string[] = [];
    for (const current of frontier) {
      for (const edge of uniqueEdges(graph, current)) {
        if (!traversalKinds.has(edge.kind)) continue;
        const otherId = edge.from === current ? edge.to : edge.from;
        if (visited.has(otherId)) continue;
        visited.add(otherId);
        previous.set(otherId, { nodeId: current, edge });
        if (otherId === toId) {
          found = true;
          break;
        }
        next.push(otherId);
      }
      if (found) break;
    }
    frontier = next;
  }

  if (!found) return { ...empty, reason: "unreachable" };

  const nodeIds: string[] = [toId];
  const stepsReversed: WorldGraphPathStep[] = [{ kind: "node", node: nodeById(graph, toId)! }];
  let cursor = toId;
  while (cursor !== fromId) {
    const back = previous.get(cursor);
    if (!back) break;
    stepsReversed.push({ kind: "edge", edge: back.edge });
    stepsReversed.push({ kind: "node", node: nodeById(graph, back.nodeId)! });
    nodeIds.push(back.nodeId);
    cursor = back.nodeId;
  }

  const steps = stepsReversed.reverse();
  return {
    ok: true,
    fromId,
    toId,
    nodeIds: nodeIds.reverse(),
    steps,
    distance: (steps.length - 1) / 2,
  };
}

/**
 * The structural route as it should read in Atlas:
 *   `LENA → World → Chamber → Inner destination`
 * Breadcrumbs come from the path above; nothing is hardcoded separately.
 */
export function structuralPathLabels(
  graph: WorldGraph,
  fromId: string,
  toId: string,
  locale: "ar" | "en",
  options: ShortestPathOptions = {},
): { separator: string; parts: string[]; path: WorldGraphPath } | null {
  const path = shortestPath(graph, fromId, toId, options);
  if (!path.ok) return null;
  const parts = path.nodeIds
    .map((id) => nodeById(graph, id)?.label[locale])
    .filter((label): label is string => Boolean(label));
  return { parts, separator: " \u2192 ", path };
}

/** Operating roots this world claims, as graph nodes. */
export function sharedRootsOf(graph: WorldGraph, id: string): WorldGraphNode[] {
  const node = nodeById(graph, id);
  if (!node) return [];
  const target = node.type === "capability" ? node.id : null;
  if (target) return [node];
  return neighborsOf(graph, id, { kinds: ["shares-root"] })
    .map((neighbor) => neighbor.node)
    .filter((other) => other.type === "capability");
}

/** Roots two worlds both draw on — the structural overlap, if any. */
export function commonRootsOf(graph: WorldGraph, idA: string, idB: string): WorldGraphNode[] {
  const rootsA = new Set(sharedRootsOf(graph, idA).map((node) => node.id));
  return sharedRootsOf(graph, idB).filter((node) => rootsA.has(node.id));
}

/** Worlds that share at least one operating root with this node. */
export function relatedWorldsOf(graph: WorldGraph, id: string): WorldGraphNode[] {
  const seen = new Set<string>();
  const out: WorldGraphNode[] = [];
  for (const neighbor of neighborsOf(graph, id, { kinds: ["related-to", "shares-root"] })) {
    if (neighbor.node.type !== "world") continue;
    if (neighbor.node.id === id || seen.has(neighbor.node.id)) continue;
    seen.add(neighbor.node.id);
    out.push(neighbor.node);
  }
  return out;
}

const DESTINATION_INTENT: Record<WorldGraphNodeType, WorldGraphDestination["intent"]> = {
  root: "enter",
  world: "descend",
  chamber: "descend",
  inner: "focus",
  operation: "descend",
  capability: "approach",
};

/**
 * Navigation seam: graph node → canonical LENA destination.
 *
 * This does not navigate and does not know about React Router. It resolves a
 * destination plus the spatial intent that fits it, so the caller can hand it
 * to the existing spatial navigation layer. A node with no route of its own
 * inherits its nearest routed ancestor (`inherited`) — an operation leads into
 * its chamber rather than to a fictional per-operation URL.
 */
export function resolveDestination(graph: WorldGraph, id: string): WorldGraphDestination {
  const node = nodeById(graph, id);
  const noDestination: WorldGraphDestination = {
    kind: "none",
    path: null,
    ownerId: null,
    intent: "approach",
  };
  if (!node) return noDestination;

  if (node.route) {
    return {
      kind: "route",
      path: node.route,
      ownerId: node.id,
      intent: DESTINATION_INTENT[node.type],
    };
  }

  for (const ancestor of ancestorsOf(graph, id)) {
    if (ancestor.route) {
      return {
        kind: "inherited",
        path: ancestor.route,
        ownerId: ancestor.id,
        // A leaf inside a chamber resolves *into* that chamber.
        intent: "descend",
      };
    }
  }
  return noDestination;
}

/** True when committing to this node would move the visitor somewhere. */
export function canNavigate(graph: WorldGraph, id: string): boolean {
  return resolveDestination(graph, id).path !== null;
}

/** A world node id for any node in that world; `null` for cross-world nodes. */
export function worldIdOf(graph: WorldGraph, id: string): string | null {
  const node = nodeById(graph, id);
  if (!node) return null;
  if (node.type === "world") return node.id;
  if (!node.worldId) return null;
  return WORLD_GRAPH_IDS.world(node.worldId);
}
