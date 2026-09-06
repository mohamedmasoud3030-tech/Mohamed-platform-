import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

// Verifies "language as an address": the rules that decide which language a URL serves.
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import assert from "node:assert/strict";

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
globalThis.window = { localStorage: new FakeStorage() };

const out = await build({
  entryPoints: [`${ROOT}/artifacts/lena/src/lib/locale.ts`],
  bundle: true, write: false, format: "esm", platform: "neutral",
  alias: { "@": `${ROOT}/artifacts/lena/src` },
});
const L = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  PASS  ${name}`); } catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); } };
const url = (pathname, search = "", hash = "") => ({ pathname, search, hash });
const reset = () => { window.localStorage = new FakeStorage(); };

console.log("\n== a shared link always opens in the language it was shared in ==");
reset();
window.localStorage.setItem(L.LOCALE_STORAGE_KEY, "ar");
check("English link wins over an Arabic stored preference", () => {
  const r = L.bootstrapLocale(url("/en/world/property"), ["ar"]);
  assert.equal(r.locale, "en");
  assert.equal(r.redirectTo, null, "a prefixed URL must never redirect");
});
check("Arabic link wins over an English device", () => {
  assert.equal(L.bootstrapLocale(url("/ar/portfolio"), ["en-US"]).locale, "ar");
});

console.log("\n== first visit, no prefix: device decides ==");
reset();
check("Arabic device → Arabic", () => assert.equal(L.bootstrapLocale(url("/"), ["ar-EG"]).locale, "ar"));
check("English device → English", () => assert.equal(L.bootstrapLocale(url("/"), ["en-GB"]).locale, "en"));
check("French device → English fallback (we do not publish French)", () => assert.equal(L.bootstrapLocale(url("/"), ["fr-FR"]).locale, "en"));
check("German-then-Arabic device → Arabic (first supported wins)", () => assert.equal(L.bootstrapLocale(url("/"), ["de", "ar"]).locale, "ar"));
check("no language information at all → English", () => assert.equal(L.bootstrapLocale(url("/"), []).locale, "en"));

console.log("\n== a returning visitor's own choice beats the device ==");
reset();
L.storeLocale("en");
check("stored English beats an Arabic device", () => assert.equal(L.bootstrapLocale(url("/"), ["ar"]).locale, "en"));
reset();
L.storeLocale("ar");
check("stored Arabic beats an English device", () => assert.equal(L.bootstrapLocale(url("/"), ["en"]).locale, "ar"));

console.log("\n== links shared before languages had addresses still work ==");
reset();
check("/services → /en/services for an English visitor", () => {
  assert.equal(L.bootstrapLocale(url("/services"), ["en"]).redirectTo, "/en/services");
});
check("/world/property → /ar/world/property for an Arabic visitor", () => {
  assert.equal(L.bootstrapLocale(url("/world/property"), ["ar"]).redirectTo, "/ar/world/property");
});
check("query string and hash survive the move", () => {
  const r = L.bootstrapLocale(url("/contact", "?service=property", "#form"), ["en"]);
  assert.equal(r.redirectTo, "/en/contact?service=property#form");
});
check("root becomes a bare language root, not /en/", () => {
  assert.equal(L.bootstrapLocale(url("/"), ["en"]).redirectTo, "/en");
});

console.log("\n== paths that must never be given a language ==");
reset();
for (const p of ["/api/trpc/ping", "/api/oauth/callback", "/robots.txt", "/sitemap.xml", "/favicon.svg", "/assets/index-abc.js"]) {
  check(`${p} is left untouched`, () => assert.equal(L.bootstrapLocale(url(p), ["ar"]).redirectTo, null));
}

console.log("\n== switching language keeps the page ==");
check("/ar/world/property → /en/world/property", () => assert.equal(L.withLocale("en", "/ar/world/property"), "/en/world/property"));
check("/en/help → /ar/help", () => assert.equal(L.withLocale("ar", "/en/help"), "/ar/help"));
check("language root stays a root, never a trailing slash", () => assert.equal(L.withLocale("en", "/ar"), "/en"));
check("an unprefixed path gains the prefix", () => assert.equal(L.withLocale("ar", "/contact"), "/ar/contact"));

console.log("\n== router-relative paths ==");
check("/ar/dashboard/projects-editor → /dashboard/projects-editor", () => assert.equal(L.stripLocale("/ar/dashboard/projects-editor"), "/dashboard/projects-editor"));
check("/en → /", () => assert.equal(L.stripLocale("/en"), "/"));
check("already relative stays relative", () => assert.equal(L.stripLocale("/contact"), "/contact"));
check("a route that merely starts with the letters is not a language", () => {
  assert.equal(L.stripLocale("/energy"), "/energy");
  assert.equal(L.localeFromPath("/energy"), null);
});

console.log("\n== round trip is stable ==");
for (const path of ["/", "/services", "/world/property", "/world/atlas", "/contact", "/help", "/dashboard/projects-editor"]) {
  check(`${path} survives ar→en→ar unchanged`, () => {
    assert.equal(L.stripLocale(L.withLocale("ar", L.withLocale("en", L.withLocale("ar", path)))), path);
  });
}

console.log("\n== mounted under /lena (MALEK same-domain namespace) ==");
L.setBasePathForTests("/lena");
reset();
check("/lena/ar/services is Arabic and does not redirect", () => {
  const r = L.bootstrapLocale(url("/lena/ar/services"), ["en"]);
  assert.equal(r.locale, "ar");
  assert.equal(r.redirectTo, null);
});
check("/lena/en/about is English and does not redirect", () => {
  const r = L.bootstrapLocale(url("/lena/en/about"), ["ar"]);
  assert.equal(r.locale, "en");
  assert.equal(r.redirectTo, null);
});
check("/lena → /lena/ar for an Arabic device", () => {
  assert.equal(L.bootstrapLocale(url("/lena"), ["ar"]).redirectTo, "/lena/ar");
});
check("/lena/services → /lena/en/services for an English visitor", () => {
  assert.equal(L.bootstrapLocale(url("/lena/services"), ["en"]).redirectTo, "/lena/en/services");
});
check("query string survives the /lena move", () => {
  const r = L.bootstrapLocale(url("/lena/contact", "?from=malek", "#form"), ["ar"]);
  assert.equal(r.redirectTo, "/lena/ar/contact?from=malek#form");
});
check("language switch keeps the page under /lena", () => {
  assert.equal(L.withLocale("en", "/lena/ar/services"), "/lena/en/services");
  assert.equal(L.withLocale("ar", "/lena/en/contact"), "/lena/ar/contact");
});
check("router basename is /lena/<locale>", () => {
  assert.equal(L.routerBasename("ar"), "/lena/ar");
  assert.equal(L.routerBasename("en"), "/lena/en");
});
check("stripLocale under /lena returns a router-relative path", () => {
  assert.equal(L.stripLocale("/lena/ar/portfolio"), "/portfolio");
  assert.equal(L.stripLocale("/lena/en"), "/");
});
check("/lena/api and /lena/assets never receive a language", () => {
  assert.equal(L.bootstrapLocale(url("/lena/api/trpc/ping"), ["ar"]).redirectTo, null);
  assert.equal(L.bootstrapLocale(url("/lena/assets/index-abc.js"), ["en"]).redirectTo, null);
});
check("round trip under /lena is stable", () => {
  assert.equal(L.stripLocale(L.withLocale("ar", L.withLocale("en", "/lena/ar/services"))), "/services");
});
L.setBasePathForTests(null);
check("restoring the default base path returns standalone URLs", () => {
  assert.equal(L.withLocale("ar", "/contact"), "/ar/contact");
  assert.equal(L.routerBasename("en"), "/en");
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
