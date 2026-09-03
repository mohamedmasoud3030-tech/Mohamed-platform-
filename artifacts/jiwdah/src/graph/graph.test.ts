import { describe, expect, it } from "vitest";
import { publicSystems } from "@/content/systems";
import { WORLD_ENTITIES } from "@/features/world/content/world";
import {
  OPERATING_PRIMITIVES,
  buildConstellationRoots,
} from "@/features/world/content/operating-primitives";
import {
  HIERARCHY_EDGE_KINDS,
  WORLD_GRAPH_IDS,
  ancestorsOf,
  assertWorldGraphIntegrity,
  buildWorldGraph,
  childrenOf,
  commonRootsOf,
  defaultWorldGraphInput,
  depthOf,
  graphStats,
  indexGraph,
  isNavigable,
  neighborsOf,
  nodeById,
  nodesInWorld,
  nodesOfType,
  parentOf,
  pathFromRoot,
  relatedWorldsOf,
  requiredWorldIds,
  resolveDestination,
  sharedRootsOf,
  shortestPath,
  structuralPathLabels,
  validateWorldGraph,
  worldGraph,
  worldsOf,
  type WorldGraphInput,
  type WorldGraphNode,
} from "@/graph";

/**
 * World Graph — structural contracts.
 *
 * These tests are the enforcement half of "one structural truth": they pin the
 * derivation to the canonical registries (so the day a system or a chamber is
 * added, the graph is expected to change with it), the query surface Atlas
 * depends on, and the failure modes that must be loud.
 */

function fixtureInput(overrides: Partial<WorldGraphInput> = {}): WorldGraphInput {
  return { ...defaultWorldGraphInput(), ...overrides };
}

const graph = worldGraph();
const publicEntities = WORLD_ENTITIES.filter((entity) =>
  publicSystems().some((system) => system.id === entity.systemId),
);

describe("canonical derivation", () => {
  it("contains one world node per public World entity, and nothing else", () => {
    const worlds = nodesOfType(graph, "world");
    expect(worlds.map((node) => node.systemId)).toEqual(
      publicEntities.map((entity) => entity.systemId),
    );
  });

  it("mirrors registry order rather than inventing its own", () => {
    expect(worldsOf(graph).map((node) => node.id)).toEqual(
      publicEntities.map((entity) => WORLD_GRAPH_IDS.world(entity.systemId)),
    );
  });

  it("derives labels from the canonical system record, never from graph copy", () => {
    for (const world of worldsOf(graph)) {
      const system = publicSystems().find((entry) => entry.id === world.systemId);
      expect(system).toBeDefined();
      expect(world.label).toEqual({ ar: system!.name.ar, en: system!.name.en });
    }
  });

  it("derives DNA, world state and stage from their canonical owners", () => {
    for (const world of worldsOf(graph)) {
      const entity = WORLD_ENTITIES.find((entry) => entry.systemId === world.systemId)!;
      const system = publicSystems().find((entry) => entry.id === world.systemId)!;
      expect(world.meta.dna).toBe(entity.dna);
      expect(world.meta.state).toBe(entity.state);
      expect(world.meta.status).toBe(system.stage);
      expect(world.meta.primitiveIds).toEqual([...system.operatingPrimitives]);
    }
  });

  it("builds operations straight from system.does in registry order", () => {
    for (const entity of publicEntities) {
      const system = publicSystems().find((entry) => entry.id === entity.systemId)!;
      const inner = nodeById(graph, WORLD_GRAPH_IDS.inner(entity.systemId))!;
      const operations = childrenOf(graph, inner.id);
      expect(operations.map((node) => node.meta.operationLabel?.en)).toEqual(system.does.en);
      expect(operations.map((node) => node.label.en)).toEqual(system.does.en);
    }
  });

  it("carries the Arabic operation copy from the registry, not a translation", () => {
    const system = publicSystems().find((entry) => entry.id === "property")!;
    const first = nodeById(graph, WORLD_GRAPH_IDS.operation("property", 0))!;
    expect(first.label.ar).toBe(system.does.ar[0]);
  });

  it("creates capability nodes only for roots a public system claims", () => {
    const expected = buildConstellationRoots(publicSystems());
    expect(nodesOfType(graph, "capability").map((node) => node.primitiveId).sort()).toEqual(
      expected.map((root) => root.id).sort(),
    );
  });

  it("marks a single-holder root as a signal and a multi-holder root as shared", () => {
    const capabilities = nodesOfType(graph, "capability");
    for (const node of capabilities) {
      const holders = node.meta.holderCount ?? 0;
      expect(node.meta.maturity).toBe(holders >= 2 ? "shared" : "signal");
    }
  });
});

describe("determinism and identity", () => {
  it("is byte-identical across independent builds", () => {
    const a = buildWorldGraph(fixtureInput());
    const b = buildWorldGraph(fixtureInput());
    expect(a.nodes).toEqual(b.nodes);
    expect(a.edges).toEqual(b.edges);
  });

  it("assigns unique ids to every node", () => {
    const ids = graph.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps ids stable when registry copy is edited", () => {
    const renamed = fixtureInput({
      entities: WORLD_ENTITIES.map((entity) =>
        entity.systemId === "property" ? { ...entity, state: "forming" } : entity,
      ),
    });
    const built = buildWorldGraph(renamed);
    const before = graph.nodes.map((node) => node.id);
    const after = built.nodes.map((node) => node.id);
    expect(after).toEqual(before);
  });

  it("never derives an id from translated text", () => {
    for (const node of graph.nodes) {
      expect(node.id).not.toMatch(/[\u0600-\u06FF]/);
      expect(node.id).toMatch(/^[a-z0-9:.\-]+$/);
    }
  });
});

describe("hierarchy", () => {
  it("has exactly one parentless root: LENA", () => {
    const roots = graph.nodes.filter((node) => node.parentId === null);
    expect(roots.map((node) => node.id)).toEqual([WORLD_GRAPH_IDS.root]);
  });

  it("follows LENA → world → chamber → inner → operation", () => {
    const operation = nodeById(graph, WORLD_GRAPH_IDS.operation("property", 0))!;
    expect(pathFromRoot(graph, operation.id).map((node) => node.type)).toEqual([
      "root",
      "world",
      "chamber",
      "inner",
      "operation",
    ]);
  });

  it("reports depth per level", () => {
    expect(depthOf(graph, WORLD_GRAPH_IDS.root)).toBe(0);
    expect(depthOf(graph, WORLD_GRAPH_IDS.world("property"))).toBe(1);
    expect(depthOf(graph, WORLD_GRAPH_IDS.chamber("property"))).toBe(2);
    expect(depthOf(graph, WORLD_GRAPH_IDS.inner("property"))).toBe(3);
    expect(depthOf(graph, WORLD_GRAPH_IDS.operation("property", 0))).toBe(4);
    // Shared roots hang off LENA, not below one world.
    expect(depthOf(graph, WORLD_GRAPH_IDS.capability("money"))).toBe(1);
  });

  it("gives every node a parent except the root, and a world except cross-world nodes", () => {
    for (const node of graph.nodes) {
      if (node.parentId === null) {
        expect(node.id).toBe(WORLD_GRAPH_IDS.root);
        continue;
      }
      expect(nodeById(graph, node.parentId)).not.toBeNull();
      if (node.type !== "capability") expect(node.worldId).not.toBeNull();
      if (node.type === "capability") expect(node.worldId).toBeNull();
    }
  });
});

describe("queries", () => {
  it("resolves parent and children symmetrically", () => {
    const worldId = WORLD_GRAPH_IDS.world("property");
    expect(parentOf(graph, worldId)?.id).toBe(WORLD_GRAPH_IDS.root);
    expect(childrenOf(graph, WORLD_GRAPH_IDS.root)).toContainEqual(nodeById(graph, worldId));
    expect(parentOf(graph, WORLD_GRAPH_IDS.root)).toBeNull();
    expect(childrenOf(graph, "does:not:exist")).toEqual([]);
  });

  it("returns ancestors nearest-first and terminates on a missing id", () => {
    expect(ancestorsOf(graph, WORLD_GRAPH_IDS.inner("property")).map((node) => node.id)).toEqual([
      WORLD_GRAPH_IDS.chamber("property"),
      WORLD_GRAPH_IDS.world("property"),
      WORLD_GRAPH_IDS.root,
    ]);
    expect(pathFromRoot(graph, "ghost:node")).toEqual([]);
  });

  it("exposes neighbors with the verb that connects them", () => {
    const worldId = WORLD_GRAPH_IDS.world("property");
    const neighbors = neighborsOf(graph, worldId);
    const kinds = new Set(neighbors.map((entry) => entry.via.kind));
    expect(kinds.has("contains")).toBe(true);
    expect(kinds.has("shares-root")).toBe(true);
    expect(kinds.has("related-to")).toBe(true);
    // A world's rootward neighbor is LENA; there is exactly one such parent.
    expect(neighbors.filter((entry) => entry.node.id === WORLD_GRAPH_IDS.root)).toHaveLength(1);
  });

  it("filters neighbors by verb and by node type", () => {
    const worldId = WORLD_GRAPH_IDS.world("property");
    expect(
      neighborsOf(graph, worldId, { kinds: ["enters"] }).map((entry) => entry.node.type),
    ).toEqual(["chamber"]);
    expect(
      neighborsOf(graph, worldId, { nodeTypes: ["capability"] }).every(
        (entry) => entry.node.type === "capability",
      ),
    ).toBe(true);
  });

  it("filters nodes by type and by world", () => {
    expect(nodesOfType(graph, "operation").length).toBe(
      publicEntities.reduce(
        (total, entity) =>
          total + (publicSystems().find((system) => system.id === entity.systemId)?.does.en.length ?? 0),
        0,
      ),
    );
    const inProperty = nodesInWorld(graph, "property");
    expect(inProperty.every((node) => node.worldId === "property")).toBe(true);
    expect(inProperty.filter((node) => node.type === "world")).toHaveLength(1);
    expect(inProperty.filter((node) => node.type === "chamber")).toHaveLength(1);
    expect(inProperty.filter((node) => node.type === "inner")).toHaveLength(1);
    expect(inProperty.filter((node) => node.type === "capability")).toHaveLength(0);
    expect(inProperty.filter((node) => node.type === "operation").length).toBe(
      publicSystems().find((system) => system.id === "property")!.does.en.length,
    );
  });

  it("finds the structural path LENA → world → chamber → inner", () => {
    const path = shortestPath(graph, WORLD_GRAPH_IDS.root, WORLD_GRAPH_IDS.inner("property"));
    expect(path.ok).toBe(true);
    expect(path.nodeIds).toEqual([
      WORLD_GRAPH_IDS.root,
      WORLD_GRAPH_IDS.world("property"),
      WORLD_GRAPH_IDS.chamber("property"),
      WORLD_GRAPH_IDS.inner("property"),
    ]);
    expect(path.distance).toBe(3);
  });

  it("shortest-paths two related worlds in one lateral hop", () => {
    const path = shortestPath(graph, WORLD_GRAPH_IDS.world("property"), WORLD_GRAPH_IDS.world("wellness"));
    expect(path.ok).toBe(true);
    expect(path.distance).toBe(1);
    expect(path.steps[1]?.kind).toBe("edge");
    expect((path.steps[1] as { edge: { kind: string } }).edge.kind).toBe("related-to");
  });

  it("can cross two worlds purely through a shared operating root", () => {
    const path = shortestPath(graph, WORLD_GRAPH_IDS.world("property"), WORLD_GRAPH_IDS.world("wellness"), {
      kinds: ["shares-root"],
    });
    expect(path.ok).toBe(true);
    expect(path.distance).toBe(2);
    const middle = nodeById(graph, path.nodeIds[1]!)!;
    expect(middle.type).toBe("capability");
    const property = publicSystems().find((system) => system.id === "property")!;
    const wellness = publicSystems().find((system) => system.id === "wellness")!;
    expect(property.operatingPrimitives).toContain(middle.primitiveId);
    expect(wellness.operatingPrimitives).toContain(middle.primitiveId);
  });

  it("answers hierarchy-only questions with the containment truth: worlds meet at LENA", () => {
    const path = shortestPath(graph, WORLD_GRAPH_IDS.world("property"), WORLD_GRAPH_IDS.world("wellness"), {
      kinds: HIERARCHY_EDGE_KINDS,
    });
    expect(path.ok).toBe(true);
    expect(path.nodeIds).toEqual([WORLD_GRAPH_IDS.world("property"), WORLD_GRAPH_IDS.root, WORLD_GRAPH_IDS.world("wellness")]);
    expect(path.distance).toBe(2);
  });

  it("is deterministic when several shortest paths exist", () => {
    const first = shortestPath(graph, WORLD_GRAPH_IDS.root, WORLD_GRAPH_IDS.capability("money"));
    const second = shortestPath(graph, WORLD_GRAPH_IDS.root, WORLD_GRAPH_IDS.capability("money"));
    expect(second.nodeIds).toEqual(first.nodeIds);
  });

  it("reports unknown nodes and unreachable targets instead of guessing", () => {
    expect(shortestPath(graph, WORLD_GRAPH_IDS.root, "nope").reason).toBe("unknown-node");
    // A detached island cannot reach LENA: no traversal edge connects them.
    const nodes = [...graph.nodes, islandNode("world:island")];
    const island = indexGraph(nodes, graph.edges);
    expect(shortestPath(island, WORLD_GRAPH_IDS.root, "world:island").reason).toBe("unreachable");
    expect(shortestPath(island, "world:island", "world:island").ok).toBe(true);
  });

  it("exposes shared roots of a world and the overlap between two worlds", () => {
    const roots = sharedRootsOf(graph, WORLD_GRAPH_IDS.world("property"));
    expect(roots.map((node) => node.primitiveId)).toEqual([
      ...publicSystems().find((system) => system.id === "property")!.operatingPrimitives,
    ]);
    const overlap = commonRootsOf(graph, WORLD_GRAPH_IDS.world("property"), WORLD_GRAPH_IDS.world("wellness"));
    const property = publicSystems().find((system) => system.id === "property")!;
    const wellness = publicSystems().find((system) => system.id === "wellness")!;
    expect(overlap.map((node) => node.primitiveId).sort()).toEqual(
      property.operatingPrimitives.filter((id) => wellness.operatingPrimitives.includes(id)).sort(),
    );
  });

  it("lists related worlds only where a root is genuinely shared", () => {
    for (const world of worldsOf(graph)) {
      const system = publicSystems().find((entry) => entry.id === world.systemId)!;
      const related = relatedWorldsOf(graph, world.id);
      for (const peer of related) {
        const peerSystem = publicSystems().find((entry) => entry.id === peer.systemId)!;
        expect(
          system.operatingPrimitives.some((id) => peerSystem.operatingPrimitives.includes(id)),
        ).toBe(true);
      }
    }
  });

  it("formats the structural route from the query API, not from hardcoded crumbs", () => {
    const route = structuralPathLabels(graph, WORLD_GRAPH_IDS.root, WORLD_GRAPH_IDS.inner("property"), "en");
    expect(route?.parts).toEqual(["LENA", "MALEK", "MALEK", "MALEK inner space"]);
    expect(route?.separator).toBe(" → ");
    expect(structuralPathLabels(graph, WORLD_GRAPH_IDS.root, "ghost", "en")).toBeNull();
  });
});

describe("navigation seam", () => {
  it("routes a world and its chamber to the canonical chamber path", () => {
    const entity = WORLD_ENTITIES.find((entry) => entry.systemId === "property")!;
    expect(resolveDestination(graph, WORLD_GRAPH_IDS.world("property"))).toEqual({
      kind: "route",
      path: entity.detailPath,
      ownerId: WORLD_GRAPH_IDS.world("property"),
      intent: "descend",
    });
    expect(resolveDestination(graph, WORLD_GRAPH_IDS.chamber("property")).path).toBe(entity.detailPath);
  });

  it("resolves the LENA root to the world field", () => {
    expect(resolveDestination(graph, WORLD_GRAPH_IDS.root).path).toBe("/world");
  });

  it("inherits the nearest routed ancestor for inner spaces and operations", () => {
    const inner = resolveDestination(graph, WORLD_GRAPH_IDS.inner("property"));
    expect(inner.kind).toBe("inherited");
    expect(inner.path).toBe("/world/property");
    expect(inner.ownerId).toBe(WORLD_GRAPH_IDS.chamber("property"));

    const operation = resolveDestination(graph, WORLD_GRAPH_IDS.operation("property", 1));
    expect(operation.kind).toBe("inherited");
    expect(operation.path).toBe("/world/property");
  });

  it("gives a shared root no destination of its own — it is structure, not a page", () => {
    const node = nodeById(graph, WORLD_GRAPH_IDS.capability("money"))!;
    expect(node.route).toBeNull();
    const destination = resolveDestination(graph, node.id);
    // LENA is its parent and the root routes to the world field, so a capability
    // resolves outward to the field rather than to a fictional root page.
    expect(destination.path).toBe("/world");
    expect(destination.ownerId).toBe(WORLD_GRAPH_IDS.root);
    expect(destination.intent).toBe("descend");
  });

  it("marks navigability from the route, not from the node type", () => {
    expect(isNavigable(graph, WORLD_GRAPH_IDS.world("property"))).toBe(true);
    expect(isNavigable(graph, WORLD_GRAPH_IDS.inner("property"))).toBe(false);
    expect(isNavigable(graph, WORLD_GRAPH_IDS.chamber("property"))).toBe(true);
  });
});

describe("integrity validation", () => {
  it("passes on the shipped graph", () => {
    const validation = validateWorldGraph(graph);
    expect(validation.issues).toEqual([]);
    expect(validation.ok).toBe(true);
    expect(() => assertWorldGraphIntegrity(graph)).not.toThrow();
  });

  it("requires every public world to be present", () => {
    const withoutWellness = fixtureInput({ entities: WORLD_ENTITIES.filter((e) => e.systemId !== "wellness") });
    const built = buildWorldGraph(withoutWellness);
    const validation = validateWorldGraph(built, { requiredWorlds: requiredWorldIds() });
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((entry) => entry.code === "missing-world")).toBe(true);
  });

  it("flags duplicate node ids", () => {
    const duplicated = [graph.nodes[0]!, ...graph.nodes];
    const validation = validateWorldGraph(indexGraph(duplicated, graph.edges));
    expect(validation.issues.some((entry) => entry.code === "duplicate-node-id")).toBe(true);
  });

  it("flags orphan edges and missing targets", () => {
    const validation = validateWorldGraph(
      indexGraph(graph.nodes, [...graph.edges, { from: WORLD_GRAPH_IDS.root, to: "ghost:node", kind: "contains" }]),
    );
    expect(validation.issues.some((entry) => entry.code === "missing-edge-target")).toBe(true);
  });

  it("flags missing parents", () => {
    const orphan: WorldGraphNode = {
      ...nodeById(graph, WORLD_GRAPH_IDS.world("property"))!,
      id: "world:orphan",
      parentId: "world:not-here",
      systemId: undefined,
    };
    const validation = validateWorldGraph(indexGraph([...graph.nodes, orphan], graph.edges));
    expect(validation.issues.some((entry) => entry.code === "missing-parent")).toBe(true);
    expect(validation.issues.some((entry) => entry.code === "orphan-node")).toBe(true);
  });

  it("flags nodes that hang off nothing", () => {
    // A second parentless node is both an orphan (unreachable from LENA) and a
    // node whose destination can never resolve, so both checks must fire.
    const detached: WorldGraphNode = {
      id: "world:detached",
      type: "world",
      label: { ar: "منفصل", en: "Detached" },
      parentId: null,
      worldId: null,
      route: null,
      meta: {},
    };
    const validation = validateWorldGraph(indexGraph([...graph.nodes, detached], graph.edges));
    expect(validation.issues.some((entry) => entry.code === "orphan-node")).toBe(true);
    expect(validation.issues.some((entry) => entry.code === "unreachable-destination")).toBe(true);
  });

  it("flags a destination the router does not serve", () => {
    const drifted = fixtureInput({
      entities: WORLD_ENTITIES.map((entity) =>
        entity.systemId === "property" ? { ...entity, detailPath: "/world/not-a-route" } : entity,
      ),
    });
    const validation = validateWorldGraph(buildWorldGraph(drifted));
    expect(validation.issues.some((entry) => entry.code === "invalid-destination")).toBe(true);
  });

  it("flags one route claimed by two different worlds", () => {
    const collided = fixtureInput({
      entities: WORLD_ENTITIES.map((entity) =>
        entity.systemId === "wellness" ? { ...entity, detailPath: "/world/property" } : entity,
      ),
    });
    const validation = validateWorldGraph(buildWorldGraph(collided));
    expect(validation.issues.some((entry) => entry.code === "duplicate-destination")).toBe(true);
  });

  it("flags a chamber without an inner space", () => {
    const nodes = graph.nodes.filter((node) => node.type !== "inner");
    const edges = graph.edges.filter((edge) => !edge.to.startsWith("inner:"));
    const validation = validateWorldGraph(indexGraph(nodes, edges), { requiredWorlds: requiredWorldIds() });
    expect(validation.issues.some((entry) => entry.code === "missing-inner")).toBe(true);
  });

  it("flags a fabricated shares-root claim", () => {
    const forged: WorldGraphNode = {
      id: "root:forged",
      type: "capability",
      label: { ar: "مختلق", en: "Forged" },
      parentId: WORLD_GRAPH_IDS.root,
      worldId: null,
      route: null,
      primitiveId: "integrity",
      meta: { holderCount: 1, maturity: "signal" },
    };
    // `rental` does not claim `integrity`; the edge must not survive validation.
    const rental = publicSystems().find((system) => system.id === "rental")!;
    expect(rental.operatingPrimitives).not.toContain("integrity");
    const validation = validateWorldGraph(
      indexGraph(
        [...graph.nodes.filter((node) => node.id !== WORLD_GRAPH_IDS.capability("integrity")), forged],
        [
          ...graph.edges.filter((edge) => !edge.to.includes(":integrity")),
          { from: WORLD_GRAPH_IDS.world("rental"), to: "root:forged", kind: "shares-root" },
        ],
      ),
    );
    expect(
      validation.issues.some(
        (entry) => entry.code === "invalid-destination" && entry.message.includes("rental"),
      ),
    ).toBe(true);
  });

  it("flags a capability whose declared holders do not match the graph", () => {
    const node = nodeById(graph, WORLD_GRAPH_IDS.capability("money"))!;
    const inflated: WorldGraphNode = { ...node, meta: { ...node.meta, holderCount: 99 } };
    const validation = validateWorldGraph(
      indexGraph(
        graph.nodes.map((entry) => (entry.id === inflated.id ? inflated : entry)),
        graph.edges,
      ),
    );
    expect(validation.issues.some((entry) => entry.message.includes("declares 99 holder"))).toBe(true);
  });

  it("flags a containment cycle", () => {
    const nodes = graph.nodes.map((node) =>
      node.id === WORLD_GRAPH_IDS.world("property")
        ? { ...node, parentId: WORLD_GRAPH_IDS.chamber("property") }
        : node,
    );
    const validation = validateWorldGraph(indexGraph(nodes, graph.edges));
    expect(validation.issues.some((entry) => entry.code === "cycle" || entry.code === "orphan-node")).toBe(true);
  });

  it("flags a self-parent and a self-edge", () => {
    const nodes = graph.nodes.map((node) =>
      node.id === WORLD_GRAPH_IDS.root ? { ...node, parentId: WORLD_GRAPH_IDS.root } : node,
    );
    const validation = validateWorldGraph(
      indexGraph(nodes, [...graph.edges, { from: WORLD_GRAPH_IDS.root, to: WORLD_GRAPH_IDS.root, kind: "enters" }]),
    );
    expect(validation.issues.some((entry) => entry.code === "edge-to-self")).toBe(true);
    expect(validation.issues.some((entry) => entry.code === "cycle")).toBe(true);
  });

  it("fails loudly for an empty graph", () => {
    expect(validateWorldGraph(indexGraph([], [])).issues[0]?.code).toBe("empty-graph");
    expect(() => assertWorldGraphIntegrity(indexGraph([], []))).toThrow(/integrity failed/);
  });

  it("surfaces a useful count and depth summary", () => {
    const stats = graphStats(graph);
    expect(stats.nodes).toBe(graph.nodes.length);
    expect(stats.depth).toBe(4);
    expect(stats.nodesByType["world"]).toBe(publicEntities.length);
    expect(stats.edgesByKind["shares-root"]).toBeGreaterThan(0);
  });

  it("emits exactly one related-to edge per world pair", () => {
    const related = graph.edges.filter((edge) => edge.kind === "related-to");
    const keys = related.map((edge) => [edge.from, edge.to].sort().join("|"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only knows the nine canonical primitives", () => {
    expect(OPERATING_PRIMITIVES).toHaveLength(9);
    for (const node of nodesOfType(graph, "capability")) {
      expect(OPERATING_PRIMITIVES.map((entry) => entry.id)).toContain(node.primitiveId);
    }
  });
});

function islandNode(id: string): WorldGraphNode {
  return {
    id,
    type: "world",
    label: { ar: id, en: id },
    // No parent and no edges: structurally present but unreachable.
    parentId: null,
    worldId: null,
    route: null,
    meta: {},
  };
}
