import { describe, expect, it } from "vitest";
import {
  emptyGraphContextAdapter,
  graphNodeFor,
  InMemoryGraphContextAdapter,
} from "./GraphContextAdapter";
import { makeGraph, PUB_WORLD_IDS } from "../testing/fixtures";

describe("graph/GraphContextAdapter seam", () => {
  it("empty adapter is unavailable and answers null safely", () => {
    expect(emptyGraphContextAdapter.available).toBe(false);
    expect(emptyGraphContextAdapter.neighbors("property")).toBeNull();
    expect(emptyGraphContextAdapter.shortestPath("/", "property")).toBeNull();
  });

  it("in-memory adapter reports neighbors deterministically", () => {
    const graph = makeGraph();
    expect(graph.available).toBe(true);
    expect(graph.neighbors("/world")).toEqual(["/", ...PUB_WORLD_IDS]);
    expect(graph.neighbors("rental")).toEqual(["/world", "recycling"]);
    // Same query twice → same output (no internal ordering drift).
    expect(graph.neighbors("/world")).toEqual(["/", ...PUB_WORLD_IDS]);
  });

  it("unknown nodes answer null, empty-known nodes answer []", () => {
    const graph = new InMemoryGraphContextAdapter();
    graph.addEdge("a", "b");
    expect(graph.neighbors("ghost")).toBeNull();
    const lonely = new InMemoryGraphContextAdapter();
    lonely.addEdge("solo", "solo");
    expect(lonely.neighbors("other")).toBeNull();
  });

  it("shortestPath is deterministic and includes both endpoints", () => {
    const graph = makeGraph();
    expect(graph.shortestPath("/", "property")).toEqual(["/", "/world", "property"]);
    // Repeated query returns the identical path array content.
    expect(graph.shortestPath("/", "property")).toEqual(["/", "/world", "property"]);
    expect(graph.shortestPath("rental", "recycling")).toEqual(["rental", "recycling"]);
    expect(graph.shortestPath("wellness", "recycling")).toEqual([
      "wellness",
      "/world",
      "recycling",
    ]);
  });

  it("shortestPath reports null for unreachable or unknown nodes", () => {
    const graph = makeGraph();
    expect(graph.shortestPath("/", "ghost")).toBeNull();
    const empty = new InMemoryGraphContextAdapter();
    expect(empty.shortestPath("a", "b")).toBeNull();
    expect(graph.shortestPath("property", "property")).toEqual(["property"]);
  });

  it("graphNodeFor maps LENA spaces to reserved/structural node ids", () => {
    expect(graphNodeFor("home")).toBe("/");
    expect(graphNodeFor("world")).toBe("/world");
    expect(graphNodeFor("chamber", "property")).toBe("property");
    expect(graphNodeFor("chamber", null)).toBeNull();
    expect(graphNodeFor(null)).toBeNull();
    expect(graphNodeFor("chamber")).toBeNull();
  });
});
