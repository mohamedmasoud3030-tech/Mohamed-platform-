#!/usr/bin/env node
/**
 * LENA critical asset + Sacred Core static contract verifier.
 *
 * Fast, dependency-free gate (runs inside `pnpm verify` and CI):
 *
 *  1. canonical assets exist, are non-empty and are valid by magic bytes;
 *  2. WebP payloads are structurally complete (RIFF chunk sizes consistent,
 *     and a real bitstream chunk present) — truncation is caught before browser runs;
 *  3. the Sacred Core stylesheet references the approved canonical WebP for the
 *     public center, loads after World styles, and contains no retired inline/v2
 *     reference or synthetic black-sphere fallback;
 *  4. essential World identity assets (evidence/OG/logo) are present and valid;
 *  5. every critical route in routes.config.json exists in App.tsx.
 *
 * Pure Node — no package installation required.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(GUARD_DIR, "..", "..");
const JIWDHA = resolve(ROOT, "artifacts", "jiwdah");

const config = JSON.parse(readFileSync(resolve(GUARD_DIR, "routes.config.json"), "utf8"));

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message.split("\n").slice(0, 6).join("\n        ")}`);
  }
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const hasMagic = (buffer, magic) => buffer.subarray(0, magic.length).equals(Buffer.from(magic));

/* ----------------------------- WebP structure ----------------------------- */

/**
 * Validate a WebP container: RIFF/WEBP header, every chunk's declared size
 * must fit inside the file, and a decodable bitstream chunk (VP8 / VP8L) must
 * exist. A "VP8X + ALPH only" file or a chunk that overruns the file is
 * TRUNCATED and therefore undecodable.
 */
function validateWebP(buffer, label) {
  assert(buffer.length >= 12, `${label}: too small for a WebP header`);
  assert(hasMagic(buffer, "RIFF") && hasMagic(buffer.subarray(8), "WEBP"), `${label}: RIFF/WEBP magic missing`);
  const riffSize = buffer.readUInt32LE(4) + 8;
  assert(riffSize <= buffer.length, `${label}: RIFF declares ${riffSize} bytes but file has ${buffer.length} (truncated)`);

  let offset = 12;
  let sawBitstream = false;
  const chunks = [];
  while (offset + 8 <= buffer.length) {
    const fourcc = buffer.subarray(offset, offset + 4).toString("latin1");
    const size = buffer.readUInt32LE(offset + 4);
    assert(offset + 8 + size <= buffer.length, `${label}: chunk ${fourcc} declares ${size} bytes which overruns the file (truncated)`);
    chunks.push(fourcc);
    if (fourcc === "VP8 " || fourcc === "VP8L") sawBitstream = true;
    offset += 8 + size + (size % 2);
  }
  assert(sawBitstream, `${label}: no VP8/VP8L bitstream chunk — broken file (${chunks.join(", ")})`);
  return chunks;
}

/* --------------------------------- assets --------------------------------- */

const CRITICAL_ASSETS = [
  ...config.criticalAssets,
  // Every world evidence screenshot doubles as a world identity asset.
  ...readdirSync(resolve(JIWDHA, "public/world/evidence/malek"))
    .filter((name) => /\.(png|webp)$/i.test(name))
    .map((name) => ({ name: `evidence-${name}`, file: `artifacts/jiwdah/public/world/evidence/malek/${name}`, kind: name.endsWith(".png") ? "png" : "webp" })),
];

console.log("\n== Guardian: critical asset integrity ==\n");

for (const asset of CRITICAL_ASSETS) {
  const path = resolve(ROOT, asset.file);
  check(`${asset.name} (${asset.file})`, () => {
    assert(existsSync(path), "file does not exist");
    const buffer = readFileSync(path);
    assert(buffer.length > 0, "file is empty (0 bytes)");

    switch (asset.kind) {
      case "svg":
      case "svg-embedded-webp": {
        const text = buffer.toString("utf8");
        assert(text.trimStart().startsWith("<svg"), "not an SVG document");
        assert(text.includes("</svg>"), "SVG is not closed");
        if (asset.kind === "svg-embedded-webp") {
          const data = /data:image\/(webp|png);base64,([A-Za-z0-9+/=]+)/.exec(text);
          assert(data, "embedded raster data URI missing");
          const payload = Buffer.from(data[2], "base64");
          if (data[1] === "webp") validateWebP(payload, `${asset.name} embedded data URI`);
          else assert(payload.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "embedded PNG magic invalid");
        }
        break;
      }
      case "webp":
        validateWebP(buffer, asset.name);
        break;
      case "png":
        assert(hasMagic(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "PNG magic missing");
        break;
      case "jpeg":
        assert(hasMagic(buffer, [0xff, 0xd8, 0xff]) && buffer.subarray(6, 10).equals(Buffer.from("JFIF")), "JPEG magic missing");
        break;
      default:
        break;
    }
  });
}

/* --------------------------- Sacred Core contract -------------------------- */

const lenaCss = readFileSync(resolve(JIWDHA, "src/lena.css"), "utf8");
const sacredCss = readFileSync(resolve(JIWDHA, "src/styles/sacred-core.css"), "utf8");
const retiredInline = resolve(JIWDHA, "src/assets/lena-sacred-core-v3-inline.svg");

console.log("\n== Guardian: Sacred Core source contract ==\n");

check("approved WebP owns the shared Sacred Core center", () => {
  const centerRule = /\.lena-house,\s*\n\.lena-world-core\s*\{[\s\S]*?\}/.exec(sacredCss);
  assert(centerRule, "shared .lena-house / .lena-world-core rule missing");
  assert(/background:\s*transparent\s+url\([^)]*lena-sacred-core\.webp[^)]*\)/.test(centerRule[0]), "center must be a transparent url() background of the approved WebP");
  assert(/border-color:\s*transparent\s*!important/.test(centerRule[0]), "center must not carry a fake disk border");
  assert(centerRule[0].includes("no-repeat"), "center must be contained/no-repeat");
});

check("retired/truncated Sacred Core assets cannot own the center", () => {
  assert(!existsSync(retiredInline), "retired v3 inline SVG must not exist");
  assert(!sacredCss.includes("lena-sacred-core-v3-inline"), "retired inline asset reference found");
  assert(!sacredCss.includes("lena-sacred-core-v2"), "retired v2 asset reference found");
  const centerRule = /\.lena-house,\s*\n\.lena-world-core\s*\{[\s\S]*?\}/.exec(sacredCss)?.[0] ?? "";
  assert(!/radial-gradient/.test(centerRule), "center must be the artwork url() — a radial-gradient would be a synthetic stand-in");
  assert(!/radial-gradient\([^)]*(?:#020202|#030303|#090705|#171009)/i.test(sacredCss), "dark synthetic disk gradient found");
  assert(!/background(?:-color)?:\s*(?:#0[0-9a-f]{5}\b|black\b)/i.test(centerRule), "black/void background found on the center");
});

check("sacred-core.css still loads after World styles (cascade priority)", () => {
  const worldIndex = lenaCss.indexOf('@import "./styles/world.css"');
  const sacredIndex = lenaCss.indexOf('@import "./styles/sacred-core.css"');
  assert(worldIndex >= 0 && sacredIndex > worldIndex, "sacred-core.css must be imported after world.css");
});

check("chamber/inner watermarks still reference the canonical WebP", () => {
  const chamber = readFileSync(resolve(JIWDHA, "src/styles/world-chamber.css"), "utf8");
  const inner = readFileSync(resolve(JIWDHA, "src/styles/world-inner.css"), "utf8");
  assert(chamber.includes("lena-sacred-core.webp"), "chamber watermark reference missing");
  assert(inner.includes("lena-sacred-core.webp"), "inner watermark reference missing");
});

check("primary logo/identity is present in the app", () => {
  const logo = readFileSync(resolve(JIWDHA, "src/design-system/brand/LenaLogo.tsx"), "utf8");
  assert(logo.includes("lena-logo-mark") && logo.includes("<svg"), "LenaLogo must render the SVG mark");
  const favicon = readFileSync(resolve(JIWDHA, "public/favicon.svg"), "utf8");
  assert(favicon.trimStart().startsWith("<svg"), "favicon must be an SVG");
});

/* ------------------------- built output resolution ------------------------ */

const DIST = resolve(JIWDHA, "dist/public");
if (existsSync(DIST)) {
  console.log("\n== Guardian: built output asset resolution ==\n");
  const assetsDir = resolve(DIST, "assets");
  const built = existsSync(assetsDir) ? readdirSync(assetsDir) : [];

  check("built output contains the canonical Sacred Core WebP", () => {
    assert(built.some((name) => /^lena-sacred-core-[\w-]+\.webp$/.test(name)), "hashed core WebP missing from dist");
    assert(!built.some((name) => /^lena-sacred-core-v3-inline-[\w-]+\.svg$/.test(name)), "retired inline Sacred Core leaked into dist");
  });

  check("built stylesheet references the hashed canonical WebP", () => {
    const css = readdirSync(assetsDir)
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFileSync(resolve(assetsDir, name), "utf8"))
      .join("\n");
    assert(css.includes("lena-sacred-core-"), "built CSS must reference the core WebP");
    assert(!css.includes("lena-sacred-core-v3-inline-"), "built CSS must not reference the retired inline asset");
  });
} else {
  console.log("\n== Guardian: built output check SKIPPED (dist/public missing — run pnpm build first) ==\n");
}

/* ------------------------------- routes ---------------------------------- */

console.log("\n== Guardian: critical route inventory ==\n");

const appSource = readFileSync(resolve(JIWDHA, "src/App.tsx"), "utf8");
const dynamicRoutes = appSource.match(/path="([^"]+)"/g) ?? [];

check("every critical route exists in the router", () => {
  const missing = [];
  for (const route of config.criticalRoutes) {
    const literal = `path="${route.path}"`;
    const dynamic = `path="/world/:systemId"`;
    const present = dynamicRoutes.includes(literal) || (route.path.startsWith("/world/") && dynamicRoutes.includes(dynamic));
    if (!present) missing.push(route.path);
  }
  assert(missing.length === 0, `routes missing from App.tsx: ${missing.join(", ")}`);
});

check("future-route config remains structurally valid", () => {
  for (const route of config.futureRoutes) void route;
  assert(Array.isArray(config.futureRoutes), "futureRoutes must be an array");
  assert(dynamicRoutes.length > 5, "router inventory unexpectedly empty");
});

console.log(failures === 0 ? "\nALL GUARDIAN ASSET CHECKS PASSED\n" : `\n${failures} GUARDIAN CHECKS FAILED\n`);
process.exit(failures ? 1 : 0);
