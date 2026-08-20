import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

// Verifies the support report itself: hostile input must not produce a leaky report.
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import assert from "node:assert/strict";

globalThis.window = {
  location: { pathname: "/dashboard", search: "?email=victim@example.com&token=SECRET123", href: "https://x/dashboard?token=SECRET123" },
  innerWidth: 390, innerHeight: 844,
  navigator: { onLine: true },
};
globalThis.document = { documentElement: { lang: "ar" } };
// navigator is read-only in Node; the module reads window.navigator

const out = await build({
  entryPoints: [`${ROOT}/artifacts/jiwdah/src/lib/support.ts`],
  bundle: true, write: false, format: "esm", platform: "neutral",
  define: { __APP_BUILD__: JSON.stringify("abc1234.2026-08-20") },
});
const m = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

console.log("\n== error reference ==");
const refs = new Set(Array.from({ length: 500 }, () => m.createErrorReference()));
check("references follow LENA-YYMMDD-XXXX", () => assert.match(m.createErrorReference(), /^LENA-\d{6}-[A-Z0-9]{4}$/));
check("500 references are effectively unique", () => assert.ok(refs.size > 480, `only ${refs.size} unique`));

console.log("\n== captured context ==");
const ctx = m.collectSupportContext({ role: "admin", locale: "ar" });
check("route is the pathname only", () => assert.equal(ctx.route, "/dashboard"));
check("build id is present", () => assert.equal(ctx.build, "abc1234.2026-08-20"));
check("viewport captured", () => assert.equal(ctx.viewport, "390x844"));
check("role captured", () => assert.equal(ctx.role, "admin"));

console.log("\n== the report cannot leak ==");
const report = m.formatSupportReport({
  context: ctx,
  steps: "فتحت لوحة التحكم",
  expected: "أن تظهر الاستفسارات",
  actual: "ظهرت رسالة خطأ",
});
for (const secret of ["SECRET123", "victim@example.com", "token=", "?email", "https://x/dashboard"]) {
  check(`report never contains "${secret}"`, () => assert.ok(!report.includes(secret)));
}
check("report keeps the owner's own words", () => {
  assert.ok(report.includes("فتحت لوحة التحكم"));
  assert.ok(report.includes("ظهرت رسالة خطأ"));
});
check("report is short enough to send over WhatsApp", () => assert.ok(report.length < 700, `${report.length} chars`));
check("report includes the reference for correlation", () => assert.ok(report.includes(ctx.reference)));

console.log("\n== empty answers degrade cleanly ==");
const minimal = m.formatSupportReport({ context: m.collectSupportContext() });
check("no dangling empty sections", () => {
  assert.ok(!minimal.includes("Expected:"));
  assert.ok(!minimal.includes("Actual:"));
  assert.ok(minimal.includes("Reference:"));
});

console.log("\n---\n" + report + "\n---");
console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
