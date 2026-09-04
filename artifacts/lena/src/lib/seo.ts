import { SITE_CONFIG } from "@/config/site";
import { FOUNDER } from "@/content/founder";
import { withBase } from "@/lib/base-path";
import type { AppLocale } from "@/providers/preferences";

export const BRAND_NAME = "LENA Digital House";
export const DEFAULT_OG_IMAGE = "/lena-og.jpg";

/**
 * Absolute origin of the deployed site.
 * Never hard-coded: configuration first, current browser origin second.
 *
 * VITE_SITE_URL must be the public LENA origin (custom domain preferred).
 * It must not be a MALEK domain, GitHub, or an internal preview host.
 */
export function resolveSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

export function absoluteUrl(path: string): string {
  const origin = resolveSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Locale helpers already return public paths that include BASE_PATH; withBase is idempotent.
  const publicPath = withBase(normalized);
  return origin ? `${origin}${publicPath}` : publicPath;
}

export function buildDocumentTitle(title: string, isHome: boolean): string {
  const trimmed = title.trim();
  if (!trimmed) return BRAND_NAME;
  if (isHome || trimmed === BRAND_NAME) return trimmed;
  return `${trimmed} | ${BRAND_NAME}`;
}

/** Collapses whitespace and clamps to a search-result friendly length. */
export function clampDescription(value: string, max = 165): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Organization + WebSite graph, built only from values the studio actually publishes.
 */
export function organizationJsonLd(locale: AppLocale): Record<string, unknown> {
  const origin = resolveSiteOrigin();
  const siteUrl = origin ? `${origin}${withBase("/") === "/" ? "" : withBase("/")}` : undefined;
  const description =
    locale === "ar"
      ? "بيت الحلول الرقمية الإبداعية: استراتيجية وتصميم ومحتوى ومواقع ومنتجات رقمية وأتمتة."
      : "A creative digital house for strategy, design, content, websites, digital products, and automation.";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteUrl ? `${origin}/#organization` : "#organization",
        name: BRAND_NAME,
        alternateName: SITE_CONFIG.brandName,
        description,
        url: siteUrl || origin || undefined,
        logo: origin ? `${origin}${withBase("/favicon.svg")}` : undefined,
        image: origin ? `${origin}${withBase(DEFAULT_OG_IMAGE)}` : undefined,
        email: SITE_CONFIG.contactEmail,
        telephone: SITE_CONFIG.channels.map((channel) => channel.tel),
        // No location is claimed. Reach is expressed by the markets the studio
        // can be reached in locally, which is verifiable, unlike an address.
        areaServed: "Worldwide",
        // The hybrid identity: a brand with a named person behind it.
        founder: {
          "@type": "Person",
          name: FOUNDER.name.en,
          alternateName: FOUNDER.name.ar,
          jobTitle: FOUNDER.role.en,
          ...(FOUNDER.photo && origin ? { image: `${origin}${withBase(FOUNDER.photo)}` } : {}),
        },
        contactPoint: SITE_CONFIG.channels.map((channel) => ({
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: channel.tel,
          email: SITE_CONFIG.contactEmail,
          areaServed: channel.id.toUpperCase(),
          availableLanguage: ["ar", "en"],
        })),
      },
      {
        "@type": "WebSite",
        "@id": siteUrl ? `${origin}/#website` : "#website",
        name: BRAND_NAME,
        url: siteUrl || origin || undefined,
        inLanguage: locale,
        publisher: { "@id": siteUrl ? `${origin}/#organization` : "#organization" },
      },
    ],
  };
}
