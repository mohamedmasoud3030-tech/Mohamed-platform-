import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

// The error boundary is the last line of defence. Verify it recovers and leaks nothing.
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import assert from "node:assert/strict";

globalThis.document = { documentElement: { lang: "ar" } };
globalThis.window = { location: { pathname: "/dashboard/projects-editor", reload() {} } };
globalThis.console = { ...console, error: (...a) => globalThis.__logged.push(a) };
globalThis.__logged = [];

const out = await build({
  entryPoints: [`${ROOT}/artifacts/jiwdah/src/components/ErrorBoundary.tsx`],
  bundle: true, write: false, format: "esm", platform: "neutral",
  jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment",
  inject: [`${ROOT}/tools/shim/inject.js`],
  alias: { react: `${ROOT}/tools/shim/react.js`, "@": `${ROOT}/artifacts/jiwdah/src` },
  define: { __APP_BUILD__: JSON.stringify("abc1234.2026-08-20"), "import.meta.env": "{}" },
});
const mod = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const ErrorBoundary = mod.default;

const flatten = (node, acc = []) => {
  if (node == null || node === false) return acc;
  if (typeof node === "string" || typeof node === "number") { acc.push(String(node)); return acc; }
  if (Array.isArray(node)) { node.forEach((n) => flatten(n, acc)); return acc; }
  acc.push({ type: node.type, props: node.props });
  (node.children || []).forEach((c) => flatten(c, acc));
  return acc;
};

let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  PASS  ${name}`); } catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); } };

console.log("\n== healthy path ==");
const ok = new ErrorBoundary({ children: "APP" });
check("children render untouched when nothing fails", () => assert.equal(ok.render(), "APP"));

console.log("\n== after a crash ==");
const boom = new ErrorBoundary({ children: "APP" });
Object.assign(boom.state, ErrorBoundary.getDerivedStateFromError());
boom.componentDidCatch(new Error("TOP SECRET internal failure at row 42 for user sara@example.com"), { componentStack: "at Dashboard\n at App" });

const tree = flatten(boom.render());
const text = tree.filter((n) => typeof n === "string").join(" ");
const nodes = tree.filter((n) => typeof n !== "string");

check("the visitor is told what happened, in Arabic", () => assert.ok(text.includes("حدث خطأ غير متوقع")));
check("a reference is displayed", () => assert.match(text, /LENA-\d{6}-[A-Z0-9]{4}/));
check("recovery: a reload button exists", () => assert.ok(nodes.some((n) => n.type === "button" && typeof n.props.onClick === "function")));
check("recovery: a link home exists", () => assert.ok(nodes.some((n) => n.type === "a" && n.props.href === "/")));
check("recovery: a WhatsApp report link exists", () => {
  const wa = nodes.find((n) => n.type === "a" && String(n.props.href).startsWith("https://wa.me/"));
  assert.ok(wa, "no WhatsApp link");
  assert.ok(decodeURIComponent(wa.props.href).includes("LENA-"), "reference not carried into the message");
});

console.log("\n== nothing sensitive reaches the screen ==");
for (const secret of ["TOP SECRET", "sara@example.com", "componentStack", "at Dashboard", "row 42"]) {
  check(`screen never shows "${secret}"`, () => assert.ok(!JSON.stringify(tree).includes(secret)));
}
check("the real error stays in the console for the maintainer", () => {
  assert.ok(globalThis.__logged.length === 1, "expected exactly one console.error");
  assert.ok(String(globalThis.__logged[0][0]).includes("LENA-"), "console line lacks the reference");
});
check("no network call is made on crash", () => assert.ok(!out.outputFiles[0].text.includes("fetch(")));

console.log("\n== language follows the page ==");
globalThis.document.documentElement.lang = "en";
const en = flatten(boom.render()).filter((n) => typeof n === "string").join(" ");
check("English page shows English recovery copy", () => assert.ok(en.includes("Something went wrong")));

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
