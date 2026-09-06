import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

// Adversarial verification harness for the SEO head logic.
// Compiles the REAL source with esbuild and drives it against a minimal but
// faithful document.head implementation. Not committed to the repository.
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import path from "node:path";
import assert from "node:assert/strict";

const APP = `${ROOT}/artifacts/lena`;

// ---------- minimal DOM ----------
class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.attrs = new Map();
    this.textContent = "";
    this.parent = null;
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  get id() { return this.attrs.get("id") ?? ""; }
  set id(v) { this.attrs.set("id", v); }
  get type() { return this.attrs.get("type") ?? ""; }
  set type(v) { this.attrs.set("type", v); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this); }
  matches(sel) {
    let m = sel.match(/^([a-z]+)#([\w-]+)$/);
    if (m) return this.tagName === m[1].toUpperCase() && this.id === m[2];
    m = sel.match(/^([a-z]+)((?:\[[a-zA-Z:_-]+="[^"]*"\])+)$/);
    if (!m) return false;
    if (this.tagName !== m[1].toUpperCase()) return false;
    for (const attr of m[2].matchAll(/\[([a-zA-Z:_-]+)="([^"]*)"\]/g)) {
      if (this.getAttribute(attr[1]) !== attr[2]) return false;
    }
    return true;
  }
}
class Head {
  constructor() { this.children = []; }
  appendChild(el) { el.parent = this; this.children.push(el); return el; }
  querySelector(sel) { return this.children.find((c) => c.matches(sel)) ?? null; }
  querySelectorAll(sel) { return this.children.filter((c) => c.matches(sel)); }
}
const head = new Head();
globalThis.document = { head, createElement: (t) => new El(t), title: "" };
globalThis.window = { location: { origin: "https://lena.example" } };

// ---------- compile the real modules ----------
const bundle = await build({
  entryPoints: [path.join(APP, "src/hooks/useSeo.ts")],
  bundle: true, write: false, format: "esm", platform: "neutral",
  external: ["react"],
  define: { "import.meta.env": JSON.stringify({}) },
  alias: { "@": path.join(APP, "src") },
});
const code = bundle.outputFiles[0].text;

// Capture the effect callback instead of running React.
let effectFn = null;
const mod = await import(
  "data:text/javascript;base64," +
  Buffer.from(
    code.replace(/import\s*{[^}]*}\s*from\s*"react";?/g, 'const useEffect = (fn) => { globalThis.__effect = fn; };')
  ).toString("base64")
);
const { useSeo } = mod;

function apply(input) { useSeo(input); globalThis.__effect(); }
const meta = (attr, key) => head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") ?? null;
const countMeta = (attr, key) => head.querySelectorAll(`meta[${attr}="${key}"]`).length;

let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

console.log("\n== AC5/AC6/AC7: per-route head application ==");

apply({ title: "LENA Digital House — أنظمة تشغيل للأعمال الحقيقية", description: "بيت رقمي يجمع أنظمة تشغيل للعقارات والجمال والتأجير والضيافة والاستثمار وإعادة التدوير داخل عالم LENA واحد.", path: "/", locale: "ar", jsonLd: { "@context": "https://schema.org", "@graph": [{ "@type": "Organization" }, { "@type": "WebSite" }] } });

check("home title has no duplicated brand suffix", () => {
  assert.equal(document.title, "LENA Digital House — أنظمة تشغيل للأعمال الحقيقية");
});
check("home emits index,follow", () => assert.equal(meta("name", "robots"), "index,follow"));
check("home canonical is absolute and language-prefixed", () => assert.equal(head.querySelector('link[rel="canonical"]').getAttribute("href"), "https://lena.example/ar"));
check("home JSON-LD present, single, valid", () => {
  const scripts = head.children.filter((c) => c.tagName === "SCRIPT");
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].type, "application/ld+json");
  const parsed = JSON.parse(scripts[0].textContent);
  assert.equal(parsed["@graph"].length, 2);
});
check("og:locale maps ar -> ar_OM", () => assert.equal(meta("property", "og:locale"), "ar_OM"));

apply({ title: "تجربة المستخدم", description: "  وصف   فيه   مسافات   زائدة  ", path: "/services/ui-ux", locale: "ar" });

check("AC5 title switches and gains brand suffix", () => assert.equal(document.title, "تجربة المستخدم | LENA Digital House"));
check("AC5 canonical follows the route and the language", () => assert.equal(head.querySelector('link[rel="canonical"]').getAttribute("href"), "https://lena.example/ar/services/ui-ux"));
check("description whitespace is collapsed", () => assert.equal(meta("name", "description"), "وصف فيه مسافات زائدة"));
check("AC7 JSON-LD removed on routes that do not supply it", () => assert.equal(head.children.filter((c) => c.tagName === "SCRIPT").length, 0));

apply({ title: "Riwaq", description: "A contemporary café brand launch.", path: "/work/riwaq", locale: "en", type: "article" });
check("og:type article on case studies", () => assert.equal(meta("property", "og:type"), "article"));
check("og:locale maps en -> en_US", () => assert.equal(meta("property", "og:locale"), "en_US"));

apply({ title: "لوحة التحكم", description: "إدارة الاستفسارات والمشاريع.", path: "/dashboard", locale: "ar", noindex: true });
check("AC6 admin route is noindex,nofollow", () => assert.equal(meta("name", "robots"), "noindex,nofollow"));

console.log("\n== FR-3: language alternates ==");
const alts = () => head.querySelectorAll('link[rel="alternate"][data-lena="hreflang"]');
apply({ title: "Help", description: "Answers.", path: "/help", locale: "en" });
check("both languages plus x-default are declared", () => {
  const found = alts().map((n) => `${n.getAttribute("hreflang")}=${n.getAttribute("href")}`).sort();
  assert.deepEqual(found, [
    "ar=https://lena.example/ar/help",
    "en=https://lena.example/en/help",
    "x-default=https://lena.example/en/help",
  ]);
});
check("alternates follow the route, they do not accumulate", () => {
  apply({ title: "Contact", description: "Talk.", path: "/contact", locale: "ar" });
  assert.equal(alts().length, 3, `expected 3 alternates, found ${alts().length}`);
  assert.ok(alts().every((n) => n.getAttribute("href").includes("/contact")));
});
check("admin pages declare no alternates (they are noindex)", () => {
  apply({ title: "Dashboard", description: "Admin.", path: "/dashboard", locale: "ar", noindex: true });
  assert.equal(alts().length, 0);
});

console.log("\n== AC5: idempotency (the real regression risk) ==");
for (let i = 0; i < 25; i++) apply({ title: `Route ${i}`, description: `Description ${i}`, path: `/services/route-${i}`, locale: "en", jsonLd: i % 2 ? { "@type": "Thing" } : null });

check("exactly one <title> value, never appended", () => assert.equal(document.title, "Route 24 | LENA Digital House"));
for (const [attr, key] of [["name", "description"], ["name", "robots"], ["property", "og:title"], ["property", "og:url"], ["property", "og:image"], ["name", "twitter:card"]]) {
  check(`exactly one meta[${attr}=${key}] after 29 route changes`, () => assert.equal(countMeta(attr, key), 1));
}
check("exactly one canonical link after 29 route changes", () => assert.equal(head.querySelectorAll('link[rel="canonical"]').length, 1));
check("at most one JSON-LD script after alternating routes", () => assert.ok(head.children.filter((c) => c.tagName === "SCRIPT").length <= 1));
check("head never grows unbounded", () => assert.ok(head.children.length <= 18, `head has ${head.children.length} nodes`));

console.log("\n== long-description clamping ==");
apply({ title: "T", description: "ب".repeat(400), path: "/about", locale: "ar" });
check("description clamped to <= 165 chars", () => assert.ok(meta("name", "description").length <= 165));

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
