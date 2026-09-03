import { describe, expect, it } from "vitest";
import {
  CanonicalWorldGraphAdapter,
  canonicalWorldGraphAdapter,
} from "./CanonicalWorldGraphAdapter";

const PUBLIC_WORLDS = [
  "property",
  "wellness",
  "rental",
  "investment",
  "hospitality",
  "recycling",
];

describe("CanonicalWorldGraphAdapter", () => {
  it("exposes the live canonical graph", () => {
    expect(canonicalWorldGraphAdapter.available).toBe(true);
  });

  it("keeps the home threshold outside the graph but connected to World", () => {
    expect(canonicalWorldGraphAdapter.neighbors("/")).toEqual(["/world"]);
    expect(canonicalWorldGraphAdapter.shortestPath("/", "/world")).toEqual([
      "/",
      "/world",
    ]);
  });

  it("maps the canonical LENA root to the six public worlds", () => {
    const neighbors = canonicalWorldGraphAdapter.neighbors("/world");
    expect(neighbors).not.toBeNull();
    expect(new Set(neighbors)).toEqual(new Set(PUBLIC_WORLDS));
  });

  it("maps world nodes back to system ids without leaking graph ids", () => {
    const neighbors = canonicalWorldGraphAdapter.neighbors("property");
    expect(neighbors).not.toBeNull();
    expect(neighbors).toContain("/world");
    expect(neighbors?.some((id) => id.startsWith("world:"))).toBe(false);
  });

  it("uses the canonical graph for structural paths", () => {
    expect(canonicalWorldGraphAdapter.shortestPath("/world", "recycling")).toEqual([
      "/world",
      "recycling",
    ]);
    expect(canonicalWorldGraphAdapter.shortestPath("/", "recycling")).toEqual([
      "/",
      "/world",
      "recycling",
    ]);
  });

  it("returns null for unknown systems instead of inventing topology", () => {
    const adapter = new CanonicalWorldGraphAdapter();
    expect(adapter.neighbors("unknown-world")).toBeNull();
    expect(adapter.shortestPath("property", "unknown-world")).toBeNull();
  });
});
