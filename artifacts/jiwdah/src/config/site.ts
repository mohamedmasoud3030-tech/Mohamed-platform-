const env = import.meta.env;

// Contact details are configuration. The fallbacks keep a misconfigured deploy
// usable, and a missing value is reported in the console rather than hidden.
const display = env.VITE_PRIMARY_PHONE_DISPLAY ?? "91928186";
const tel = env.VITE_PRIMARY_PHONE_TEL ?? "+96891928186";
const whatsapp = env.VITE_PRIMARY_WHATSAPP ?? "96891928186";
const email = env.VITE_CONTACT_EMAIL ?? "Mohamedms.oud@outlook.com";

if (import.meta.env.PROD) {
  for (const [name, value] of Object.entries({
    VITE_PRIMARY_WHATSAPP: env.VITE_PRIMARY_WHATSAPP,
    VITE_CONTACT_EMAIL: env.VITE_CONTACT_EMAIL,
  })) {
    if (!value) console.warn(`[config] ${name} is not set — a built-in fallback is being shown to visitors.`);
  }
}
const message = "مرحبًا LENA، لدي فكرة مشروع وأرغب في معرفة التفاصيل. / Hello LENA, I have a project idea and would like to know more.";
const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
const emailUrl = `mailto:${email}?subject=${encodeURIComponent("استفسار مشروع جديد — LENA Digital House")}`;

export const SITE_CONFIG = {
  ownerName: "LENA",
  brandName: "LENA",
  brandFullName: "LENA Digital House",
  brandSubtitle: "بيت الحلول الرقمية الإبداعية",
  phone: { display, tel, whatsapp },
  phones: [{ label: "واتساب واتصال", display, tel, whatsapp }],
  primaryWhatsApp: whatsapp,
  primaryWhatsAppUrl: whatsappUrl,
  contactEmail: email,
  email,
  whatsappUrl,
  emailUrl,
  // Where the studio is based. Never used to describe who it serves.
  basedIn: { ar: "سلطنة عمان", en: "Oman" },
  servesLabel: { ar: "نعمل مع عملاء في المنطقة العربية وخارجها", en: "Working with clients across the Arab region and beyond" },
} as const;

export const PRIMARY_PHONE = SITE_CONFIG.phones[0];
