import { childrenOf, neighborsOf, nodeById, pathFromRoot, worldsOf } from "@/graph";
import type { WorldGraph, WorldGraphEdgeKind, WorldGraphNode } from "@/graph";

/**
 * LENA Atlas — layout derivation.
 *
 * All geometry lives here so the Atlas components only render what they are
 * told. Two properties matter:
 *
 *   - It is *derived*: rings come from graph relations (children, parent,
 *     neighbors, worlds), never from a hand-placed list. Add a chamber to the
 *     registry and the Atlas grows without a layout edit.
 *   - It is *deterministic*: angles are assigned by registry order, so the
 *     same focus always produces the same picture. No force simulation, no
 *     animation loop, no random seed.
 *
 * The field is a focus model, not an overview of everything: at most one ring
 * of children, one ring of context and one ring of worlds are ever plotted, so
 * LENA never collapses into a hairball on screen.
 */

/** Normalized drawing space. Percentages make the field fluid on any viewport. */
export const ATLAS_VIEWBOX = { width: 100, height: 100, unit: "percent" } as const;

export type AtlasNodeRole =
  | "focus"
  | "child"
  | "parent"
  | "neighbor"
  | "world"
  | "root-context";

/** Which ring a node sits on, and how far it may grow. */
export type AtlasRingId = "core" | "depth" | "context" | "field";

export interface AtlasRing {
  id: AtlasRingId;
  /** Radius as a percentage of the field's half-width. The ring's wording is
   *  display vocabulary owned by `selectors.ts`, not layout output. */
  radius: number;
}

export interface AtlasPlacedNode {
  id: string;
  role: AtlasNodeRole;
  ring: AtlasRingId;
  /** Center position in ATLAS_VIEWBOX units. */
  x: number;
  y: number;
  /** Nominal diameter in the same units. */
  size: number;
  /** Degrees, for the node's own label placement. */
  angle: number;
  /** Structural depth from the LENA root — never the only hierarchy cue. */
  depth: number;
  /** Short canonical rank label, e.g. "02", so order is readable in text. */
  rank: string;
}

export interface AtlasLink {
  id: string;
  from: string;
  to: string;
  kind: WorldGraphEdgeKind;
  /** SVG path in ATLAS_VIEWBOX units. */
  d: string;
  /** Three levels only: the eye must read hierarchy without a legend. */
  emphasis: "strong" | "medium" | "faint";
}

export interface AtlasFieldLayout {
  viewBox: typeof ATLAS_VIEWBOX;
  rings: AtlasRing[];
  nodes: AtlasPlacedNode[];
  links: AtlasLink[];
  /** The focused node, or the LENA root when nothing is focused. */
  focusId: string;
  /** True when the field is showing an actual selection. */
  hasFocus: boolean;
}

export interface AtlasFieldOptions {
  focusId?: string | null;
  /** `field` = broader topology with a worlds ring. `stepwise` = no worlds ring. */
  mode?: "field" | "stepwise";
}

const RING_RADII: Record<AtlasRingId, number> = {
  core: 0,
  depth: 27,
  context: 41,
  field: 54,
};

const SIZE_BY_TYPE: Record<string, number> = {
  root: 17,
  world: 14,
  chamber: 12,
  inner: 11,
  operation: 7.5,
  capability: 9.5,
};

const round = (value: number): number => Math.round(value * 100) / 100;

function polar(radius: number, angleDegrees: number): { x: number; y: number } {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: round(50 + Math.cos(radians) * radius),
    y: round(50 + Math.sin(radians) * radius),
  };
}

function sizeFor(graph: WorldGraph, id: string, isFocus: boolean): number {
  const node = nodeById(graph, id);
  const base = SIZE_BY_TYPE[node?.type ?? "operation"] ?? 8;
  return round(Math.min(19, base + (isFocus ? 2.5 : 0)));
}

function depthFor(graph: WorldGraph, id: string): number {
  return Math.max(0, pathFromRoot(graph, id).length - 1);
}

/** A short curve: the control point is pulled toward the field center, which is
 *  what makes containment read as orbiting rather than as a wire diagram. */
export function atlasLinkGeometry(from: AtlasPlacedNode, to: AtlasPlacedNode): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const cx = round(mx + (50 - mx) * 0.18);
  const cy = round(my + (50 - my) * 0.18);
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

function distribute(count: number, startAngle = -90): number[] {
  if (count <= 0) return [];
  if (count === 1) return [startAngle];
  return Array.from({ length: count }, (_, index) => round(startAngle + (360 / count) * index));
}

function placed(
  graph: WorldGraph,
  id: string,
  role: AtlasNodeRole,
  ring: AtlasRingId,
  angle: number,
  index: number,
  isFocus = false,
): AtlasPlacedNode | null {
  const node = nodeById(graph, id);
  if (!node) return null;
  const radius = RING_RADII[ring];
  const position = radius === 0 ? { x: 50, y: 50 } : polar(radius, angle);
  return {
    id,
    role,
    ring,
    ...position,
    size: sizeFor(graph, id, isFocus),
    angle,
    depth: depthFor(graph, id),
    rank: String(index + 1).padStart(2, "0"),
  };
}

export function buildAtlasFieldLayout(
  graph: WorldGraph,
  options: AtlasFieldOptions = {},
): AtlasFieldLayout {
  const requested = options.focusId ? nodeById(graph, options.focusId) : null;
  const focus: WorldGraphNode = requested ?? nodeById(graph, graph.rootId)!;
  const hasFocus = Boolean(requested && requested.id !== graph.rootId);
  const mode = options.mode ?? "field";

  const nodes: AtlasPlacedNode[] = [];
  const placedById = new Map<string, AtlasPlacedNode>();

  const push = (node: AtlasPlacedNode | null) => {
    if (!node || placedById.has(node.id)) return;
    placedById.set(node.id, node);
    nodes.push(node);
  };

  // ── core: the focus ──────────────────────────────────────────────────────
  const focusNode = placed(graph, focus.id, "focus", "core", -90, 0, true);
  push(focusNode);

  // ── depth: containment children, in registry order ───────────────────────
  const children = childrenOf(graph, focus.id);
  const childAngles = distribute(children.length);
  children.forEach((child, index) => {
    push(placed(graph, child.id, "child", "depth", childAngles[index] ?? 0, index));
  });

  // ── context: the parent plus meaningful neighbors ────────────────────────
  const contextIds: string[] = [];
  const parent = focus.parentId ? nodeById(graph, focus.parentId) : null;
  if (parent) contextIds.push(parent.id);
  for (const neighbor of neighborsOf(graph, focus.id, {
    kinds: ["shares-root", "related-to", "enters"],
  })) {
    if (!contextIds.includes(neighbor.node.id)) contextIds.push(neighbor.node.id);
  }
  const contextAngles = distribute(contextIds.length, -90);
  contextIds.forEach((id, index) => {
    push(placed(graph, id, id === parent?.id ? "parent" : "neighbor", "context", contextAngles[index] ?? 0, index));
  });

  // ── field: the other worlds, kept as context rather than content ─────────
  if (mode === "field") {
    const focusWorldBranch = new Set<string>([
      ...(parent ? [parent.id] : []),
      ...children.map((child) => child.id),
      ...contextIds,
    ]);
    const others = worldsOf(graph)
      .map((world) => world.id)
      .filter((id) => id !== focus.id && !focusWorldBranch.has(id));
    const fieldAngles = distribute(others.length, -90);
    others.forEach((id, index) => {
      push(placed(graph, id, "world", "field", fieldAngles[index] ?? 0, index));
    });
  }

  // ── links: only what the focus makes meaningful ──────────────────────────
  const links: AtlasLink[] = [];
  const addLink = (fromId: string, toId: string, kind: WorldGraphEdgeKind, emphasis: AtlasLink["emphasis"]) => {
    const from = placedById.get(fromId);
    const to = placedById.get(toId);
    if (!from || !to || from === to) return;
    links.push({ id: `${kind}:${fromId}->${toId}`, from: fromId, to: toId, kind, emphasis, d: atlasLinkGeometry(from, to) });
  };

  for (const child of children) {
    addLink(focus.id, child.id, "contains", "strong");
  }
  if (parent) addLink(parent.id, focus.id, "contains", "medium");
  for (const id of contextIds) {
    if (id === parent?.id) continue;
    addLink(focus.id, id, "shares-root", "medium");
  }
  if (mode === "field" && focus.id === graph.rootId) {
    // With nothing selected the field is a topology of worlds, so the only
    // honest lines are the shared roots they all sit on.
    for (const link of graph.edges) {
      if (link.kind !== "related-to") continue;
      if (!placedById.has(link.from) || !placedById.has(link.to)) continue;
      addLink(link.from, link.to, "related-to", "faint");
    }
  }

  const ringsUsed = new Set(nodes.map((node) => node.ring));
  const rings = (["core", "depth", "context", "field"] as AtlasRingId[])
    .filter((id) => ringsUsed.has(id) && id !== "core")
    .map((id) => ({ id, radius: RING_RADII[id] }));

  return {
    viewBox: ATLAS_VIEWBOX,
    rings,
    nodes,
    links,
    focusId: focus.id,
    hasFocus,
  };
}

/**
 * The hierarchy read as text and order rather than as position.
 *
 * Both rendering modes use it, and the accessible description is built from it,
 * so a screen-reader user or a reduced-motion visitor gets the same structural
 * information that a sighted user reads off the rings.
 */
export interface AtlasDepthSequence {
  /** LENA down to the focus, inclusive. */
  spine: WorldGraphNode[];
  focus: WorldGraphNode;
  children: WorldGraphNode[];
  neighbors: { node: WorldGraphNode; kind: WorldGraphEdgeKind }[];
  /** `LENA → World → Chamber → Inner destination`, from the query API. */
  trail: string[];
}

export function buildAtlasDepthSequence(
  graph: WorldGraph,
  focusId: string | null,
  locale: "ar" | "en",
): AtlasDepthSequence {
  const focus = (focusId ? nodeById(graph, focusId) : null) ?? nodeById(graph, graph.rootId)!;
  const spine = pathFromRoot(graph, focus.id);
  return {
    spine,
    focus,
    children: childrenOf(graph, focus.id),
    neighbors: neighborsOf(graph, focus.id, { kinds: ["shares-root", "related-to", "enters", "leads-to"] })
      .filter((entry) => entry.node.id !== focus.parentId)
      .map((entry) => ({ node: entry.node, kind: entry.via.kind })),
    trail: spine.map((node) => node.label[locale]),
  };
}
