import { describe, expect, it } from "vitest";
import { WORLD_GRAPH_IDS, childrenOf, worldGraph } from "@/graph";
import {
  ATLAS_VIEWBOX,
  atlasLinkGeometry,
  buildAtlasDepthSequence,
  buildAtlasFieldLayout,
} from "@/features/world/atlas/layout";
import { atlasNodeKey } from "@/features/world/atlas/selectors";

/**
 * Atlas layout derivation.
 *
 * The layout is the part of Atlas most likely to drift into "hand-placed
 * artwork", so it is pinned here as a pure function of the graph: same graph +
 * same focus → same geometry, and every plotted node must exist in the graph.
 */

const graph = worldGraph();
const propertyWorld = WORLD_GRAPH_IDS.world("property");
const propertyChamber = WORLD_GRAPH_IDS.chamber("property");

describe("field layout", () => {
  it("is a pure function of the graph and the focus", () => {
    const a = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const b = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    expect(a).toEqual(b);
  });

  it("puts the focus at the exact center", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const focus = layout.nodes.find((node) => node.role === "focus");
    expect(focus?.id).toBe(propertyWorld);
    expect(focus?.x).toBe(50);
    expect(focus?.y).toBe(50);
    expect(focus?.ring).toBe("core");
  });

  it("falls back to the LENA root when nothing is focused", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: null, mode: "field" });
    expect(layout.focusId).toBe(graph.rootId);
    expect(layout.hasFocus).toBe(false);
    expect(childrenOf(graph, graph.rootId).map((node) => node.id).every((id) =>
      layout.nodes.some((node) => node.id === id),
    )).toBe(true);
  });

  it("plots containment on the depth ring and never more nodes than exist", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const children = layout.nodes.filter((node) => node.role === "child");
    expect(children.map((node) => node.id)).toEqual([propertyChamber]);
    expect(children[0]!.ring).toBe("depth");
    expect(layout.nodes.length).toBeLessThan(graph.nodes.length);
    for (const node of layout.nodes) {
      expect(graph.nodesById.has(node.id)).toBe(true);
    }
  });

  it("rings grow outward and are reported in that order", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const radii = layout.rings.map((ring) => ring.radius);
    expect([...radii].sort((a, b) => a - b)).toEqual(radii);
    expect(radii[0]).toBeLessThan(radii[radii.length - 1]!);
    expect(radii).not.toContain(0);
  });

  it("stepwise mode drops the worlds ring, which is what makes mobile a different structure", () => {
    // Deep inside a chamber nothing relates laterally, so the desktop field is
    // what keeps the rest of LENA in view. Mobile drops exactly that ring.
    const deep = WORLD_GRAPH_IDS.operation("property", 0);
    const field = buildAtlasFieldLayout(graph, { focusId: deep, mode: "field" });
    const stepwise = buildAtlasFieldLayout(graph, { focusId: deep, mode: "stepwise" });
    expect(field.nodes.some((node) => node.ring === "field")).toBe(true);
    expect(stepwise.nodes.some((node) => node.ring === "field")).toBe(false);
    expect(stepwise.nodes.length).toBeLessThan(field.nodes.length);
    // A focused world already sees its peers through shared roots, so both
    // modes agree there: the ring is not a place to hide information.
    const worldField = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const worldStep = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "stepwise" });
    expect(worldStep.nodes.map((node) => node.id).sort()).toEqual(
      worldField.nodes.map((node) => node.id).sort(),
    );
  });

  it("emits one link per meaningful relation, always between plotted nodes", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const plotted = new Set(layout.nodes.map((node) => node.id));
    for (const link of layout.links) {
      expect(plotted.has(link.from)).toBe(true);
      expect(plotted.has(link.to)).toBe(true);
      expect(link.emphasis).toMatch(/^(strong|medium|faint)$/);
    }
    // The focused branch's containment is always the loudest thing on screen.
    expect(layout.links.some((link) => link.emphasis === "strong" && link.kind === "contains")).toBe(true);
    const keys = layout.links.map((link) => link.id);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps geometry inside the normalized box", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(ATLAS_VIEWBOX.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(ATLAS_VIEWBOX.height);
      expect(node.size).toBeGreaterThan(0);
    }
  });

  it("curves links toward the center instead of drawing straight wires", () => {
    const layout = buildAtlasFieldLayout(graph, { focusId: propertyWorld, mode: "field" });
    const child = layout.nodes.find((node) => node.role === "child")!;
    const focus = layout.nodes.find((node) => node.role === "focus")!;
    const d = atlasLinkGeometry(focus, child);
    expect(d.startsWith("M ")).toBe(true);
    expect(d).toContain("Q");
    // A curve, not a straight wire: the control point sits closer to the
    // center than the geometric midpoint does.
    const numbers = d.split(/[\s,]+/).map(Number);
    const cx = numbers[4]!;
    const cy = numbers[5]!;
    const distance = (x: number, y: number) => Math.hypot(x - 50, y - 50);
    expect(distance(cx, cy)).toBeLessThan(distance((focus.x + child.x) / 2, (focus.y + child.y) / 2));
  });
});

describe("depth sequence", () => {
  it("reads LENA down to the focus and labels each level", () => {
    const sequence = buildAtlasDepthSequence(graph, WORLD_GRAPH_IDS.inner("property"), "en");
    expect(sequence.spine.map((node) => node.type)).toEqual(["root", "world", "chamber", "inner"]);
    expect(sequence.trail[0]).toBe("LENA");
    expect(sequence.trail[sequence.trail.length - 1]).toContain("inner space");
    expect(sequence.focus.id).toBe(WORLD_GRAPH_IDS.inner("property"));
  });

  it("exposes children and meaningful neighbors without inventing either", () => {
    const sequence = buildAtlasDepthSequence(graph, propertyChamber, "en");
    expect(sequence.children.map((node) => node.id)).toEqual([WORLD_GRAPH_IDS.inner("property")]);
    // The parent is not also listed as a neighbor.
    expect(sequence.neighbors.some((entry) => entry.node.id === propertyWorld)).toBe(false);
    expect(sequence.neighbors.length).toBeGreaterThan(0);
  });

  it("keeps Arabic labels available for every level", () => {
    const inner = WORLD_GRAPH_IDS.inner("property");
    const arabic = buildAtlasDepthSequence(graph, inner, "ar");
    const english = buildAtlasDepthSequence(graph, inner, "en");
    expect(arabic.trail).toHaveLength(4);
    expect(english.trail).toHaveLength(4);
    // Brand names stay Latin because the registry keeps them Latin; the
    // structural wording is composed by the graph and is genuinely Arabic.
    expect(/[\u0600-\u06FF]{3,}/u.test(arabic.trail[3]!)).toBe(true);
    expect(english.trail[3]).toContain("inner space");
  });
});

describe("qa keys", () => {
  it("turns structural ids into CSS-safe attribute values", () => {
    expect(atlasNodeKey(propertyChamber)).toBe("chamber-property");
    expect(atlasNodeKey(graph.rootId)).toBe("lena");
    for (const node of graph.nodes) {
      expect(atlasNodeKey(node.id)).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});
