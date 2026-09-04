import { depthOf, type WorldGraph, type WorldGraphNode } from "@/graph";

/**
 * LENA Atlas — the Atlas-only jump.
 *
 * A local index over graph nodes so a visitor can name a place and land on it
 * inside the Atlas. It is deliberately *not* product search: the candidate set
 * is exactly the structural graph, it never queries content, projects, case
 * studies or the API, and selecting a result changes Atlas focus rather than
 * navigating the app.
 */

export interface AtlasJumpResult {
  node: WorldGraphNode;
  /** Matched haystack, for the result row. */
  matchedOn: "label" | "type" | "primitive";
  /** Lower is better; keeps ordering stable for equal scores. */
  score: number;
}

export interface AtlasJumpIndexEntry {
  nodeId: string;
  /** Pre-folded search text. Folded once per build, not per keystroke. */
  haystack: string;
  type: WorldGraphNode["type"];
  worldId: string | null;
}

export function buildAtlasJumpIndex(graph: WorldGraph): AtlasJumpIndexEntry[] {
  return graph.nodes.map((node) => ({
    nodeId: node.id,
    haystack: [node.label.en, node.label.ar, node.type, node.primitiveId ?? "", node.worldId ?? ""]
      .join(" ")
      .toLowerCase(),
    type: node.type,
    worldId: node.worldId,
  }));
}

/** Ranked, deduplicated, capped. Empty query yields no results on purpose. */
export function atlasJumpSearch(
  index: readonly AtlasJumpIndexEntry[],
  graph: WorldGraph,
  query: string,
  limit = 6,
): AtlasJumpResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const results: AtlasJumpResult[] = [];
  for (const entry of index) {
    const node = graph.nodesById.get(entry.nodeId);
    if (!node) continue;
    const labelEn = node.label.en.toLowerCase();
    const labelAr = node.label.ar.toLowerCase();
    let matchedOn: AtlasJumpResult["matchedOn"] = "label";
    let score = 60;

    if (labelEn.startsWith(needle) || labelAr.startsWith(needle)) {
      score = 0;
    } else if (labelEn.includes(needle) || labelAr.includes(needle)) {
      score = 20;
    } else if (node.type.includes(needle)) {
      matchedOn = "type";
      score = 40;
    } else if (entry.haystack.includes(needle)) {
      matchedOn = node.primitiveId ? "primitive" : "label";
      score = 55;
    } else {
      continue;
    }

    // Shallower structure is more findable: LENA and its worlds outrank a
    // same-named chamber or operation, so a name never buries its entrance.
    score += depthOf(graph, node.id) * 4;
    results.push({ node, matchedOn, score });
  }

  return results
    .sort((a, b) => a.score - b.score || a.node.id.localeCompare(b.node.id))
    .slice(0, limit);
}
