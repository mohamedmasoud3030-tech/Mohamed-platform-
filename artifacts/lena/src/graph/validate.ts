import { publicSystems, type SystemId } from "@/content/systems";
import { WORLD_ENTITIES } from "@/features/world/content/world";
import { OPERATING_PRIMITIVES } from "@/features/world/content/operating-primitives";
import { WORLD_GRAPH_IDS } from "./builder";
import {
  ancestorsOf,
  childrenOf,
  nodeById,
  nodesOfType,
  resolveDestination,
  sharedRootsOf,
} from "./query";
import type {
  WorldGraph,
  WorldGraphEdge,
  WorldGraphIntegrityIssue,
  WorldGraphValidation,
} from "./types";

/**
 * LENA World Graph — structural integrity.
 *
 * The graph is LENA's single structural truth, so drift has to fail loudly and
 * early: at build time in CI, not as a blank Atlas panel. This validator runs on
 * the *raw* node and edge arrays (before index dedupe could hide a collision)
 * and reports every problem it finds rather than throwing on the first one.
 *
 * It is also callable with explicit expectations, which is how the tests prove
 * a drifted registry is actually caught instead of silently tolerated.
 */

/** Routes the LENA product owns. Kept as an explicit list because the graph must
 *  never point at a destination the router does not serve: `/world/atlas` is
 *  canonical now, and `/services`, `/contact` are the chamber's documented exits. */
export const KNOWN_LENA_ROUTES = [
  "/",
  "/world",
  "/world/command",
  "/world/atlas",
  "/services",
  "/contact",
] as const;

function routeIsCanonical(route: string): boolean {
  if ((KNOWN_LENA_ROUTES as readonly string[]).includes(route)) return true;
  // A chamber route for a canonical world is canonical by definition: it is
  // produced by `WorldEntity.detailPath`, never hand-written into the graph.
  return WORLD_ENTITIES.some((entity) => entity.detailPath === route);
}

function issue(
  code: WorldGraphIntegrityIssue["code"],
  message: string,
  extra: Partial<WorldGraphIntegrityIssue> = {},
): WorldGraphIntegrityIssue {
  return { code, message, ...extra };
}

export interface WorldGraphExpectations {
  /** System ids that must appear as worlds. Defaults to the canonical entities
   *  whose system is public — i.e. exactly what the World field shows. */
  requiredWorlds?: readonly string[];
}

export function requiredWorldIds(): string[] {
  const publicIds = new Set(publicSystems().map((system) => system.id));
  return WORLD_ENTITIES.filter((entity) => publicIds.has(entity.systemId)).map(
    (entity) => entity.systemId,
  );
}

/** Validate a graph. Pass `rawNodes`/`rawEdges` to check pre-index arrays. */
export function validateWorldGraph(
  graph: WorldGraph,
  expectations: WorldGraphExpectations = {},
): WorldGraphValidation {
  const issues: WorldGraphIntegrityIssue[] = [];
  const nodes = graph.nodes;
  const edges = graph.edges;

  if (nodes.length === 0) {
    return { ok: false, issues: [issue("empty-graph", "The World Graph has no nodes.")] };
  }

  // ── duplicate node ids ───────────────────────────────────────────────────
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) {
      issues.push(
        issue("duplicate-node-id", `Duplicate node id "${node.id}" — structural ids must be unique.`, {
          nodeId: node.id,
        }),
      );
    }
    ids.add(node.id);
  }

  // ── parents ──────────────────────────────────────────────────────────────
  let roots = 0;
  for (const node of nodes) {
    if (node.parentId === null) {
      roots += 1;
      continue;
    }
    if (node.parentId === node.id) {
      issues.push(
        issue("cycle", `Node "${node.id}" is its own parent — containment cannot be circular.`, {
          nodeId: node.id,
        }),
      );
      continue;
    }
    if (!ids.has(node.parentId)) {
      issues.push(
        issue(
          "missing-parent",
          `Node "${node.id}" points at parent "${node.parentId}", which is not in the graph.`,
          { nodeId: node.id },
        ),
      );
    }
  }
  if (roots !== 1) {
    issues.push(
      issue("orphan-node", `Expected exactly one LENA root, found ${roots}. Structural truth needs one top.`),
    );
  }
  if (!ids.has(WORLD_GRAPH_IDS.root)) {
    issues.push(issue("orphan-node", `The LENA root node "${WORLD_GRAPH_IDS.root}" is missing.`));
  }

  // ── reachability from the root (orphan detection) ────────────────────────
  const reachable = new Set<string>([WORLD_GRAPH_IDS.root]);
  const queue: string[] = [WORLD_GRAPH_IDS.root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childrenOf(graph, current)) {
      if (reachable.has(child.id)) continue;
      reachable.add(child.id);
      queue.push(child.id);
    }
  }
  for (const node of nodes) {
    if (!reachable.has(node.id)) {
      issues.push(
        issue("orphan-node", `Node "${node.id}" (${node.type}) is not reachable from the LENA root.`, {
          nodeId: node.id,
        }),
      );
    }
  }

  // ── edges ────────────────────────────────────────────────────────────────
  const edgeKeys = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.kind}:${edge.from}->${edge.to}`;
    if (edgeKeys.has(key)) {
      issues.push(issue("duplicate-destination", `Duplicate edge ${key}.`, { edge }));
    }
    edgeKeys.add(key);

    if (edge.from === edge.to) {
      issues.push(issue("edge-to-self", `Edge "${edge.kind}" points at itself: ${edge.from}.`, { edge }));
      continue;
    }
    for (const endpoint of [edge.from, edge.to] as const) {
      if (!ids.has(endpoint)) {
        issues.push(
          issue(
            "missing-edge-target",
            `Edge "${edge.kind}" references "${endpoint}", which is not in the graph.`,
            { edge },
          ),
        );
      }
    }

    // `shares-root` must be a claim a world actually makes on its own.
    if (edge.kind === "shares-root" || edge.kind === "belongs-to") {
      const worldEnd = edge.kind === "shares-root" ? edge.from : edge.to;
      const rootEnd = edge.kind === "shares-root" ? edge.to : edge.from;
      const worldNode = nodeById(graph, worldEnd);
      const rootNode = nodeById(graph, rootEnd);
      if (worldNode?.type === "world" && rootNode?.primitiveId) {
        const claimed = worldNode.meta.primitiveIds?.includes(rootNode.primitiveId);
        if (!claimed) {
          issues.push(
            issue(
              "invalid-destination",
              `Edge "${edge.kind}" claims ${worldNode.id} shares "${rootNode.primitiveId}", but the canonical registry does not list it.`,
              { edge },
            ),
          );
        }
      }
    }
  }

  // ── destinations ─────────────────────────────────────────────────────────
  const destinationOwners = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.route) continue;
    if (!routeIsCanonical(node.route)) {
      issues.push(
        issue(
          "invalid-destination",
          `Node "${node.id}" routes to "${node.route}", which is not a canonical LENA destination.`,
          { nodeId: node.id },
        ),
      );
    }
    const bucket = destinationOwners.get(node.route) ?? [];
    bucket.push(node.id);
    destinationOwners.set(node.route, bucket);
  }

  // `/world` is the world field itself: the LENA root and the World Command
  // entrance may both stand for it. A *world* node and its own *chamber* node
  // also share the canonical detail path by design (there is no second URL),
  // so only structurally different worlds colliding on one route is drift.
  for (const [route, owners] of destinationOwners) {
    const distinctWorlds = new Set(
      nodes.filter((node) => owners.includes(node.id) && node.worldId).map((node) => node.worldId),
    );
    if (distinctWorlds.size > 1) {
      issues.push(
        issue(
          "duplicate-destination",
          `Canonical route "${route}" is claimed by more than one world (${[...distinctWorlds].join(", ")}).`,
        ),
      );
    }
  }

  // ── canonical coverage ───────────────────────────────────────────────────
  const required = expectations.requiredWorlds ?? requiredWorldIds();
  const worldNodes = nodesOfType(graph, "world");
  for (const systemId of required) {
    const worldNode = worldNodes.find((node) => node.systemId === (systemId as SystemId));
    if (!worldNode) {
      issues.push(
        issue("missing-world", `Known world "${systemId}" is absent from the graph — structural truth is incomplete.`),
      );
      continue;
    }
    const chamber = childrenOf(graph, worldNode.id).find((node) => node.type === "chamber");
    if (!chamber) {
      issues.push(issue("missing-chamber", `World "${systemId}" has no chamber node.`));
      continue;
    }
    const inner = childrenOf(graph, chamber.id).find((node) => node.type === "inner");
    if (!inner) {
      issues.push(issue("missing-inner", `Chamber "${systemId}" has no inner space node.`));
    }
  }

  // Every derived label must come from a registry primitive, not a string the
  // graph invented.
  const primitiveIds = new Set<string>(OPERATING_PRIMITIVES.map((primitive) => primitive.id));
  for (const node of nodesOfType(graph, "capability")) {
    if (!node.primitiveId || !primitiveIds.has(node.primitiveId)) {
      issues.push(
        issue("invalid-destination", `Capability node "${node.id}" has no canonical operating-primitive id.`, {
          nodeId: node.id,
        }),
      );
    }
    // A root nobody holds is decoration. A single holder is legitimate: the
    // canonical model marks that an emerging signal, not a shared claim.
    const holders = childrenOf(graph, WORLD_GRAPH_IDS.root).filter(
      (world) => world.type === "world" && sharedRootsOf(graph, world.id).some((root) => root.id === node.id),
    );
    const declaredHolders = node.meta.holderCount ?? 0;
    if (holders.length === 0) {
      issues.push(
        issue("orphan-node", `Capability "${node.id}" is held by no world and should not be in the graph.`, {
          nodeId: node.id,
        }),
      );
    } else if (holders.length !== declaredHolders) {
      issues.push(
        issue(
          "invalid-destination",
          `Capability "${node.id}" declares ${declaredHolders} holder(s) but ${holders.length} world(s) claim it.`,
          { nodeId: node.id },
        ),
      );
    }
  }

  // ── resolution must terminate at a real route ────────────────────────────
  // A world with no destination would be an entrance to nowhere, so it is
  // checked too. Only the LENA root is exempt (it *is* the field's address).
  for (const node of nodes) {
    if (node.type === "root") continue;
    const destination = resolveDestination(graph, node.id);
    if (destination.path === null) {
      issues.push(
        issue(
          "unreachable-destination",
          `Node "${node.id}" (${node.type}) resolves to no LENA destination; committing to it would do nothing.`,
          { nodeId: node.id },
        ),
      );
      continue;
    }
    if (!routeIsCanonical(destination.path)) {
      issues.push(
        issue("invalid-destination", `Node "${node.id}" resolves to non-canonical "${destination.path}".`, {
          nodeId: node.id,
        }),
      );
    }
  }

  // ── containment cycles ───────────────────────────────────────────────────
  for (const node of nodes) {
    const chain = ancestorsOf(graph, node.id);
    if (chain.some((ancestor) => ancestor.id === node.id)) {
      issues.push(issue("cycle", `Containment cycle detected at node "${node.id}".`, { nodeId: node.id }));
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Throw on drift. Used by the CI-facing script so a failure is unmistakable. */
export function assertWorldGraphIntegrity(
  graph: WorldGraph,
  expectations: WorldGraphExpectations = {},
): void {
  const validation = validateWorldGraph(graph, expectations);
  if (validation.ok) return;
  const list = validation.issues.map((entry) => `  - [${entry.code}] ${entry.message}`).join("\n");
  throw new Error(`LENA World Graph integrity failed with ${validation.issues.length} issue(s):\n${list}`);
}

/** Compact summary for test output and the verify script. */
export function graphStats(graph: WorldGraph) {
  const byType = new Map<string, number>();
  for (const node of graph.nodes) byType.set(node.type, (byType.get(node.type) ?? 0) + 1);
  const byKind = new Map<WorldGraphEdge["kind"], number>();
  for (const edge of graph.edges) byKind.set(edge.kind, (byKind.get(edge.kind) ?? 0) + 1);
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    navigable: graph.nodes.filter((node) => Boolean(node.route)).length,
    depth: Math.max(...graph.nodes.map((node) => ancestorsOf(graph, node.id).length)),
    nodesByType: Object.fromEntries(byType),
    edgesByKind: Object.fromEntries(byKind),
  };
}
