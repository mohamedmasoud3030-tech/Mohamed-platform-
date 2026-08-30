/**
 * Canonical base-path authority for the LENA public site.
 *
 * Vite `base` (from the BASE_PATH environment variable) is the single input.
 * Production behind MALEK uses `/lena/`. Standalone and local development use `/`.
 *
 * Every public URL, API call, asset path, locale prefix, canonical tag and
 * sitemap entry must go through these helpers. Do not concatenate BASE_PATH
 * onto strings at call sites.
 */

export function normalizeBasePath(raw: string | undefined | null): string {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (!value || value === "/") return "";
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");
  return value === "/" ? "" : value;
}

function readConfiguredBasePath(): string {
  try {
    const fromVite = import.meta.env?.BASE_URL;
    if (typeof fromVite === "string" && fromVite.length > 0) {
      return normalizeBasePath(fromVite);
    }
  } catch {
    /* node tests without a Vite runtime */
  }
  if (typeof process !== "undefined" && typeof process.env?.BASE_PATH === "string") {
    return normalizeBasePath(process.env.BASE_PATH);
  }
  return "";
}

let configured = readConfiguredBasePath();

/** Test-only: override the resolved base path. Pass `null` to restore from env. */
export function setBasePathForTests(raw: string | null): void {
  configured = raw === null ? readConfiguredBasePath() : normalizeBasePath(raw);
}

/** Deployment base path with no trailing slash. Empty string means the site is at `/`. */
export function getBasePath(): string {
  return configured;
}

/**
 * Prefix a site-root-relative path with the deployment base path.
 * Idempotent: a path that already includes the base is returned unchanged.
 */
export function withBase(path: string): string {
  const base = getBasePath();
  const normalized = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  if (normalized === "/") return base;
  if (normalized === base || normalized.startsWith(`${base}/`)) return normalized;
  return `${base}${normalized}`;
}

/** Strip the deployment base path, returning a site-root-relative path that always starts with `/`. */
export function stripBase(pathname: string): string {
  const base = getBasePath();
  const raw = pathname || "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  if (!base) return withSlash;
  if (withSlash === base || withSlash === `${base}/`) return "/";
  if (withSlash.startsWith(`${base}/`)) {
    const rest = withSlash.slice(base.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return withSlash;
}
