import type { AppLocale } from "@/providers/preferences";

/**
 * The systems this studio builds, organised by the industry that buys them.
 *
 * Content is drawn strictly from the founder's own account of what he has built
 * (see docs/PROJECT_INVENTORY.md). Nothing here is invented: no metric, no client
 * name, no claim of scale. Where detail is still missing, the entry says so
 * rather than filling the gap.
 *
 * `visibility` is the mechanism the owner asked for: an entry can be taken off
 * the public surface without being deleted, and restored with one word.
 */

export type Visibility = "public" | "hidden";

export type SystemId =
  | "property"
  | "wellness"
  | "rental"
  | "investment"
  | "hospitality"
  | "recycling";

export type BusinessSystem = {
  id: SystemId;
  visibility: Visibility;
  /** The industry, as its owner would name it. */
  industry: Record<AppLocale, string>;
  /** The daily operational problem, in the buyer's language. */
  problem: Record<AppLocale, string>;
  /** What the system does. Verbs, not features. */
  does: Record<AppLocale, string[]>;
  /** Whether a documented case study exists yet. */
  documented: boolean;
};

export const BUSINESS_SYSTEMS: BusinessSystem[] = [
  {
    id: "property",
    visibility: "public",
    industry: { ar: "إدارة العقارات", en: "Property management" },
    problem: {
      ar: "عقود متفرقة، وتحصيل يُتابَع بالذاكرة، وصيانة تُطلب على واتساب، وتقرير آخر الشهر يُجمَّع يدويًا.",
      en: "Scattered contracts, collection tracked from memory, maintenance requested over WhatsApp, and a month-end report assembled by hand.",
    },
    does: {
      ar: ["تشغيل الوحدات والعقود", "التأجير والتجديد", "التحصيل والمتأخرات", "طلبات الصيانة", "تقارير الملّاك"],
      en: ["Unit and contract operations", "Leasing and renewals", "Collection and arrears", "Maintenance requests", "Owner reporting"],
    },
    documented: false,
  },
  {
    id: "wellness",
    visibility: "public",
    industry: { ar: "المراكز الصحية والسبا", en: "Health centres and spa" },
    problem: {
      ar: "حجوزات على دفتر، وجدول موظفين يتغير كل يوم، ولا صورة واضحة لما دخل فعلًا نهاية اليوم.",
      en: "Bookings in a notebook, a staff schedule that changes daily, and no clear picture of what actually came in by close.",
    },
    does: {
      ar: ["الحجوزات والمواعيد", "جدولة الطاقم", "الخدمات والأسعار", "متابعة العملاء", "ملخص يومي"],
      en: ["Bookings and appointments", "Staff scheduling", "Services and pricing", "Client follow-up", "Daily summary"],
    },
    documented: false,
  },
  {
    id: "rental",
    visibility: "public",
    industry: { ar: "معارض وتأجير الفساتين", en: "Showrooms and dress rental" },
    problem: {
      ar: "قطعة واحدة تُحجز لأكثر من موعد، وتواريخ الإرجاع تضيع، ولا أحد يعرف ما المتاح فعلًا هذا الأسبوع.",
      en: "One piece double-booked, return dates lost, and nobody sure what is actually available this week.",
    },
    does: {
      ar: ["مخزون القطع وحالتها", "الحجز بالتواريخ", "الخروج والإرجاع", "التأمين والمدفوعات", "توفر فوري"],
      en: ["Piece inventory and condition", "Date-based reservations", "Check-out and return", "Deposits and payments", "Live availability"],
    },
    documented: false,
  },
  {
    id: "investment",
    visibility: "public",
    industry: { ar: "شركات الاستثمار", en: "Investment companies" },
    problem: {
      ar: "أقسام مختلفة — حيواني وزراعي وعقاري — كل قسم بملفاته، ولا لوحة واحدة تجمع الصورة.",
      en: "Different divisions — livestock, agricultural, real estate — each with its own files, and no single view of the whole.",
    },
    does: {
      ar: ["أقسام متعددة في نظام واحد", "الأصول والعمليات", "المصروفات والإيرادات", "تقارير لكل قسم"],
      en: ["Multiple divisions in one system", "Assets and operations", "Costs and revenue", "Reporting per division"],
    },
    documented: false,
  },
  {
    id: "hospitality",
    visibility: "public",
    industry: { ar: "خدمات الضيافة والفعاليات", en: "Hospitality and events" },
    problem: {
      ar: "كل مناسبة طلب مختلف وطاقم مختلف وتجهيزات مختلفة، والتنسيق كله في رسائل متفرقة.",
      en: "Every occasion is a different order, a different crew and different equipment, coordinated entirely in scattered messages.",
    },
    does: {
      ar: ["طلبات المناسبات", "الطاقم والتجهيزات", "الجدولة", "التكلفة لكل مناسبة"],
      en: ["Event orders", "Crew and equipment", "Scheduling", "Cost per occasion"],
    },
    documented: false,
  },
  {
    id: "recycling",
    visibility: "public",
    industry: { ar: "مخازن إعادة التدوير", en: "Recycling warehouses" },
    problem: {
      ar: "الميزان يعمل طول اليوم، والدفتر يتأخر، وفي آخر اليوم لا أحد يعرف كم دخل وكم خرج وكم بقي في الخزنة.",
      en: "The weighbridge runs all day, the notebook falls behind, and by close nobody knows what came in, what went out, or what is left in the cash box.",
    },
    does: {
      ar: [
        "أصناف بالنوع والدرجة وأسعار اليوم",
        "شراء وبيع في أقل من ٣٠ ثانية",
        "أطراف بأرصدة مفتوحة",
        "خزنة مع تقفيل يومي بالعدّ",
        "إيصالات مرقّمة على واتساب",
        "يعمل بدون إنترنت، والتصحيح بالعكس لا بالحذف",
      ],
      en: [
        "Items by type and grade with today's prices",
        "Buy and sell in under 30 seconds",
        "Counterparties with open balances",
        "Cash box with a daily counted close",
        "Numbered receipts over WhatsApp",
        "Works offline; corrections by reversal, never deletion",
      ],
    },
    documented: false,
  },
];

export function publicSystems(): BusinessSystem[] {
  return BUSINESS_SYSTEMS.filter((system) => system.visibility === "public");
}

export function findSystem(id?: string): BusinessSystem | undefined {
  return BUSINESS_SYSTEMS.find((system) => system.id === id && system.visibility === "public");
}
