import { expect } from "@playwright/test";

export const HOME_CORE = ".lena-house";
export const WORLD_CORE = ".lena-world-core";

/**
 * Runtime probe of a Sacred Core element.
 *
 * 1. The element is rendered with non-zero dimensions and a background-image
 *    pointing at the canonical Sacred Core WebP (never `none`, never a gradient
 *    stand-in, never a retired inline/v2 asset).
 * 2. The WebP is fetched from the built runtime and must decode in Chromium.
 * 3. The decoded artwork must paint real LENA warm/amber identity pixels.
 * 4. The eye/glow pseudo-element may exist, but it never masks a missing or
 *    undecodable artwork — asset health and glow health are asserted separately.
 */
export async function probeCore(page, selector = HOME_CORE, label = "home core") {
  const el = page.locator(selector);
  await expect(el, `${label} element present`).toHaveCount(1, { timeout: 20_000 });
  await expect(el, `${label} element visible`).toBeVisible({ timeout: 20_000 });

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

/** Assert the CSS contract for a core element (canonical WebP, no stand-ins). */
export function expectCoreCssContract(probe) {
  const { css } = probe;
  expect(css.isBackgroundNone, `${probe.label}: background-image must exist`).toBe(false);
  expect(css.backgroundImage, `${probe.label}: must reference canonical Sacred Core WebP`).toMatch(
    /lena-sacred-core-[A-Za-z0-9_-]+\.webp/,
  );
  expect(css.backgroundImage, `${probe.label}: retired inline/v2 artwork must not own the core`).not.toMatch(
    /lena-sacred-core-v3-inline|lena-sacred-core-v2/,
  );
  expect(css.backgroundImage, `${probe.label}: gradient stand-in is forbidden`).not.toMatch(/gradient\(/i);
  expect(css.backgroundColor, `${probe.label}: must stay transparent (no fake disk)`).toMatch(
    /rgba\(0, 0, 0, 0\)|transparent/,
  );
  expect(Number(css.opacity), `${probe.label}: element must not be hidden`).toBeGreaterThan(0.9);
  expect(css.visibility, `${probe.label}: must not be hidden`).toBe("visible");
  expect(probe.rect.width, `${probe.label}: width`).toBeGreaterThan(0);
  expect(probe.rect.height, `${probe.label}: height`).toBeGreaterThan(0);
}

/** In-browser fetch + decode + paint analysis of the canonical WebP. */
export async function analyzeCoreArtwork(page, probe) {
  return page.evaluate(async (backgroundImage) => {
    const urlMatch = /url\(["']?([^"')]+)["']?\)/.exec(backgroundImage);
    if (!urlMatch) return { ok: false, reason: "no background url found" };
    const assetUrl = urlMatch[1];

    let response;
    try {
      response = await fetch(assetUrl, { cache: "no-store" });
    } catch (error) {
      return { ok: false, reason: `asset fetch failed: ${String(error)}` };
    }
    if (!response.ok) return { ok: false, reason: `asset fetch ${response.status}` };

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("image/webp")) {
      return { ok: false, reason: `canonical asset content-type is ${contentType || "missing"}, expected image/webp` };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 20) return { ok: false, reason: `canonical WebP is too small (${bytes.length} bytes)` };
    const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    if (ascii(0, 4) !== "RIFF" || ascii(8, 12) !== "WEBP") {
      return { ok: false, reason: "canonical asset is not a RIFF/WEBP container" };
    }
    const declared = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8;
    if (declared !== bytes.length) {
      return { ok: false, reason: `canonical WebP RIFF declares ${declared} bytes but fetched ${bytes.length}` };
    }

    const blob = new Blob([bytes], { type: "image/webp" });
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    let loaded = false;
    let decodeError = null;
    try {
      loaded = await new Promise((resolve) => {
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = objectUrl;
      });
      if (loaded && image.decode) await image.decode().catch((error) => { decodeError = String(error); });
    } catch (error) {
      decodeError = String(error);
    }

    if (!loaded || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      URL.revokeObjectURL(objectUrl);
      return {
        ok: false,
        reason: decodeError ?? "canonical WebP is undecodable (broken/truncated asset)",
        payloadBytes: bytes.length,
      };
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return { ok: false, reason: "2d canvas unavailable for paint probe" };
    }
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    URL.revokeObjectURL(objectUrl);

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
      transparent,
      identity,
      identityRatio: identity / total,
      payloadBytes: bytes.length,
      contentType,
    };
  }, probe.css.backgroundImage);
}

export async function expectSettledOpacity(page, selector, threshold, label, timeout = 15_000) {
  await expect(page.locator(selector).first(), `${label} present`).toHaveCount(1, { timeout: 20_000 });
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

/** Regression gate: glow may never survive without real, decodable artwork. */
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
          width: artwork.width,
          height: artwork.height,
          payloadBytes: artwork.payloadBytes,
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
