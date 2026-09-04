import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

import { createRequire } from "node:module";
/** Resolves a workspace dependency from the package that declares it. */
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

// Verification of abandoned-progress recovery: compiles the real module and drives it
// against a faithful Storage implementation, including the private-mode failure path.
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));
import assert from "node:assert/strict";

class FakeStorage {
  constructor({ throwOnWrite = false, throwOnRead = false } = {}) {
    this.map = new Map();
    this.throwOnWrite = throwOnWrite;
    this.throwOnRead = throwOnRead;
  }
  getItem(k) { if (this.throwOnRead) throw new Error("blocked"); return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { if (this.throwOnWrite) throw new Error("QuotaExceeded"); this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

globalThis.window = { localStorage: new FakeStorage() };

const out = await build({
  entryPoints: [`${ROOT}/artifacts/lena/src/lib/inquiryDraft.ts`],
  bundle: true, write: false, format: "esm", platform: "neutral",
});
const mod = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const { readDraft, writeDraft, clearDraft, emptyDraft, DRAFT_STORAGE_KEY } = mod;

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

console.log("\n== abandoned progress / refresh recovery ==");

check("nothing stored means nothing to restore", () => assert.equal(readDraft(), null));

const typed = { ...emptyDraft(), name: "سارة", message: "أحتاج هوية بصرية", service: "visual-identity" };
writeDraft(typed);
check("what the visitor typed survives a refresh", () => {
  const restored = readDraft();
  assert.equal(restored.name, "سارة");
  assert.equal(restored.message, "أحتاج هوية بصرية");
  assert.equal(restored.service, "visual-identity");
});
check("untouched fields stay empty, never undefined", () => {
  const restored = readDraft();
  assert.equal(restored.email, "");
  assert.equal(restored.phone, "");
});

writeDraft(emptyDraft());
check("emptying the form clears the stored draft (no stale ghost)", () => {
  assert.equal(readDraft(), null);
  assert.equal(window.localStorage.map.has(DRAFT_STORAGE_KEY), false);
});

writeDraft({ ...emptyDraft(), name: "   " });
check("whitespace-only input is not treated as progress", () => assert.equal(readDraft(), null));

writeDraft(typed);
clearDraft();
check("successful submission wipes the draft", () => assert.equal(readDraft(), null));

console.log("\n== hostile / broken storage ==");

window.localStorage.map.set(DRAFT_STORAGE_KEY, "{not json");
check("corrupted storage does not break the page", () => assert.equal(readDraft(), null));

window.localStorage.map.set(DRAFT_STORAGE_KEY, JSON.stringify({ name: 42, message: { evil: true }, extra: "x" }));
check("wrong-typed stored values are ignored", () => assert.equal(readDraft(), null));

window.localStorage.map.set(DRAFT_STORAGE_KEY, JSON.stringify({ name: "ok", role: "admin", id: 1 }));
check("unknown keys are never restored into the form", () => {
  const restored = readDraft();
  assert.deepEqual(Object.keys(restored).sort(), ["email", "message", "name", "phone", "service"]);
  assert.equal(restored.name, "ok");
});

globalThis.window = { localStorage: new FakeStorage({ throwOnWrite: true }) };
check("private mode / quota errors never throw at the visitor", () => {
  writeDraft(typed);
  assert.equal(readDraft(), null);
});

globalThis.window = { localStorage: new FakeStorage({ throwOnRead: true }) };
check("unreadable storage degrades to an empty form", () => assert.equal(readDraft(), null));

globalThis.window = undefined;
check("no crash when storage is entirely absent", () => {
  assert.equal(readDraft(), null);
  writeDraft(typed);
  clearDraft();
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures ? 1 : 0);
