import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "artifacts/lena/src");

/**
 * Localization integrity.
 *
 * This product has no translation library and does not need one: copy lives in
 * typed Arabic/English pairs. The risk of that approach is silent drift — an
 * Arabic string added without its English counterpart, an empty translation
 * shipped as a blank label, or a hardcoded date locale reintroduced. Nothing in
 * typecheck or build detects any of those. This does.
 */

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "ui") continue; // vendored design-system primitives
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const files = walk(SRC);
let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

console.log("\n== every Arabic string has an English counterpart ==");
const unpaired = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  // `ar: "..."` must be followed by an `en:` within the same object literal.
  const re = /\bar:\s*(?:"([^"]*)"|`([^`]*)`)/g;
  let m;
  while ((m = re.exec(src))) {
    const after = src.slice(m.index, m.index + 900);
    if (!/\ben:\s*(?:"|`|\[|\{)/.test(after)) {
      unpaired.push(`${relative(ROOT, file)}: ar without en near "${(m[1] ?? m[2] ?? "").slice(0, 34)}"`);
    }
  }
}
check(`all Arabic entries are paired (${files.length} files scanned)`, () => {
  assert.equal(unpaired.length, 0, `\n        ${unpaired.slice(0, 6).join("\n        ")}`);
});

console.log("\n== no empty translation is shipped as a blank label ==");
const empties = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  // An intentionally empty owner-authored field is allowed only where declared.
  const allowEmpty = src.includes("Empty until written") || src.includes("never generated");
  if (allowEmpty) continue;
  for (const m of src.matchAll(/\b(ar|en):\s*""/g)) {
    empties.push(`${relative(ROOT, file)}: empty ${m[1]} value`);
  }
}
check("no accidental empty strings", () => {
  assert.equal(empties.length, 0, `\n        ${empties.slice(0, 6).join("\n        ")}`);
});

console.log("\n== dates and numbers go through the shared formatter ==");
const rawIntl = [];
for (const file of files) {
  if (file.endsWith("lib/format.ts")) continue;
  const src = readFileSync(file, "utf8");
  if (/new Intl\.(DateTimeFormat|NumberFormat|RelativeTimeFormat|PluralRules)/.test(src)) {
    rawIntl.push(relative(ROOT, file));
  }
}
check("no component builds its own Intl formatter", () => {
  assert.equal(rawIntl.length, 0, `use lib/format.ts instead: ${rawIntl.join(", ")}`);
});

console.log("\n== no country is hardcoded into a locale tag ==");
const hardcoded = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/["'`](ar-[A-Z]{2}|en-US)["'`]/g)) {
    hardcoded.push(`${relative(ROOT, file)}: ${m[1]}`);
  }
}
check("locale tags stay region-neutral", () => {
  // en-GB is the deliberate English formatting choice; ar-OM and en-US are not.
  assert.equal(hardcoded.length, 0, hardcoded.join(", "));
});

console.log("\n== RTL uses logical properties, not physical ones ==");
const cssFiles = walk(resolve(SRC, "styles")).concat([resolve(SRC, "pages/contact.css")].filter((f) => {
  try { statSync(f); return true; } catch { return false; }
}));
const physical = [];
for (const file of cssFiles.filter((f) => f.endsWith(".css"))) {
  const css = readFileSync(file, "utf8");
  for (const m of css.matchAll(/(?:^|[;{\s])(margin-left|margin-right|padding-left|padding-right|text-align:\s*(?:left|right))\s*:?/g)) {
    physical.push(`${relative(ROOT, file)}: ${m[1]}`);
  }
}
check("no physical left/right spacing in the stylesheets we own", () => {
  assert.equal(physical.length, 0, `\n        ${[...new Set(physical)].slice(0, 8).join("\n        ")}`);
});

console.log("\n== both languages expose the same set of help articles ==");
// The canonical help authority is the shared content package; the lena file re-exports it.
const help = readFileSync(resolve(ROOT, "lib/content/src/index.ts"), "utf8");
check("every article answers in both languages", () => {
  const questions = (help.match(/question:\s*\{/g) ?? []).length;
  const answers = (help.match(/answer:\s*\{/g) ?? []).length;
  assert.ok(questions > 0, "no articles found — extraction broken");
  assert.equal(questions, answers, `${questions} questions but ${answers} answers`);
});

console.log("\n== the formatter itself behaves in both languages ==");
const { build } = await import(
  (await import("node:module")).createRequire(resolve(ROOT, "artifacts/api-server/package.json")).resolve("esbuild")
);
const out = await build({
  entryPoints: [resolve(SRC, "lib/format.ts")],
  bundle: true, write: false, format: "esm", platform: "neutral",
  alias: { "@": SRC },
});
const fmt = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

check("Arabic plural picks a different form from English", () => {
  const ar = fmt.plural(3, "ar", { one: "استفسار واحد", two: "استفساران", few: "{n} استفسارات", many: "{n} استفسارًا", other: "{n} استفسار" });
  const en = fmt.plural(3, "en", { one: "{n} inquiry", other: "{n} inquiries" });
  assert.ok(ar.includes("استفسارات"), `Arabic few form not selected: ${ar}`);
  assert.ok(en.includes("inquiries"), `English plural wrong: ${en}`);
});
check("singular is correct in both", () => {
  assert.equal(fmt.plural(1, "en", { one: "{n} inquiry", other: "{n} inquiries" }), "1 inquiry");
  assert.ok(fmt.plural(1, "ar", { one: "استفسار واحد", other: "{n} استفسار" }).includes("واحد"));
});
check("a missing plural form falls back instead of rendering undefined", () => {
  const value = fmt.plural(11, "ar", { other: "{n} عنصر" });
  assert.ok(!value.includes("undefined"), value);
});
check("numbers format per locale", () => {
  assert.ok(fmt.formatNumber(1234, "en").includes(","));
  assert.equal(typeof fmt.formatNumber(1234, "ar"), "string");
});
check("dates format in both languages without throwing", () => {
  for (const l of ["ar", "en"]) {
    assert.ok(fmt.formatDate("2026-08-20", l).length > 0);
    assert.ok(fmt.formatDateTime("2026-08-20T10:00:00Z", l).length > 0);
    assert.ok(fmt.formatShortDateTime("2026-08-20T10:00:00Z", l).length > 0);
  }
});
check("Latin text is isolated for safe embedding in Arabic", () => {
  const wrapped = fmt.isolate("LENA Flow");
  assert.ok(wrapped.startsWith("\u2068") && wrapped.endsWith("\u2069"));
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
