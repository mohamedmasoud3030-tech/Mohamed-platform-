const env = import.meta.env;

/**
 * Contact configuration.
 *
 * The studio deliberately does not publish a country as its location: it works
 * across markets rather than from one. What replaces a location claim is
 * stronger — a local number in each of the three markets it serves, so a client
 * dials a familiar country code instead of an international one.
 *
 * Every value is configuration. The fallbacks keep a misconfigured deployment
 * usable, and a missing value is reported in the production console instead of
 * silently showing a stale number.
 */

export type ContactChannel = {
  id: string;
  /** Market label, not a claim about where the studio is. */
  region: { ar: string; en: string };
  /** Shown to the reader, spaced for legibility. */
  display: string;
  /** E.164, for tel: links. */
  tel: string;
  /** Digits only, for wa.me links. */
  whatsapp: string;
};

const CHANNELS: ContactChannel[] = [
  {
    id: "om",
    region: { ar: "عُمان", en: "Oman" },
    display: env.VITE_PHONE_OM_DISPLAY ?? "+968 9192 8186",
    tel: env.VITE_PHONE_OM_TEL ?? "+96891928186",
    whatsapp: env.VITE_PHONE_OM_WHATSAPP ?? "96891928186",
  },
  {
    id: "eg",
    region: { ar: "مصر", en: "Egypt" },
    display: env.VITE_PHONE_EG_DISPLAY ?? "+20 121 210 1073",
    tel: env.VITE_PHONE_EG_TEL ?? "+201212101073",
    whatsapp: env.VITE_PHONE_EG_WHATSAPP ?? "201212101073",
  },
  {
    id: "sa",
    region: { ar: "السعودية", en: "Saudi Arabia" },
    display: env.VITE_PHONE_SA_DISPLAY ?? "+966 50 868 8213",
    tel: env.VITE_PHONE_SA_TEL ?? "+966508688213",
    whatsapp: env.VITE_PHONE_SA_WHATSAPP ?? "966508688213",
  },
];

/** The number behind the floating button and every one-tap action. */
const primaryId = env.VITE_PRIMARY_CHANNEL ?? "om";
const primary = CHANNELS.find((channel) => channel.id === primaryId) ?? CHANNELS[0];

const email = env.VITE_CONTACT_EMAIL ?? "MohamedMs.oud@outlook.com";

if (import.meta.env.PROD) {
  for (const [name, value] of Object.entries({
    VITE_PHONE_OM_WHATSAPP: env.VITE_PHONE_OM_WHATSAPP,
    VITE_CONTACT_EMAIL: env.VITE_CONTACT_EMAIL,
  })) {
    if (!value) console.warn(`[config] ${name} is not set — a built-in fallback is being shown to visitors.`);
  }
}

const message =
  "مرحبًا بفريق LENA Digital House، لدي فكرة مشروع وأرغب في استكشاف كيف يمكن تحويلها إلى تجربة رقمية متكاملة. يسعدني معرفة المزيد عن خدماتكم والخطوات المناسبة للبدء. / Hello LENA Digital House, I have a project idea and would love to explore how it could be shaped into a complete digital experience. I’d like to learn more about your services and the best way to get started.";

export function whatsappUrlFor(channel: ContactChannel): string {
  return `https://wa.me/${channel.whatsapp}?text=${encodeURIComponent(message)}`;
}

const whatsappUrl = whatsappUrlFor(primary);
const emailUrl = `mailto:${email}?subject=${encodeURIComponent("استفسار مشروع جديد — LENA Digital House")}`;

export const SITE_CONFIG = {
  ownerName: "Mohamed Masoud",
  brandName: "LENA",
  brandFullName: "LENA Digital House",
  brandSubtitle: "بيت الحلول الرقمية الإبداعية",

  channels: CHANNELS,
  phone: { display: primary.display, tel: primary.tel, whatsapp: primary.whatsapp },
  phones: CHANNELS,
  primaryWhatsApp: primary.whatsapp,
  primaryWhatsAppUrl: whatsappUrl,
  contactEmail: email,
  email,
  whatsappUrl,
  emailUrl,

  /**
   * No country is claimed as the studio's location. Reach is described by the
   * markets it can be called in locally, which is a fact rather than a boundary.
   */
  reachLabel: {
    ar: "أرقام محلية في عُمان ومصر والسعودية — ونعمل مع عملاء خارجها",
    en: "Local numbers in Oman, Egypt and Saudi Arabia — and we work with clients beyond them",
  },
  servesLabel: {
    ar: "نعمل مع عملاء في المنطقة العربية وخارجها",
    en: "Working with clients across the Arab region and beyond",
  },
} as const;

export const PRIMARY_PHONE = primary;
