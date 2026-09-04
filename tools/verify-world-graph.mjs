import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const builder = read("artifacts/lena/src/graph/builder.ts");
const query = read("artifacts/lena/src/graph/query.ts");
const validate = read("artifacts/lena/src/graph/validate.ts");
const layout = read("artifacts/lena/src/features/world/atlas/layout.ts");
const page = read("artifacts/lena/src/pages/WorldAtlas.tsx");
const selectors = read("artifacts/lena/src/features/world/atlas/selectors.ts");
const app = read("artifacts/lena/src/App.tsx");
const worldPage = read("artifacts/lena/src/pages/World.tsx");
const lenaCss = read("artifacts/lena/src/lena.css");
const entities = read("artifacts/lena/src/features/world/content/world.ts");

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

console.log("\n== LENA World Graph structural contract ==");

check("the graph derives from the canonical registries and owns no product data", () => {
  assert.match(builder, /from "@\/content\/systems"/);
  assert.match(builder, /from "@\/features\/world\/content\/world"/);
  assert.match(builder, /from "@\/features\/world\/content\/operating-primitives"/);
  // World labels must be read from the system record, never restated here.
  assert.match(builder, /label: \{ ar: system\.name\.ar, en: system\.name\.en \}/);
  // A second registry of destinations would be the exact failure this
  // subsystem exists to avoid: only WorldEntity.detailPath may name a chamber.
  assert.doesNotMatch(builder, /"\/world\/(property|wellness|rental|investment|hospitality|recycling)"/, "hardcoded chamber route in the builder");
});

check("no world identity is restated as a literal list", () => {
  const ids = [...entities.matchAll(/systemId: "([a-z]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length >= 1, "world entities not found");
  for (const id of ids) {
    const literal = new RegExp(`(?:chamber|world|inner):"${id}"`);
    assert.doesNotMatch(builder, literal, `builder hardcodes a node id for "${id}"`);
  }
});

check("construction is deterministic: no randomness, clock, fetch or React", () => {
  for (const [name, source] of [["builder", builder], ["query", query], ["layout", layout]]) {
    assert.doesNotMatch(source, /Math\.random|Date\.now\(|new Date\(|fetch\(|useEffect|useState/, `${name} is impure`);
  }
  assert.doesNotMatch(builder, /from "react"/);
});

check("integrity validation fails loudly rather than repairing silently", () => {
  for (const code of [
    "duplicate-node-id",
    "missing-parent",
    "missing-edge-target",
    "orphan-node",
    "duplicate-destination",
    "invalid-destination",
    "missing-world",
    "missing-chamber",
    "missing-inner",
  ]) {
    assert.ok(validate.includes(`"${code}"`), `validator does not detect ${code}`);
  }
  assert.match(validate, /export function assertWorldGraphIntegrity/);
});

check("path finding uses only meaningful structural verbs", () => {
  assert.match(query, /TRAVERSAL_EDGE_KINDS/);
  // belongs-to is the declared inverse of shares-root: crossing both would
  // fabricate a second hop and halve every real distance.
  const traversalBlock = /TRAVERSAL_EDGE_KINDS[^;]*;/.exec(query)?.[0] ?? "";
  assert.doesNotMatch(traversalBlock, /"belongs-to"/);
  assert.match(query, /export function shortestPath/);
  assert.match(query, /export function resolveDestination/);
});

console.log("\n== LENA Atlas surface contract ==");

check("Atlas is a static route registered before the dynamic system route", () => {
  const atlasAt = app.indexOf('path="/world/atlas"');
  const paramAt = app.indexOf('path="/world/:systemId"');
  assert.ok(atlasAt > -1, "/world/atlas is not registered");
  assert.ok(paramAt > atlasAt, "/world/:systemId would swallow atlas");
});

check("Atlas is reachable from the World as a spatial entry, not a sidebar", () => {
  assert.match(worldPage, /className="lena-world-atlas-entry"\s+to="\/world\/atlas"/);
  assert.doesNotMatch(read("artifacts/lena/src/layouts/FloatingHeader.tsx"), /atlas/);
});

check("the page consumes canonical systems instead of duplicating them", () => {
  assert.match(page, /worldGraph\(\)/);
  assert.match(page, /useSpatialNavigate/);
  assert.match(page, /useSignalRuntime/);
  assert.doesNotMatch(page, /createSignalStore|worldMemory\.remember|useNavigate\(\)/);
});

check("the owner selector Atlas renders is the one QA protects", () => {
  const declared = /ATLAS_ROOT_SELECTOR = "([^"]+)"/.exec(selectors)?.[1];
  assert.ok(declared, "no root selector exported");
  assert.match(page, new RegExp(`ATLAS_ROOT_SELECTOR\\.slice\\(1\\)`));
  assert.match(declared, /^\.[a-z-]+$/);
});

check("Atlas styling is registered once in the shared stylesheet", () => {
  assert.equal(
    [...lenaCss.matchAll(/styles\/world-atlas\.css/g)].length,
    1,
    "world-atlas.css must be imported exactly once",
  );
});

check("Atlas ships no second Sacred Core artwork and no fabricated branding", () => {
  const css = read("artifacts/lena/src/styles/world-atlas.css");
  assert.doesNotMatch(css, /url\(/, "Atlas must not reference image assets directly");
  assert.doesNotMatch(css, /radial-gradient\([^)]*#(000|0a0a0a)/, "no synthetic black disk");
});

console.log(failures === 0 ? "\nALL WORLD GRAPH CHECKS PASSED\n" : `\n${failures} WORLD GRAPH CHECKS FAILED\n`);
process.exit(failures ? 1 : 0);
