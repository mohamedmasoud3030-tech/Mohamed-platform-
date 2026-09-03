import { defineConfig } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GUARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)));

/**
 * CI: real Chromium via `npx playwright install --with-deps chromium`.
 * Local restricted sandboxes (no system browser deps): LENA_LOCAL_BROWSER=1
 * launches the @sparticuz/chromium serverless binary with NSS/NSPR stubs.
 */
const local = process.env.LENA_LOCAL_BROWSER === "1" ? await (await import("./helpers/browser-stub.mjs")).localChromiumOptions() : {};
if (process.env.LENA_LOCAL_BROWSER === "1") {
  console.log(`[guardian] local browser fallback: ${local.executablePath}`);
}

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  snapshotDir: "screenshots",
  snapshotPathTemplate: "{snapshotDir}/{testFileName}/{arg}{ext}",
  fullyParallel: false,
  // The @sparticuz/chromium local fallback runs --single-process; parallel
  // workers make it unreliable. CI uses a real Chromium and is capped at 1
  // worker to keep visual baselines deterministic anyway.
  workers: process.env.LENA_LOCAL_BROWSER === "1" ? 1 : process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    [resolve(GUARD_DIR, "helpers", "artifact-reporter.mjs")],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    locale: "en-US",
    colorScheme: "dark",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
    ...(local.executablePath
      ? {
          launchOptions: {
            executablePath: local.executablePath,
            args: local.args,
            env: local.env,
          },
        }
      : {}),
  },
  projects: [
    {
      name: "smoke",
      testMatch: /(route-smoke|sacred-core|spatial-journey|a11y|console-network)\.spec\.ts/,
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "safety",
      testMatch: /safety\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "visual",
      testMatch: /visual-regression\.spec\.ts/,
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "node scripts/start-preview.mjs",
    url: "http://127.0.0.1:4173/en",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.25,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
});

mkdirSync(resolve(GUARD_DIR, "test-results"), { recursive: true });
writeFileSync(resolve(GUARD_DIR, "test-results", ".guardian-ok"), "");
