import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const transition = read("artifacts/jiwdah/src/features/world/WorldPortalTransition.tsx");
const scene = read("artifacts/jiwdah/src/features/world/components/WorldScene.tsx");
const css = read("artifacts/jiwdah/src/styles/world-portal.css");
const lenaCss = read("artifacts/jiwdah/src/lena.css");
const analytics = read("artifacts/jiwdah/src/lib/analytics/events.ts");

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
  assert.match(scene, /onClick=\{\(event\) => enterPortal\(event, selected\.detailPath, selected\.systemId\)\}/);
});

check("native navigation is prevented so choreography has one owner", () => {
  assert.match(transition, /event\.preventDefault\(\)/);
  assert.match(transition, /inFlight\.current/);
});

check("reduced motion navigates without cinematic delay", () => {
  assert.match(transition, /prefers-reduced-motion:\s*reduce/);
  assert.match(transition, /if \(!world \|\| reduce\)\s*\{\s*navigate\(destination\)/s);
});

check("the portal uses a two-beat isolate then resolve choreography", () => {
  assert.match(transition, /classList\.add\("is-portal"\)/);
  assert.match(transition, /classList\.add\("is-portal-resolve"\)/);
  assert.match(transition, /190/);
});

check("View Transitions enhance the final handoff with a CSS fallback", () => {
  assert.match(transition, /document\.startViewTransition/);
  assert.match(transition, /680/);
  assert.match(transition, /navigate\(destination\)/);
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
  assert.match(css, /lena-world-portal-core/);
  assert.match(css, /\.lena-world-core::after/);
});

check("mobile keeps the single-focused-body contract", () => {
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /translate\(0, -34px\)/);
});

check("analytics recognises World as a first-class route", () => {
  assert.match(analytics, /case "world":/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
