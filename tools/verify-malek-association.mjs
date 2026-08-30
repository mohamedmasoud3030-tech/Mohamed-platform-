import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
};

const systems = readFileSync(resolve(ROOT, "artifacts/jiwdah/src/content/systems.ts"), "utf8");
const grid = readFileSync(resolve(ROOT, "artifacts/jiwdah/src/components/SystemGrid.tsx"), "utf8");

console.log("\n== LENA surfaces MALEK as a product, not as LENA support ==");
check("the property system is a public named product MALEK", () => {
  assert.match(systems, /id:\s*"property"/);
  assert.match(systems, /name:\s*\{\s*ar:\s*"MALEK",\s*en:\s*"MALEK"\s*\}/);
  assert.match(systems, /visibility:\s*"public"/);
});
check("MALEK has a concise bilingual product tagline", () => {
  assert.match(systems, /Arabic-first property operations and rent accounting platform/);
  assert.match(systems, /منصة عربية لتشغيل العقارات ومحاسبة الإيجار/);
});
check("the existing industry-system grid renders the tagline rather than a parallel product card", () => {
  assert.match(grid, /system\.tagline/);
  assert.match(grid, /lena-system-tagline/);
});
check("LENA is not described as MALEK support", () => {
  const home = readFileSync(resolve(ROOT, "artifacts/jiwdah/src/pages/Home.tsx"), "utf8");
  assert.doesNotMatch(home, /MALEK support/i);
  assert.doesNotMatch(home, /مركز دعم MALEK/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
