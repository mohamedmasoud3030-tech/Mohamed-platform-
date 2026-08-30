/**
 * Canonical base-path authority for the LENA API.
 *
 * Mirrors the frontend helper. When the public site is mounted under `/lena`,
 * OAuth callbacks, cookie Path attributes and post-login redirects must use
 * that prefix so they never land on the host application's own routes.
 */

export function normalizeBasePath(raw: string | undefined | null): string {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (!value || value === "/") return "";
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");
  return value === "/" ? "" : value;
}

export function getBasePath(): string {
  return normalizeBasePath(process.env.BASE_PATH);
}

export function withBase(path: string): string {
  const base = getBasePath();
  const normalized = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  if (normalized === "/") return base;
  if (normalized === base || normalized.startsWith(`${base}/`)) return normalized;
  return `${base}${normalized}`;
}

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

/** Cookie Path: scoped to the LENA namespace when mounted under a base path. */
export function cookiePath(): string {
  return getBasePath() || "/";
}
