import { expect, test } from "@playwright/test";
import { openApp, settle, VIEWPORTS } from "../helpers/app.mjs";
import { GUARDIAN_CONFIG } from "../helpers/config.mjs";

/**
 * Phase 8 — spatial journey smoke.
 *
 * Home → World → Portal → Chamber → Inner Space with browser Back support.
 * Asserts navigation outcomes and clean state (no stuck overlay, no disabled
 * pointer layer), never animation frames.
 */
const journey = GUARDIAN_CONFIG.spatialJourney;

test("spatial journey: Home → World → Portal → Chamber → Inner Space → Back → Back", async ({
  page,
}) => {
  test.info().annotations.push(
    { type: "route", description: "full journey (en)" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
    { type: "locale", description: "en" },
  );

  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  // 1 → 2: Home → World via the primary gateway CTA.
  await page.getByRole("link", { name: /Enter the world/i }).click();
  await page.waitForURL(`**${journey.world}`, { timeout: 20_000 });
  await expect(page.locator(".lena-world-entity"), "World entities listed").toHaveCount(6);
  await expect(page.locator(".lena-world-core")).toBeVisible();

  // 3: select a system (portal preparation) then 4: enter the portal.
  const entity = page.locator(`.lena-world-entity[aria-label*="${journey.systemName}"]`);
  await entity.click();
  await expect(entity).toHaveAttribute("aria-pressed", "true");
  await settle(page, 350);

  await page.locator(".lena-world-info-action").click();
  await page.waitForURL(`**${journey.chamber}`, { timeout: 20_000 });

  // 5: Chamber + Inner Space present.
  await expect(page.locator("main.lena-system-chamber")).toBeVisible();
  await expect(page.locator(".lena-chamber-back")).toBeVisible();
  await expect(page.locator(journey.innerSpace)).toBeVisible();
  await expect(page.locator(".lena-inner-node").first()).toBeVisible();

  // Clean state: no stuck portal overlay / aria-busy / disabled pointer layer.
  await expect(page.locator(".lena-world.is-portal, .lena-world.is-portal-resolve")).toHaveCount(0);
  await expect(page.locator(".lena-world [aria-busy='true']")).toHaveCount(0);
  const blocked = await page.evaluate(() => {
    const target = document.querySelector("main");
    if (!target) return true;
    const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    if (!element) return true;
    const style = getComputedStyle(element);
    return style.pointerEvents === "none" && !element.closest(".lena-whatsapp-fab");
  });
  expect(blocked, "no pointer-blocking layer over the page center").toBe(false);

  // Browser Back works through the path: chamber → world → home.
  await page.goBack();
  await page.waitForURL(`**${journey.world}`, { timeout: 20_000 });
  await expect(page.locator(".lena-world-entity").first()).toBeVisible();
  await expect(page.locator(".lena-world [aria-busy='true']")).toHaveCount(0);
  await expect(page.locator(".lena-world-info-action")).toBeVisible();

  await page.goBack();
  await page.waitForURL("**/en", { timeout: 20_000 });
  await expect(page.getByRole("link", { name: /Enter the world/i })).toBeVisible();
});
