import { expect, test } from "@playwright/test";
import {
  expectAppReady,
  expectNoFatalRuntime,
  openApp,
  readUnhandledRejections,
  VIEWPORTS,
} from "../helpers/app.mjs";
import { GUARDIAN_CONFIG } from "../helpers/config.mjs";

/**
 * Phase 1 — critical runtime smoke.
 *
 * Every critical route (from routes.config.json) must boot with:
 *  - a real page (no error boundary / route fallback / blank root),
 *  - main landmark rendered,
 *  - the route's expected owner element visible,
 *  - no uncaught error, no unhandled rejection, no fatal console error,
 *  - no failed critical network request / 4xx-5xx on same-origin assets.
 *
 * Adding `/world/command` or `/world/atlas` later = append to routes.config.json.
 */
for (const route of GUARDIAN_CONFIG.criticalRoutes) {
  for (const locale of route.locales) {
    test(`route smoke: ${route.name} (${locale})`, async ({ page }) => {
      test.info().annotations.push(
        { type: "route", description: `${locale}${route.path}` },
        { type: "locale", description: locale },
        { type: "theme", description: "dark" },
        { type: "viewport", description: "1280x800" },
      );

      const log = await openApp(page, {
        route: route.path,
        locale,
        theme: "dark",
        viewport: VIEWPORTS.desktop,
      });

      await expectAppReady(page, locale);

      // No broken hydration / runtime state: the rendered page must own text.
      await expect(page.locator("main").first()).not.toBeEmpty({ timeout: 20_000 });

      const expectedPath = `/${locale}${route.path === "/" ? "" : route.path}`;
      expect(new URL(page.url()).pathname, "canonical route should be stable").toBe(expectedPath);

      if (route.owner) {
        await expect(page.locator(route.owner).first(), `owner "${route.owner}"`).toBeVisible({
          timeout: 20_000,
        });
      }

      expect(await readUnhandledRejections(page), "unhandled promise rejections").toEqual([]);
      expectNoFatalRuntime(log, page);
    });
  }
}
