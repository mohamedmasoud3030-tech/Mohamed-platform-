import { useEffect } from "react";
import {
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  buildDocumentTitle,
  clampDescription,
} from "@/lib/seo";
import { SUPPORTED_LOCALES, withLocale } from "@/lib/locale";
import type { AppLocale } from "@/providers/preferences";

const STRUCTURED_DATA_ID = "lena-structured-data";

export type SeoInput = {
  /** Page title without the brand suffix. */
  title: string;
  description: string;
  /** Route path, e.g. "/services" — used for canonical and og:url. */
  path: string;
  locale: AppLocale;
  /** Root-relative or absolute image URL. */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

/**
 * Language alternates. Without these, two language versions of the same page
 * look like duplicates to a search engine instead of a pair.
 */
function upsertAlternates(entries: Array<{ hreflang: string; href: string }>) {
  const managed = document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-lena="hreflang"]');
  managed.forEach((element) => element.remove());
  for (const entry of entries) {
    const element = document.createElement("link");
    element.setAttribute("rel", "alternate");
    element.setAttribute("hreflang", entry.hreflang);
    element.setAttribute("href", entry.href);
    element.setAttribute("data-lena", "hreflang");
    document.head.appendChild(element);
  }
}

function upsertStructuredData(data: Record<string, unknown> | null | undefined) {
  const existing = document.head.querySelector<HTMLScriptElement>(`script#${STRUCTURED_DATA_ID}`);
  if (!data) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement("script");
  if (!existing) {
    element.id = STRUCTURED_DATA_ID;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

/**
 * Idempotently applies the current route's metadata to <head>.
 * Every managed tag is reused, so <head> never accumulates duplicates.
 */
export function useSeo({
  title,
  description,
  path,
  locale,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd = null,
}: SeoInput): void {
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const isHome = path === "/";
    const documentTitle = buildDocumentTitle(title, isHome);
    const summary = clampDescription(description);
    // Canonical and alternates always point at the language-prefixed address.
    const canonical = absoluteUrl(withLocale(locale, path));
    const hasOrigin = canonical.startsWith("http");
    const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

    document.title = documentTitle;
    upsertMeta("name", "description", summary);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    upsertCanonical(hasOrigin ? canonical : null);

    if (hasOrigin && !noindex) {
      upsertAlternates([
        ...SUPPORTED_LOCALES.map((code) => ({ hreflang: code, href: absoluteUrl(withLocale(code, path)) })),
        { hreflang: "x-default", href: absoluteUrl(withLocale("en", path)) },
      ]);
    } else {
      upsertAlternates([]);
    }

    upsertMeta("property", "og:site_name", BRAND_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:locale", locale === "ar" ? "ar_OM" : "en_US");
    upsertMeta("property", "og:title", documentTitle);
    upsertMeta("property", "og:description", summary);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", imageUrl);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", documentTitle);
    upsertMeta("name", "twitter:description", summary);
    upsertMeta("name", "twitter:image", imageUrl);

    upsertStructuredData(serializedJsonLd ? (JSON.parse(serializedJsonLd) as Record<string, unknown>) : null);
  }, [title, description, path, locale, image, type, noindex, serializedJsonLd]);
}
