import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import assert from "node:assert/strict";

const alias = { "@": `${ROOT}/artifacts/lena/src` };

async function load(entry) {
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    alias,
  });
  return import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
}

const B = await load(`${ROOT}/artifacts/lena/src/lib/base-path.ts`);
const E = await load(`${ROOT}/artifacts/lena/src/lib/analytics/events.ts`);

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

console.log("\n== normalizeBasePath is the single authority ==");
check("empty, slash and missing all mean standalone", () => {
  assert.equal(B.normalizeBasePath(""), "");
  assert.equal(B.normalizeBasePath("/"), "");
  assert.equal(B.normalizeBasePath(null), "");
  assert.equal(B.normalizeBasePath(undefined), "");
});
check("trailing slashes are stripped, a leading slash is required", () => {
  assert.equal(B.normalizeBasePath("/lena/"), "/lena");
  assert.equal(B.normalizeBasePath("lena"), "/lena");
  assert.equal(B.normalizeBasePath("/lena"), "/lena");
});

console.log("\n== withBase / stripBase are idempotent ==");
B.setBasePathForTests("/lena");
check("withBase prefixes once", () => {
  assert.equal(B.withBase("/"), "/lena");
  assert.equal(B.withBase("/api/trpc"), "/lena/api/trpc");
  assert.equal(B.withBase("/lena/api/trpc"), "/lena/api/trpc");
  assert.equal(B.withBase("favicon.svg"), "/lena/favicon.svg");
});
check("stripBase restores a site-root path", () => {
  assert.equal(B.stripBase("/lena"), "/");
  assert.equal(B.stripBase("/lena/"), "/");
  assert.equal(B.stripBase("/lena/ar/services"), "/ar/services");
  assert.equal(B.stripBase("/ar/services"), "/ar/services");
});
B.setBasePathForTests(null);
check("standalone withBase is identity", () => {
  assert.equal(B.withBase("/api/trpc"), "/api/trpc");
  assert.equal(B.stripBase("/ar/services"), "/ar/services");
});

console.log("\n== analytics routes under /lena collapse to the same shapes ==");
E.setBasePathForTests?.("/lena");
if (typeof E.setBasePathForTests === "function") {
  check("/lena/ar/services → /services", () => assert.equal(E.normaliseRoute("/lena/ar/services"), "/services"));
  check("/lena/en/work/sample → /work/:project", () => assert.equal(E.normaliseRoute("/lena/en/work/sample"), "/work/:project"));
  check("/lena/ar → /", () => assert.equal(E.normaliseRoute("/lena/ar"), "/"));
  E.setBasePathForTests(null);
} else {
  // events.ts imports stripBase; the test bundle of events.ts also exports setBasePathForTests
  // if the helper is re-exported. If not, drive stripBase via a known default of "".
  check("events module is base-path aware (stripBase is used)", () => {
    const source = readFileSync(`${ROOT}/artifacts/lena/src/lib/analytics/events.ts`, "utf8");
    assert.match(source, /stripBase/);
    assert.match(source, /from "@\/lib\/base-path"/);
  });
}

console.log("\n== API client, OAuth and assets go through withBase ==");
const files = {
  trpc: readFileSync(`${ROOT}/artifacts/lena/src/providers/trpc.tsx`, "utf8"),
  sink: readFileSync(`${ROOT}/artifacts/lena/src/lib/analytics/sink.ts`, "utf8"),
  upload: readFileSync(`${ROOT}/artifacts/lena/src/lib/uploadProjectMedia.ts`, "utf8"),
  login: readFileSync(`${ROOT}/artifacts/lena/src/pages/Login.tsx`, "utf8"),
  html: readFileSync(`${ROOT}/artifacts/lena/index.html`, "utf8"),
  router: readFileSync(`${ROOT}/artifacts/lena/src/main.tsx`, "utf8"),
};
check("tRPC client uses withBase('/api/trpc')", () => {
  assert.match(files.trpc, /withBase\("\/api\/trpc"\)/);
  assert.doesNotMatch(files.trpc, /url:\s*"\/api\/trpc"/);
});
check("analytics sink does not post to host /api", () => {
  assert.match(files.sink, /withBase\("\/api\/trpc\/analytics\.record"\)/);
  assert.doesNotMatch(files.sink, /fetch\("\/api\/trpc/);
});
check("CMS upload authorises through withBase", () => {
  assert.match(files.upload, /withBase\("\/api\/upload\/sign"\)/);
});
check("admin OAuth login is base-path prefixed", () => {
  assert.match(files.login, /withBase\("\/api\/oauth\/login"\)/);
});
check("index.html assets use Vite %BASE_URL%", () => {
  assert.match(files.html, /%BASE_URL%favicon\.svg/);
  assert.match(files.html, /%BASE_URL%lena-og\.jpg/);
  assert.match(files.html, /src="\/src\/main\.tsx"/);
  assert.doesNotMatch(files.html, /href="\/favicon\.svg"/);
});
check("router basename is routerBasename(locale), not a hardcoded /ar", () => {
  assert.match(files.router, /routerBasename\(active\)/);
  assert.doesNotMatch(files.router, /basename=\{`\/\$\{active\}`\}/);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
