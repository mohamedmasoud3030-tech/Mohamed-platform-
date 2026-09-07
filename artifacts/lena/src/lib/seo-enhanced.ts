/**
 * LENA SEO Enhancements
 *
 * Structured data generators for better search engine visibility.
 */

import type { AppLocale } from "@/providers/preferences";
import { absoluteUrl } from "@/lib/seo";

/**
 * Organization structured data (JSON-LD)
 */
export function organizationJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LENA Digital House",
    alternateName: locale === "ar" ? "بيت لينا الرقمي" : "LENA Digital House",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/lena-og.jpg"),
    description:
      locale === "ar"
        ? "أنظمة تشغيل حقيقية لست صناعات. اتبنت من أرض الواقع، مش من مكتب بعيد."
        : "Real operating systems for six industries. Built from the ground, not from a distant office.",
    founder: {
      "@type": "Person",
      name: locale === "ar" ? "محمد مسعود" : "Mohamed Masoud",
      jobTitle:
        locale === "ar"
          ? "مؤسس LENA Digital House"
          : "Founder, LENA Digital House",
    },
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Arabic", "English"],
    },
  };
}

/**
 * Software Application structured data for each system
 */
export function softwareApplicationJsonLd(
  system: {
    name: Record<AppLocale, string>;
    industry: Record<AppLocale, string>;
    problem: Record<AppLocale, string>;
    does: Record<AppLocale, string[]>;
  },
  locale: AppLocale
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: system.name[locale],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: system.problem[locale],
    featureList: system.does[locale],
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
    },
  };
}

/**
 * Breadcrumb structured data
 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/**
 * FAQ structured data
 */
export function faqJsonLd(
  questions: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate meta tags for social sharing
 */
export function socialMetaTags(
  title: string,
  description: string,
  url: string,
  image: string = absoluteUrl("/lena-og.jpg")
) {
  return {
    "og:title": title,
    "og:description": description,
    "og:url": url,
    "og:image": image,
    "og:type": "website",
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
  };
}
