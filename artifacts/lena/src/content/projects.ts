import type { AppLocale } from "@/providers/preferences";
import type { LenaServiceId } from "@/content/services";

/**
 * How an item came to exist. Publishing work without saying what it is, is the
 * fastest way to lose a serious prospect: one question with no answer behind it
 * ends the conversation. Labelling costs nothing and is honest.
 */
export type ProjectProvenance = "concept" | "product" | "client";

export const PROVENANCE_LABEL: Record<ProjectProvenance, Record<AppLocale, string>> = {
  concept: { ar: "عمل مفاهيمي", en: "Concept work" },
  product: { ar: "منتج من بنائي", en: "Built and owned by us" },
  client: { ar: "مشروع لعميل", en: "Client project" },
};

export const PROVENANCE_NOTE: Record<ProjectProvenance, Record<AppLocale, string>> = {
  concept: {
    ar: "مشروع مفاهيمي يوضح طريقة العمل والتفكير، وليس تنفيذًا لعميل.",
    en: "A concept project showing method and thinking — not a client engagement.",
  },
  product: {
    ar: "نظام بنيناه ونشغّله بأنفسنا.",
    en: "A system we built and operate ourselves.",
  },
  client: {
    ar: "نُفِّذ لعميل، ويُنشر باسمه بإذن كتابي فقط.",
    en: "Delivered for a client; the name is published only with written permission.",
  },
};

export type StudioProject = {
  visibility: "public" | "hidden";
  id: string;
  provenance: ProjectProvenance;
  tone: string;
  services: LenaServiceId[];
  title: Record<AppLocale, string>;
  category: Record<AppLocale, string>;
  summary: Record<AppLocale, string>;
  direction: Record<AppLocale, string>;
  deliverables: Record<AppLocale, string[]>;
  tags: string[];
};

export const STUDIO_PROJECTS: StudioProject[] = [
  { id: "riwaq", visibility: "hidden", provenance: "concept", tone: "orange", services: ["visual-identity", "content-design", "brand-building", "launch-projects"], title: { ar: "رِواق — إطلاق علامة مقهى معاصر", en: "Riwaq — Contemporary Café Brand Launch" }, category: { ar: "هوية + محتوى + إطلاق", en: "Branding + Content + Launch" }, summary: { ar: "نظام علامة يجمع الدفء المحلي مع حضور بصري حديث عبر التغليف والقائمة والمحتوى.", en: "A brand system blending local warmth with a modern visual presence across packaging, menu, and content." }, direction: { ar: "لغة بصرية هادئة وألوان دافئة وتكوينات مرنة تعمل في المكان والمنصات الرقمية.", en: "A calm visual language, warm palette, and flexible compositions across venue and digital channels." }, deliverables: { ar: ["Logo System", "تغليف وقائمة", "حزمة محتوى", "واجهة إطلاق"], en: ["Logo system", "Packaging and menu", "Content kit", "Launch surface"] }, tags: ["Logo System", "Packaging", "Social Kit"] },
  { id: "nizwa-homes", visibility: "hidden", provenance: "concept", tone: "blue", services: ["web-platforms", "ui-ux", "digital-marketing"], title: { ar: "Nizwa Homes — منصة عقارية واضحة", en: "Nizwa Homes — Clear Real Estate Platform" }, category: { ar: "Web + UI/UX + Marketing", en: "Web + UI/UX + Marketing" }, summary: { ar: "تجربة عقارية Mobile-first تنظّم البحث والتصفية وتحوّل الاهتمام إلى استفسار واتساب سريع.", en: "A mobile-first property experience organizing discovery, filters, and fast WhatsApp inquiries." }, direction: { ar: "بطاقات واسعة وفلاتر مركزة وتفاصيل سهلة القراءة ومسار تواصل مباشر.", en: "Wide cards, focused filters, scannable details, and a direct inquiry path." }, deliverables: { ar: ["Homepage", "Listing وFilters", "تفاصيل العقار", "Mobile Views"], en: ["Homepage", "Listings and filters", "Property detail", "Mobile views"] }, tags: ["Responsive", "Filters", "WhatsApp Flow"] },
  { id: "cool-season", visibility: "hidden", provenance: "concept", tone: "cyan", services: ["digital-marketing", "content-design"], title: { ar: "Cool Season — حملة خدمات محلية", en: "Cool Season — Local Services Campaign" }, category: { ar: "Marketing + Content", en: "Marketing + Content" }, summary: { ar: "حملة موسمية تعتمد على التوعية والتحولات البصرية والتواصل المباشر قبل ذروة الطلب.", en: "A seasonal campaign built around education, visual transformations, and direct contact before peak demand." }, direction: { ar: "قبل وبعد واضح وCarousels تعليمية وCTA واتساب حاضر بهدوء.", en: "Clear before-and-after visuals, educational carousels, and a calm WhatsApp CTA." }, deliverables: { ar: ["هوية الحملة", "عرض موسمي", "شبكة محتوى", "إعلانات تحويل"], en: ["Campaign identity", "Seasonal offer", "Content grid", "Conversion ads"] }, tags: ["Campaign", "Carousels", "Ads"] },
  { id: "atelier", visibility: "hidden", provenance: "concept", tone: "pink", services: ["web-platforms", "ui-ux", "brand-building"], title: { ar: "Atelier — تجربة تجارة أزياء فاخرة", en: "Atelier — Premium Fashion Commerce" }, category: { ar: "E-commerce + UI/UX", en: "E-commerce + UI/UX" }, summary: { ar: "متجر رقمي هادئ يمنح الصور مساحة كافية ويبسط الاستكشاف والشراء من الهاتف.", en: "A calm digital store with room for imagery and a simplified mobile purchase journey." }, direction: { ar: "مساحات واسعة وفلاتر مختصرة وتفاصيل منظمة وسلة خفيفة.", en: "Generous spacing, concise filters, structured details, and a lightweight cart." }, deliverables: { ar: ["Storefront", "Product Detail", "Cart وCheckout", "Mobile UX"], en: ["Storefront", "Product detail", "Cart and checkout", "Mobile UX"] }, tags: ["Commerce", "Luxury", "Checkout"] },
  { id: "sahl", visibility: "hidden", provenance: "concept", tone: "violet", services: ["launch-projects", "brand-building", "web-platforms", "content-design"], title: { ar: "سَهل — حزمة إطلاق لخدمة رقمية", en: "Sahl — Digital Service Launch Pack" }, category: { ar: "Brand + Launch", en: "Brand + Launch" }, summary: { ar: "اسم ووعد وهوية وصفحة هبوط ومحتوى تمهيدي لخدمة رقمية تحتاج بداية واضحة.", en: "A name, promise, identity, landing page, and starter content for a digital service." }, direction: { ar: "لغة مباشرة ورمز بسيط وصفحة هبوط مركزة وحزمة ظهور قابلة للتوسع.", en: "Direct language, a simple symbol, a focused landing page, and an expandable presence kit." }, deliverables: { ar: ["Naming", "Logo System", "Landing Page", "خطة 30 يومًا"], en: ["Naming", "Logo system", "Landing page", "30-day plan"] }, tags: ["Naming", "Landing Page", "Launch"] },
  { id: "lena-flow", visibility: "hidden", provenance: "concept", tone: "lime", services: ["ai-automation", "ui-ux", "web-platforms"], title: { ar: "LENA Flow — تنظيم استقبال العملاء", en: "LENA Flow — Lead Intake Automation" }, category: { ar: "Automation + AI + Dashboard", en: "Automation + AI + Dashboard" }, summary: { ar: "تدفق موحد يصنف الاستفسارات وينظم الحالة والأولوية والمتابعة داخل لوحة واحدة.", en: "A unified intake workflow organizing inquiry classification, status, priority, and follow-up." }, direction: { ar: "نموذج موحد وتصنيف خفيف وحالات واضحة وتنبيهات مرتبطة بالإجراء التالي.", en: "Unified intake, lightweight classification, clear states, and action-oriented alerts." }, deliverables: { ar: ["Intake Form", "Status Flow", "Dashboard", "Reporting Snapshot"], en: ["Intake form", "Status flow", "Dashboard", "Reporting snapshot"] }, tags: ["Automation", "CRM", "Dashboard"] },
  { id: "mizan", visibility: "hidden", provenance: "concept", tone: "blue", services: ["ui-ux", "ai-automation", "web-platforms"], title: { ar: "ميزان — لوحة تشغيل وقرارات", en: "Mizan — Operations Dashboard" }, category: { ar: "UI/UX + Systems", en: "UI/UX + Systems" }, summary: { ar: "واجهة تشغيل تجمع المؤشرات والتنبيهات والتقارير في تجربة هادئة تساعد الفريق على اتخاذ الإجراء.", en: "An operations surface bringing metrics, alerts, and reports into a calm actionable experience." }, direction: { ar: "Bento dashboard وتنبيهات قابلة للتصرف وتفاصيل تظهر تدريجيًا.", en: "A bento dashboard with actionable alerts and progressive detail disclosure." }, deliverables: { ar: ["Dashboard Hero", "KPI Cards", "Alerts", "Mobile View"], en: ["Dashboard hero", "KPI cards", "Alerts", "Mobile view"] }, tags: ["Dashboard", "Bento", "Operations"] },
  { id: "oman-routes", visibility: "hidden", provenance: "concept", tone: "orange", services: ["digital-marketing", "content-design", "visual-identity", "web-platforms"], title: { ar: "مسارات عُمان — حملة سياحية قصصية", en: "Oman Routes — Tourism Story Campaign" }, category: { ar: "Marketing + Content + Identity", en: "Marketing + Content + Identity" }, summary: { ar: "حملة تستخدم القصص والخرائط والتدرج البصري لتحويل الصور إلى فضول ثم تخطيط ثم تواصل.", en: "A campaign using stories, maps, and visual pacing to turn imagery into curiosity, planning, and contact." }, direction: { ar: "فصول بصرية واضحة وخرائط خفيفة وCarousels قصصية وصفحة هبوط مريحة.", en: "Clear visual chapters, lightweight maps, story carousels, and a comfortable landing page." }, deliverables: { ar: ["Campaign Idea", "Visual System", "Carousels", "Discovery Flow"], en: ["Campaign idea", "Visual system", "Carousels", "Discovery flow"] }, tags: ["Storytelling", "Maps", "Campaign"] },
];

export function findStudioProject(id?: string) {
  return STUDIO_PROJECTS.find((project) => project.id === id);
}

/** Concept work stays in the repository but off the public surface until real case studies replace it. */
export function publicProjects() {
  return STUDIO_PROJECTS.filter((project) => project.visibility === "public");
}
