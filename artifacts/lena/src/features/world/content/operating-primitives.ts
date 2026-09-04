import type { AppLocale } from "@/providers/preferences";
import type {
  BusinessSystem,
  OperatingPrimitiveId,
  SystemId,
} from "@/content/systems";

export type OperatingPrimitive = {
  id: OperatingPrimitiveId;
  label: Record<AppLocale, string>;
  meaning: Record<AppLocale, string>;
};

export type ConstellationRoot = OperatingPrimitive & {
  systemIds: SystemId[];
  maturity: "shared" | "signal";
};

/**
 * The common vocabulary beneath the vertical products.
 *
 * Definitions describe the already documented product scope. They do not say
 * that a shared backend exists. The graph derives every edge from each system's
 * explicit `operatingPrimitives` field and never guesses from translated copy.
 */
export const OPERATING_PRIMITIVES: OperatingPrimitive[] = [
  {
    id: "relationships",
    label: { ar: "العلاقات", en: "Relationships" },
    meaning: {
      ar: "عملاء وملّاك ومستأجرون وأطراف مرتبطة بالعمل.",
      en: "Customers, owners, tenants and business counterparties.",
    },
  },
  {
    id: "time",
    label: { ar: "الوقت والالتزام", en: "Time & commitments" },
    meaning: {
      ar: "حجوزات وتجديدات ومواعيد وجدولة مرتبطة بالتنفيذ.",
      en: "Bookings, renewals, dates and execution schedules.",
    },
  },
  {
    id: "money",
    label: { ar: "المال", en: "Money" },
    meaning: {
      ar: "تحصيل ومبيعات ومدفوعات وتكاليف وحركة نقدية.",
      en: "Collection, sales, payments, costs and cash movement.",
    },
  },
  {
    id: "assets",
    label: { ar: "الأصول والمخزون", en: "Assets & inventory" },
    meaning: {
      ar: "وحدات وقطع ومخزون وتجهيزات وأصول تشغيلية.",
      en: "Units, pieces, stock, equipment and operating assets.",
    },
  },
  {
    id: "workflow",
    label: { ar: "سير العمل", en: "Workflow" },
    meaning: {
      ar: "انتقال الطلب أو العملية من البداية إلى الإغلاق.",
      en: "Work moving from request or transaction to completion.",
    },
  },
  {
    id: "documents",
    label: { ar: "السجلات والمستندات", en: "Records & documents" },
    meaning: {
      ar: "عقود وتقارير وإيصالات وسجلات قابلة للرجوع.",
      en: "Contracts, reports, receipts and retrievable records.",
    },
  },
  {
    id: "people",
    label: { ar: "الفرق والأدوار", en: "Teams & roles" },
    meaning: {
      ar: "موظفون وطاقم تنفيذ ومسؤوليات داخل التشغيل.",
      en: "Staff, execution crews and operational responsibilities.",
    },
  },
  {
    id: "insight",
    label: { ar: "الرؤية والرقابة", en: "Insight & control" },
    meaning: {
      ar: "ملخصات وتقارير تجعل حالة العمل قابلة للفهم.",
      en: "Summaries and reporting that make operations understandable.",
    },
  },
  {
    id: "integrity",
    label: { ar: "النزاهة والتدقيق", en: "Integrity & audit" },
    meaning: {
      ar: "تصحيح مضبوط وأثر تشغيلي يحمي الحقيقة.",
      en: "Controlled correction and an operational trace that protects truth.",
    },
  },
];

/**
 * Build the factual layer beneath the six systems.
 * Two or more products make a proven shared root; one remains an emerging
 * signal, visibly distinct and not promoted to a LENA OS claim.
 */
export function buildConstellationRoots(
  systems: BusinessSystem[],
): ConstellationRoot[] {
  return OPERATING_PRIMITIVES.map((primitive) => {
    const systemIds = systems
      .filter((system) => system.operatingPrimitives.includes(primitive.id))
      .map((system) => system.id);
    const maturity: ConstellationRoot["maturity"] =
      systemIds.length >= 2 ? "shared" : "signal";

    return {
      ...primitive,
      systemIds,
      maturity,
    };
  }).filter((primitive) => primitive.systemIds.length > 0);
}
