import { publicSystems, type BusinessSystem } from "@/content/systems";
import {
  WORLD_ENTITIES,
  worldSystem,
  type WorldEntity,
} from "@/features/world/content/world";
import {
  OPERATING_PRIMITIVES,
  buildConstellationRoots,
  type ConstellationRoot,
} from "@/features/world/content/operating-primitives";
import type {
  LocalizedLabel,
  WorldGraph,
  WorldGraphEdge,
  WorldGraphNode,
} from "./types";

/**
 * LENA World Graph — the canonical builder.
 *
 * ONE builder, ONE truth: it transforms the registries that already own each
 * fact and adds nothing of its own.
 *
 *   world identity, stage, operations, operating roots  -> content/systems.ts
 *   world membership, DNA, state, chamber route          -> features/world/content/world.ts
 *   operating root definitions, shared/signal maturity   -> features/world/content/operating-primitives.ts
 *   inner space (chamber focus, not a separate URL)      -> the chamber's own contract
 *
 * Properties that make it usable as runtime infrastructure:
 *   - deterministic: same registries -> byte-identical node and edge lists;
 *   - stable ids: derived from canonical ids, never from translated copy;
 *   - safe around optional data: an entity whose system is hidden contributes
 *     nothing, and a missing primitive definition does not throw;
 *   - testable without React: no imports from any component tree;
 *   - pure: no module-level caches, no side effects, no timers.
 */

/** Everything the builder reads. Overridable so integrity tests can feed it
 *  deliberately drifted registries without touching the real ones. */
export interface WorldGraphInput {
  entities: readonly WorldEntity[];
  /** The canonical public systems. A system missing here is not public. */
  systems: readonly BusinessSystem[];
  roots: readonly ConstellationRoot[];
  primitiveLabels: Record<string, LocalizedLabel>;
}

/** Structural id prefixes. One place so queries and tests never hand-write. */
export const WORLD_GRAPH_IDS = {
  root: "lena",
  world: (systemId: string) => `world:${systemId}`,
  chamber: (systemId: string) => `chamber:${systemId}`,
  inner: (systemId: string) => `inner:${systemId}`,
  operation: (systemId: string, index: number) => `operation:${systemId}:${index}`,
  capability: (primitiveId: string) => `root:${primitiveId}`,
} as const;

/** Resolve the system record for an entity without re-implementing the lookup. */
function systemFor(entity: WorldEntity, systems: readonly BusinessSystem[]): BusinessSystem | undefined {
  return systems.find((system) => system.id === entity.systemId);
}

/**
 * The registry snapshot the shipped graph is built from. Consumers should not
 * assemble registries themselves — `buildWorldGraph()` without arguments is the
 * canonical entry point.
 */
export function defaultWorldGraphInput(): WorldGraphInput {
  const systems = publicSystems();
  const primitiveLabels: Record<string, LocalizedLabel> = {};
  for (const primitive of OPERATING_PRIMITIVES) {
    primitiveLabels[primitive.id] = { ar: primitive.label.ar, en: primitive.label.en };
  }
  return {
    entities: WORLD_ENTITIES,
    systems,
    roots: buildConstellationRoots(systems),
    primitiveLabels,
  };
}

export function buildWorldGraph(input: WorldGraphInput = defaultWorldGraphInput()): WorldGraph {
  const nodes: WorldGraphNode[] = [];
  const edges: WorldGraphEdge[] = [];

  const publicSystemsById = new Map(input.systems.map((system) => [system.id, system]));
  const isPublicWorld = (entity: WorldEntity) => publicSystemsById.has(entity.systemId);

  // ── LENA root ────────────────────────────────────────────────────────────
  nodes.push({
    id: WORLD_GRAPH_IDS.root,
    type: "root",
    label: { ar: "لين", en: "LENA" },
    parentId: null,
    worldId: null,
    route: "/world",
    // No authored copy here: the LENA root has no registry record to quote, and
    // the graph must not invent positioning text. Atlas wording is display
    // vocabulary and lives in `features/world/atlas/selectors.ts`.
    meta: {},
  });

  // The World field is not a registry entry of its own; the root's destination
  // *is* the world. Rather than invent a "world:field" node with no canonical
  // owner, the graph contains each world as a child of LENA and lets the root
  // route stand for the field itself.
  const orderedEntities = input.entities.filter(isPublicWorld);

  for (const entity of orderedEntities) {
    const system = systemFor(entity, input.systems);
    if (!system) continue;

    const worldId = WORLD_GRAPH_IDS.world(entity.systemId);
    const chamberId = WORLD_GRAPH_IDS.chamber(entity.systemId);
    const innerId = WORLD_GRAPH_IDS.inner(entity.systemId);
    const operations = system.does.en;

    // ── world ──────────────────────────────────────────────────────────────
    nodes.push({
      id: worldId,
      type: "world",
      label: { ar: system.name.ar, en: system.name.en },
      parentId: WORLD_GRAPH_IDS.root,
      worldId: entity.systemId,
      route: entity.detailPath,
      systemId: entity.systemId,
      meta: {
        dna: entity.dna,
        state: entity.state,
        status: system.stage,
        primitiveIds: [...system.operatingPrimitives],
        operationCount: operations.length,
        summary: system.tagline ?? system.industry,
      },
    });
    edges.push({
      from: WORLD_GRAPH_IDS.root,
      to: worldId,
      kind: "contains",
    });

    // ── chamber (the calm route a world opens into) ────────────────────────
    nodes.push({
      id: chamberId,
      type: "chamber",
      label: { ar: system.name.ar, en: system.name.en },
      parentId: worldId,
      worldId: entity.systemId,
      // The chamber route and the world entrance are the same canonical URL on
      // purpose: `content/systems.ts` gives no separate chamber address.
      route: entity.detailPath,
      systemId: entity.systemId,
      meta: {
        dna: entity.dna,
        state: entity.state,
        status: system.stage,
        primitiveIds: [...system.operatingPrimitives],
        operationCount: operations.length,
        summary: system.problem,
      },
    });
    edges.push({ from: worldId, to: chamberId, kind: "contains" });
    // Entering a chamber from its world entrance is the `descend` move the
    // World portal already performs; the graph names it so Atlas can reuse it.
    edges.push({ from: worldId, to: chamberId, kind: "enters" });

    // ── inner space ────────────────────────────────────────────────────────
    // The chamber's inner constellation is a spatial focus inside the same
    // route, not a second URL. `route: null` encodes that exactly.
    nodes.push({
      id: innerId,
      type: "inner",
      label: {
        ar: `فضاء ${system.name.ar} الداخلي`,
        en: `${system.name.en} inner space`,
      },
      parentId: chamberId,
      worldId: entity.systemId,
      route: null,
      systemId: entity.systemId,
      meta: { operationCount: operations.length, dna: entity.dna },
    });
    edges.push({ from: chamberId, to: innerId, kind: "enters" });

    // ── operations (inner constellation nodes) ─────────────────────────────
    // Every node comes straight from the canonical `does` list, in registry
    // order. No inferred workflow sequence, no invented capability.
    // `does` is the canonical verb list; the Arabic array is its own registry
    // entry, so operations carry both and the graph adds no translation.
    const operationsAr = system.does.ar;
    const operationLabels: LocalizedLabel[] = operations.map((_, index) => ({
      ar: operationsAr[index] ?? operations[index] ?? "",
      en: operations[index] ?? "",
    }));

    operations.forEach((operation, index) => {
      const operationId = WORLD_GRAPH_IDS.operation(entity.systemId, index);
      nodes.push({
        id: operationId,
        type: "operation",
        label: operationLabels[index] ?? { ar: operation, en: operation },
        parentId: innerId,
        worldId: entity.systemId,
        route: null,
        systemId: entity.systemId,
        meta: { operationLabel: operationLabels[index] },
      });
      edges.push({ from: innerId, to: operationId, kind: "leads-to" });
    });
  }

  // ── shared operating roots ───────────────────────────────────────────────
  // `buildConstellationRoots` already filters to roots at least one public
  // system claims and computes shared/signal maturity from the same data.
  for (const root of input.roots) {
    const holdingWorlds = orderedEntities.filter((entity) =>
      root.systemIds.includes(entity.systemId),
    );
    if (holdingWorlds.length === 0) continue;

    const label = input.primitiveLabels[root.id];
    const capabilityId = WORLD_GRAPH_IDS.capability(root.id);

    nodes.push({
      id: capabilityId,
      type: "capability",
      label: label ?? { ar: root.id, en: root.id },
      parentId: WORLD_GRAPH_IDS.root,
      worldId: null,
      // A shared root is a structural truth, not a page: no destination.
      route: null,
      primitiveId: root.id,
      meaning: root.meaning,
      meta: {
        maturity: root.maturity,
        holderCount: holdingWorlds.length,
      },
    });

    for (const entity of holdingWorlds) {
      const worldId = WORLD_GRAPH_IDS.world(entity.systemId);
      edges.push({ from: worldId, to: capabilityId, kind: "shares-root" });
      edges.push({ from: capabilityId, to: worldId, kind: "belongs-to" });
    }
  }

  // ── related-to ───────────────────────────────────────────────────────────
  // Two worlds are related when they claim at least the same operating root.
  // Exactly one edge per pair: the *number* of shared roots is a query
  // (commonRootsOf), and repeating the edge per root would inflate path
  // weights and make the graph look noisier than the truth is.
  const relatedPairs = new Set<string>();
  for (const root of input.roots) {
    const peers = orderedEntities
      .filter((entity) => root.systemIds.includes(entity.systemId))
      .map((entity) => WORLD_GRAPH_IDS.world(entity.systemId));
    for (let i = 0; i < peers.length; i += 1) {
      for (let j = i + 1; j < peers.length; j += 1) {
        const key = `${peers[i]}|${peers[j]}`;
        if (relatedPairs.has(key)) continue;
        relatedPairs.add(key);
        edges.push({ from: peers[i]!, to: peers[j]!, kind: "related-to" });
      }
    }
  }

  return indexGraph(nodes, edges);
}

/** Build the lookup indexes. Kept separate so validation can run on raw
 *  arrays before any dedupe silently hides a collision. */
export function indexGraph(
  nodes: readonly WorldGraphNode[],
  edges: readonly WorldGraphEdge[],
): WorldGraph {
  const nodesById = new Map<string, WorldGraphNode>();
  for (const node of nodes) {
    if (!nodesById.has(node.id)) nodesById.set(node.id, node);
  }
  const adjacency = new Map<string, WorldGraphEdge[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from)!.push(edge);
    adjacency.get(edge.to)!.push(edge);
  }
  return {
    nodes: nodes.slice(),
    edges: edges.slice(),
    nodesById,
    adjacency,
    rootId: WORLD_GRAPH_IDS.root,
  };
}

/** The shipped LENA graph. Built once per module load from canonical inputs. */
let cached: WorldGraph | null = null;

/**
 * Canonical accessor used by Atlas and any later consumer (AI navigation,
 * World Memory, signals). Deterministic and side-effect free.
 */
export function worldGraph(): WorldGraph {
  if (!cached) cached = buildWorldGraph(defaultWorldGraphInput());
  return cached;
}

/** Test hook: drop the memoized graph so a fixture can take its place. */
export function resetWorldGraphCache(): void {
  cached = null;
}
