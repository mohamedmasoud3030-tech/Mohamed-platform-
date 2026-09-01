#!/usr/bin/env node
/**
 * Runs every verification suite and fails if any of them does.
 *
 * These suites exist because typecheck and build cannot detect the failures that
 * actually matter here: a metadata regression, a locale routing mistake, personal
 * data leaking into a support report or an analytics event, an authorization
 * hole, or help text that has drifted away from the behaviour it describes.
 *
 * Suites that need a live database report SKIPPED rather than failing, so an
 * environment without one stays honest instead of green by omission.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import net from "node:net";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SUITES = [
  { name: "egress guard", file: "tools/check-egress.mjs" },
  { name: "seo metadata & hreflang", file: "tools/verify-seo.mjs" },
  { name: "locale routing", file: "tools/verify-locale.mjs" },
  { name: "base-path authority", file: "tools/verify-base-path.mjs" },
  { name: "optional lena subpath contract", file: "tools/verify-subpath-contract.mjs" },
  { name: "malek product association", file: "tools/verify-malek-association.mjs" },
  { name: "lena sacred core identity", file: "tools/verify-sacred-core.mjs" },
  { name: "lena world portal", file: "tools/verify-world-portal.mjs" },
  { name: "lena world chambers", file: "tools/verify-world-chambers.mjs" },
  { name: "lena inner constellations", file: "tools/verify-inner-constellations.mjs" },
  { name: "lena constellation graph", file: "tools/verify-constellation-graph.mjs" },
  { name: "inquiry draft recovery", file: "tools/verify-draft.mjs" },
  { name: "support report privacy", file: "tools/verify-support.mjs" },
  { name: "crash boundary", file: "tools/verify-boundary.mjs" },
  { name: "analytics layer", file: "tools/verify-analytics.mjs" },
  { name: "owner allowlist", file: "tools/verify-owner-allowlist.mjs" },
  { name: "localization integrity", file: "tools/verify-i18n.mjs" },
  { name: "help content freshness", file: "tools/verify-freshness.mjs" },
  { name: "admin authorization", file: "tools/verify-admin.sh", needsApi: true },
];

/** Is the API reachable? Determines whether the database-backed suite can run. */
function apiReachable(port = 8080, host = "127.0.0.1") {
  return new Promise((done) => {
    const socket = net.connect({ port, host });
    const finish = (result) => {
      socket.destroy();
      done(result);
    };
    socket.setTimeout(700);
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

const results = [];
let failed = 0;
let skipped = 0;

for (const suite of SUITES) {
  const path = resolve(ROOT, suite.file);
  if (!existsSync(path)) {
    results.push([suite.name, "MISSING"]);
    failed++;
    continue;
  }
  if (suite.needsApi && !(await apiReachable())) {
    results.push([suite.name, "SKIPPED (no API on 127.0.0.1:8080)"]);
    skipped++;
    continue;
  }

  const runner = suite.file.endsWith(".sh") ? "bash" : process.execPath;
  const run = spawnSync(runner, [path], { cwd: ROOT, encoding: "utf8" });
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const assertions = (output.match(/^\s*PASS\s/gm) ?? []).length;

  if (run.status === 0) {
    results.push([suite.name, assertions ? `PASS (${assertions} assertions)` : "PASS"]);
  } else {
    results.push([suite.name, `FAIL (exit ${run.status})`]);
    failed++;
    process.stderr.write(`\n--- ${suite.name} ---\n${output.trim().split("\n").slice(-25).join("\n")}\n`);
  }
}

const width = Math.max(...results.map(([name]) => name.length));
console.log("");
for (const [name, status] of results) {
  console.log(`  ${name.padEnd(width, " ")} ..... ${status}`);
}
const total = results.reduce((sum, [, status]) => {
  const match = /\((\d+) assertions\)/.exec(status);
  return sum + (match ? Number(match[1]) : 0);
}, 0);
console.log(
  `\n  ${results.length} suites, ${total} assertions, ${failed} failing` +
    (skipped ? `, ${skipped} skipped` : "") +
    "\n",
);

process.exit(failed > 0 ? 1 : 0);
