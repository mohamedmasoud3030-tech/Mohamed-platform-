import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
/** Repository root, so these suites run from any checkout. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Executable freshness tests: does the help content still describe the real system?
// These read the actual source of truth, so they fail when behaviour drifts from documentation.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const R = `${ROOT}`;
const read = (p) => readFileSync(`${R}/${p}`, "utf8");

const help = read("artifacts/jiwdah/src/content/help.ts");
const app = read("artifacts/jiwdah/src/App.tsx");
const storage = read("artifacts/api-server/src/lib/project-media-storage.ts");
const inquiries = read("artifacts/api-server/src/trpc/routers/inquiries.ts");
const oauth = read("artifacts/api-server/src/auth/oauth.ts");
const login = read("artifacts/jiwdah/src/pages/Login.tsx");
const contact = read("artifacts/jiwdah/src/pages/Contact.tsx");
const adminHelp = read("artifacts/jiwdah/src/components/AdminSupport.tsx");
const enums = read("lib/api-zod/src/enums.ts");
const support = read("artifacts/jiwdah/src/lib/support.ts");

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

console.log("\n== FT1: help deep links resolve to real routes ==");
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
const links = [...help.matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
check(`all ${links.length} help links registered in the router`, () => {
  assert.ok(links.length > 0, "no links found — extraction broken");
  for (const link of links) assert.ok(routes.includes(link), `${link} is not a route (routes: ${routes.join(", ")})`);
});

console.log("\n== FT2: upload limits quoted to the owner match the server ==");
const maxBytes = /PROJECT_MEDIA_MAX_BYTES\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/.exec(storage);
check("server limit is discoverable", () => assert.ok(maxBytes, "could not read PROJECT_MEDIA_MAX_BYTES"));
check(`admin help quotes ${maxBytes?.[1]}MB in both languages`, () => {
  assert.ok(adminHelp.includes(`${maxBytes[1]} ميغابايت`), "Arabic size wrong or missing");
  assert.ok(adminHelp.includes(`${maxBytes[1]}MB`), "English size wrong or missing");
});
const mimes = [...storage.matchAll(/\["(image|video)\/([a-z0-9+.-]+)",\s*"\.([a-z0-9]+)"\]/g)].map((m) => m[3].toUpperCase());
check(`every accepted format (${mimes.join(", ")}) is named in the admin help`, () => {
  assert.ok(mimes.length > 0);
  const upper = adminHelp.toUpperCase();
  for (const ext of mimes) {
    const named = upper.includes(ext) || (ext === "JPG" && upper.includes("JPG"));
    assert.ok(named, `${ext} is accepted by the server but never mentioned`);
  }
});

console.log("\n== FT3: the rate limit told to visitors matches the server ==");
const attempts = /INQUIRY_RATE_LIMIT_MAX_ATTEMPTS\s*=\s*(\d+)/.exec(inquiries)[1];
const windowMs = /INQUIRY_RATE_LIMIT_WINDOW_MS\s*=\s*([^;]+);/.exec(inquiries)[1];
check(`server allows ${attempts} per ${windowMs.trim()}`, () => {
  assert.equal(attempts, "5");
  assert.ok(windowMs.includes("60 * 60 * 1000"), "window is no longer one hour");
});
check("help says five per hour in Arabic and English", () => {
  assert.ok(help.includes("خمسة استفسارات في الساعة"), "Arabic rate-limit wording drifted");
  assert.ok(help.includes("five inquiries per hour"), "English rate-limit wording drifted");
});

console.log("\n== FT4: inquiry statuses in the admin help match the enum ==");
// Only the statuses actually offered in the interface need an explanation.
// Legacy values still render on historical rows but are never selectable.
const statuses = /INQUIRY_PIPELINE_VALUES\s*=\s*\[([^\]]+)\]/.exec(enums)[1]
  .match(/"([a-z_]+)"/g).map((s) => s.replaceAll('"', ""));
const allStatuses = /INQUIRY_STATUS_VALUES\s*=\s*\[([^\]]+)\]/.exec(enums)[1]
  .match(/"([a-z_]+)"/g).map((s) => s.replaceAll('"', ""));
const legacyStatuses = allStatuses.filter((v) => !statuses.includes(v));
check(`legacy statuses (${legacyStatuses.join(", ") || "none"}) are never offered as a choice`, () => {
  const dashboard = read("artifacts/jiwdah/src/pages/Dashboard.tsx");
  const pipeline = /const PIPELINE: InquiryStatus\[\] = \[([^\]]+)\]/.exec(dashboard);
  assert.ok(pipeline, "the dashboard no longer declares an explicit pipeline");
  for (const legacy of legacyStatuses) {
    assert.ok(!pipeline[1].includes(`"${legacy}"`), `legacy status "${legacy}" is offered in the picker`);
  }
});
check(`every offered status (${statuses.join(", ")}) is explained to the owner`, () => {
  const labels = { new: ["استفسار جديد", "New inquiry"], contacted: ["تم التواصل", "Contacted"], quoted: ["عرض سعر", "Quoted"], agreed: ["متفق", "Agreed"], in_progress: ["تحت التنفيذ", "In delivery"], completed: ["مكتمل", "Completed"], closed: ["مغلق", "Closed"], archived: ["مؤرشف", "Archived"], qualified: ["مؤهل", "Qualified"] };
  for (const status of statuses) {
    const pair = labels[status];
    assert.ok(pair, `status "${status}" has no documented label at all`);
    assert.ok(adminHelp.includes(pair[0]), `Arabic label for "${status}" missing from admin help`);
    assert.ok(adminHelp.includes(pair[1]), `English label for "${status}" missing from admin help`);
  }
});

console.log("\n== FT5: every sign-in failure has a human sentence ==");
const errorCodes = [
  ...oauth.matchAll(/\/login\?error=([a-z]+)/g),
  ...oauth.matchAll(/loginErrorPath\("([a-z]+)"\)/g),
].map((m) => m[1]);
check(`server emits [${[...new Set(errorCodes)].join(", ")}] and all are handled`, () => {
  assert.ok(errorCodes.length >= 5, "expected at least five distinct failure redirects");
  for (const code of new Set(errorCodes)) {
    assert.ok(new RegExp(`\\b${code}:`).test(login), `no message for ?error=${code}`);
  }
});
check("no sign-in path returns raw JSON any more", () => {
  assert.ok(!/res\.status\((400|500)\)\.json/.test(oauth), "a raw JSON error response came back");
});

console.log("\n== FT6: the reply promise is identical everywhere ==");
check("Arabic promise identical on /contact and /help", () => {
  const promise = "نرد خلال يوم عمل واحد";
  assert.ok(contact.includes(promise), "missing from the contact confirmation");
  assert.ok(help.includes(promise), "missing from the help page");
});
check("English promise identical on /contact and /help", () => {
  const promise = "We reply within one business day";
  assert.ok(contact.includes(promise), "missing from the contact confirmation");
  assert.ok(help.includes(promise), "missing from the help page");
});

console.log("\n== FT7: help never describes something that does not exist ==");
check("help never promises an in-product feature that does not exist", () => {
  // Subscription is a real commercial model (owner, 2026-08-20), so describing it
  // is truthful. What must never be implied is an in-app surface for it: this
  // product has no customer login, no billing screen and no invoices.
  for (const forbidden of ["حسابك على المنصة", "لوحة العميل", "بوابة العملاء", "الفاتورة",
                           "invoice", "client portal", "your account", "billing page", "sign up"]) {
    assert.ok(!help.includes(forbidden), `help mentions "${forbidden}" which this product does not have`);
  }
});
check("no in-app billing or customer-account surface actually exists", () => {
  const routes = app.match(/path="([^"]+)"/g) ?? [];
  for (const route of routes) {
    assert.ok(!/billing|checkout|subscribe|account/i.test(route), `unexpected route ${route}`);
  }
});

console.log("\n== FT8: support intake cannot leak private context ==");
check("route is captured as pathname only (no query string)", () => {
  assert.ok(support.includes("window.location.pathname"), "pathname not used");
  assert.ok(!support.includes("location.search") && !support.includes("location.href"), "query string or full URL captured");
});
check("no cookies, storage, or headers are read", () => {
  for (const forbidden of ["document.cookie", "localStorage", "sessionStorage", "navigator.userAgent"]) {
    assert.ok(!support.includes(forbidden), `support context reads ${forbidden}`);
  }
});
check("no automatic transmission anywhere in the support path", () => {
  for (const src of [support, adminHelp]) {
    assert.ok(!/\bfetch\(/.test(src) && !/XMLHttpRequest|sendBeacon/.test(src), "support code performs a network call");
  }
});

console.log("\n== FT9: help still describes the current admin model ==");
check("admin help explains masking, archive-vs-purge and the audit trail", () => {
  for (const needle of ["إظهار بيانات التواصل", "أرشفة", "سجل المراجعة", "Reveal contact details", "Archive", "Audit trail"]) {
    assert.ok(adminHelp.includes(needle), `admin help no longer mentions "${needle}"`);
  }
});
check("no help text still promises a one-click delete", () => {
  assert.ok(!adminHelp.includes("استخدم حالة «مؤرشف» بدل الحذف"), "stale pre-operations wording remains");
});
check("visitor help covers language addresses and the privacy page", () => {
  assert.ok(help.includes("/ar") || help.includes("لكل لغة عنوان مستقل"), "language addressing is undocumented");
  assert.ok(help.includes('to: "/privacy"'), "the privacy page is not linked from help");
});

console.log(failures === 0 ? "\nALL FRESHNESS TESTS PASSED\n" : `\n${failures} FRESHNESS TEST(S) FAILED\n`);
process.exit(failures ? 1 : 0);
