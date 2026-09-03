import type { WorldSignal } from "./types.ts";

/**
 * Curated LENA-level demo signals. Not product telemetry — only enough
 * structured events to prove the world can feel activity, attention, and calm.
 */
export const DEMO_SIGNALS: WorldSignal[] = [
  {
    id: "sig-property-attention",
    sourceWorld: "property",
    kind: "attention-needed",
    severity: "attention",
    timestamp: "2026-09-03T08:12:00.000Z",
    title: {
      ar: "عقود تحتاج مراجعة قبل التجديد",
      en: "Contracts need review before renewal",
    },
    description: {
      ar: "حركة تشغيل في عالم العقارات تتطلب انتباهًا قبل دورة التجديد القادمة.",
      en: "Operating movement in the property world needs attention before the next renewal cycle.",
    },
    targetPath: "/world/property",
    lifecycle: "new",
  },
  {
    id: "sig-wellness-activity",
    sourceWorld: "wellness",
    kind: "activity",
    severity: "information",
    timestamp: "2026-09-03T07:40:00.000Z",
    title: {
      ar: "نشاط يومي داخل عالم الجمال",
      en: "Daily activity inside the beauty world",
    },
    description: {
      ar: "العالم يعمل بهدوء: حركة مواعيد وتشغيل يومي دون ضغط حرج.",
      en: "The world is quietly working: appointment movement without critical pressure.",
    },
    targetPath: "/world/wellness",
    lifecycle: "active",
  },
  {
    id: "sig-recycling-degraded",
    sourceWorld: "recycling",
    kind: "degraded",
    severity: "critical",
    timestamp: "2026-09-03T06:05:00.000Z",
    title: {
      ar: "حالة تشغيل متدهورة عند نقطة الوزن",
      en: "Degraded operating state at the weigh point",
    },
    description: {
      ar: "عالم إعادة التدوير يرسل إشارة حرجة: التدفق اليومي يحتاج تدخلًا.",
      en: "The recycling world is emitting a critical signal: daily flow needs intervention.",
    },
    targetPath: "/world/recycling",
    lifecycle: "active",
  },
  {
    id: "sig-hospitality-change",
    sourceWorld: "hospitality",
    kind: "operational-change",
    severity: "information",
    timestamp: "2026-09-03T05:22:00.000Z",
    title: {
      ar: "تغيّر تشغيلي في جدولة المناسبات",
      en: "Operational change in occasion scheduling",
    },
    description: {
      ar: "تنسيق الطاقم والتجهيزات تحرّك داخل عالم الضيافة.",
      en: "Crew and equipment coordination has shifted inside the hospitality world.",
    },
    targetPath: "/world/hospitality",
    lifecycle: "active",
  },
  {
    id: "sig-rental-milestone",
    sourceWorld: "rental",
    kind: "milestone",
    severity: "ambient",
    timestamp: "2026-09-02T21:00:00.000Z",
    title: {
      ar: "اكتملت دورة حجز أسبوعية",
      en: "A weekly reservation cycle completed",
    },
    description: {
      ar: "عالم التأجير أنهى دورة وأعاد القطعة إلى حالة الهدوء.",
      en: "The rental world completed a cycle and returned a piece to calm.",
    },
    targetPath: "/world/rental",
    lifecycle: "resolved",
  },
  {
    id: "sig-investment-resolved",
    sourceWorld: "investment",
    kind: "resolved",
    severity: "ambient",
    timestamp: "2026-09-02T18:30:00.000Z",
    title: {
      ar: "استقرت صورة الأقسام بعد المراجعة",
      en: "Division picture settled after review",
    },
    description: {
      ar: "إشارة سابقة في عالم الاستثمار أُغلقت وعاد العالم إلى الهدوء.",
      en: "A prior signal in the investment world closed and the world returned to quiet.",
    },
    targetPath: "/world/investment",
    lifecycle: "resolved",
  },
];
