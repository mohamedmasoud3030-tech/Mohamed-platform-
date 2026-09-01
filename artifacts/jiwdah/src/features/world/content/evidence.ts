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
