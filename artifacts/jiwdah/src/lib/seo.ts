import { SITE_CONFIG } from "@/config/site";
import type { AppLocale } from "@/providers/preferences";

export const BRAND_NAME = "LENA Digital House";
export const DEFAULT_OG_IMAGE = "/lena-og.svg";

/**
 * Absolute origin of the deployed site.
 * Never hard-coded: configuration first, current browser origin second.
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
  return origin ? `${origin}${normalized}` : normalized;
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
  const url = origin || undefined;
  const description =
    locale === "ar"
      ? "بيت الحلول الرقمية الإبداعية: استراتيجية وتصميم ومحتوى ومواقع ومنتجات رقمية وأتمتة."
      : "A creative digital house for strategy, design, content, websites, digital products, and automation.";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": url ? `${url}/#organization` : "#organization",
        name: BRAND_NAME,
        alternateName: SITE_CONFIG.brandName,
        description,
        url,
        logo: origin ? `${origin}/favicon.svg` : undefined,
        image: origin ? `${origin}${DEFAULT_OG_IMAGE}` : undefined,
        email: SITE_CONFIG.contactEmail,
        telephone: SITE_CONFIG.phone.tel,
        areaServed: { "@type": "Country", name: "Oman" },
        address: { "@type": "PostalAddress", addressCountry: "OM" },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: SITE_CONFIG.phone.tel,
            email: SITE_CONFIG.contactEmail,
            areaServed: "OM",
            availableLanguage: ["ar", "en"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": url ? `${url}/#website` : "#website",
        name: BRAND_NAME,
        url,
        inLanguage: locale,
        publisher: { "@id": url ? `${url}/#organization` : "#organization" },
      },
    ],
  };
}
