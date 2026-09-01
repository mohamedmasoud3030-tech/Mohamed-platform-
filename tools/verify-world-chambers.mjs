import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const app = read("artifacts/jiwdah/src/App.tsx");
const page = read("artifacts/jiwdah/src/pages/WorldSystem.tsx");
const world = read("artifacts/jiwdah/src/features/world/content/world.ts");
const css = read("artifacts/jiwdah/src/styles/world-chamber.css");
const lenaCss = read("artifacts/jiwdah/src/lena.css");
const sitemap = read("artifacts/jiwdah/scripts/generate-sitemap.mjs");
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

console.log("\n== LENA World System Chamber contract ==");

check("a lazy dynamic World chamber route exists", () => {
  assert.match(app, /const WorldSystem = lazy\(\(\) => import\("\.\/pages\/WorldSystem"\)\)/);
  assert.match(app, /path="\/world\/:systemId" element=\{<WorldSystem \/>\}/);
});

check("all six World exits now land in canonical chambers", () => {
  for (const id of ["wellness", "rental", "property", "hospitality", "investment", "recycling"]) {
    assert.match(world, new RegExp(`systemId: "${id}"[\\s\\S]*?detailPath: "/world/${id}"`));
  }
  assert.doesNotMatch(world, /detailPath:\s*"\/services#/);
});

check("the Chamber resolves facts from the canonical system record", () => {
  assert.match(page, /findWorldEntity\(systemId\)/);
  assert.match(page, /worldSystem\(entity\)/);
  assert.match(page, /system\.problem\[locale\]/);
  assert.match(page, /system\.usage\[locale\]/);
  assert.match(page, /system\.does\[locale\]/);
  assert.match(page, /system\.beneficiaries\[locale\]/);
});

check("invalid system ids return safely to World", () => {
  assert.match(page, /if \(!entity \|\| !system\) return <Navigate to="\/world" replace \/>/);
});

check("World state and verified product stage stay visibly distinct", () => {
  assert.match(page, /WORLD_STATE_LABEL\[entity\.state\]\[locale\]/);
  assert.match(page, /STAGE_LABEL\[system\.stage\]\[locale\]/);
  assert.match(page, /WORLD_STATE_NOTE\[entity\.state\]\[locale\]/);
  assert.match(page, /STAGE_NOTE\[system\.stage\]\[locale\]/);
});

check("the Chamber keeps a calm exit into operating detail and contact", () => {
  assert.match(page, /to=\{`\/services#\$\{system\.id\}`\}/);
  assert.match(page, /to=\{`\/contact\?service=\$\{system\.id\}`\}/);
});

check("portal arrival is one-shot visual settling, not continuous motion", () => {
  assert.match(page, /fromWorldPortal/);
  assert.match(page, /is-arrival/);
  assert.match(css, /lena-chamber-body-arrive/);
  assert.doesNotMatch(css, /\binfinite\b/);
});

check("all six Digital DNA families have chamber material rules", () => {
  for (const dna of ["architectural", "organic", "crafted", "ceremonial", "systemic", "industrial"]) {
    assert.match(css, new RegExp(`\\.dna-${dna} \\.lena-chamber-body`));
  }
});

check("Chamber styles load after Portal styles", () => {
  const portal = lenaCss.indexOf('@import "./styles/world-portal.css"');
  const chamber = lenaCss.indexOf('@import "./styles/world-chamber.css"');
  assert.ok(portal >= 0, "world-portal.css import missing");
  assert.ok(chamber > portal, "world-chamber.css must load after world-portal.css");
});

check("reduced-motion removes arrival animation", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none\s*!important/);
});

check("public systems generate indexable Chamber sitemap entries", () => {
  assert.match(sitemap, /extractPublicIds\("content\/systems\.ts", "system"\)/);
  assert.match(sitemap, /path: `\/world\/\$\{id\}`/);
});

check("analytics records a route shape, never the chamber system id", () => {
  assert.match(analytics, /case "world":\s*\n\s*return second \? "\/world\/:system" : "\/world"/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
