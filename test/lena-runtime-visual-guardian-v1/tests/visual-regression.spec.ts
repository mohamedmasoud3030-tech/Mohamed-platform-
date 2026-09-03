import { expect, test } from "@playwright/test";
import { openApp, VIEWPORTS } from "../helpers/app.mjs";

/**
 * Phase 4 — visual regression for critical LENA surfaces.
 *
 * Baseline matrix (kept intentionally small):
 *   Home   — mobile dark, mobile light, desktop dark
 *   World  — mobile dark, desktop dark
 *   Chamber— mobile dark, desktop dark
 *   RTL    — Arabic mobile dark (required RTL screenshot)
 *
 * Stability:
 *   - reduced-motion emulation (orbital JS places once at t=0),
 *   - theme pinned via localStorage before first paint,
 *   - fonts awaited, entry animations disabled for capture,
 *   - deterministic seeded star fields.
 * Tolerance: 2% differing pixels + perceptual threshold — microscopic
 * anti-aliasing never fails the build; disappearance / layout collapse does.
 */
const MATRIX = [
  { name: "home-mobile-dark", route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile },
  { name: "home-mobile-light", route: "/", locale: "en", theme: "light", viewport: VIEWPORTS.mobile },
  { name: "home-desktop-dark", route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop },
  { name: "world-mobile-dark", route: "/world", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile },
  { name: "world-desktop-dark", route: "/world", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop },
  { name: "chamber-mobile-dark", route: "/world/property", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile },
  { name: "chamber-desktop-dark", route: "/world/property", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop },
  { name: "home-ar-rtl-mobile-dark", route: "/", locale: "ar", theme: "dark", viewport: VIEWPORTS.mobile },
];

for (const entry of MATRIX) {
  test(`visual: ${entry.name}`, async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "route", description: `/${entry.locale}${entry.route}` },
      { type: "viewport", description: `${entry.viewport.width}x${entry.viewport.height}` },
      { type: "theme", description: entry.theme },
      { type: "locale", description: entry.locale },
    );

    const watcher = await openApp(page, entry);

    // Deterministic capture.
    await page.evaluate(() => document.fonts?.ready);

    await expect(page).toHaveScreenshot(`${entry.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.25,
      animations: "disabled",
      caret: "hide",
      scale: "css",
      timeout: 30_000,
    });

    // A visual pass never overrides runtime safety.
    const pageErrors = watcher.pageErrors;
    expect(pageErrors, "no uncaught errors during visual capture").toEqual([]);
  });
}
