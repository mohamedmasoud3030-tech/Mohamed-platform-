import { expect, test } from "@playwright/test";
import {
  contrastRatio,
  findCoveringOverlays,
  horizontalOverflow,
  openApp,
  VIEWPORTS,
} from "../helpers/app.mjs";
import {
  expectCoreCssContract,
  expectSettledOpacity,
  HOME_CORE,
  probeCore,
} from "../helpers/core.mjs";

/**
 * Phases 3, 5, 6, 7 — mobile viewport safety, RTL/LTR, dark/light theme,
 * reduced-motion behavior.
 */

/* ----------------------------- mobile safety ----------------------------- */

const MOBILE_ROUTES = ["/", "/world", "/world/property"];

for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.narrow]) {
  for (const route of MOBILE_ROUTES) {
    test(`mobile no-overflow + usable nav: ${route} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.info().annotations.push(
        { type: "route", description: `/en${route}` },
        { type: "viewport", description: `${viewport.width}x${viewport.height}` },
        { type: "theme", description: "dark" },
        { type: "locale", description: "en" },
      );
      await openApp(page, { route, locale: "en", theme: "dark", viewport });

      const overflow = await horizontalOverflow(page);
      expect(
        overflow.documentWidth,
        `document must not overflow horizontally (${JSON.stringify(overflow)})`,
      ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
      expect(
        overflow.bodyWidth,
        `body must not overflow horizontally (${JSON.stringify(overflow)})`,
      ).toBeLessThanOrEqual(overflow.viewportWidth + 1);

      const overlays = await findCoveringOverlays(page);
      expect(overlays, "no giant fixed element may cover the viewport").toEqual([]);

      // Menu control on-screen and usable.
      await expect(page.locator("button.lena-menu-toggle")).toBeVisible();
      await page.locator("button.lena-menu-toggle").click();
      await expect(page.locator(".lena-mobile-menu")).toBeVisible();
      await expect(page.locator(".lena-mobile-menu a").first()).toBeVisible();
      await page.keyboard.press("Escape");
      await page.locator("button.lena-menu-toggle").click();

      // Headings readable (never collapsed).
      await expect(page.locator("h1").first()).toBeVisible();
      const heading = await page.evaluate(() => {
        const el = document.querySelector("h1");
        const style = getComputedStyle(el);
        return { size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
      });
      expect(heading.size, `h1 font-size (${JSON.stringify(heading)})`).toBeGreaterThanOrEqual(18);
      expect(heading.line, `h1 line-height (${JSON.stringify(heading)})`).toBeGreaterThanOrEqual(18);
    });
  }
}

for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.narrow]) {
  test(`Command unavailable state stays explicit and contained @ ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.info().annotations.push(
      { type: "route", description: "/en/world/command" },
      { type: "viewport", description: `${viewport.width}x${viewport.height}` },
      { type: "theme", description: "dark" },
      { type: "locale", description: "en" },
    );
    await openApp(page, { route: "/world/command", locale: "en", theme: "dark", viewport });

    const command = page.locator('[data-testid="world-command"]');
    await expect(command).toHaveAttribute("data-signal-availability", "unavailable");
    await expect(command.getByText("Live product signals are not connected yet.")).toBeVisible();
    await expect(command.locator(".lena-command-unavailable-panel")).toBeVisible();
    await expect(command.locator(".lena-command-grid")).toHaveCount(0);
    await expect(command.locator("button")).toHaveCount(0);
    await expect(command.locator(".lena-cmd-actions")).toHaveCount(0);

    const overflow = await horizontalOverflow(page);
    expect(overflow.documentWidth, `Command document overflow (${JSON.stringify(overflow)})`).toBeLessThanOrEqual(
      overflow.viewportWidth + 1,
    );
    expect(overflow.bodyWidth, `Command body overflow (${JSON.stringify(overflow)})`).toBeLessThanOrEqual(
      overflow.viewportWidth + 1,
    );
  });
}

for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.narrow]) {
  test(`selected World information clears the constellation @ ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.info().annotations.push(
      { type: "route", description: "/en/world (selected property)" },
      { type: "viewport", description: `${viewport.width}x${viewport.height}` },
      { type: "theme", description: "dark" },
      { type: "locale", description: "en" },
    );
    await openApp(page, { route: "/world", locale: "en", theme: "dark", viewport });
    await page.locator('.lena-world-entity[aria-label^="MALEK"]').first().click();
    const info = page.locator(".lena-world-info");
    await expect(info).toBeVisible();

    const geometry = await page.evaluate(() => {
      const read = (selector) =>
        [...document.querySelectorAll(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
          };
        });
      return {
        viewport: window.innerWidth,
        info: read(".lena-world-info")[0],
        constellation: read(".lena-world-entity, .lena-world-entity-caption, .lena-world-ring"),
      };
    });
    expect(geometry.info.left, "selected info stays inside the viewport").toBeGreaterThanOrEqual(-1);
    expect(geometry.info.right, "selected info does not overflow right").toBeLessThanOrEqual(geometry.viewport + 1);
    const intersects = geometry.constellation.filter(
      (rect) =>
        geometry.info.left < rect.right &&
        geometry.info.right > rect.left &&
        geometry.info.top < rect.bottom &&
        geometry.info.bottom > rect.top,
    );
    expect(intersects, "selected information must not overlap constellation bodies").toEqual([]);
  });
}

test("unavailable World observation does not become a selected live signal", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en/world" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
    { type: "locale", description: "en" },
  );
  await openApp(page, { route: "/world", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  await expect(page.locator('.lena-world[data-signal-availability="unavailable"]')).toHaveCount(1);
  const signal = page.locator(".lena-world-path.is-active").first();
  await expect(signal).toHaveCount(1);
  const appearance = await signal.evaluate((element) => {
    const style = getComputedStyle(element);
    const dot = getComputedStyle(element, "::after");
    return { opacity: Number(style.opacity), dotOpacity: Number(dot.opacity), animation: dot.animationName };
  });
  expect(appearance.opacity, `unavailable path opacity (${JSON.stringify(appearance)})`).toBeLessThan(0.2);
  expect(appearance.dotOpacity, `unavailable signal dot (${JSON.stringify(appearance)})`).toBe(0);
  expect(appearance.animation, `unavailable signal animation (${JSON.stringify(appearance)})`).toBe("none");
});

test("MALEK Chamber keeps the external auth boundary explicit", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en/world/property" },
    { type: "viewport", description: "390x844" },
    { type: "theme", description: "dark" },
    { type: "locale", description: "en" },
  );
  await openApp(page, { route: "/world/property", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile });

  await expect(page.getByText(/Authentication stays with MALEK/)).toBeVisible();
  const handoff = page.locator('[data-testid="malek-product-handoff"]');
  await expect(handoff).toHaveAttribute("href", "https://malek-plus.vercel.app/");
  await expect(handoff).toHaveAttribute("target", "_blank");
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("mobile (390x844): primary CTA and Sacred Core are visible and not clipped", async ({ page }) => {
  test.info().annotations.push(
    { type: "route", description: "/en" },
    { type: "viewport", description: "390x844" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.mobile });

  const cta = page.locator(".lena-hero .lena-primary");
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box.x, "CTA not clipped left").toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, "CTA not clipped right").toBeLessThanOrEqual(390 + 1);

  const probe = await probeCore(page, HOME_CORE, "Home core mobile");
  expectCoreCssContract(probe, page);
  expect(probe.rect.width, "core width inside safe bounds").toBeGreaterThanOrEqual(140);
  expect(probe.rect.left, "core not off-screen left").toBeGreaterThanOrEqual(-1);
  expect(probe.rect.left + probe.rect.width, "core not off-screen right").toBeLessThanOrEqual(391);
});

/* ------------------------------ theme safety ------------------------------ */

for (const theme of ["dark", "light"]) {
  for (const route of ["/", "/world", "/world/property"]) {
    test(`theme ${theme}: ${route} stays readable`, async ({ page }) => {
      test.info().annotations.push(
        { type: "route", description: `/en${route}` },
        { type: "viewport", description: "1280x800" },
        { type: "theme", description: theme },
        { type: "locale", description: "en" },
      );
      await openApp(page, { route, locale: "en", theme, viewport: VIEWPORTS.desktop });

      await expect(page.locator(`html.${theme}`)).toHaveCount(1);
      await expect(page.locator(`html[data-theme="${theme}"]`)).toHaveCount(1);

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const heading = document.querySelector("h1");
        const styleOf = (selector) => getComputedStyle(document.querySelector(selector));
        return {
          rootClass: root.className,
          // Token colors are the authoritative palette; element backgroundColor
          // is transparent because surfaces are gradients.
          bodyBg: styleOf(".lena-public").getPropertyValue("--lena-bg").trim(),
          headingColor: getComputedStyle(heading).color,
          glassSurface: styleOf(".lena-glass").getPropertyValue("--lena-card").trim(),
        };
      });

      // Core still visible in every theme.
      if (route !== "/world/property") {
        const core = route === "/" ? HOME_CORE : ".lena-world-core";
        const probe = await probeCore(page, core, `${route} core (${theme})`);
        expectCoreCssContract(probe, page);
      }

      // Sanity contrast: large heading vs page background (not a full WCAG audit).
      const ratio = contrastRatio(metrics.headingColor, metrics.bodyBg);
      expect(ratio, `heading/background contrast in ${theme} (${JSON.stringify(metrics)})`).toBeGreaterThan(3);

      // Glass hierarchy: nav surface differs from the page background.
      expect(metrics.glassSurface, `glass surface must differ from page bg (${JSON.stringify(metrics)})`).not.toBe(
        metrics.bodyBg,
      );
    });
  }
}

/* ------------------------------- RTL / LTR -------------------------------- */

for (const locale of ["ar", "en"]) {
  for (const route of ["/", "/world", "/world/property"]) {
    test(`direction ${locale}: ${route} layout stays coherent (mobile)`, async ({ page }) => {
      test.info().annotations.push(
        { type: "route", description: `/${locale}${route}` },
        { type: "viewport", description: "390x844" },
        { type: "theme", description: "dark" },
        { type: "locale", description: locale },
      );
      await openApp(page, { route, locale, theme: "dark", viewport: VIEWPORTS.mobile });

      const expectedDir = locale === "ar" ? "rtl" : "ltr";
      expect(await page.locator("html").getAttribute("dir"), "document direction").toBe(expectedDir);
      expect(await page.locator("html").getAttribute("lang"), "document language").toBe(locale);

      // No text clipping / overflow in either direction.
      const overflow = await horizontalOverflow(page);
      expect(overflow.documentWidth, `${locale} horizontal overflow`).toBeLessThanOrEqual(
        overflow.viewportWidth + 1,
      );

      // Navigation alignment follows direction.
      const alignment = await page.evaluate(() => {
        const brand = document.querySelector(".lena-brand-link")?.getBoundingClientRect();
        const actions = document.querySelector(".lena-nav-actions")?.getBoundingClientRect();
        return brand && actions ? { brandX: brand.x, actionsX: actions.x } : null;
      });
      expect(alignment).not.toBeNull();
      if (locale === "ar") expect(alignment.brandX).toBeGreaterThan(alignment.actionsX);
      else expect(alignment.brandX).toBeLessThan(alignment.actionsX);

      // Chamber back arrow flips with direction.
      if (route.startsWith("/world/")) {
        const rotate = await page
          .locator(".lena-chamber-back > span")
          .first()
          .evaluate((el) => getComputedStyle(el).transform);
        if (locale === "ar") expect(rotate, "RTL back arrow must flip").toContain("matrix");
        else expect(rotate, "LTR back arrow must not flip").toBe("none");
      }

      // Mobile menu works in both directions.
      await page.locator("button.lena-menu-toggle").click();
      await expect(page.locator(".lena-mobile-menu")).toBeVisible();
      await expect(page.locator(".lena-mobile-menu a").first()).toBeVisible();
    });
  }
}

/* ----------------------------- reduced motion ----------------------------- */

test("reduced motion: Home core and orbit never vanish and navigation still works", async ({
  page,
}) => {
  test.info().annotations.push(
    { type: "route", description: "/en" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
    { type: "locale", description: "en" },
  );
  await openApp(page, { route: "/", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  // The classic trap: animation removed → element left at opacity: 0.
  // Each check waits for the scene to settle (lazy chunk + intersect flag),
  // then asserts the settled value — a stuck opacity: 0 fails the poll.
  await expectSettledOpacity(page, ".lena-house", 0.99, "core opacity (reduced motion)");
  await expectSettledOpacity(page, ".lena-orbit-field", 0.9, "orbit field opacity (reduced motion)");
  await expectSettledOpacity(page, ".lena-sat", 0.5, "satellite opacity (reduced motion)");
  const opacities = {
    house: await page.locator(".lena-house").evaluate((el) => Number(getComputedStyle(el).opacity)),
    orbitField: await page.locator(".lena-orbit-field").evaluate((el) => Number(getComputedStyle(el).opacity)),
    satellite: await page.locator(".lena-sat").first().evaluate((el) => Number(getComputedStyle(el).opacity)),
  };
  expect(opacities.house, `core opacity under reduced motion (${JSON.stringify(opacities)})`).toBe(1);

  const probe = await probeCore(page, HOME_CORE, "Home core reduced motion");
  expectCoreCssContract(probe, page);

  // Routes remain usable: the gateway CTA navigates immediately-ish.
  await page.getByRole("link", { name: /Enter the world/i }).click();
  await page.waitForURL("**/en/world", { timeout: 20_000 });
  await expect(page.locator(".lena-world-core")).toBeVisible();
});

test("reduced motion: World field and Inner Constellation are not left invisible", async ({
  page,
}) => {
  test.info().annotations.push(
    { type: "route", description: "/en/world + /en/world/property" },
    { type: "viewport", description: "1280x800" },
    { type: "theme", description: "dark" },
  );
  await openApp(page, { route: "/world", locale: "en", theme: "dark", viewport: VIEWPORTS.desktop });

  // Wait for the field to settle, then assert — reduced motion must render it
  // fully present rather than leaving it at its pre-animation opacity.
  await expectSettledOpacity(page, ".lena-world-field", 0.99, "world field opacity (reduced motion)");

  await page.goto("http://127.0.0.1:4173/en/world/property");
  await expectSettledOpacity(page, ".lena-inner-core", 0.9, "inner core opacity (reduced motion)");
  await page.waitForTimeout(200);
  const inner = await page.evaluate(() => {
    const read = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return { present: false };
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        present: true,
        opacity: Number(style.opacity),
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none",
      };
    };
    return {
      core: read(".lena-inner-core"),
      origin: read(".lena-inner-origin"),
      nodes: Array.from(document.querySelectorAll(".lena-inner-node")).map((node) => {
        const style = getComputedStyle(node);
        return Number(style.opacity);
      }),
    };
  });
  expect(inner.core.present, "inner core present").toBe(true);
  expect(inner.core.visible, "inner core must not be stuck invisible").toBe(true);
  expect(inner.nodes.length, "operation nodes present").toBeGreaterThan(0);
  expect(
    Math.min(...inner.nodes),
    `no operation node left at opacity 0 (${JSON.stringify(inner.nodes)})`,
  ).toBeGreaterThan(0.9);
});
