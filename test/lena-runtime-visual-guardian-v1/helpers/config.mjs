import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const GUARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Shared route / journey / asset configuration for the Guardian.
 *
 * Both browser suites (Playwright) and the static integrity verifier read this
 * file, so adding a route (e.g. `/world/command` after a parallel branch
 * merges) is a one-line change here + the matching `<Route>` in App.tsx.
 */
export function loadGuardianConfig() {
  return JSON.parse(readFileSync(resolve(GUARD_DIR, "routes.config.json"), "utf8"));
}

export const GUARDIAN_CONFIG = loadGuardianConfig();

export const PLATFORM_ROOT = resolve(GUARD_DIR, "..", "..");

export function platformPath(relativePath) {
  return resolve(PLATFORM_ROOT, relativePath);
}
