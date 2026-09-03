import { expect, test } from "@playwright/test";
import { openApp, VIEWPORTS } from "../helpers/app.mjs";

/**
 * Phase 10 — lightweight accessibility sanity.
 * No months-long compliance project: duplicate IDs, unnamed interactives,
 * landmark presence, skip link, keyboard reachability, focus visibility.
 */

function annotate(testInfo, route, locale) {
  testInfo.annotations.push(
    { type: "route", description: `/${locale}${route}` },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
    { type: "locale", description: locale },
  );
}

for (const route of ["/", "/world", "/world/property", "/contact"]) {
  test(`a11y sanity: ${route} (en)`, async ({ page }) => {
    annotate(test.info(), route, "en");
    await openApp(page, { route, locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

    // Duplicate IDs would confuse labels / aria-labelledby / anchors.
    const duplicateIds = await page.evaluate(() => {
      const seen = new Map();
      for (const el of document.querySelectorAll("[id]")) {
        const id = el.getAttribute("id");
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
      return [...seen].filter(([, count]) => count > 1).map(([id, count]) => `${id} (${count})`);
    });
    expect(duplicateIds, "duplicate element ids").toEqual([]);

    // Interactive elements (excluding decorative) must have an accessible name.
    const unnamed = await page.evaluate(() => {
      const nameOf = (el) => {
        if (el.getAttribute("aria-label")?.trim()) return true;
        if (el.getAttribute("aria-labelledby")) return true;
        if (el.getAttribute("title")?.trim()) return true;
        if (el.getAttribute("alt")?.trim()) return true;
        return Boolean(el.textContent?.trim());
      };
      const picks = new Set();
      for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (!nameOf(el)) {
          picks.add(
            `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(" ")[0]}` : ""}`,
          );
        }
      }
      return [...picks].slice(0, 30);
    });
    expect(unnamed, "interactive elements missing accessible names").toEqual([]);

    // Landmarks. Chamber pages legitimately render a nested <main> and section
    // <header> elements, so assert landmark roles present (≥1) and banner = 1.
    await expect
      .poll(() => page.getByRole("main").count(), { message: "main landmark present" })
      .toBeGreaterThanOrEqual(1);
    await expect(page.getByRole("banner"), "banner landmark").toHaveCount(1);
    await expect(page.getByRole("banner").locator("nav"), "primary navigation in banner").toBeVisible();

    // Skip link points to a real target and is focusable.
    const skip = page.locator(".skip-link");
    await expect(skip).toHaveCount(1);
    const skipTarget = await skip.getAttribute("href");
    expect(skipTarget?.startsWith("#"), "skip link targets an anchor").toBe(true);
    await expect(page.locator(skipTarget), "skip link target exists").toHaveCount(1);
  });
}

test("a11y sanity: keyboard reaches primary navigation with visible focus", async ({ page }) => {
  annotate(test.info(), "/", "en");
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  await page.locator("body").click({ position: { x: 4, y: 4 } }).catch(() => {});
  const focused = [];
  for (let i = 0; i < 16; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.textContent ?? "").trim().slice(0, 40),
        className: String(el.className).slice(0, 50),
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
      };
    });
    focused.push(info);
    if (info?.className?.includes("lena-nav-link")) break;
  }

  const reachedNav = focused.some((info) => info?.className?.includes("lena-nav-link"));
  expect(reachedNav, `keyboard must reach primary navigation (${JSON.stringify(focused)})`).toBe(true);

  const navLink = focused.find((info) => info?.className?.includes("lena-nav-link"));
  expect(
    parseFloat(navLink.outlineWidth) > 0 && navLink.outlineStyle !== "none",
    `focused navigation link must show a visible focus indicator (${JSON.stringify(navLink)})`,
  ).toBe(true);
});
