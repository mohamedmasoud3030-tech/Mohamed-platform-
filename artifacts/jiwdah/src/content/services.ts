import type { AppLocale } from "@/providers/preferences";

export type LenaServiceId =
  | "digital-marketing"
  | "visual-identity"
  | "content-design"
  | "web-platforms"
  | "ui-ux"
  | "brand-building"
  | "ai-automation"
  | "launch-projects";

/**
 * Owner decision (2026-08-20): the creative tracks are hidden from the public
 * surface, not removed, until each has real content behind it. Changing
 * "hidden" back to "public" restores a track with no other change.
 */
export type ServiceVisibility = "public" | "hidden";

export type LenaService = {
  visibility: ServiceVisibility;
  id: LenaServiceId;
  icon: string;
  tone: string;
  title: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
  why: Record<AppLocale, string>;
  deliverables: Record<AppLocale, string[]>;
  process: Record<AppLocale, string[]>;
  tags: string[];
};

export const LENA_SERVICES: LenaService[] = [
  { id: "digital-marketing", visibility: "hidden", icon: "Sparkles", tone: "pink", title: { ar: "التسويق الرقمي وصناعة النمو", en: "Digital Marketing & Growth" }, description: { ar: "استراتيجية وحملات ومحتوى تحوّل الاهتمام إلى خطوة فعلية.", en: "Strategy, campaigns, and content that turn attention into action." }, why: { ar: "الظهور وحده لا يكفي. كل نقطة تواصل يجب أن تقرّب العميل من قرار واضح.", en: "Visibility alone is not enough. Every touchpoint should move the audience toward a clear decision." }, deliverables: { ar: ["خريطة الجمهور والرسائل", "خطة محتوى وحملات", "مسار تحويل وCTA", "خطة تحسين تدريجية"], en: ["Audience and message map", "Campaign content plan", "Conversion path and CTAs", "Optimization roadmap"] }, process: { ar: ["فهم الجمهور", "تحديد الرسائل", "بناء الحملة", "القياس والتحسين"], en: ["Understand the audience", "Define messages", "Build the campaign", "Measure and improve"] }, tags: ["Strategy", "Campaigns", "Conversion"] },
  { id: "visual-identity", visibility: "hidden", icon: "Palette", tone: "violet", title: { ar: "الهوية البصرية والاتجاه الإبداعي", en: "Visual Identity & Creative Direction" }, description: { ar: "لغة بصرية تجعل العلامة معروفة من أول نظرة.", en: "A visual language that makes the brand recognizable at first glance." }, why: { ar: "الهوية ليست شعارًا منفردًا، بل نظام يضمن ظهور المشروع متماسكًا في كل مكان.", en: "Identity is not a standalone logo; it is a system keeping the brand coherent everywhere." }, deliverables: { ar: ["اتجاه بصري واضح", "Logo System مرن", "ألوان وخطوط", "تطبيقات الهوية"], en: ["Visual direction", "Flexible logo system", "Palette and typography", "Identity applications"] }, process: { ar: ["اكتشاف الشخصية", "بناء الاتجاه", "تصميم النظام", "تجهيز التطبيقات"], en: ["Discover character", "Shape direction", "Design the system", "Prepare applications"] }, tags: ["Branding", "Logo System", "Direction"] },
  { id: "content-design", visibility: "hidden", icon: "Brush", tone: "orange", title: { ar: "تصميم المحتوى والحملات البصرية", en: "Content Design & Visual Campaigns" }, description: { ar: "منشورات وCarousels وإعلانات تعمل كمنظومة واحدة.", en: "Posts, carousels, and ads designed as one coherent system." }, why: { ar: "المحتوى المتناسق يبني الثقة أسرع ويجعل الحملة أسهل في التذكر.", en: "Coherent content builds trust faster and makes campaigns easier to remember." }, deliverables: { ar: ["نظام تصميم للمحتوى", "قوالب منشورات وقصص", "حملات موسمية", "حزمة تسليم منظمة"], en: ["Content design system", "Post and story templates", "Seasonal campaigns", "Organized delivery kit"] }, process: { ar: ["تحديد الفكرة", "بناء النظام البصري", "توزيع السلسلة", "تجهيز التسليم"], en: ["Define the idea", "Build visual system", "Structure the series", "Package delivery"] }, tags: ["Content", "Carousels", "Ads"] },
  { id: "web-platforms", visibility: "hidden", icon: "PanelsTopLeft", tone: "blue", title: { ar: "تصميم وتطوير المواقع والمنصات", en: "Websites & Digital Platforms" }, description: { ar: "واجهات سريعة ومتجاوبة تحوّل الموقع إلى تجربة تخدم النشاط.", en: "Fast responsive interfaces turning websites into useful business experiences." }, why: { ar: "الموقع نقطة تشغيل وتحويل يجب أن تكون واضحة وسريعة على الهاتف.", en: "A website is an operational conversion point that must stay clear and fast on mobile." }, deliverables: { ar: ["خريطة الصفحات", "Wireframes", "واجهة UI متكاملة", "تطوير متجاوب"], en: ["Sitemap", "Wireframes", "Complete UI", "Responsive build"] }, process: { ar: ["رسم الرحلة", "تحديد الصفحات", "تصميم الواجهة", "البناء والاختبار"], en: ["Map journey", "Define pages", "Design interface", "Build and test"] }, tags: ["Web", "Responsive", "Conversion"] },
  { id: "ui-ux", visibility: "hidden", icon: "PenTool", tone: "cyan", title: { ar: "تجربة المستخدم والمنتجات الرقمية", en: "UI/UX & Digital Products" }, description: { ar: "تطبيقات ولوحات تحكم مبنية حول المستخدم والهدف التشغيلي.", en: "Apps and dashboards shaped around users and operational goals." }, why: { ar: "المنتج الجيد يقلل التفكير المطلوب ويجعل الخطوة التالية واضحة.", en: "A strong product reduces cognitive load and keeps the next action obvious." }, deliverables: { ar: ["تحليل التدفقات", "Information architecture", "Wireframes ونماذج", "نظام مكونات"], en: ["Flow analysis", "Information architecture", "Wireframes and prototypes", "Component system"] }, process: { ar: ["فهم المستخدم", "تحليل التدفق", "اختبار المسارات", "بناء النظام"], en: ["Understand users", "Analyze flows", "Test journeys", "Build system"] }, tags: ["UI/UX", "Dashboards", "Flows"] },
  { id: "brand-building", visibility: "hidden", icon: "Layers3", tone: "lime", title: { ar: "بناء العلامة ورسائلها", en: "Brand Building & Messaging" }, description: { ar: "تحديد كيف تظهر العلامة وماذا تقول ولماذا يختارها العميل.", en: "Define how the brand appears, speaks, and earns preference." }, why: { ar: "الرسالة الواضحة تجعل التصميم والمحتوى والإطلاق أكثر دقة.", en: "A clear message makes design, content, and launch work more precise." }, deliverables: { ar: ["تعريف الجمهور", "وعد العلامة", "النبرة والرسائل", "دليل ظهور مختصر"], en: ["Audience definition", "Brand promise", "Voice and messaging", "Presence playbook"] }, process: { ar: ["تحديد القيمة", "صياغة الوعد", "بناء الرسائل", "توحيد الظهور"], en: ["Clarify value", "Shape promise", "Build messages", "Align presence"] }, tags: ["Messaging", "Positioning", "Voice"] },
  { id: "ai-automation", visibility: "hidden", icon: "Bot", tone: "violet", title: { ar: "الأتمتة والحلول المدعومة بالذكاء الاصطناعي", en: "AI Automation & Smart Solutions" }, description: { ar: "أدوات وتدفقات عمل تقلل التكرار وتنظم العمليات.", en: "Tools and workflows reducing repetition and organizing operations." }, why: { ar: "الأتمتة الجيدة تقلل الخطوات اليدوية وتوضّح المتابعة.", en: "Good automation removes manual steps and clarifies follow-up." }, deliverables: { ar: ["تحليل العملية", "تصميم التدفق", "نموذج للحل", "تكاملات مناسبة"], en: ["Process analysis", "Workflow design", "Solution prototype", "Relevant integrations"] }, process: { ar: ["كشف التكرار", "تحديد الأولوية", "بناء التدفق", "مراجعة الأثر"], en: ["Find repetition", "Set priority", "Build workflow", "Review impact"] }, tags: ["Automation", "AI", "Systems"] },
  { id: "launch-projects", visibility: "hidden", icon: "Rocket", tone: "pink", title: { ar: "إطلاق المشاريع من الفكرة إلى الظهور", en: "Project Launches from Idea to Presence" }, description: { ar: "مسار يجمع الاسم والهوية والموقع والمحتوى وخطة الإطلاق.", en: "A track connecting naming, identity, website, content, and launch planning." }, why: { ar: "البداية المتماسكة تقلل إعادة العمل وتمنح المشروع ظهورًا واضحًا.", en: "A coherent start reduces rework and gives the project a clear presence." }, deliverables: { ar: ["اسم ورسالة واتجاه", "هوية أولية أو متكاملة", "صفحة أو موقع إطلاق", "خطة أول 30 يومًا"], en: ["Name, message, direction", "Starter or complete identity", "Launch page or website", "First 30-day plan"] }, process: { ar: ["تحديد الأولويات", "بناء الأساس", "تجهيز الظهور", "إطلاق منظم"], en: ["Set priorities", "Build foundation", "Prepare presence", "Launch clearly"] }, tags: ["Launch", "Brand", "Roadmap"] },
];

/** Only tracks with real content behind them. */
export function publicServices() {
  return LENA_SERVICES.filter((service) => service.visibility === "public");
}

export function findService(id?: string) {
  return LENA_SERVICES.find((service) => service.id === id);
}
