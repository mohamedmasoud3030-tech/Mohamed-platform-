// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { PreferencesProvider } from "@/providers/preferences";
import { publicSystems } from "@/content/systems";
import WorldSystem from "@/pages/WorldSystem";
import WorldPage from "@/pages/World";
import Home from "@/pages/Home";
import SpatialCleanup from "./SpatialCleanup";
import { Outlet } from "react-router";
import {
  buildSpatialState,
  resetNavigationDirectionTracking,
  worldMemory,
} from "@/lib/spatial";

/**
 * Spatial continuity — integration contracts.
 *
 * These render the real pages inside a real router and assert the behavior
 * the visitor feels: which arrival a route receives, where Back goes, and
 * what world memory offers a returning visitor. Visuals are asserted at the
 * level of semantic classes (arrival / return / remembered), never pixels.
 */

let historyIndex = 0;

beforeEach(() => {
  historyIndex = 0;
  window.localStorage.clear();
  worldMemory.reset();
  resetNavigationDirectionTracking();
  // The test router is in-memory; mirror its position in
  // window.history.state.idx exactly as BrowserRouter would, so direction
  // detection sees reality.
  Object.defineProperty(window.history, "state", {
    configurable: true,
    get: () => ({ idx: historyIndex }),
    set: () => {},
  });
});

afterEach(() => {
  cleanup();
});

function renderRoutes(
  routes: Parameters<typeof createMemoryRouter>[0],
  initial: { pathname: string; state?: unknown },
) {
  // The layout route mirrors the app: SpatialCleanup (direction tracking +
  // transition cleanup) is mounted for every route.
  const layoutRoute = {
    path: "*",
    element: (
      <>
        <SpatialCleanup />
        <Outlet />
      </>
    ),
    children: routes,
  };
  const router = createMemoryRouter([layoutRoute], { initialEntries: [initial] });
  render(
    <StrictMode>
      {/* English locale so assertions can read the English labels. */}
      <PreferencesProvider initialLocale="en">
        <RouterProvider router={router} />
      </PreferencesProvider>
    </StrictMode>,
  );
  return router;
}

const chamberRoute = { path: "world/:systemId", element: <WorldSystem /> };
const worldRoute = { path: "world", element: <WorldPage /> };
const homeRoute = { index: true, element: <Home /> };
const otherRoute = { path: "other", element: <div>outside LENA</div> };

describe("chamber arrival semantics", () => {
  it("a direct URL entry receives a calm neutral arrival (no state, no replay)", async () => {
    renderRoutes([chamberRoute, otherRoute], { pathname: "/world/property" });
    const chamber = document.querySelector(".lena-system-chamber");
    expect(chamber).not.toBeNull();
    expect(chamber?.classList.contains("is-arrival")).toBe(false);
    expect(chamber?.classList.contains("is-return")).toBe(false);
    // The back control is present and usable even on a deep link.
    expect(screen.getByText("Back to LENA World")).toBeTruthy();
  });

  it("a portal descent receives the full arrival choreography", async () => {
    historyIndex = 2;
    renderRoutes([chamberRoute, otherRoute], {
      pathname: "/world/property",
      state: buildSpatialState({ origin: "/world", intent: "descend", systemId: "property" }),
    });
    const chamber = document.querySelector(".lena-system-chamber");
    expect(chamber?.classList.contains("is-arrival")).toBe(true);
  });

  it("a back move receives an outward settle, never a replay of the entrance", async () => {
    const router = renderRoutes([chamberRoute, worldRoute, otherRoute], {
      pathname: "/world",
    });

    // Forward into the chamber (a portal move with typed state).
    historyIndex = 1;
    await act(async () => {
      await router.navigate("/world/property", {
        state: buildSpatialState({ origin: "/world", intent: "descend", systemId: "property" }),
      });
    });
    let chamber = document.querySelector(".lena-system-chamber");
    expect(chamber?.classList.contains("is-arrival")).toBe(true);

    // Leave to another page, then come back the way visitors do.
    historyIndex = 2;
    await act(async () => {
      await router.navigate("/other");
    });
    historyIndex = 1;
    await act(async () => {
      await router.navigate(-1);
    });

    chamber = document.querySelector(".lena-system-chamber");
    expect(chamber?.classList.contains("is-arrival")).toBe(false);
    expect(chamber?.classList.contains("is-return")).toBe(true);
  });
});

describe("coherent back navigation", () => {
  it("follows browser history when the entry was a spatial forward move", async () => {
    const router = renderRoutes([chamberRoute, worldRoute, otherRoute], {
      pathname: "/world",
    });
    historyIndex = 1;
    await act(async () => {
      await router.navigate("/world/property", {
        state: buildSpatialState({ origin: "/world", intent: "descend", systemId: "property" }),
      });
    });

    await act(async () => {
      screen.getByText("Back to LENA World").click();
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/world"));
  });

  it("returns to the canonical parent with an emerge intent from a deep link", async () => {
    const router = renderRoutes([chamberRoute, worldRoute, otherRoute], {
      pathname: "/world/property",
    });

    screen.getByText("Back to LENA World").click();
    await waitFor(() => expect(router.state.location.pathname).toBe("/world"));
    const state = router.state.location.state as ReturnType<typeof buildSpatialState>;
    expect(state.spatial.intent).toBe("emerge");
    expect(state.spatial.origin).toBe("/world/property");
    expect(state.spatial.systemId).toBe("property");
  });
});

describe("world focus restoration", () => {
  it("restores the remembered system when a returning visitor opens the field", async () => {
    worldMemory.remember({
      space: "chamber",
      systemId: "wellness",
      chamberPath: "/world/wellness",
      at: Date.now(),
    });

    renderRoutes([worldRoute, otherRoute], { pathname: "/world" });
    const selected = document.querySelector(".lena-world-entity.is-selected");
    expect(selected).not.toBeNull();
    // The remembered entity is selected — identified by its data-driven name
    // from the canonical content, not a hardcoded label.
    const wellnessName = publicSystems().find((s) => s.id === "wellness")?.name.en ?? "wellness";
    expect(selected?.textContent).toContain(wellnessName);
    // The remembered system is quietly marked in the list.
    expect(document.querySelector(".lena-world-list-link.is-remembered")).not.toBeNull();
  });

  it("opens with the stable default focus for a first-time visitor", async () => {
    renderRoutes([worldRoute, otherRoute], { pathname: "/world" });
    const selected = document.querySelector(".lena-world-entity.is-selected");
    expect(selected).not.toBeNull();
    // No memory: the default system (property) is selected, nothing marked.
    expect(selected?.textContent).toContain("Property");
    expect(document.querySelector(".lena-world-list-link.is-remembered")).toBeNull();
  });
});

describe("home gateway continuity", () => {
  it("offers a continuation seam to a returning visitor, and nothing to a first-timer", async () => {
    // First visit: no seam.
    renderRoutes([homeRoute], { pathname: "/" });
    expect(document.querySelector(".lena-continue")).toBeNull();
    expect(document.querySelector(".lena-return-line")).toBeNull();
    cleanup();

    // Returning visitor who reached a chamber: a seam, labeled with the system.
    worldMemory.remember({
      space: "chamber",
      systemId: "wellness",
      chamberPath: "/world/wellness",
      at: Date.now(),
    });
    renderRoutes([homeRoute], { pathname: "/" });
    const seam = document.querySelector(".lena-continue");
    expect(seam).not.toBeNull();
    // The seam names the remembered system from canonical content.
    const wellnessName = publicSystems().find((s) => s.id === "wellness")?.name.en ?? "wellness";
    expect(seam?.textContent).toContain(wellnessName);
    expect(document.querySelector(".lena-return-line")).not.toBeNull();
  });

  it("the footer reset seam erases spatial memory and the seam disappears", async () => {
    worldMemory.remember({
      space: "chamber",
      systemId: "wellness",
      chamberPath: "/world/wellness",
      at: Date.now(),
    });
    renderRoutes([homeRoute], { pathname: "/" });
    expect(document.querySelector(".lena-continue")).not.toBeNull();

    screen.getByText("Reset spatial memory").click();
    expect(worldMemory.read()).toBeNull();
    await waitFor(() => expect(document.querySelector(".lena-continue")).toBeNull());
  });
});
