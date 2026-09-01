import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const evidence = read("artifacts/jiwdah/src/features/world/content/evidence.ts");
const systems = read("artifacts/jiwdah/src/content/systems.ts");
const primitives = read("artifacts/jiwdah/src/features/world/content/operating-primitives.ts");
const publicDir = resolve(ROOT, "artifacts/jiwdah/public");

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

console.log("\n== LENA World real-evidence contract ==\n");

check("evidence is a canonical map keyed by canonical SystemId", () => {
  assert.match(evidence, /SYSTEM_EVIDENCE:\s*Partial<Record<SystemId, EvidenceSurface\[\]>>/);
  assert.match(evidence, /import type .*SystemId.* from "@\/content\/systems"/);
  assert.match(evidence, /import type .*OperatingPrimitiveId.* from "@\/content\/systems"/);
});

check("every system key of the evidence map is a real canonical system", () => {
  const keys = [...evidence.matchAll(/^\s{2}([a-z-]+):\s*\[/gm)].map((m) => m[1]);
  assert.ok(keys.length >= 1, "no evidence systems declared");
  for (const key of keys) {
    assert.match(systems, new RegExp(`id: "${key}"`), `evidence key ${key} is not a canonical system`);
  }
});

check("every evidence asset exists and lives under its canonical system folder", () => {
  const refs = [...evidence.matchAll(/src:\s*"(\/world\/evidence\/([a-z0-9-]+)\/([^"]+))"/g)];
  assert.ok(refs.length >= 5, `expected at least 5 real surfaces, found ${refs.length}`);
  for (const [, src, folder, file] of refs) {
    assert.match(src, /^\/world\/evidence\/[a-z0-9-]+\/[^/]+\.png$/);
    assert.ok(
      existsSync(resolve(publicDir, "world/evidence", folder, file)),
      `missing evidence asset: ${src}`,
    );
  }
});

check("every surface is fully labelled for both locales", () => {
  const blocks = evidence.split(/\n    \{\n/).slice(1);
  for (const block of blocks) {
    assert.match(block, /id:\s*"/, "surface missing id");
    assert.match(block, /src:\s*"/, "surface missing src");
    assert.match(block, /alt:\s*\{[\s\S]*ar:[\s\S]*en:/, "surface alt missing ar/en");
    assert.match(block, /capability:\s*\{[\s\S]*ar:[\s\S]*en:/, "surface capability missing ar/en");
  }
});

check("evidence surface ids are globally unique", () => {
  const ids = [...evidence.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate evidence surface ids");
});

check("primitive links on surfaces reference real operating roots", () => {
  const primitiveIds = new Set(
    [...primitives.matchAll(/^\s+id:\s*"([^"]+)",$/gm)].map((m) => m[1]),
  );
  for (const match of evidence.matchAll(/primitive:\s*"([^"]+)"/g)) {
    assert.ok(primitiveIds.has(match[1]), `unknown operating primitive: ${match[1]}`);
  }
});

check("evidence never claims traction, customers or lifecycle", () => {
  assert.doesNotMatch(evidence, /customer|client|user count|revenue|deployment|production|بيانات حقيقية لعملاء/i);
  assert.doesNotMatch(evidence, /نسخة تجريبية|قيد الاستخدام الفعلي|Demo|Trial|Beta/);
});

check("the Operating Surfaces component derives from canonical data", () => {
  const component = read("artifacts/jiwdah/src/features/world/components/OperatingSurfaces.tsx");
  assert.match(component, /evidenceFor\(systemId\)/);
  assert.doesNotMatch(component, /systemId === "property"/);
  assert.doesNotMatch(component, /\.src\s*[:=]\s*["']\/world\/evidence/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
