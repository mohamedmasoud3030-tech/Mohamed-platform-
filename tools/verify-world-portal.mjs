import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const transition = read("artifacts/lena/src/features/world/WorldPortalTransition.tsx");
const scene = read("artifacts/lena/src/features/world/components/WorldScene.tsx");
const worldPage = read("artifacts/lena/src/pages/World.tsx");
const runtime = read("artifacts/lena/src/lib/spatial/runtime.ts");
const tokens = read("artifacts/lena/src/lib/spatial/tokens.ts");
const css = read("artifacts/lena/src/styles/world-portal.css");
const lenaCss = read("artifacts/lena/src/lena.css");
const analytics = read("artifacts/lena/src/lib/analytics/events.ts");

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
};

console.log("\n== LENA World portal / approach contract ==");

check("the selected-system action is owned by the portal transition", () => {
  assert.match(scene, /useWorldPortalTransition/);
  assert.match(
    scene,
    /onClick=\{\(event\) => enterPortal\(selected\.detailPath, selected\.systemId, event\)\}/,
  );
  // The World list is a second exit, not a second owner.
  assert.match(worldPage, /useWorldPortalTransition/);
  assert.match(
    worldPage,
    /onClick=\{\(event\) => enterPortal\(entity\.detailPath, entity\.systemId, event\)\}/,
  );
});

check("native navigation is prevented so choreography has one owner", () => {
  assert.match(transition, /if \(event\) event\.preventDefault\(\)/);
  assert.match(transition, /spatialRuntime\.run/);
  assert.match(transition, /if \(!handle\) return/);
  assert.doesNotMatch(transition, /inFlight\.current/);
  // Single-flight lives in the shared spatial runtime, not a local ref.
  assert.match(runtime, /if \(active\) return null/);
});

check("reduced motion navigates without cinematic delay", () => {
  assert.match(transition, /reducedMotion: reduced/);
  assert.match(runtime, /prefers-reduced-motion:\s*reduce/);
  assert.match(runtime, /if \(reduced && options\.action\)/);
  assert.match(tokens, /export const reducedBeat = 90/);
  // Reduced path must return before movement classes are applied.
  const reducedBlock = runtime.slice(runtime.indexOf("if (reduced && options.action)"));
  assert.match(reducedBlock, /return handle/);
  assert.doesNotMatch(
    reducedBlock.slice(0, reducedBlock.indexOf("return handle")),
    /enterPhase\("preparing"\)/,
  );
});

check("portal arrival context is canonical and bounded", () => {
  assert.match(
    transition,
    /buildSpatialState\(\{\s*origin: "\/world", intent: "descend", systemId \}\)/s,
  );
  assert.match(transition, /navigate\(destination, \{\s*state: buildSpatialState/s);
  assert.doesNotMatch(transition, /fromWorldPortal:\s*true/);
});

check("the portal uses a two-beat isolate then resolve choreography", () => {
  assert.match(runtime, /scene === "world" && intent === "descend"/);
  assert.match(runtime, /add: \["is-portal"\]/);
  assert.match(runtime, /add: \["is-portal-resolve"\]/);
  assert.match(tokens, /descend: \{ preparing: 190, moving: 290 \}/);
});

check("View Transitions enhance the final handoff with a CSS fallback", () => {
  assert.match(runtime, /doc\.startViewTransition/);
  assert.match(runtime, /if \(vt\.supported\)/);
  assert.match(runtime, /promise\.finished/);
});

check("World v3 CSS loads after World v2", () => {
  const v2 = lenaCss.indexOf('@import "./styles/world-v2.css"');
  const portal = lenaCss.indexOf('@import "./styles/world-portal.css"');
  assert.ok(v2 >= 0, "world-v2.css import missing");
  assert.ok(portal > v2, "world-portal.css must load after world-v2.css");
});

check("the chosen body approaches while unrelated systems recede", () => {
  assert.match(css, /\.lena-world\.is-portal \.lena-world-entity:not\(\.is-selected\)/);
  assert.match(css, /\.lena-world\.is-portal-resolve \.lena-world-entity\.is-selected/);
  assert.match(css, /translate\(var\(--portal-x\), var\(--portal-y\)\)/);
  assert.match(scene, /"--portal-x": `\$\{\(pos\.x \* 0\.34\)\.toFixed\(1\)\}px`/);
  assert.match(scene, /"--portal-y": `\$\{\(pos\.y \* 0\.34\)\.toFixed\(1\)\}px`/);
});

check("the active signal becomes the corridor and the Sacred Core responds", () => {
  assert.match(css, /\.lena-world\.is-portal \.lena-world-path\.is-active/);
  assert.match(css, /lena-world-portal-signal/);
  assert.match(css, /lena-world-portal-core/);
  assert.match(css, /\.lena-world-core::after/);
});

check("mobile keeps the single-focused-body contract", () => {
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /translate\(0, -34px\)/);
});

check("analytics recognises World as a first-class route family", () => {
  assert.match(analytics, /case "world":/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
