// Measurement layer verification: fires once, carries nothing sensitive, and
// never pollutes production numbers with test or bot traffic.
import { build } from "/home/user/platform/node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/lib/main.js";
import assert from "node:assert/strict";

const captured = [];
globalThis.window = { location: { hostname: "lena.example", pathname: "/ar/contact" }, doNotTrack: undefined };
// navigator is replaced per-scenario via defineProperty in setup()

const out = await build({
  entryPoints: ["/home/user/platform/artifacts/jiwdah/src/lib/analytics/index.ts"],
  bundle: true, write: false, format: "esm", platform: "neutral",
  alias: { "@": "/home/user/platform/artifacts/jiwdah/src" },
});
const A = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));

let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  PASS  ${name}`); } catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); } };
const setup = (nav = {}, env = "production", enabled = true) => {
  captured.length = 0;
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Mozilla/5.0", webdriver: false, doNotTrack: undefined, ...nav }, configurable: true });
  A.configureAnalytics({ sink: (p) => captured.push(p), environment: env, enabled });
};

console.log("\n== the taxonomy is a closed set ==");
setup();
A.track("inquiry_submitted", { locale: "ar" });
check("a known event is recorded", () => assert.equal(captured.length, 1));
A.track("user_signed_up", { locale: "ar" });
check("an invented event is refused", () => {
  assert.equal(captured.length, 1);
  assert.ok(A.droppedEvents().some((d) => d.includes("unknown event")));
});
A.track("inquiry_submitted", { email: "sara@example.com" });
check("an undeclared property is refused", () => assert.ok(A.droppedEvents().some((d) => d.includes("not in the allowed list"))));

console.log("\n== nothing personal or secret can pass validation ==");
const hostile = [
  ["route", "/ar/contact?email=sara@example.com"],
  ["reason", "sara.alharthi@example.com"],
  ["surface", "+96891234567"],
  ["context", "Bearer eyJhbGciOiJIUzI1NiJ9abcdefghij"],
  ["channel", "https://lena.example/secret"],
  ["outcome", "password=hunter2"],
];
for (const [key, value] of hostile) {
  setup();
  A.track("inquiry_failed", { [key]: value });
  check(`${key}="${String(value).slice(0, 28)}…" is refused`, () => {
    assert.equal(captured.length, 0, `it was sent: ${JSON.stringify(captured)}`);
  });
}
setup();
A.track("help_searched", { query_length: 12, has_results: true, locale: "en" });
check("the search query length is kept but the query itself has no field to live in", () => {
  assert.deepEqual(captured[0].properties, { query_length: 12, has_results: true, locale: "en" });
});

console.log("\n== route shapes only, never real paths ==");
const routes = [
  ["/ar/work/riwaq", "/work/:project"],
  ["/en/services/ui-ux", "/services/:service"],
  ["/ar/contact?service=ui-ux&token=SECRET", "/contact"],
  ["/en/dashboard/projects-editor", "/dashboard/:section"],
  ["/ar", "/"],
  ["/en/privacy", "/privacy"],
  ["/ar/some-unknown-thing", "/other"],
];
for (const [input, expected] of routes) {
  check(`${input} -> ${expected}`, () => assert.equal(A.normaliseRoute(input), expected));
}
setup();
A.track("page_viewed", { route: A.normaliseRoute("/ar/contact?token=SECRET123"), locale: "ar" });
check("a query-string secret cannot survive into an event", () => {
  assert.ok(!JSON.stringify(captured).includes("SECRET123"));
  assert.equal(captured[0].properties.route, "/contact");
});

console.log("\n== each event fires exactly once ==");
setup();
for (let i = 0; i < 12; i++) A.trackPageView("/ar/contact", "ar");
check("twelve renders produce one page view", () => assert.equal(captured.length, 1));
A.trackPageView("/ar/help", "ar");
check("a different route is a new page view", () => assert.equal(captured.length, 2));
A.resetOnceGuard();
A.trackPageView("/ar/contact", "ar");
check("a real navigation back is counted again", () => assert.equal(captured.length, 3));
setup();
for (let i = 0; i < 5; i++) A.trackOnce("inquiry-started", "inquiry_started", { locale: "ar" });
check("repeated keystrokes record intent once", () => assert.equal(captured.length, 1));

console.log("\n== traffic that must never be counted ==");
setup({}, "development");
A.track("inquiry_submitted", { locale: "ar" });
check("development traffic is excluded", () => assert.equal(captured.length, 0));
setup({}, "preview");
A.track("inquiry_submitted", { locale: "ar" });
check("preview traffic is excluded", () => assert.equal(captured.length, 0));
setup({ webdriver: true });
A.track("inquiry_submitted", { locale: "ar" });
check("automated browsers are excluded", () => assert.equal(captured.length, 0));
setup({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" });
A.track("inquiry_submitted", { locale: "ar" });
check("crawlers are excluded", () => assert.equal(captured.length, 0));
setup({ doNotTrack: "1" });
A.track("inquiry_submitted", { locale: "ar" });
check("Do Not Track is honoured", () => assert.equal(captured.length, 0));

console.log("\n== off by default, and never fatal ==");
captured.length = 0;
A.configureAnalytics({ sink: null, enabled: false, environment: "production" });
A.track("inquiry_submitted", { locale: "ar" });
check("with no sink configured, nothing is sent and nothing throws", () => assert.equal(captured.length, 0));
A.configureAnalytics({ sink: () => { throw new Error("sink exploded"); }, enabled: true, environment: "production" });
check("a broken sink cannot break the page", () => {
  A.track("inquiry_submitted", { locale: "ar" });
});

console.log("\n== payload shape ==");
setup();
A.track("contact_channel_opened", { channel: "whatsapp", surface: "fab" });
check("day bucket only — no timestamp precise enough to correlate a person", () => {
  assert.match(captured[0].day, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(Object.keys(captured[0]).sort(), ["day", "event", "properties"]);
});
check("no identifier of any kind is attached", () => {
  const blob = JSON.stringify(captured[0]);
  for (const bad of ["id", "user", "session", "visitor", "ip"]) {
    assert.ok(!Object.keys(captured[0].properties).some((k) => k.includes(bad)), `found ${bad}`);
  }
  assert.ok(!blob.includes("uuid"));
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
