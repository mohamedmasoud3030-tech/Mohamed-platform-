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
    ar: "مؤسس LENA Digital House — متخصص في بناء وتطوير البرمجيات وأنظمة التشغيل السحابية",
    en: "Founder, LENA Digital House — Software & Cloud Systems Specialist",
  },
  initials: "MM",
  // Produced by tools/prepare-founder-photo.sh: 440x440, metadata stripped.
  photo: "/founder.jpg",
  photoAlt: {
    ar: "محمد مسعود، مؤسس LENA Digital House",
    en: "Mohamed Masoud, founder of LENA Digital House",
  },
  /**
   * Specialist background in Computer Science & MIS, building cloud systems.
   */
  bio: {
    ar: "محمد مسعود، خريج حاسبات ونظم معلومات إدارية، ومؤسس LENA Digital House. متخصص في بناء وتطوير أنظمة التشغيل السحابية والحلول البرمجية المتكاملة للشركات والأعمال. أركز على تحويل متطلبات وسير العمليات اليومية إلى برمجيات ذكية، انسيابية، وموثوقة، وأعمل مع أصحاب المشاريع مباشرة لتحقيق أعلى كفاءة تشغيلية وتوفير الوقت والجهد.",
    en: "Mohamed Masoud, Computer Science & Management Information Systems graduate and founder of LENA Digital House. Specialized in developing enterprise cloud operating systems and tailored software solutions. I focus on turning daily operational workflows into clean, intuitive, and reliable software, working directly with business owners to achieve maximum operational efficiency.",
  },
};

export function hasFounderBio(locale: AppLocale): boolean {
  return FOUNDER.bio[locale].trim().length > 0;
}
