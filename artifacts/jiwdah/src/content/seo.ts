import type { AppLocale } from "@/providers/preferences";

export type LocalizedSeo = {
  title: string;
  description: string;
};

export type PageSeoKey =
  | "home"
  | "world"
  | "services"
  | "portfolio"
  | "about"
  | "ai"
  | "contact"
  | "help"
  | "privacy"
  | "login"
  | "dashboard"
  | "notFound";

export const PAGE_SEO: Record<PageSeoKey, Record<AppLocale, LocalizedSeo>> = {
  home: {
    ar: {
      title: "LENA Digital House — أنظمة تشغيل للأعمال الحقيقية",
      description:
        "بيت رقمي يجمع أنظمة تشغيل للعقارات والجمال والتأجير والضيافة والاستثمار وإعادة التدوير داخل عالم LENA واحد.",
    },
    en: {
      title: "LENA Digital House — Operating Systems for Real Businesses",
      description:
        "A digital house connecting operating systems for property, beauty, rental, hospitality, investment, and recycling inside one LENA World.",
    },
  },
  world: {
    ar: {
      title: "عالم LENA — أنظمة تشغيل مترابطة",
      description:
        "استكشف أنظمة LENA وعملياتها وجذورها التشغيلية المشتركة داخل World Graph واحد، بدون طمس منطق كل قطاع.",
    },
    en: {
      title: "LENA World — Connected Operating Systems",
      description:
        "Explore LENA systems, their operations, and shared operating roots inside one World Graph without flattening each industry's own logic.",
    },
  },
  services: {
    ar: {
      title: "أنظمة التشغيل حسب القطاع",
      description:
        "ابدأ من طبيعة عملك لترى أنظمة تشغيل مبنية للعقارات والجمال والتأجير والضيافة والاستثمار وإعادة التدوير.",
    },
    en: {
      title: "Operating Systems by Industry",
      description:
        "Start from how your business works and explore operating systems built for property, beauty, rental, hospitality, investment, and recycling.",
    },
  },
  portfolio: {
    ar: {
      title: "الأنظمة والمنتجات",
      description:
        "منتجات LENA التشغيلية: المشكلة، المستخدمون، العمليات والأدلة المتاحة لكل نظام.",
    },
    en: {
      title: "Systems and Product Evidence",
      description:
        "LENA operating products presented through their problem, users, workflows, and available product evidence.",
    },
  },
  about: {
    ar: {
      title: "داخل LENA — كيف نبني أنظمة التشغيل",
      description:
        "كيف تبني LENA أنظمة مستقلة لقطاعات مختلفة ثم تربط الجذور التشغيلية والذاكرة والإشارات والذكاء بينها تدريجيًا.",
    },
    en: {
      title: "Inside LENA — How We Build Operating Systems",
      description:
        "How LENA builds independent industry systems and progressively connects their operating roots, memory, signals, and intelligence.",
    },
  },
  ai: {
    ar: {
      title: "الذكاء التشغيلي في LENA",
      description:
        "طبقة ذكاء حتمية تقرأ السياق والذاكرة والإشارات وبنية العالم لتحدد الحالة وما يستحق الانتباه والخطوة التالية.",
    },
    en: {
      title: "LENA Operating Intelligence",
      description:
        "A deterministic intelligence layer reading context, memory, signals, and World structure to identify state, attention, and the next useful place.",
    },
  },
  contact: {
    ar: {
      title: "ابدأ نظام تشغيل لعملك",
      description:
        "شارك طريقة عملك الحالية أو المشكلة التشغيلية مع LENA عبر واتساب أو البريد أو نموذج الاستفسار.",
    },
    en: {
      title: "Start an Operating System for Your Business",
      description:
        "Share your current workflow or operational problem with LENA through WhatsApp, email, or the inquiry form.",
    },
  },
  help: {
    ar: {
      title: "المساعدة والأسئلة الشائعة",
      description:
        "إجابات مباشرة عن بدء المشروع، وقت الرد، الأسعار، مشاكل النموذج، وبياناتك — مع قنوات التواصل المباشرة.",
    },
    en: {
      title: "Help and frequently asked questions",
      description:
        "Direct answers about starting a project, reply times, pricing, form problems and your data — plus the direct contact channels.",
    },
  },
  privacy: {
    ar: {
      title: "بياناتك وخصوصيتك",
      description:
        "ما الذي يُجمع عند إرسال استفسار، ولماذا، وأين يُحفظ، ومن يصل إليه، وكيف تطلب نسخة أو تصحيحًا أو حذفًا.",
    },
    en: {
      title: "Your data and privacy",
      description:
        "What is collected when you send an inquiry, why, where it is stored, who can reach it, and how to request a copy, a correction or deletion.",
    },
  },
  login: {
    ar: { title: "تسجيل الدخول", description: "دخول مخصص لفريق LENA فقط." },
    en: { title: "Sign in", description: "Restricted access for the LENA team." },
  },
  dashboard: {
    ar: { title: "لوحة التحكم", description: "إدارة الاستفسارات والمشاريع." },
    en: { title: "Dashboard", description: "Manage inquiries and projects." },
  },
  notFound: {
    ar: {
      title: "الصفحة غير موجودة",
      description: "الرابط الذي فتحته غير متاح. عد إلى الصفحة الرئيسية أو استكشف أنظمة LENA.",
    },
    en: {
      title: "Page not found",
      description: "This link is not available. Return home or explore LENA operating systems.",
    },
  },
};

export function pageSeo(key: PageSeoKey, locale: AppLocale): LocalizedSeo {
  return PAGE_SEO[key][locale];
}
