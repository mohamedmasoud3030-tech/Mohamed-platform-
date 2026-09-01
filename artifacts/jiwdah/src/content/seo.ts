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
      title: "LENA Digital House — بيت الحلول الرقمية الإبداعية",
      description:
        "نبني الهوية والمحتوى والمواقع والمنتجات الرقمية والأتمتة كنظام واحد متكامل — لعملاء في المنطقة العربية وخارجها.",
    },
    en: {
      title: "LENA Digital House — Creative Systems & Digital Experiences",
      description:
        "A digital house building identity, content, websites, digital products, and automation as one connected system — for clients across the Arab region and beyond.",
    },
  },
  world: {
    ar: {
      title: "عالم LENA",
      description:
        "عالم LENA يجمع أنظمة العقارات والجمال وتأجير الفساتين والضيافة والاستثمار وإعادة التدوير داخل منظومة تشغيلية واحدة ذات هوية مشتركة.",
    },
    en: {
      title: "LENA World",
      description:
        "LENA World brings property, beauty, dress rental, hospitality, investment and recycling systems into one connected operating world with a shared identity.",
    },
  },
  services: {
    ar: {
      title: "الحلول",
      description:
        "ثمانية مسارات متكاملة: التسويق الرقمي، الهوية البصرية، المحتوى، المواقع والمنصات، تجربة المستخدم، بناء العلامة، الأتمتة، وإطلاق المشاريع.",
    },
    en: {
      title: "Solutions",
      description:
        "Eight connected tracks: digital marketing, visual identity, content design, web platforms, UI/UX, brand building, AI automation, and launch projects.",
    },
  },
  portfolio: {
    ar: {
      title: "الأعمال المختارة",
      description:
        "دراسات مشاريع تُعرض كأنظمة متكاملة تجمع الهوية والمحتوى والواجهات والأنظمة الرقمية.",
    },
    en: {
      title: "Selected Work",
      description:
        "Case studies presented as complete systems connecting identity, content, interfaces, and digital operations.",
    },
  },
  about: {
    ar: {
      title: "عالم LENA",
      description:
        "كيف نعمل داخل LENA: منهج واضح يبدأ من الهدف وينتهي بتجربة رقمية متماسكة قابلة للنمو.",
    },
    en: {
      title: "Inside LENA",
      description:
        "How LENA works: a clear method that starts from the goal and ends with a coherent digital experience built to grow.",
    },
  },
  ai: {
    ar: {
      title: "الأنظمة الذكية والأتمتة",
      description:
        "أنظمة وأتمتة تربط أدوات العمل وتقلل الخطوات اليدوية وتحوّل العمليات المتكررة إلى مسارات واضحة.",
    },
    en: {
      title: "Smart Systems & Automation",
      description:
        "Systems and automation that connect tools, remove manual steps, and turn repetitive operations into clear workflows.",
    },
  },
  contact: {
    ar: {
      title: "ابدأ مشروعك",
      description:
        "تواصل مع LENA عبر واتساب أو البريد أو نموذج الاستفسار، وسنراجع فكرتك ونحدد أوضح خطوة تالية.",
    },
    en: {
      title: "Start a Project",
      description:
        "Reach LENA on WhatsApp, by email, or through the inquiry form. We review the idea and define the clearest next step.",
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
      description: "الرابط الذي فتحته غير متاح. عد إلى الصفحة الرئيسية أو تصفّح الأعمال.",
    },
    en: {
      title: "Page not found",
      description: "This link is not available. Return to the home page or browse the work.",
    },
  },
};

export function pageSeo(key: PageSeoKey, locale: AppLocale): LocalizedSeo {
  return PAGE_SEO[key][locale];
}
