// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { PreferencesProvider } from "@/providers/preferences";
import { SignalRuntimeProvider } from "@/features/world/signals";
import { WORLD_ENTITIES } from "@/features/world/content/world";
import { publicSystems } from "@/content/systems";
import {
  WORLD_GRAPH_IDS,
  childrenOf,
  nodeById,
  resolveDestination,
  worldGraph,
} from "@/graph";
import { ATLAS_ROOT_SELECTOR, ATLAS_TEST_IDS, atlasNodeKey } from "@/features/world/atlas/selectors";
import { buildAtlasFieldLayout } from "@/features/world/atlas/layout";
import { atlasJumpSearch, buildAtlasJumpIndex } from "@/features/world/atlas/jump";
import WorldAtlas from "@/pages/WorldAtlas";
import WorldSystem from "@/pages/WorldSystem";
import { resetNavigationDirectionTracking, worldMemory } from "@/lib/spatial";

/**
 * Atlas — behavior, not pixels.
 *
 * What these tests hold the page to: the route actually resolves to Atlas
 * rather than being swallowed by `/world/:systemId`; focus is in-scene and
 * derived; the destination handed to the router is the canonical chamber path;
 * keyboard movement works without a pointer; and the narrow-viewport mode is a
 * different structure, not a squeezed desktop field. Visual baselines remain
 * the Guardian's job.
 */

const isMobileMock = vi.fn(() => false);

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileMock(),
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderAtlas(initialPath = "/world/atlas", locale: "ar" | "en" = "en") {
  const router = createMemoryRouter(
    [
      { path: "/world/atlas", element: <><WorldAtlas /><LocationProbe /></> },
      { path: "/world/:systemId", element: <><WorldSystem /><LocationProbe /></> },
      { path: "/world", element: <LocationProbe /> },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(
    <PreferencesProvider initialLocale={locale}>
      <SignalRuntimeProvider>
        <RouterProvider router={router} />
      </SignalRuntimeProvider>
    </PreferencesProvider>,
  );
  return { ...view, router };
}

const graph = worldGraph();

beforeEach(() => {
  isMobileMock.mockReturnValue(false);
  window.localStorage.clear();
  worldMemory.reset();
  resetNavigationDirectionTracking();
});

afterEach(() => {
  cleanup();
});

function scene() {
  return document.querySelector<HTMLElement>(ATLAS_ROOT_SELECTOR);
}

/** Structural ids contain ":"; the Atlas renders a CSS-safe key for selection. */
function nodeButton(id: string) {
  return document.querySelector<HTMLButtonElement>(`[data-atlas-node-key="${atlasNodeKey(id)}"]`);
}

function field() {
  return document.querySelector<HTMLElement>(".lena-atlas-field");
}

describe("route and surface", () => {
  it("renders the Atlas at /world/atlas instead of falling into a chamber route", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    expect(screen.getByTestId("location").textContent).toBe("/world/atlas");
    expect(scene()?.getAttribute("data-atlas-mode")).toBe("field");
  });

  it("shows the canonical topology it is standing for", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    const publicCount = WORLD_ENTITIES.filter((entity) =>
      publicSystems().some((system) => system.id === entity.systemId),
    ).length;
    expect(screen.getByText(new RegExp(`${publicCount} worlds`, "u"))).toBeTruthy();
    // Nothing on the field is invented: only graph nodes are rendered.
    const rendered = Array.from(document.querySelectorAll("[data-atlas-node-id]")).map(
      (element) => (element as HTMLElement).dataset.atlasNodeId,
    );
    for (const id of rendered) expect(nodeById(graph, id ?? "")).not.toBeNull();
    expect(rendered.length).toBeGreaterThan(1);
  });

  it("renders the unstyled-but-structural Arabic copy without an English fallback", async () => {
    renderAtlas("/world/atlas", "ar");
    await waitFor(() => expect(scene()).not.toBeNull());
    expect(screen.getByText("الأطلس")).toBeTruthy();
  });
});

describe("focus mode", () => {
  it("establishes focus in-scene and reveals parent, children and neighbors", async () => {
    const worldId = WORLD_GRAPH_IDS.world("property");
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());

    const center = nodeById(graph, graph.rootId)!;
    expect(childrenOf(graph, center.id).length).toBeGreaterThan(0);

    fireEvent.click(nodeButton(worldId)!);

    const panel = document.getElementById(ATLAS_TEST_IDS.focusPanel);
    expect(panel).toBeTruthy();
    const system = publicSystems().find((entry) => entry.id === "property")!;
    expect(panel?.textContent).toContain(system.name.en);

    // Children of the focused world are exposed inside the scene.
    expect(nodeButton(WORLD_GRAPH_IDS.chamber("property"))).not.toBeNull();

    // The context trail is the graph query's answer, not a hardcoded crumb.
    const context = document.getElementById(ATLAS_TEST_IDS.context);
    expect(context?.textContent).toContain("LENA");
    expect(context?.textContent).toContain(system.name.en);
  });

  it("keeps the focused branch dominant and never plots the whole graph", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    fireEvent.click(nodeButton(WORLD_GRAPH_IDS.world("property"))!);

    const placed = buildAtlasFieldLayout(graph, { focusId: WORLD_GRAPH_IDS.world("property"), mode: "field" }).nodes;
    const rendered = Array.from(document.querySelectorAll("[data-atlas-node-id]"));
    expect(rendered).toHaveLength(placed.length);
    expect(placed.length).toBeLessThan(graph.nodes.length);
    expect(placed.some((entry) => entry.role === "focus")).toBe(true);
    expect(placed.filter((entry) => entry.role === "child").length).toBe(
      childrenOf(graph, WORLD_GRAPH_IDS.world("property")).length,
    );
  });

  it("releasing focus returns to the world field", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    const worldId = WORLD_GRAPH_IDS.world("property");
    fireEvent.click(nodeButton(worldId)!);
    expect(field()?.getAttribute("data-atlas-focused")).toBe("true");
    fireEvent.click(nodeButton(worldId)!);
    await waitFor(() => expect(field()?.getAttribute("data-atlas-focused")).toBe("false"));
  });
});

describe("canonical navigation", () => {
  it("hands the chamber destination to the spatial navigation layer", async () => {
    const { router } = renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    fireEvent.click(nodeButton(WORLD_GRAPH_IDS.world("property"))!);

    const destination = document.getElementById(ATLAS_TEST_IDS.destination);
    const entity = WORLD_ENTITIES.find((entry) => entry.systemId === "property")!;
    expect(destination?.getAttribute("data-atlas-destination-path")).toBe(entity.detailPath);

    fireEvent.click(destination!);
    await waitFor(() => expect(router.state.location.pathname).toBe(entity.detailPath));
  });

  it("resolves a leaf through its ancestor instead of a fictional route", async () => {
    // The seam itself: an operation is not a URL, so it inherits its chamber.
    const operationId = WORLD_GRAPH_IDS.operation("property", 1);
    const resolved = resolveDestination(graph, operationId);
    expect(resolved.kind).toBe("inherited");
    expect(resolved.path).toBe("/world/property");

    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    fireEvent.click(nodeButton(WORLD_GRAPH_IDS.world("property"))!);
    const chamberButton = nodeButton(WORLD_GRAPH_IDS.chamber("property"));
    expect(chamberButton).not.toBeNull();
    fireEvent.click(chamberButton!);
    const panel = document.getElementById(ATLAS_TEST_IDS.focusPanel);
    expect(panel?.textContent).toContain("Enter");
  });

  it("leaves a shared root without a destination rather than inventing one", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    // The LENA center shows worlds; a capability node has no route of its own.
    const capability = nodeById(graph, WORLD_GRAPH_IDS.capability("money"))!;
    expect(capability.route).toBeNull();
  });
});

describe("keyboard", () => {
  it("moves between nodes with the arrow keys", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-atlas-node-id]"));
    buttons[0]!.focus();
    const sceneElement = document.querySelector(".lena-atlas-scene")!;

    fireEvent.keyDown(sceneElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(sceneElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("descends and ascends the hierarchy with ArrowDown and ArrowUp", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    const sceneElement = document.querySelector(".lena-atlas-scene")!;
    const rootButton = nodeButton(graph.rootId)!;
    rootButton.focus();

    fireEvent.keyDown(sceneElement, { key: "ArrowDown" });
    await waitFor(() => expect(field()?.getAttribute("data-atlas-focused")).toBe("true"));
    // The scene's center is now the first canonical world, not LENA itself.
    expect(document.querySelector<HTMLElement>("[data-atlas-node-role=\"focus\"]")?.getAttribute("data-atlas-node-id")).toBe(
      childrenOf(graph, graph.rootId)[0]!.id,
    );

    fireEvent.keyDown(sceneElement, { key: "ArrowUp" });
    await waitFor(() => expect(document.activeElement?.getAttribute("data-atlas-node-id")).toBe(graph.rootId));
  });

  it("clears focus on Escape", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    fireEvent.click(nodeButton(WORLD_GRAPH_IDS.world("property"))!);
    const sceneElement = document.querySelector(".lena-atlas-scene")!;
    fireEvent.keyDown(sceneElement, { key: "Escape" });
    await waitFor(() => expect(field()?.getAttribute("data-atlas-focused")).toBe("false"));
  });
});

describe("jump", () => {
  it("indexes only graph nodes and never leaves the Atlas", async () => {
    const index = buildAtlasJumpIndex(graph);
    expect(index).toHaveLength(graph.nodes.length);
    const results = atlasJumpSearch(index, graph, "malek");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.node.id).toBe(WORLD_GRAPH_IDS.world("property"));
    // The candidate set is structure, so a result can never be a content route.
    for (const result of results) expect(graph.nodesById.has(result.node.id)).toBe(true);
  });

  it("selecting a result focuses the node in the scene", async () => {
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    const input = document.querySelector<HTMLInputElement>(`#${ATLAS_TEST_IDS.jump} input`)!;
    fireEvent.change(input, { target: { value: "wellness" } });
    const option = await waitFor(() => {
      const found = document.querySelector<HTMLButtonElement>(
        `[data-atlas-jump-key="${atlasNodeKey(WORLD_GRAPH_IDS.world("wellness"))}"]`,
      );
      expect(found).not.toBeNull();
      return found!;
    });
    fireEvent.mouseDown(option);
    await waitFor(() => expect(field()?.getAttribute("data-atlas-focused")).toBe("true"));
    expect(screen.getByTestId("location").textContent).toBe("/world/atlas");
  });
});

describe("mobile structural mode", () => {
  it("renders stepwise depth instead of the field", async () => {
    isMobileMock.mockReturnValue(true);
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    expect(scene()?.getAttribute("data-atlas-mode")).toBe("stepwise");
    expect(document.getElementById(ATLAS_TEST_IDS.stepwise)).toBeTruthy();
    expect(document.getElementById(ATLAS_TEST_IDS.field)).toBeNull();
  });

  it("keeps parent context, children and the destination reachable in the rail", async () => {
    isMobileMock.mockReturnValue(true);
    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    fireEvent.click(nodeButton(WORLD_GRAPH_IDS.world("rental"))!);

    const spine = document.querySelector(".lena-atlas-spine");
    const system = publicSystems().find((entry) => entry.id === "rental")!;
    expect(spine?.textContent).toContain("LENA");
    expect(spine?.textContent).toContain(system.name.en);
    expect(document.getElementById(ATLAS_TEST_IDS.destination)).toBeTruthy();
  });

  it("never depends on the desktop layout for its content", async () => {
    isMobileMock.mockReturnValue(true);
    renderAtlas();
    await waitFor(() => expect(screen.getByText(/worlds ·/u)).toBeTruthy());
    expect(document.querySelector(".lena-atlas-diagram")).toBeNull();
  });
});

describe("reduced motion and presence", () => {
  it("marks the field so no travel is attempted, and states presence in words", async () => {
    const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList);

    renderAtlas();
    await waitFor(() => expect(scene()).not.toBeNull());
    expect(document.querySelector(".lena-atlas-field")?.getAttribute("data-atlas-reduced-motion")).toBe("true");
    const presenceNodes = document.querySelectorAll("[data-atlas-presence]");
    for (const node of presenceNodes) {
      expect(node.textContent?.trim().length).toBeGreaterThan(0);
    }
    matchMedia.mockRestore();
  });
});
