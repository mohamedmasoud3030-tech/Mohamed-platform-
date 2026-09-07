import type { AppLocale } from "@/providers/preferences";
import type { OperatingPrimitiveId, SystemId } from "@/content/systems";

/**
 * Canonical real-application evidence.
 *
 * One place owns every product visual surfaced in LENA World. Each entry points
 * at an actual asset from the real product repository (verified by the
 * repository guard), describes the capability the surface proves, and — where
 * it is meaningful — links the surface to the operating root it demonstrates,
 * so the Constellation Graph can point visitors at real proof.
 *
 * Systems without evidence yet simply have no entry here. Nothing is invented:
 * no fictional screens, no mockups presented as real. The chamber reveals the
 * Operating Surfaces layer only when real evidence exists.
 */
export type EvidenceSurface = {
  /** Stable anchor id, used for deep links (e.g. /world/property#money). */
  id: string;
  /** Site-root-relative asset path (public/world/evidence/<system>/…). */
  src: string;
  /** Accessible description of the actual application surface. */
  alt: Record<AppLocale, string>;
  /** What this surface proves — capability, never lifecycle status. */
  capability: Record<AppLocale, string>;
  /** Operating root this surface demonstrates, when applicable. */
  primitive?: OperatingPrimitiveId;
};

export const SYSTEM_EVIDENCE: Partial<Record<SystemId, EvidenceSurface[]>> = {
  /**
   * MALEK — real application surfaces captured from the running application
   * (the current deployed MALEK UI, signed in as the QA workspace) plus the
   * sign-in screen. Each surface proves a different capability: entry point,
   * operating overview, assets, contracts, money, maintenance and mobile
   * operations. These are current-interface captures, not archived exports.
   */
  property: [
    {
      id: "entry",
      src: "/world/evidence/malek/entry.png",
      alt: {
        ar: "شاشة تسجيل الدخول إلى MALEK",
        en: "The MALEK sign-in screen",
      },
      capability: {
        ar: "نقطة دخول MALEK: جلسة واحدة تدخل إلى كل عمليات النظام.",
        en: "MALEK's entry point: one session into the whole system's operations.",
      },
    },
    {
      id: "dashboard",
      src: "/world/evidence/malek/dashboard-dark.png",
      alt: {
        ar: "لوحة تشغيل MALEK: العقارات والوحدات وحالة الشهر في نظرة واحدة",
        en: "MALEK operating dashboard: properties, units and the month at a glance",
      },
      capability: {
        ar: "نظرة تشغيل عامة تجمع العقارات والوحدات وحالة التحصيل.",
        en: "An operating overview that gathers properties, units and collection state.",
      },
      primitive: "insight",
    },
    {
      id: "properties",
      src: "/world/evidence/malek/properties.png",
      alt: {
        ar: "شاشة العقارات والوحدات في MALEK",
        en: "The properties and units screen in MALEK",
      },
      capability: {
        ar: "العقارات والوحدات أصول منظَّمة داخل النظام.",
        en: "Properties and units as organized assets inside the system.",
      },
      primitive: "assets",
    },
    {
      id: "contracts",
      src: "/world/evidence/malek/contracts.png",
      alt: {
        ar: "شاشة العقود والإيجارات في MALEK",
        en: "The contracts and leases screen in MALEK",
      },
      capability: {
        ar: "العقود والتجديدات بتاريخها، يتتبعها النظام لا الذاكرة.",
        en: "Contracts and renewals with their dates, tracked by the system rather than memory.",
      },
      primitive: "time",
    },
    {
      id: "financials",
      src: "/world/evidence/malek/financials.png",
      alt: {
        ar: "الشاشة المالية في MALEK: التحصيل والمتأخرات",
        en: "The financials screen in MALEK: collection and arrears",
      },
      capability: {
        ar: "التحصيل والمتأخرات والتقارير المالية في مسار واحد.",
        en: "Collection, arrears and financial reporting in one path.",
      },
      primitive: "money",
    },
    {
      id: "maintenance",
      src: "/world/evidence/malek/maintenance.png",
      alt: {
        ar: "شاشة طلبات الصيانة في MALEK",
        en: "The maintenance requests screen in MALEK",
      },
      capability: {
        ar: "طلبات الصيانة تُسجَّل وتُتابَع حتى الإغلاق.",
        en: "Maintenance requests logged and followed through to closure.",
      },
      primitive: "workflow",
    },
    {
      id: "mobile",
      src: "/world/evidence/malek/mobile.png",
      alt: {
        ar: "واجهة MALEK على الجوال",
        en: "The MALEK interface on a phone",
      },
      capability: {
        ar: "الوحدات والعقود تُدار من الجوال أثناء التنقل.",
        en: "Units and contracts operated from a phone on the move.",
      },
    },
  ],

  /**
   * Wellness (Lara Beauty) — real application surfaces captured from
   * the running centre system: sign-in, daily dashboard, appointment
   * scheduling, point of sale, records, services, reports, and mobile flows.
   */
  wellness: [
    {
      id: "wellness-entry",
      src: "/world/evidence/wellness/login.png",
      alt: {
        ar: "شاشة تسجيل الدخول إلى نظام مراكز التجميل والسبا",
        en: "Sign-in screen for the beauty and spa system",
      },
      capability: {
        ar: "نقطة دخول مخصصة لفريق العمل: إدارة متكاملة في جلسة واحدة.",
        en: "Dedicated entry point for staff: complete operations in one session.",
      },
    },
    {
      id: "wellness-dashboard",
      src: "/world/evidence/wellness/dashboard.png",
      alt: {
        ar: "لوحة تشغيل المركز: المواعيد وحالة اليوم في نظرة واحدة",
        en: "Operating dashboard: appointments and daily state at a glance",
      },
      capability: {
        ar: "نظرة تشغيل عامة تلخص المواعيد وجدول اليوم والأداء المالي.",
        en: "An operating overview summarizing appointments, schedule and financial state.",
      },
      primitive: "insight",
    },
    {
      id: "wellness-appointments",
      src: "/world/evidence/wellness/appointments.png",
      alt: {
        ar: "شاشة المواعيد والحجوزات وجداول المتخصصات",
        en: "The appointments and schedule screen",
      },
      capability: {
        ar: "إدارة المواعيد وتوزيع الجداول بدقة دون تضارب.",
        en: "Appointment scheduling and conflict-free staff assignment.",
      },
      primitive: "time",
    },
    {
      id: "wellness-pos",
      src: "/world/evidence/wellness/pos.png",
      alt: {
        ar: "شاشة نقطة البيع وإصدار الفواتير",
        en: "Point of sale and receipt generation",
      },
      capability: {
        ar: "نقطة بيع فورية مع طرق دفع متعددة وفواتير مرقّمة.",
        en: "Instant point of sale with multiple payment methods and receipts.",
      },
      primitive: "money",
    },
    {
      id: "wellness-records",
      src: "/world/evidence/wellness/records.png",
      alt: {
        ar: "شاشة سجلات المستفيدات وتاريخ الزيارات",
        en: "Visitor records and visit history screen",
      },
      capability: {
        ar: "سجلات الزيارات والملاحظات الخاصة بكل مستفيدة في مكان واحد.",
        en: "Visit records and individual preferences organized in one place.",
      },
      primitive: "relationships",
    },
    {
      id: "wellness-services",
      src: "/world/evidence/wellness/services.png",
      alt: {
        ar: "شاشة الخدمات والتسعير والتصنيفات",
        en: "Services, pricing and categories screen",
      },
      capability: {
        ar: "هيكلة الخدمات والمدد الزمنية والتسعير لكل قسم.",
        en: "Structuring services, durations and pricing across departments.",
      },
      primitive: "workflow",
    },
    {
      id: "wellness-reports",
      src: "/world/evidence/wellness/reports.png",
      alt: {
        ar: "شاشة التقارير والتحليلات التشغيلية",
        en: "Operational reports and performance analytics",
      },
      capability: {
        ar: "تقارير تشغيلية ومالية واضحة لحركة المركز والأقسام.",
        en: "Clear operational and financial reporting on centre performance.",
      },
      primitive: "insight",
    },
    {
      id: "wellness-mobile-dashboard",
      src: "/world/evidence/wellness/mobile-dashboard.png",
      alt: {
        ar: "لوحة التحكم من شاشة الجوال",
        en: "Mobile dashboard interface",
      },
      capability: {
        ar: "متابعة أداء المركز والمواعيد مباشرة من الجوال.",
        en: "Monitoring operations and appointments directly from mobile.",
      },
      primitive: "assets",
    },
    {
      id: "wellness-mobile-appointments",
      src: "/world/evidence/wellness/mobile-appointments.png",
      alt: {
        ar: "إدارة المواعيد من الجوال",
        en: "Mobile appointments management",
      },
      capability: {
        ar: "حجز وتعديل المواعيد ومتابعة الجدول أثناء الحركة.",
        en: "Booking and managing appointments on the move.",
      },
      primitive: "people",
    },
    {
      id: "wellness-mobile-pos",
      src: "/world/evidence/wellness/mobile-pos.png",
      alt: {
        ar: "واجهة نقطة البيع من الجوال",
        en: "Mobile point-of-sale interface",
      },
      capability: {
        ar: "تنفيذ عمليات البيع والتحصيل السريع من أي جهاز محمول.",
        en: "Handling fast sales and payments directly from mobile devices.",
      },
      primitive: "money",
    },
  ],
};

/** Real evidence for one system, or undefined when none exists yet. */
export function evidenceFor(systemId: string): EvidenceSurface[] | undefined {
  return SYSTEM_EVIDENCE[systemId as SystemId];
}

/** First surface of a system that demonstrates a given operating root. */
export function evidenceForPrimitive(
  systemId: string,
  primitiveId: OperatingPrimitiveId,
): EvidenceSurface | undefined {
  return evidenceFor(systemId)?.find((surface) => surface.primitive === primitiveId);
}
