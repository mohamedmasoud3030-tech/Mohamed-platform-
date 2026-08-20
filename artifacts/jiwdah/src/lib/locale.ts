/**
 * Locale as an address.
 *
 * Every public page lives under a language prefix (/ar/... or /en/...), so each
 * language is a real URL that can be indexed, shared and bookmarked. The router
 * runs with a language basename, which keeps every existing in-app link working
 * unchanged while producing prefixed URLs in the address bar.
 */

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "ar";
/** Shown to visitors whose device language is neither Arabic nor English. */
export const FALLBACK_LOCALE: SupportedLocale = "en";
export const LOCALE_STORAGE_KEY = "lena-digital-house.locale";

/** Paths that must never receive a language prefix. */
const UNPREFIXED = ["/api", "/assets", "/robots.txt", "/sitemap.xml", "/favicon.svg", "/lena-og.svg"];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isUnprefixedPath(pathname: string): boolean {
  return UNPREFIXED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Reads the language segment from a full pathname, if there is one. */
export function localeFromPath(pathname: string): SupportedLocale | null {
  const segment = pathname.split("/")[1];
  return isSupportedLocale(segment) ? segment : null;
}

/** Removes the language segment, returning a router-relative path that always starts with "/". */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || "/";
  const rest = pathname.slice(locale.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

export function withLocale(locale: SupportedLocale, pathname: string): string {
  const rest = stripLocale(pathname);
  return rest === "/" ? `/${locale}` : `/${locale}${rest}`;
}

function readStoredLocale(): SupportedLocale | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isSupportedLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: SupportedLocale): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode: the URL still carries the language, so nothing breaks */
  }
}

/** Device language, when it is one we actually publish in. */
export function localeFromDevice(languages?: readonly string[]): SupportedLocale {
  const candidates =
    languages ?? (typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : []);
  for (const entry of candidates) {
    const base = String(entry).toLowerCase().split("-")[0];
    if (isSupportedLocale(base)) return base;
  }
  return FALLBACK_LOCALE;
}

/**
 * Decides which language a request should be served in.
 *
 * Priority is deliberate:
 *  1. the URL — a shared link must always open in the language it was shared in;
 *  2. the visitor's own previous choice;
 *  3. the device language;
 *  4. English, so a visitor we do not publish for still understands the page.
 */
export function resolveLocale(pathname: string, languages?: readonly string[]): SupportedLocale {
  return localeFromPath(pathname) ?? readStoredLocale() ?? localeFromDevice(languages);
}

export type LocaleBootstrap = { locale: SupportedLocale; redirectTo: string | null };

/**
 * Works out the language for the current URL and whether the browser should be
 * moved to a prefixed address. Old, unprefixed links keep working: they resolve
 * to the visitor's language instead of failing.
 */
export function bootstrapLocale(url: { pathname: string; search: string; hash: string }, languages?: readonly string[]): LocaleBootstrap {
  const { pathname, search, hash } = url;
  if (isUnprefixedPath(pathname)) {
    return { locale: resolveLocale(pathname, languages), redirectTo: null };
  }
  const fromPath = localeFromPath(pathname);
  if (fromPath) return { locale: fromPath, redirectTo: null };

  const locale = resolveLocale(pathname, languages);
  return { locale, redirectTo: `${withLocale(locale, pathname)}${search}${hash}` };
}
