/**
 * Starts the built LENA site (vite preview) for the browser suites.
 *
 * - Serves `artifacts/jiwdah/dist/public` on PORT (default 4173).
 * - Builds the jiwdah workspace first if dist is missing (local convenience).
 *
 * In CI the `build` job already produced the dist, so this effectively starts
 * a production preview server — no dev-server specific routes or HMR.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLATFORM_ROOT = resolve(GUARD_DIR, "..", "..");
const JIWDHA = resolve(PLATFORM_ROOT, "artifacts", "jiwdah");
const DIST = resolve(JIWDHA, "dist", "public");
const PORT = process.env.PORT ?? "4173";

if (!existsSync(DIST)) {
  console.log(`[guardian] ${DIST} missing — building @workspace/jiwdah first…`);
  const build = spawn("pnpm", ["--filter", "@workspace/jiwdah", "run", "build"], {
    cwd: PLATFORM_ROOT,
    stdio: "inherit",
  });
  const code = await new Promise((done) => build.on("exit", done));
  if (code !== 0) throw new Error(`jiwdah build failed with exit ${code}`);
}

console.log(`[guardian] serving ${DIST} on http://127.0.0.1:${PORT}`);
const preview = spawn(
  "pnpm",
  [
    "exec",
    "vite",
    "preview",
    "--config",
    "vite.config.ts",
    "--port",
    PORT,
    "--host",
    "0.0.0.0",
    "--strictPort",
  ],
  { cwd: JIWDHA, stdio: "inherit", env: { ...process.env, PORT } },
);
preview.on("exit", (code) => process.exit(code ?? 1));
