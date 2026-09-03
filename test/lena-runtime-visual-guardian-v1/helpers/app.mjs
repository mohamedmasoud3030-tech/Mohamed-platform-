import { expect } from "@playwright/test";

export const THEME_STORAGE_KEY = "lena-digital-house.theme";
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
  narrow: { width: 360, height: 800 },
};

/** URLs that are allowed to fail — the SPA must work without the API backing. */
export const NETWORK_ALLOWLIST = [
  /\/api\/trpc(\?|$)/,
  /\/api\/[^?#]*(\?|$)/,
  /favicon\.ico$/,
  // External host fonts: blocked in restricted sandboxes/preview hosts; the app
  // must render with system fallbacks. Not a LENA runtime bundle/asset.
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

/**
 * Fatal console message patterns. Resource-load messages are handled by URL
 * inspection (requestfailed / response status), not by message text.
 */
export const CONSOLE_ALLOWLIST = [
  /Failed to load resource/i,
  /net::ERR_CONNECTION_CLOSED/i,
  /net::ERR_ABORTED/i,
];

export function localePath(locale, route) {
  return `/${locale}${route === "/" ? "" : route}`;
}

/**
 * Boot the LENA app deterministically:
 * - theme from localStorage before first paint,
 * - reduced motion honoured (Playwright emulation),
 * - fonts settled,
 * - console / network watchers attached.
 */
export async function openApp(page, { route = "/", locale = "en", theme = "dark", viewport } = {}) {
  if (viewport) await page.setViewportSize(viewport);
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, theme],
  );
  const watcher = watchRuntime(page);

  // Deterministic rendering: external host fonts are blocked so the visual
  // suite never depends on network-delivered font metrics (which differ between
  // the sandbox and CI). The app must render with system fallback fonts.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

  // Reduced motion is the stable, deterministic test state (ID: also the
  // explicit test-mode seam — ambient/orbital motion never runs). It also
  // exercises the reduced-motion paths the app ships.
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto(`http://127.0.0.1:4173${localePath(locale, route)}`, {
    waitUntil: "load",
    timeout: 60_000,
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  return watcher;
}

/** Attach console / page-error / network watchers. Returns collected log. */
export function watchRuntime(page) {
  const log = {
    pageErrors: [],
    unhandledRejections: [],
    consoleErrors: [],
    failedRequests: [],
    badResponses: [],
  };

  page.on("pageerror", (error) => log.pageErrors.push(String(error?.message ?? error)));
  page.on("console", (message) => {
    if (message.type() === "error") log.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    log.failedRequests.push({ url: request.url(), error: failure?.errorText ?? "failed" });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      log.badResponses.push({ url: response.url(), status: response.status() });
    }
  });

  page.evaluate(() => {
    window.__guardian_rejections__ ??= [];
    window.addEventListener("unhandledrejection", (event) => {
      window.__guardian_rejections__.push(String(event.reason?.message ?? event.reason));
    });
  }).catch(() => {});

  return log;
}

export function readUnhandledRejections(page) {
  return page.evaluate(() => window.__guardian_rejections__ ?? []);
}

function isAllowedUrl(url) {
  return NETWORK_ALLOWLIST.some((pattern) => pattern.test(url));
}

/** Fails the test if any uncaught/fatal runtime problem was observed. */
export function expectNoFatalRuntime(log, page) {
  expect(log.pageErrors, "uncaught page errors").toEqual([]);

  // Browser-generated resource-error console messages carry no URL; the URL
  // checks below are the authoritative gate for assets/bundles. Application
  // console.error (e.g. ErrorBoundary) is never filtered.
  const appConsoleErrors = log.consoleErrors.filter(
    (message) => !CONSOLE_ALLOWLIST.some((pattern) => pattern.test(message)),
  );
  expect(appConsoleErrors, "console.error (application)").toEqual([]);

  const unexpectedFailures = log.failedRequests.filter((entry) => !isAllowedUrl(entry.url));
  expect(unexpectedFailures, "unexpected failed requests").toEqual([]);
  const unexpectedResponses = log.badResponses.filter((entry) => !isAllowedUrl(entry.url));
  expect(unexpectedResponses, "unexpected 4xx/5xx responses").toEqual([]);
}

/** Assert the app shell is really mounted: main landmark + no crash boundary. */
export async function expectAppReady(page, locale = "en") {
  // Chamber pages nest a second <main> inside PublicShell's <main>; assert the
  // outer landmark and the content area separately.
  await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(new RegExp(locale === "ar" ? "حدث خطأ غير متوقع" : "Something went wrong", "i")),
  ).toHaveCount(0);
  await expect(page.locator(".lena-route-fallback")).toHaveCount(0);
}

/** Wait for visual noise (entry animations, layout) to settle deterministically. */
export async function settle(page, ms = 450) {
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => setTimeout(done, 0))));
  await page.waitForTimeout(ms);
}

/** Scan for fixed elements that cover most of the viewport (menu/overlay traps). */
export async function findCoveringOverlays(page) {
  return page.evaluate(() => {
    const allowed = new Set([
      ".lena-header",
      ".lena-whatsapp-fab",
      ".skip-link",
      ".lena-mobile-menu",
    ]);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const covering = [];
    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      if (style.position !== "fixed") continue;
      if (allowed.has(`.${el.className?.split?.(" ")?.[0]}`)) continue;
      // Pure decoration behind content (ambient field): aria-hidden + no
      // pointer events + lowest stacking. Never an interaction trap.
      if (el.getAttribute("aria-hidden") === "true" && style.pointerEvents === "none") continue;
      const rect = el.getBoundingClientRect();
      const w = Math.min(rect.width, vw);
      const h = Math.min(rect.height, vh);
      if (rect.width < 1 || rect.height < 1) continue;
      const covered = (w * h) / (vw * vh);
      if (covered > 0.55) {
        covering.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 80),
          ratio: Number(covered.toFixed(3)),
        });
      }
    }
    return covering;
  });
}

/** True when the page is horizontally overflowing (incl. body scroll). */
export function horizontalOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      documentWidth: root.scrollWidth,
      bodyWidth: body.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

/** Relative-luminance contrast ratio between two rgb()/~hex colors. */
export function contrastRatio(foreground, background) {
  const parse = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value) ?? /#?([0-9a-f]{6})/i.exec(value);
    if (!m) return null;
    const parts = m[1].split(",").map((part) => part.trim());
    if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
      return parts.slice(0, 3).map(Number);
    }
    const hex = m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };
  const luminance = (rgb) => {
    if (!rgb) return null;
    const [r, g, b] = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luminance(parse(foreground));
  const l2 = luminance(parse(background));
  if (l1 == null || l2 == null) return null;
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
