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
  | "recycling"
  | "materials";

/**
 * Stage reflects verified evidence, not inference. A product is marked in-use
 * only when current real-business use is established; otherwise it stays trial.
 */
export type SystemStage = "in-use" | "trial";

/**
 * Explicit operating roots that recur across the product family.
 *
 * This is a founder-controlled classification, not a claim that the products
 * already share code, databases or infrastructure. LENA World uses it to reveal
 * proven repetition; a root only becomes a shared LENA OS candidate when two or
 * more public systems point to it.
 */
export type OperatingPrimitiveId =
  | "relationships"
  | "time"
  | "money"
  | "assets"
  | "workflow"
  | "documents"
  | "people"
  | "insight"
  | "integrity";

export type BusinessSystem = {
  id: SystemId;
  visibility: Visibility;
  /** Display order on every public surface. Owner-decided. */
  order: number;
  /** Product name where one exists; otherwise the industry stands in. */
  name: Record<AppLocale, string>;
  /** Optional one-line product description, used for named products such as MALEK. */
  tagline?: Record<AppLocale, string>;
  stage: SystemStage;
  /** Who benefits, by role — the buyer and the person using it daily. */
  beneficiaries: Record<AppLocale, string[]>;
  /** How it is used in practice, day to day. */
  usage: Record<AppLocale, string>;
  /** The industry, as its owner would name it. */
  industry: Record<AppLocale, string>;
  /** The daily operational problem, in the buyer's language. */
  problem: Record<AppLocale, string>;
  /** What the system does. Verbs, not features. */
  does: Record<AppLocale, string[]>;
  /** The real domain entities the system holds and coordinates. */
  entities: Record<AppLocale, string[]>;
  /** Explicit links to cross-system operating roots; never inferred from copy. */
  operatingPrimitives: OperatingPrimitiveId[];
  /** Whether a documented case study with screens exists yet. */
  documented: boolean;
};

/** Stage is internal canonical truth (verified evidence), never rendered as
 *  public lifecycle status. The public experience describes capability only. */
export const BUSINESS_SYSTEMS: BusinessSystem[] = [
  {
    id: "property",
    visibility: "public",
    order: 3,
    name: { ar: "MALEK", en: "MALEK" },
    tagline: {
      ar: "منصة عربية لتشغيل العقارات ومحاسبة الإيجار.",
      en: "Arabic-first property operations and rent accounting platform.",
    },
    stage: "in-use",
    beneficiaries: {
      ar: ["مالك العقار أو المحفظة العقارية", "مدير المكتب الذي يشغّل الأصول للغير", "المستأجر عند طلب صيانة"],
      en: ["The property or portfolio owner", "The office manager operating assets for others", "The tenant raising a maintenance request"],
    },
    usage: {
      ar: "الوحدات والعقود في مكان واحد: تواريخ التجديد والتحصيل تُتابَع من النظام لا من الذاكرة، وطلبات الصيانة تُسجَّل وتُتابَع حتى الإغلاق، وتقرير المالك يخرج جاهزًا بدل تجميعه يدويًا آخر الشهر.",
      en: "Units and contracts in one place: renewal and collection dates are tracked by the system rather than from memory, maintenance requests are logged and followed to closure, and the owner report comes out ready instead of being assembled by hand at month end.",
    },
    industry: { ar: "إدارة العقارات", en: "Property management" },
    problem: {
      ar: "عقود متفرقة، وتحصيل يُتابَع بالذاكرة، وصيانة تُطلب على واتساب، وتقرير آخر الشهر يُجمَّع يدويًا.",
      en: "Scattered contracts, collection tracked from memory, maintenance requested over WhatsApp, and a month-end report assembled by hand.",
    },
    does: {
      ar: ["تشغيل الوحدات والعقود", "التأجير والتجديد", "التحصيل والمتأخرات", "طلبات الصيانة", "تقارير الملّاك"],
      en: ["Unit and contract operations", "Leasing and renewals", "Collection and arrears", "Maintenance requests", "Owner reporting"],
    },
    entities: {
      ar: ["العقارات والوحدات", "الملاك والمستأجرون", "العقود والتجديدات", "طلبات الصيانة", "التحصيل والمتأخرات", "المدفوعات والتسويات"],
      en: ["Properties and units", "Owners and tenants", "Contracts and renewals", "Maintenance requests", "Collections and arrears", "Payments and settlements"],
    },
    operatingPrimitives: ["relationships", "time", "money", "assets", "workflow", "documents", "insight"],
    documented: false,
  },
  {
    id: "wellness",
    visibility: "public",
    order: 1,
    name: { ar: "LenaBeauty", en: "LenaBeauty" },
    stage: "trial",
    beneficiaries: {
      ar: ["صاحبة المركز أو مديرته", "موظفة الاستقبال", "المعالِجات ومقدّمات الخدمة"],
      en: ["The centre owner or manager", "The receptionist", "Therapists and service providers"],
    },
    usage: {
      ar: "نظام التشغيل اليومي لمركز واحد: المواعيد ونقطة البيع والعملاء والمخزون والموظفون في مكان واحد. مخصص لفريق المركز — ليس موقع حجز للعميلات. الحسابات يُنشئها مسؤول المركز، ولا يوجد تسجيل ذاتي، وبيانات كل مركز تبقى في قاعدة بياناته ولا يراها إلا فريقه.",
      en: "The daily operating system for a single centre: appointments, point of sale, clients, inventory and staff in one place. Built for the centre's team — it is not a customer booking site. Accounts are created by the centre's administrator, there is no self-registration, and each centre's data stays in its own database, visible only to its team.",
    },
    industry: { ar: "المراكز الصحية والسبا", en: "Health centres and spa" },
    problem: {
      ar: "حجوزات على دفتر، وجدول موظفين يتغير كل يوم، ولا صورة واضحة لما دخل فعلًا نهاية اليوم.",
      en: "Bookings in a notebook, a staff schedule that changes daily, and no clear picture of what actually came in by close.",
    },
    does: {
      ar: ["المواعيد والحجوزات", "نقطة البيع", "ملفات العملاء", "المخزون", "الموظفون وجدولتهم", "ملخص يومي للمالك"],
      en: ["Appointments and bookings", "Point of sale", "Client records", "Inventory", "Staff and scheduling", "Daily summary for the owner"],
    },
    entities: {
      ar: ["المواعيد والحجوزات", "العملاء وملفاتهم", "الخدمات", "الموظفون والجدولة", "المخزون", "نقطة البيع"],
      en: ["Appointments and bookings", "Clients and their records", "Services", "Staff and scheduling", "Inventory", "Point of sale"],
    },
    operatingPrimitives: ["relationships", "time", "money", "assets", "workflow", "people", "insight"],
    documented: false,
  },
  {
    id: "rental",
    visibility: "public",
    order: 2,
    name: { ar: "LENA Dress", en: "LENA Dress" },
    stage: "trial",
    beneficiaries: {
      ar: ["صاحب المعرض", "موظف المعرض الذي يسلّم ويستلم", "العميلة التي تحجز موعدًا"],
      en: ["The showroom owner", "The staff member handing pieces out and taking them back", "The customer reserving a date"],
    },
    usage: {
      ar: "كل قطعة لها سجل: متاحة، محجوزة لتاريخ، خارج المعرض، أو في التنظيف. الحجز يرتبط بتاريخ المناسبة لا بيوم الطلب، فلا تُحجز القطعة مرتين، ويظهر ما هو متاح فعلًا هذا الأسبوع.",
      en: "Every piece has a record: available, reserved for a date, out, or being cleaned. A reservation is tied to the occasion date rather than the order date, so nothing is double-booked and what is genuinely free this week is visible.",
    },
    industry: { ar: "معارض وتأجير الفساتين", en: "Showrooms and dress rental" },
    problem: {
      ar: "قطعة واحدة تُحجز لأكثر من موعد، وتواريخ الإرجاع تضيع، ولا أحد يعرف ما المتاح فعلًا هذا الأسبوع.",
      en: "One piece double-booked, return dates lost, and nobody sure what is actually available this week.",
    },
    does: {
      ar: ["مخزون القطع وحالتها", "الحجز بالتواريخ", "الخروج والإرجاع", "التأمين والمدفوعات", "توفر فوري"],
      en: ["Piece inventory and condition", "Date-based reservations", "Check-out and return", "Deposits and payments", "Live availability"],
    },
    entities: {
      ar: ["القطع وحالتها", "الحجوزات بالتواريخ", "الخروج والإرجاع", "التأمين والمدفوعات"],
      en: ["Pieces and their condition", "Date-based reservations", "Check-out and return", "Deposits and payments"],
    },
    operatingPrimitives: ["relationships", "time", "money", "assets", "workflow"],
    documented: false,
  },
  {
    id: "investment",
    visibility: "public",
    order: 5,
    name: { ar: "تيرانكس", en: "Terranex" },
    stage: "trial",
    beneficiaries: {
      ar: ["إدارة الشركة الاستثمارية", "مسؤول كل قسم: حيواني، زراعي، عقاري", "المحاسب"],
      en: ["Company management", "The head of each division: livestock, agricultural, real estate", "The accountant"],
    },
    usage: {
      ar: "كل قسم يعمل داخل النظام نفسه بأصوله وعملياته ومصروفاته، فتظهر صورة موحّدة للشركة بدل ملفات منفصلة لكل قسم.",
      en: "Each division works inside the same system with its own assets, operations and costs, producing one view of the company instead of separate files per division.",
    },
    industry: { ar: "الاستثمار الحيواني والتنمية الزراعية", en: "Livestock investment and agricultural development" },
    problem: {
      ar: "أقسام مختلفة — حيواني وزراعي وعقاري — كل قسم بملفاته، ولا لوحة واحدة تجمع الصورة.",
      en: "Different divisions — livestock, agricultural, real estate — each with its own files, and no single view of the whole.",
    },
    does: {
      ar: ["أقسام متعددة في نظام واحد", "الأصول والعمليات", "المصروفات والإيرادات", "تقارير لكل قسم"],
      en: ["Multiple divisions in one system", "Assets and operations", "Costs and revenue", "Reporting per division"],
    },
    entities: {
      ar: ["الأقسام (حيواني، زراعي، عقاري)", "الأصول", "العمليات", "المصروفات والإيرادات", "التقارير"],
      en: ["Divisions (livestock, agriculture, real estate)", "Assets", "Operations", "Costs and revenue", "Reports"],
    },
    operatingPrimitives: ["money", "assets", "workflow", "insight"],
    documented: false,
  },
  {
    id: "hospitality",
    visibility: "public",
    order: 4,
    name: { ar: "نظام الضيافة", en: "Hospitality system" },
    stage: "trial",
    beneficiaries: {
      ar: ["مكتب خدمات الضيافة", "منسّق المناسبة", "طاقم التنفيذ في الموقع"],
      en: ["The hospitality services office", "The event coordinator", "The on-site crew"],
    },
    usage: {
      ar: "يبدأ المكتب بإنشاء منشأته داخل النظام، ثم تُدار المناسبات منها: كل مناسبة طلب واحد يجمع الموعد والطاقم والتجهيزات، فيُعرف قبل التنفيذ ما هو محجوز ومع من، وتُحسب تكلفة كل مناسبة بدل تقديرها بعد انتهائها.",
      en: "The office first creates its facility inside the system, then runs occasions from it: each occasion is one order holding its date, crew and equipment, so what is committed and to whom is known before execution, and the cost per occasion is calculated rather than estimated afterwards.",
    },
    industry: { ar: "خدمات الضيافة والفعاليات", en: "Hospitality and events" },
    problem: {
      ar: "كل مناسبة طلب مختلف وطاقم مختلف وتجهيزات مختلفة، والتنسيق كله في رسائل متفرقة.",
      en: "Every occasion is a different order, a different crew and different equipment, coordinated entirely in scattered messages.",
    },
    does: {
      ar: ["طلبات المناسبات", "الطاقم والتجهيزات", "الجدولة", "التكلفة لكل مناسبة"],
      en: ["Event orders", "Crew and equipment", "Scheduling", "Cost per occasion"],
    },
    entities: {
      ar: ["المناسبات والأحداث", "الطلبات وعروض الأسعار", "الطاقم", "التجهيزات", "التكلفة والربح"],
      en: ["Occasions and events", "Requests and quotes", "Crew", "Equipment", "Cost and profit"],
    },
    operatingPrimitives: ["relationships", "time", "money", "assets", "workflow", "people"],
    documented: false,
  },
  {
    id: "recycling",
    visibility: "public",
    order: 6,
    name: { ar: "كيّال", en: "Kayyal" },
    stage: "trial",
    beneficiaries: {
      ar: ["صاحب المخزن", "العامل الواقف عند الميزان", "الأطراف الذين لهم أرصدة مفتوحة"],
      en: ["The warehouse owner", "The worker standing at the weighbridge", "Counterparties carrying open balances"],
    },
    usage: {
      ar: "يُستخدم من الموبايل بجوار الميزان مباشرة: كل شراء وبيع وحركة نقدية تُسجَّل في أقل من ٣٠ ثانية، وتُطبع إيصالات مرقّمة أو تُرسل على واتساب. يعمل بدون إنترنت، والتصحيح يتم بعملية عكسية لا بالحذف، وفي آخر اليوم تُقفَل الخزنة بالعدّ.",
      en: "Used from a phone right beside the weighbridge: every purchase, sale and cash movement is recorded in under 30 seconds, with numbered receipts printed or sent over WhatsApp. It works offline, corrections are made by reversal rather than deletion, and the cash box is closed by counting at the end of the day.",
    },
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
    entities: {
      ar: ["الأصناف بالأنواع والدرجات", "الموردون والأطراف", "الشراء والبيع", "الخزنة", "الإيصالات المرقّمة"],
      en: ["Items by type and grade", "Suppliers and counterparties", "Purchases and sales", "Cash box", "Numbered receipts"],
    },
    operatingPrimitives: ["relationships", "money", "assets", "workflow", "documents", "insight", "integrity"],
    documented: false,
  },

  {
    id: "materials",
    // Real product (Lenastore, construction materials), represented canonically
    // but held off the public World for now — the World deepens existing worlds
    // before expanding the count.
    visibility: "hidden",
    order: 7,
    name: { ar: "Lenastore", en: "Lenastore" },
    tagline: {
      ar: "إدارة مواد المشاريع الإنشائية: طلبات الشراء والمخزون والموردون في نظام واحد.",
      en: "Construction project materials: purchase requests, inventory and suppliers in one system.",
    },
    stage: "trial",
    beneficiaries: {
      ar: ["مدير المشروع", "مهندس الموقع أو المشرف", "مسؤول المشتريات", "المحاسب"],
      en: ["The project manager", "The site engineer or supervisor", "The purchasing officer", "The accountant"],
    },
    usage: {
      ar: "المشروع الإنشائي يتعامل مع مواد كثيرة: ما طُلب، وما وصل فعلًا كاملًا أو جزئيًا، وما دُفع للموردين. النظام يجمع طلبات الشراء والمشتريات والاستلام والمدفوعات والمرفقات في سجل واحد يعمل من الجوال، مع تقارير تكشف حالة المخزون وحركة المدفوعات.",
      en: "A construction project deals with many materials: what was requested, what actually arrived in full or in part, and what has been paid to suppliers. The system brings purchase requests, purchases, receiving, payments and attachments into one mobile-working record, with reports that reveal inventory state and payment movement.",
    },
    industry: { ar: "إدارة مواد المشاريع الإنشائية", en: "Construction project materials" },
    problem: {
      ar: "طلبات شراء متفرقة، ولا صورة واضحة لما طُلب مقابل ما استُلم فعلًا، وأرصدة الموردين تتجمع بلا سجل موثوق.",
      en: "Scattered purchase requests, no clear picture of what was ordered versus what actually arrived, and supplier balances accumulating without a reliable record.",
    },
    does: {
      ar: ["المواد والمخزون", "طلبات الشراء", "المشتريات والاستلام الكامل أو الجزئي", "الموردون والمدفوعات", "المرفقات", "تقارير الحالة"],
      en: ["Materials and inventory", "Purchase requests", "Purchases with full or partial receiving", "Suppliers and payments", "Attachments", "Status reports"],
    },
    entities: {
      ar: ["المواد", "المخزون", "طلبات الشراء", "المشتريات والاستلام", "الموردون", "المدفوعات", "المرفقات"],
      en: ["Materials", "Inventory", "Purchase requests", "Purchases and receiving", "Suppliers", "Payments", "Attachments"],
    },
    operatingPrimitives: ["assets", "money", "relationships", "workflow", "documents", "insight"],
    documented: false,
  },
];

export function publicSystems(): BusinessSystem[] {
  return BUSINESS_SYSTEMS.filter((system) => system.visibility === "public").sort(
    (a, b) => a.order - b.order,
  );
}

export function findSystem(id?: string): BusinessSystem | undefined {
  return BUSINESS_SYSTEMS.find((system) => system.id === id && system.visibility === "public");
}
