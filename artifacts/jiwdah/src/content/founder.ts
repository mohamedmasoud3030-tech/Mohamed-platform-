import type { AppLocale } from "@/providers/preferences";

/**
 * The person behind the brand.
 *
 * The hybrid identity approved for this product is: LENA is the brand, and the
 * founder is the visible face behind it. This file holds only what is verifiably
 * true. The biography is deliberately empty until the founder writes it —
 * inventing a background would be a false claim to a prospective client, so the
 * section simply does not render until real text exists.
 */

export type Founder = {
  name: Record<AppLocale, string>;
  /** Factual role, not a marketing claim. */
  role: Record<AppLocale, string>;
  /** Initials used when no photograph is available. */
  initials: string;
  /** Path under /public. Empty string renders the monogram instead. */
  photo: string;
  photoAlt: Record<AppLocale, string>;
  /** Owner-authored. Empty until written — never generated. */
  bio: Record<AppLocale, string>;
};

export const FOUNDER: Founder = {
  name: { ar: "محمد مسعود", en: "Mohamed Masoud" },
  role: {
    ar: "مؤسس LENA Digital House",
    en: "Founder, LENA Digital House",
  },
  initials: "MM",
  // Produced by tools/prepare-founder-photo.sh: 440x440, metadata stripped.
  photo: "/founder.jpg",
  photoAlt: {
    ar: "محمد مسعود، مؤسس LENA Digital House",
    en: "Mohamed Masoud, founder of LENA Digital House",
  },
  bio: { ar: "", en: "" },
};

export function hasFounderBio(locale: AppLocale): boolean {
  return FOUNDER.bio[locale].trim().length > 0;
}
