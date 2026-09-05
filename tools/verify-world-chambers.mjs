import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const app = read("artifacts/lena/src/App.tsx");
const page = read("artifacts/lena/src/pages/WorldSystem.tsx");
const world = read("artifacts/lena/src/features/world/content/world.ts");
const systems = read("artifacts/lena/src/content/systems.ts");
const css = read("artifacts/lena/src/styles/world-chamber.css");
const evidenceCss = read("artifacts/lena/src/styles/world-evidence.css");
const lenaCss = read("artifacts/lena/src/lena.css");
const sitemap = read("artifacts/lena/scripts/generate-sitemap.mjs");
const analytics = read("artifacts/lena/src/lib/analytics/events.ts");

const FORBIDDEN_LIFECYCLE = [
  // English lifecycle vocabulary that must not appear on public surfaces.
  /\bDemo\b/i,
  /\bTrial\b/i,
  /\bPrototype\b/i,
  /\bBeta\b/i,
  /\bExperimental\b/i,
  /\bUnder development\b/i,
  /\bComing soon\b/i,
  /\bWork in progress\b/i,
  /\bIn real use\b/i,
  /Demo version/i,
  // Arabic lifecycle vocabulary.
  /نسخة تجريبية/,
  /تحت التطوير/,
  /جاري العمل/,
  /قريبًا/,
  /قيد التجربة/,
  /قيد الاستخدام الفعلي/,
];

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

console.log("\n== LENA World System Chamber contract ==\n");

check("a lazy dynamic World chamber route exists", () => {
  assert.match(app, /const WorldSystem = lazy\(\(\) => import\("\.\/pages\/WorldSystem"\)\)/);
  assert.match(app, /path="\/world\/:systemId" element=\{<WorldSystem \/>\}/);
});

check("all six World exits now land in canonical chambers", () => {
  for (const id of ["wellness", "rental", "property", "hospitality", "investment", "recycling"]) {
    assert.match(world, new RegExp(`${id}: \\{ state:`));
  }
  assert.match(
    world,
    /export function worldPathFor\(systemId: SystemId\): string \{\s*return `\/world\/\$\{systemId\}`;/s,
  );
  assert.match(world, /return publicSystems\(\)\.map/);
  assert.match(world, /detailPath: worldPathFor\(system\.id\)/);
  assert.doesNotMatch(world, /detailPath:\s*"\/services#/);
  // Chamber routes are derived, never restated per world.
  assert.doesNotMatch(
    world,
    /detailPath:\s*"\/world\/(property|wellness|rental|investment|hospitality|recycling)"/,
  );
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

check("public Chamber copy carries no lifecycle status vocabulary", () => {
  for (const pattern of FORBIDDEN_LIFECYCLE) {
    assert.doesNotMatch(page, pattern, `forbidden lifecycle term on the chamber page`);
  }
});

check("no lifecycle label tables are exported for public rendering", () => {
  assert.doesNotMatch(systems, /STAGE_LABEL|STAGE_NOTE/);
  assert.doesNotMatch(world, /WORLD_STATE_LABEL|WORLD_STATE_NOTE|WORLD_ACTION_LABEL/);
});

check("the Chamber exposes operating roots as Layer B intelligence", () => {
  assert.match(page, /lena-chamber-signals/);
  assert.match(page, /lena-chamber-roots/);
  assert.match(page, /OPERATING_PRIMITIVES/);
  assert.match(page, /system\.operatingPrimitives\.map/);
  assert.match(css, /\.lena-chamber-roots\s*\{/);
});

check("the Chamber mounts the Operating Surfaces evidence layer", () => {
  assert.match(page, /productContractFor\(system\.id\)/);
  assert.match(page, /<OperatingSurfaces/);
  assert.match(page, /systemId=\{entity\.systemId\}/);
  assert.match(page, /brand=\{system\.name\[locale\]\}/);
  assert.match(page, /evidence=\{productContract\?\.evidence\}/);
  assert.match(page, /import \{ OperatingSurfaces \} from "@\/features\/world\/components\/OperatingSurfaces"/);
});

check("Operating Surfaces is real-evidence only, never a gallery", () => {
  assert.match(evidenceCss, /floating dimensional planes|constellation language/);
  assert.match(evidenceCss, /prefers-reduced-motion/);
  assert.match(evidenceCss, /\.lena-surface-frame img\.is-missing/);
});

check("Operating Surfaces renders nothing when a system has no evidence", () => {
  const component = read("artifacts/lena/src/features/world/components/OperatingSurfaces.tsx");
  assert.match(component, /if \(surfaces\.length === 0\) return null/);
});

check("the Chamber keeps a calm exit into operating detail and contact", () => {
  assert.match(page, /to=\{`\/services#\$\{system\.id\}`\}/);
  assert.match(page, /to=\{`\/contact\?service=\$\{system\.id\}`\}/);
});

check("portal arrival is one-shot visual settling, not continuous motion", () => {
  assert.match(page, /navState\?\.spatial\.intent === "descend"/);
  assert.match(page, /navState\?\.spatial\.intent === "emerge"/);
  assert.match(page, /is-arrival/);
  assert.match(page, /is-return/);
  assert.match(css, /lena-chamber-body-arrive/);
  assert.doesNotMatch(css, /\binfinite\b/);
  // Current write path is typed spatial state. The legacy flag is not produced here.
  assert.doesNotMatch(page, /fromWorldPortal/);
});

check("all six Digital DNA families have chamber material rules", () => {
  for (const dna of ["architectural", "organic", "crafted", "ceremonial", "systemic", "industrial"]) {
    assert.match(css, new RegExp(`\\.dna-${dna} \\.lena-chamber-body`));
  }
});

check("Chamber styles load after Portal styles", () => {
  const portal = lenaCss.indexOf('@import "./styles/world-portal.css"');
  const chamber = lenaCss.indexOf('@import "./styles/world-chamber.css"');
  const evidence = lenaCss.indexOf('@import "./styles/world-evidence.css"');
  assert.ok(portal >= 0, "world-portal.css import missing");
  assert.ok(chamber > portal, "world-chamber.css must load after world-portal.css");
  assert.ok(evidence > chamber, "world-evidence.css must load after world-chamber.css");
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

check("real evidence assets exist under the canonical system folder", () => {
  const evidence = read("artifacts/lena/src/features/world/content/evidence.ts");
  const publicDir = resolve(ROOT, "artifacts/lena/public");
  const matches = evidence.matchAll(/src:\s*"(\/world\/evidence\/([a-z0-9-]+)\/([^"]+))"/g);
  let count = 0;
  for (const match of matches) {
    const [, src, systemFolder, file] = match;
    assert.match(src, /^\/world\/evidence\/[a-z0-9-]+\/[^/]+$/);
    assert.ok(
      existsSync(resolve(publicDir, "world/evidence", systemFolder, file)),
      `missing evidence asset: ${src}`,
    );
    count += 1;
  }
  assert.ok(count >= 5, `expected at least 5 real surfaces, found ${count}`);
});

check("evidence ids are unique and every surface is alt + capability labelled", () => {
  const evidence = read("artifacts/lena/src/features/world/content/evidence.ts");
  const ids = [...evidence.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate evidence surface ids");
  assert.ok(evidence.includes("alt: {"), "surfaces need alt text");
  assert.ok(evidence.includes("capability: {"), "surfaces need capability copy");
});

check("no public render site still references stage labels", () => {
  for (const file of [
    "artifacts/lena/src/components/SystemGrid.tsx",
    "artifacts/lena/src/pages/Portfolio.tsx",
    "artifacts/lena/src/pages/Services.tsx",
    "artifacts/lena/src/features/world/components/WorldScene.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /STAGE_LABEL|STAGE_NOTE|WORLD_STATE_LABEL|WORLD_STATE_NOTE|WORLD_ACTION_LABEL/);
  }
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
