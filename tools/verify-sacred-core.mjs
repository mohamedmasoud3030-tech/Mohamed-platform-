import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = resolve(ROOT, "artifacts/lena/src/styles/sacred-core.css");
const assetPath = resolve(ROOT, "artifacts/lena/src/assets/lena-sacred-core.webp");
const retiredInlinePath = resolve(ROOT, "artifacts/lena/src/assets/lena-sacred-core-v3-inline.svg");
const lenaCssPath = resolve(ROOT, "artifacts/lena/src/lena.css");

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

function assertCompleteWebP(buffer) {
  assert.ok(buffer.length >= 20, "Sacred Core WebP is too small");
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF", "RIFF header missing");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP", "WEBP header missing");
  const declared = buffer.readUInt32LE(4) + 8;
  assert.ok(declared <= buffer.length, `WebP is truncated: declares ${declared} bytes, has ${buffer.length}`);

  let offset = 12;
  let hasBitstream = false;
  while (offset + 8 <= declared) {
    const fourcc = buffer.subarray(offset, offset + 4).toString("ascii");
    const size = buffer.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    assert.ok(end <= buffer.length, `WebP chunk ${fourcc} overruns the file`);
    if (fourcc === "VP8 " || fourcc === "VP8L") hasBitstream = true;
    offset = end + (size % 2);
  }
  assert.equal(hasBitstream, true, "WebP has no VP8/VP8L image bitstream");
}

console.log("\n== LENA Sacred Core identity contract ==");

check("the approved canonical Sacred Core WebP exists and is complete", () => {
  assert.equal(existsSync(assetPath), true);
  assertCompleteWebP(readFileSync(assetPath));
});

check("the retired truncated inline asset is gone", () => {
  assert.equal(existsSync(retiredInlinePath), false);
});

check("the Sacred Core stylesheet is loaded after World styles", () => {
  const lenaCss = readFileSync(lenaCssPath, "utf8");
  const worldIndex = lenaCss.indexOf('@import "./styles/world.css"');
  const sacredIndex = lenaCss.indexOf('@import "./styles/sacred-core.css"');
  assert.ok(worldIndex >= 0, "world.css import missing");
  assert.ok(sacredIndex > worldIndex, "sacred-core.css must load after world.css");
});

const css = readFileSync(cssPath, "utf8");

check("Orbit, World, chamber and inner spaces share the approved center", () => {
  assert.match(css, /\.lena-house,\s*\n\.lena-world-core/);
  assert.match(css, /lena-sacred-core\.webp/);
  assert.doesNotMatch(css, /lena-sacred-core-v3-inline\.svg/);
  assert.match(css, /\.lena-inner-origin,\s*\n\.lena-chamber-origin[\s\S]*lena-sacred-core\.webp/);
});

check("no synthetic black sphere or retired asset can own the core", () => {
  assert.doesNotMatch(css, /lena-sacred-core-v2/);
  assert.doesNotMatch(css, /lena-sacred-core-v3-inline/);
  assert.doesNotMatch(css, /radial-gradient\([^\n]*(?:#020202|#030303|#090705|#171009)/i);
  assert.match(css, /background:\s*transparent\s+url\([^)]*lena-sacred-core\.webp[^)]*\)/);
  assert.match(css, /border-color:\s*transparent\s*!important/);
});

check("the eye has a rare blink and a living idle pulse", () => {
  assert.match(css, /@keyframes\s+lena-sacred-blink/);
  assert.match(css, /@keyframes\s+lena-sacred-eye-breathe/);
  assert.match(css, /13\.6s/);
});

check("the Enter LENA gateway awakens the real eye instead of swapping identity", () => {
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
