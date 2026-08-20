import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function resolveFrom(pkgPath, name) {
  return createRequire(resolve(ROOT, pkgPath)).resolve(name);
}

/**
 * Who is recognised as the owner.
 *
 * This is an access-control decision, so it is tested against the real compiled
 * source rather than a copy of the logic: getting it wrong either locks the
 * owner out permanently or hands admin to someone who should not have it.
 */
const { build } = await import(resolveFrom("artifacts/api-server/package.json", "esbuild"));

// The rule has no dependencies, so it compiles and runs on its own — no database,
// no OAuth client, no logger. The test exercises the real source, not a copy.
const out = await build({
  entryPoints: [resolve(ROOT, "artifacts/api-server/src/auth/owner-identity.ts")],
  bundle: true, write: false, format: "esm", platform: "neutral",
});
const { resolveOwnerIdentities, isOwnerIdentity } = await import(
  "data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64")
);

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

console.log("\n== the existing deployment keeps working unchanged ==");
check("a single OWNER_UNION_ID still grants admin", () => {
  assert.ok(isOwnerIdentity("kimi-abc", { OWNER_UNION_ID: "kimi-abc" }));
});
check("a different identity is refused", () => {
  assert.equal(isOwnerIdentity("someone-else", { OWNER_UNION_ID: "kimi-abc" }), false);
});
check("no owner configured means nobody is owner", () => {
  assert.equal(isOwnerIdentity("kimi-abc", {}), false);
  assert.deepEqual(resolveOwnerIdentities({}), []);
});

console.log("\n== recovery: a second identity can hold admin ==");
check("both identities in the allowlist are owners", () => {
  const env = { OWNER_UNION_IDS: "primary-id,backup-id" };
  assert.ok(isOwnerIdentity("primary-id", env));
  assert.ok(isOwnerIdentity("backup-id", env));
});
check("an identity outside the allowlist is refused", () => {
  assert.equal(isOwnerIdentity("intruder", { OWNER_UNION_IDS: "primary-id,backup-id" }), false);
});
check("the legacy variable and the allowlist combine", () => {
  const env = { OWNER_UNION_ID: "legacy-id", OWNER_UNION_IDS: "backup-id" };
  assert.deepEqual(resolveOwnerIdentities(env).sort(), ["backup-id", "legacy-id"]);
  assert.ok(isOwnerIdentity("legacy-id", env));
  assert.ok(isOwnerIdentity("backup-id", env));
});

console.log("\n== malformed configuration cannot widen access ==");
check("whitespace around entries is trimmed", () => {
  const env = { OWNER_UNION_IDS: "  spaced-id  ,\tsecond-id " };
  assert.deepEqual(resolveOwnerIdentities(env), ["spaced-id", "second-id"]);
  assert.ok(isOwnerIdentity("spaced-id", env));
});
check("empty entries are ignored, not treated as a wildcard", () => {
  const env = { OWNER_UNION_IDS: ",,, ,," };
  assert.deepEqual(resolveOwnerIdentities(env), []);
  assert.equal(isOwnerIdentity("anyone", env), false);
});
check("an empty identity never matches an empty configuration", () => {
  assert.equal(isOwnerIdentity("", { OWNER_UNION_IDS: "real-id" }), false);
  assert.equal(isOwnerIdentity("", {}), false);
});
check("duplicates collapse", () => {
  assert.deepEqual(resolveOwnerIdentities({ OWNER_UNION_ID: "same", OWNER_UNION_IDS: "same,same" }), ["same"]);
});
check("matching is exact, not a prefix or substring", () => {
  const env = { OWNER_UNION_IDS: "owner-1234" };
  assert.equal(isOwnerIdentity("owner-123", env), false);
  assert.equal(isOwnerIdentity("owner-12345", env), false);
  assert.equal(isOwnerIdentity("wner-1234", env), false);
});
check("matching is case sensitive", () => {
  assert.equal(isOwnerIdentity("OWNER-1", { OWNER_UNION_IDS: "owner-1" }), false);
});
check("a wildcard string is not special", () => {
  assert.equal(isOwnerIdentity("anybody", { OWNER_UNION_IDS: "*" }), false);
});
check("whitespace-only identity is refused", () => {
  assert.equal(isOwnerIdentity("   ", { OWNER_UNION_IDS: "   " }), false);
});

console.log("\n== ordering and volume ==");
check("many identities are all honoured", () => {
  const ids = Array.from({ length: 20 }, (_, i) => `id-${i}`);
  const env = { OWNER_UNION_IDS: ids.join(",") };
  assert.equal(resolveOwnerIdentities(env).length, 20);
  assert.ok(ids.every((id) => isOwnerIdentity(id, env)));
});
check("the legacy variable keeps priority order stable", () => {
  assert.deepEqual(resolveOwnerIdentities({ OWNER_UNION_IDS: "a,b", OWNER_UNION_ID: "c" }), ["a", "b", "c"]);
});

console.log(failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`);
process.exit(failures ? 1 : 0);
