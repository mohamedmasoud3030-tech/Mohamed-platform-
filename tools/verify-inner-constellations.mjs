import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const component = read("artifacts/lena/src/features/world/components/InnerConstellation.tsx");
const chamber = read("artifacts/lena/src/pages/WorldSystem.tsx");
const css = read("artifacts/lena/src/styles/world-inner.css");
const lenaCss = read("artifacts/lena/src/lena.css");

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

console.log("\n== LENA World inner constellation contract ==");

check("every Chamber renders the shared Inner Constellation", () => {
  assert.match(chamber, /import InnerConstellation from/);
  assert.match(chamber, /<InnerConstellation/);
});

check("operation nodes come directly from canonical system.does", () => {
  assert.match(chamber, /operations=\{system\.does\[locale\]\}/);
  assert.match(component, /operations\.map\(\(operation, index\)/);
  assert.match(component, /key=\{operation\}/);
});

check("the visual does not invent workflow order or external data", () => {
  assert.doesNotMatch(component, /fetch\(|axios|useQuery|Date\(|Math\.random/);
  assert.doesNotMatch(component, /property|wellness|rental|investment|hospitality|recycling/);
});

check("radial geometry is deterministic from node count", () => {
  assert.match(component, /360 \/ count/);
  assert.match(component, /Math\.cos\(radians\)/);
  assert.match(component, /Math\.sin\(radians\)/);
});

check("Inner Constellation is content-readable, not aria-hidden decoration", () => {
  assert.match(component, /<section className="lena-inner-constellation" aria-label=\{ariaLabel\}>/);
  assert.match(component, /<span>\{operation\}<\/span>/);
});

check("all six Digital DNA families have structural treatment", () => {
  for (const dna of ["architectural", "organic", "crafted", "ceremonial", "systemic", "industrial"]) {
    assert.match(css, new RegExp(`\\.dna-${dna} \\.lena-inner-core`), `${dna} inner-core treatment missing`);
  }
});

check("the settled constellation has no continuous animation", () => {
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.match(css, /Arrival-only assembly/);
});

check("reduced motion removes the arrival assembly", () => {
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation:\s*none !important/);
});

check("the Inner layer loads after the Chamber contract", () => {
  const chamberIndex = lenaCss.indexOf('@import "./styles/world-chamber.css"');
  const innerIndex = lenaCss.indexOf('@import "./styles/world-inner.css"');
  assert.ok(chamberIndex >= 0, "world-chamber.css import missing");
  assert.ok(innerIndex > chamberIndex, "world-inner.css must load after world-chamber.css");
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
