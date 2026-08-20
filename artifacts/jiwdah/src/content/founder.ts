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
    ar: "مؤسس LENA Digital House — أبني أنظمة تشغيل من داخل المشكلة",
    en: "Founder, LENA Digital House — building operations systems from inside the problem",
  },
  initials: "MM",
  // Produced by tools/prepare-founder-photo.sh: 440x440, metadata stripped.
  photo: "/founder.jpg",
  photoAlt: {
    ar: "محمد مسعود، مؤسس LENA Digital House",
    en: "Mohamed Masoud, founder of LENA Digital House",
  },
  /**
   * Written from the founder's own account of his background, in his own facts.
   * Deliberately excluded: date of birth and age — sensitive personal data that
   * adds nothing to a purchase decision and is a known identity-theft vector.
   */
  bio: {
    ar: "محمد مسعود، خريج حاسبات ونظم معلومات إدارية. قبل أن أكتب أول سطر برمجي كنت أدير مكتبًا لتشغيل الأصول العقارية للغير: عقود وتحصيل وصيانة وتقارير آخر الشهر. من هناك عرفت أين يضيع المال والوقت فعلًا — ليس في نقص الأفكار، بل في عمليات يومية تُدار على الورق وفي مجموعات واتساب. ومنذ ثلاث سنوات أبني أنظمة تحلّ ما عشته بنفسي: إدارة العقارات، والمراكز الصحية والسبا، وصالات عرض الفساتين، وشركات الاستثمار، وخدمات الضيافة، والآن مخازن إعادة التدوير. كل نظام بدأ من مشكلة تشغيلية حقيقية، لا من فكرة على ورقة. أعمل مع صاحب العمل مباشرة: أفهم يومه، ثم أبني ما يختصره.",
    en: "Mohamed Masoud, a computers and management information systems graduate. Before I wrote my first line of code I managed an office operating real-estate assets for other owners: contracts, collections, maintenance, and month-end reports. That is where I learned where money and time actually leak — not from a shortage of ideas, but from daily operations run on paper and in WhatsApp groups. For three years I have been building systems for the problems I lived myself: property management, health and spa centres, dress showrooms, investment firms, hospitality services, and now recycling warehouses. Every one started from a real operational problem, not a concept on a page. I work directly with the owner: understand the day, then build what shortens it.",
  },
};

export function hasFounderBio(locale: AppLocale): boolean {
  return FOUNDER.bio[locale].trim().length > 0;
}
