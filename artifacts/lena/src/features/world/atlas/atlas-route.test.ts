import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/**
 * Atlas route and ownership contracts, asserted at the source level so a
 * parallel branch cannot silently break precedence or duplicate a registry.
 * These mirror the World Command test's style: static, fast, no DOM.
 */

test("World Atlas is registered before the dynamic system route", () => {
  const app = read("App.tsx");
  assert.match(app, /path="\/world\/atlas"/);
  const atlasAt = app.indexOf("/world/atlas");
  const paramAt = app.indexOf("/world/:systemId");
  assert.ok(atlasAt > -1 && paramAt > atlasAt, "/world/atlas must precede /world/:systemId");
});

test("World Atlas is lazy-loaded like every other LENA page", () => {
  const app = read("App.tsx");
  assert.match(app, /const WorldAtlas = lazy\(\(\) => import\("\.\/pages\/WorldAtlas"\)\)/);
});

test("the Atlas derives its structure from the canonical graph module", () => {
  const page = read("pages/WorldAtlas.tsx");
  assert.match(page, /worldGraph\(\)/);
  assert.match(page, /resolveDestination\(graph, node\.id\)/);
  assert.doesNotMatch(page, /WORLD_ENTITIES|BUSINESS_SYSTEMS/, "the page must not read registries directly");
});

test("the Atlas owns no graph construction", () => {
  const page = read("pages/WorldAtlas.tsx");
  assert.doesNotMatch(page, /buildWorldGraph/, "graph construction must not live in Atlas components");
  const layout = read("features/world/atlas/layout.ts");
  assert.doesNotMatch(layout, /from "react|useState/, "layout derivation must stay framework-free");
});

test("Atlas hands destinations to spatial navigation instead of the router", () => {
  const page = read("pages/WorldAtlas.tsx");
  assert.match(page, /useSpatialNavigate/);
  assert.match(page, /go\(destination\.path, \{ intent: destination\.intent/);
  assert.doesNotMatch(page, /useNavigate\(\)/, "Atlas must not bypass the spatial navigation layer");
});

test("Atlas reads world presence from World Intelligence and never mutates signals", () => {
  const page = read("pages/WorldAtlas.tsx");
  assert.match(page, /useSignalRuntime\(\)/);
  assert.doesNotMatch(page, /acknowledge|resolve\(|worldSignalStore|emit\(/);
});

test("Atlas does not reimplement spatial memory", () => {
  const page = read("pages/WorldAtlas.tsx");
  assert.match(page, /useWorldMemory\(\)/);
  assert.doesNotMatch(page, /worldMemory\.remember|localStorage/, "memory writes belong to the canonical layer");
});

test("the Atlas entry lives in the World and not in global chrome", () => {
  const world = read("pages/World.tsx");
  assert.match(world, /to="\/world\/atlas"/);
  const header = read("layouts/FloatingHeader.tsx");
  assert.doesNotMatch(header, /atlas/, "no global sidebar/header item for Atlas");
});

test("the Atlas sheet is registered once in the shared stylesheet", () => {
  const css = read("lena.css");
  const matches = css.match(/styles\/world-atlas\.css/g) ?? [];
  assert.equal(matches.length, 1);
});

test("the owner selector exported for QA is a real class the page renders", () => {
  const selectors = read("features/world/atlas/selectors.ts");
  const selector = /ATLAS_ROOT_SELECTOR = "([^"]+)"/.exec(selectors)?.[1];
  assert.ok(selector, "ATLAS_ROOT_SELECTOR must be exported");
  assert.match(selector, /^\.[a-z][a-z-]*$/);
  const page = read("pages/WorldAtlas.tsx");
  assert.match(page, /ATLAS_ROOT_SELECTOR\.slice\(1\)/);
});

test("Atlas ships no fabricated Sacred Core replacement", () => {
  const css = read("styles/world-atlas.css");
  assert.doesNotMatch(css, /url\(/, "Atlas must not reference image assets directly");
  assert.doesNotMatch(css, /canvas|WebGL|requestAnimationFrame/i, "no canvas or per-frame loop in the Atlas surface");
});
