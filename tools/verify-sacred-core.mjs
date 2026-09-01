import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = resolve(ROOT, "artifacts/jiwdah/src/styles/sacred-core.css");
const assetPath = resolve(ROOT, "artifacts/jiwdah/src/assets/lena-sacred-core.webp");
const lenaCssPath = resolve(ROOT, "artifacts/jiwdah/src/lena.css");

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

console.log("\n== LENA Sacred Core identity contract ==");

check("the authored Sacred Core asset exists", () => {
  assert.equal(existsSync(assetPath), true);
});

check("the Sacred Core stylesheet is loaded after World styles", () => {
  const lenaCss = readFileSync(lenaCssPath, "utf8");
  const worldIndex = lenaCss.indexOf('@import "./styles/world.css"');
  const sacredIndex = lenaCss.indexOf('@import "./styles/sacred-core.css"');
  assert.ok(worldIndex >= 0, "world.css import missing");
  assert.ok(sacredIndex > worldIndex, "sacred-core.css must load after world.css");
});

const css = readFileSync(cssPath, "utf8");

check("Orbit and World share the same authored center", () => {
  assert.match(css, /\.lena-house,\s*\n\.lena-world-core/);
  assert.match(css, /lena-sacred-core\.webp/);
});

check("the eye has a rare blink and a living idle pulse", () => {
  assert.match(css, /@keyframes\s+lena-sacred-blink/);
  assert.match(css, /@keyframes\s+lena-sacred-eye-breathe/);
  assert.match(css, /13\.6s/);
});

check("the Enter LENA gateway awakens the eye instead of swapping identity", () => {
  assert.match(css, /lena-gateway-quiet[\s\S]*\.lena-house/);
  assert.match(css, /lena-gateway-resolve[\s\S]*\.lena-house::after/);
  assert.match(css, /@keyframes\s+lena-sacred-awakening/);
});

check("World state focus acknowledges live beta and forming", () => {
  assert.match(css, /state-live\.is-selected/);
  assert.match(css, /state-beta\.is-selected/);
  assert.match(css, /state-forming\.is-selected/);
  assert.match(css, /lena-sacred-ack-live/);
  assert.match(css, /lena-sacred-ack-beta/);
  assert.match(css, /lena-sacred-ack-forming/);
});

check("reduced-motion removes surprise and continuous eye motion", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.lena-house::before,[\s\S]*animation:\s*none\s*!important/);
  assert.match(css, /\.lena-house::after,[\s\S]*animation:\s*none\s*!important/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
