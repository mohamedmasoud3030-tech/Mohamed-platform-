import { test, expect } from "@playwright/test";
import {
  expectCoreArtworkHealthy,
  expectCoreCssContract,
  HOME_CORE,
  probeCore,
  WORLD_CORE,
} from "../helpers/core.mjs";
import { openApp, VIEWPORTS } from "../helpers/app.mjs";

/**
 * Phase 2 — Sacred Core integrity contract in the browser.
 *
 * Beyond the static verifier, this suite proves the canonical artwork really
 * renders: CSS contract (canonical asset, transparent, no fake disk),
 * non-zero geometry, and in-browser decode/paint of the embedded artwork.
 *
 * The regression test at the bottom is the explicit guard for:
 *   "eye/glow visible while the main Sacred Core artwork is missing"
 * (the ::after pseudo-element keeps glowing while the background artwork
 *  fails to load) — this MUST fail CI when it happens again.
 */

async function expectCoreHealthy(page, selector, label, { viewport, minSize } = {}) {
  const probe = await probeCore(page, selector, label);
  expectCoreCssContract(probe, page);
  expect(probe.rect.width, `${label} desktop size`).toBeGreaterThanOrEqual(minSize ?? 150);
  if (viewport) {
    const { width } = await page.evaluate(() => ({
      width: window.innerWidth,
    }));
    expect(probe.rect.left, `${label} inside viewport (left)`).toBeGreaterThanOrEqual(-1);
    expect(probe.rect.left + probe.rect.width, `${label} inside viewport (right)`).toBeLessThanOrEqual(
      width + 1,
    );
  }
  const assertion = await expectCoreArtworkHealthy(page, probe);
  return { probe, assertion };
}

test("Sacred Core v3 renders on Home (dark, desktop)", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });
  const { probe } = await expectCoreHealthy(page, HOME_CORE, "Home core (.lena-house)");
  await testInfoAttachCore(page, probe);
});

test("Sacred Core v3 renders on World (dark, desktop)", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en/world" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/world", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });
  const { probe } = await expectCoreHealthy(page, WORLD_CORE, "World core (.lena-world-core)");
  await testInfoAttachCore(page, probe);
});

test("Sacred Core v3 stays visible and inside safe bounds on mobile (390x844)", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en" },
    { type: "viewport", description: "390x844" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile });
  const { probe } = await expectCoreHealthy(page, HOME_CORE, "Home core mobile", {
    viewport: true,
    minSize: 140,
  });
  await testInfoAttachCore(page, probe);
});

test("Sacred Core v3 renders on World under Arabic RTL (mobile)", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/ar/world" },
    { type: "viewport", description: "390x844" },
    { type: "theme", description: "dark" },
    { type: "locale", description: "ar" },
  );
  await openApp(page, { route: "/world", locale: "ar", theme: "dark", viewport: VIEWPORTS.mobile });
  const { probe } = await expectCoreHealthy(page, WORLD_CORE, "World core RTL mobile", {
    viewport: true,
    minSize: 140,
  });
  await testInfoAttachCore(page, probe);
});

test("REGRESSION: eye/glow may never outlive a missing Sacred Core artwork", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en (regression canary)" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  // Guard 1: element exists and is visible, glow pseudo-element is alive.
  const probe = await probeCore(page, HOME_CORE, "Home core (regression canary)");
  expect(Number(probe.pseudo.afterOpacity), "the eye/glow pseudo-element is rendered").toBeGreaterThan(0);
  expect(Number(probe.css.opacity), "element not left at opacity 0").toBeGreaterThan(0.9);

  // Guard 2: the embedded artwork itself must decode and paint.
  await expectCoreArtworkHealthy(page, probe, { minPaintedRatio: 0.05, minIdentityRatio: 0.004 });

  await testInfoAttachCore(page, probe);
});

/** Attach element + page screenshots to the report for diagnosability. */
async function testInfoAttachCore(page, probe) {
  try {
    const elementShot = await page.locator(probe.selector).screenshot({
      path: `test-results/core-${probe.label.replace(/\W+/g, "-")}.png`,
      animations: "disabled",
      timeout: 15_000,
    });
    await test.info().attach(`core-${probe.label}`, {
      body: elementShot,
      contentType: "image/png",
    });
  } catch {
    /* visual attachment is best-effort; the assertion above is the gate */
  }
}
