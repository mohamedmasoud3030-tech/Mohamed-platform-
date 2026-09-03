import { expect } from "@playwright/test";

export const HOME_CORE = ".lena-house";
export const WORLD_CORE = ".lena-world-core";

/**
 * Runtime probe of a Sacred Core element.
 *
 * 1. The element is rendered with non-zero dimensions and a background-image
 *    pointing at the canonical v3 artwork (never `none`, never a gradient
 *    stand-in, never a deprecated asset).
 * 2. The artwork bytes actually decode in the browser. The canonical asset is
 *    an SVG embedding a WebP data URI, so a truncated/empty payload surfaces
 *    here as an image `error` — this is exactly the regression where the eye
 *    glow (::after) stays visible while the artwork is missing.
 * 3. The decoded artwork paints real, identity-coloured pixels (guards against
 *    a blank-but-loadable asset or an animation leaving opacity at 0).
 * 4. The eye/glow pseudo-element may exist, but its presence never masks a
 *    missing artwork — test asserts both conditions independently.
 */
export async function probeCore(page, selector = HOME_CORE, label = "home core") {
  const el = page.locator(selector);
  await expect(el, `${label} element present`).toHaveCount(1, { timeout: 20_000 });
  await expect(el, `${label} element visible`).toBeVisible({ timeout: 20_000 });

  // The spatial scene mounts after the lazy chunk resolves; the IntersectionObserver
  // then flips `.is-visible` and the core fades in over a few frames. Wait for the
  // settled state rather than racing the entrance animation.
  await expect
    .poll(
      () => el.evaluate((node) => Number(getComputedStyle(node).opacity)),
      { message: `${label}: core must fade in and settle`, timeout: 15_000 },
    )
    .toBeGreaterThan(0.9);

  const info = await el.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const before = getComputedStyle(node, "::before");
    const after = getComputedStyle(node, "::after");
    return {
      rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      css: {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        isBackgroundNone: style.backgroundImage === "none",
      },
      pseudo: {
        beforeOpacity: before.opacity,
        afterOpacity: after.opacity,
        afterWidth: after.width,
      },
    };
  });

  return { selector, label, ...info };
}

/** Assert the CSS contract for a core element (canonical asset, no stand-ins). */
export function expectCoreCssContract(probe, page) {
  const { css } = probe;
  expect(css.isBackgroundNone, `${probe.label}: background-image must exist`).toBe(false);
  expect(css.backgroundImage, `${probe.label}: must reference canonical v3 artwork`).toMatch(
    /lena-sacred-core-v3-inline/,
  );
  expect(css.backgroundImage, `${probe.label}: must be the inline artwork (not a plain webp)`).not.toMatch(
    /lena-sacred-core-[A-Za-z0-9-]*\.webp/,
  );
  expect(css.backgroundColor, `${probe.label}: must stay transparent (no fake disk)`).toMatch(
    /rgba\(0, 0, 0, 0\)|transparent/,
  );
  expect(Number(css.opacity), `${probe.label}: element must not be hidden`).toBeGreaterThan(0.9);
  expect(css.visibility, `${probe.label}: must not be hidden`).toBe("visible");
  expect(probe.rect.width, `${probe.label}: width`).toBeGreaterThan(0);
  expect(probe.rect.height, `${probe.label}: height`).toBeGreaterThan(0);
}

/** In-browser decode + paint analysis of the artwork embedded in the core CSS. */
export async function analyzeCoreArtwork(page, probe) {
  return page.evaluate(async (backgroundImage) => {
    const urlMatch = /url\("([^"]+)"\)/.exec(backgroundImage);
    if (!urlMatch) return { ok: false, reason: "no background url found" };
    const svgUrl = urlMatch[1];

    const response = await fetch(svgUrl);
    if (!response.ok) return { ok: false, reason: `asset fetch ${response.status}` };
    const svg = await response.text();

    const dataMatch = /data:image\/(webp|png|svg\+xml);base64,([A-Za-z0-9+/=]+)/.exec(svg);
    if (!dataMatch) return { ok: false, reason: "canonical asset has no embedded raster data URI" };

    const dataUri = `data:image/${dataMatch[1]};base64,${dataMatch[2]}`;
    const image = new Image();
    let loaded = false;
    let decodeError = null;
    try {
      loaded = await new Promise((resolve) => {
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = dataUri;
      });
    } catch (error) {
      decodeError = String(error);
    }

    if (!loaded) {
      return {
        ok: false,
        reason: decodeError ?? "embedded artwork is undecodable (broken/truncated asset)",
        dataUriBytes: dataMatch[2].length,
      };
    }

    const width = image.naturalWidth || 160;
    const height = image.naturalHeight || 160;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;

    let painted = 0;
    let transparent = 0;
    let identity = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 8) {
        painted += 1;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // LENA identity is warm/amber: strong red channel, warm relative to blue.
        if (r > 70 && r > b + 14 && g > 40) identity += 1;
      } else {
        transparent += 1;
      }
    }

    const total = width * height;
    return {
      ok: true,
      width,
      height,
      total,
      painted,
      paintedRatio: painted / total,
      identity,
      identityRatio: identity / total,
      dataUriBytes: dataMatch[2].length,
    };
  }, probe.css.backgroundImage);
}

/**
 * Wait until an element reaches a stable opacity — then assert it. Used by the
 * reduced-motion checks so a race with lazy-chunk mount / IntersectionObserver
 * never reports a false opacity: 0. The "animation removed → opacity stays 0"
 * regression still fails because the poll has a hard timeout.
 */
export async function expectSettledOpacity(page, selector, threshold, label, timeout = 15_000) {
  await expect(page.locator(selector).first(), `${label} present`).toHaveCount(1, { timeout: 20_000 });

  // Poll the element's settled animated value. The scene mounts lazily and the
  // IntersectionObserver flips `.is-visible` a few frames later, so a single
  // read races the entrance; this still fails if the value never settles above
  // the threshold (the "animation removed → stuck opacity: 0" regression).
  const read = () =>
    page.locator(selector).first().evaluate(
      (node) => Number(getComputedStyle(node).opacity),
    );
  await expect
    .poll(read, {
      message: `${label}: opacity must settle above ${threshold}`,
      timeout,
    })
    .toBeGreaterThan(threshold);
}

/**
 * Regression gate — exactly the failure mode "eye/glow visible while the main
 * Sacred Core artwork is missing" must fail CI.
 */
export async function expectCoreArtworkHealthy(page, probe, { minPaintedRatio = 0.05, minIdentityRatio = 0.004 } = {}) {
  const artwork = await analyzeCoreArtwork(page, probe);

  const assertion = {
    label: probe.label,
    selector: probe.selector,
    rect: probe.rect,
    css: probe.css,
    glowOpacityAtFailure: probe.pseudo.afterOpacity,
    assetOk: artwork.ok,
    assetReason: artwork.reason ?? null,
    paint: artwork.ok
      ? {
          paintedRatio: Number(artwork.paintedRatio.toFixed(4)),
          identityRatio: Number(artwork.identityRatio.toFixed(4)),
        }
      : null,
  };

  if (!artwork.ok) {
    throw new Error(
      `SACRED CORE ARTWORK MISSING (${probe.label}) — eye/glow is still visible ` +
        `(after opacity ${probe.pseudo.afterOpacity}) while the artwork fails: ${artwork.reason}\n` +
        `Details: ${JSON.stringify(assertion)}`,
    );
  }

  expect(artwork.paintedRatio, `${probe.label}: artwork must paint visible pixels`).toBeGreaterThan(
    minPaintedRatio,
  );
  expect(artwork.identityRatio, `${probe.label}: artwork must contain identity (warm) pixels`).toBeGreaterThan(
    minIdentityRatio,
  );

  return assertion;
}
