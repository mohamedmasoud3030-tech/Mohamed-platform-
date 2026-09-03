import { expect, test } from "@playwright/test";
import {
  expectNoFatalRuntime,
  openApp,
  readUnhandledRejections,
  VIEWPORTS,
} from "../helpers/app.mjs";

/**
 * Phase 9 — console / network watch across critical routes.
 *
 * The allowlist is narrow and explicit: only API requests (the SPA must work
 * without its backend during frontend QA) may fail. Anything else — broken
 * chunks, missing assets, page crashes, unhandled rejections — fails the test.
 */
const WATCHED_ROUTES = ["/", "/world", "/world/property", "/contact"];

for (const route of WATCHED_ROUTES) {
  test(`console/network watch: ${route} (en, dark)`, async ({ page }) => {
    test.info().annotations.push(
      { type: "route", description: `/en${route}` },
      { type: "viewport", description: "1280x800" },
      { type: "theme", description: "dark" },
      { type: "locale", description: "en" },
    );
    const log = await openApp(page, { route, locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

    await page.waitForTimeout(600);

    expect(await readUnhandledRejections(page), "unhandled promise rejections").toEqual([]);
    expectNoFatalRuntime(log, page);
  });
}
