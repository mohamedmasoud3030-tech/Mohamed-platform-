import type { AppLocale } from "@/providers/preferences";

/**
 * Task-based answers to the questions this product actually generates.
 *
 * Rules for this file:
 * - Every answer must describe verified behaviour of the real system.
 * - No answer may promise anything the product cannot do today.
 * - Keep it short: this is not a help centre, it is the eight questions people ask.
 */

export type HelpTopicId = "start" | "work" | "answers" | "form" | "privacy" | "channels";

export type HelpArticle = {
  id: string;
  topic: HelpTopicId;
  question: Record<AppLocale, string>;
  answer: Record<AppLocale, string>;
  /** Optional in-product destination that resolves the question directly. */
  link?: { to: string; label: Record<AppLocale, string> };
};

export const HELP_TOPICS: Array<{ id: HelpTopicId; label: Record<AppLocale, string> }> = [
  { id: "start", label: { ar: "كيف نبدأ", en: "Getting started" } },
  { id: "work", label: { ar: "طريقة العمل", en: "How we work" } },
  { id: "answers", label: { ar: "الرد والمتابعة", en: "Replies and follow-up" } },
  { id: "form", label: { ar: "مشاكل في النموذج", en: "Form problems" } },
  { id: "privacy", label: { ar: "بياناتك", en: "Your data" } },
  { id: "channels", label: { ar: "قنوات التواصل", en: "Contact channels" } },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "how-to-start",
    topic: "start",
    question: {
      ar: "كيف أبدأ مشروعًا مع LENA؟",
      en: "How do I start a project with LENA?",
    },
    answer: {
      ar: "افتح صفحة «ابدأ مشروعك» واكتب اسمك ووصفًا مختصرًا لاحتياجك. هذان الحقلان فقط مطلوبان؛ البريد والهاتف والمسار اختيارية لكن تركها يسرّع الرد. إن كنت تفضّل المحادثة المباشرة، زر واتساب يعمل من كل صفحة بلا تعبئة أي نموذج.",
      en: "Open the “Start a project” page and write your name and a short description of what you need. Only those two fields are required; email, phone and track are optional but leaving them speeds up the reply. If you prefer a direct conversation, the WhatsApp button works from every page with no form at all.",
    },
    link: { to: "/contact", label: { ar: "فتح صفحة ابدأ مشروعك", en: "Open the contact page" } },
  },
  {
    id: "what-to-include",
    topic: "start",
    question: {
      ar: "ما المعلومات المفيدة في أول رسالة؟",
      en: "What is useful to include in a first message?",
    },
    answer: {
      ar: "نوع العمل، ومن يستخدمه يوميًا، وكيف تُدار العملية الآن، وأين يحدث التكرار أو التأخير أو فقدان المتابعة. لا تحتاج إلى مواصفات تقنية جاهزة — وصف صادق لسير العمل الحالي يكفي لتحديد نقطة البداية.",
      en: "The type of business, who uses it daily, how the workflow runs today, and where repetition, delay, or lost follow-up happens. You do not need prepared technical specifications — an honest description of the current workflow is enough to identify the starting point.",
    },
  },
  {
    id: "tracks",
    topic: "work",
    question: {
      ar: "ما الفرق بين الأنظمة المعروضة في «الأنظمة»؟",
      en: "What is the difference between the systems under “Systems”?",
    },
    answer: {
      ar: "كل نظام مبني لقطاع وسير عمل مختلف: العقارات ليست الصالونات، والضيافة ليست إعادة التدوير. LENA تربط الجذور التشغيلية المشتركة، لكن كل منتج يحتفظ بمنطق قطاعه. إن لم تجد قطاعك، اشرح طريقة عملك الحالية في النموذج.",
      en: "Each system is built for a different industry and workflow: property is not beauty, and hospitality is not recycling. LENA connects shared operating roots while each product keeps its own domain logic. If your industry is not shown, describe how your work runs today.",
    },
    link: { to: "/services", label: { ar: "استعراض الأنظمة", en: "Browse the systems" } },
  },
  {
    id: "case-studies",
    topic: "work",
    question: {
      ar: "هل يمكنني رؤية أعمال سابقة قبل التواصل؟",
      en: "Can I see previous work before reaching out?",
    },
    answer: {
      ar: "يمكنك استعراض الأنظمة والمعلومات الموثقة المتاحة عنها قبل التواصل. لا ننسب عميلًا أو نتيجة أو دراسة حالة إلى منتج ما لم تكن موثقة فعلًا، وتُضاف الأدلة والصور لكل نظام عندما تصبح جاهزة للنشر.",
      en: "You can review the systems and the verified information currently available before reaching out. We do not attribute a client, result, or case study to a product unless it is genuinely documented; evidence and screens are added as each system becomes publishable.",
    },
    link: { to: "/portfolio", label: { ar: "فتح الأعمال", en: "Open the work" } },
  },
  {
    id: "pricing",
    topic: "work",
    question: {
      ar: "كيف تُحدَّد التكلفة؟",
      en: "How is cost determined?",
    },
    answer: {
      ar: "لا توجد قائمة أسعار معلنة على الموقع، لأن السعر يختلف حسب المنتج وحالة كل عميل. اسألنا عن المنتج الذي يهمك ونوضح لك السعر وطريقة الحصول عليه — بيعًا أو اشتراكًا — قبل أي التزام منك.",
      en: "There is no published price list, because the price depends on the product and on each client's situation. Ask about the product you care about and we will tell you the price and how it is obtained — purchase or subscription — before any commitment from you.",
    },
  },
  {
    id: "after-delivery",
    topic: "work",
    question: {
      ar: "ماذا يحدث بعد ما أبدأ استخدام النظام؟",
      en: "What happens after I start using the system?",
    },
    answer: {
      ar: "يعتمد على نوع المنتج. الأنظمة التي تعمل بالاشتراك تشمل التحديثات والدعم المستمر طوال فترة الاشتراك. أما الأنظمة التي تُباع بالكامل مع نقل الملكية فيُتفق على الدعم في اتفاقية منفصلة تخص المنتج نفسه. نوضح لك أي الحالتين تنطبق قبل أي التزام.",
      en: "It depends on the product. Systems on a subscription include updates and ongoing support for as long as the subscription runs. Systems sold outright with ownership transferred have support agreed in a separate agreement for that product. We tell you which case applies before any commitment.",
    },
  },
  {
    id: "response-time",
    topic: "answers",
    question: {
      ar: "متى أتوقع الرد؟",
      en: "When should I expect a reply?",
    },
    answer: {
      ar: "نرد خلال يوم عمل واحد على القناة التي تركتها. إن كان الأمر عاجلًا، واتساب أسرع قناة. الاستفسارات تُراجع يدويًا — لا يوجد رد آلي يقرر نيابة عنّا.",
      en: "We reply within one business day on the channel you left. If it is urgent, WhatsApp is the fastest channel. Inquiries are reviewed by a human — there is no automated system deciding on our behalf.",
    },
  },
  {
    id: "no-reply",
    topic: "answers",
    question: {
      ar: "أرسلت استفسارًا ولم يصلني رد — ماذا أفعل؟",
      en: "I sent an inquiry and got no reply — what should I do?",
    },
    answer: {
      ar: "تحقق أولًا من مجلد الرسائل غير المرغوب فيها إن تركت بريدًا. ثم راسلنا على واتساب وأرفق رقم المرجع الذي ظهر لك بعد الإرسال (مثل ‎#12‎) — هذا الرقم يجعلنا نجد استفسارك فورًا.",
      en: "First check your spam folder if you left an email. Then message us on WhatsApp with the reference number shown after you submitted (for example #12) — that number lets us find your inquiry immediately.",
    },
  },
  {
    id: "form-blocked",
    topic: "form",
    question: {
      ar: "ظهرت لي رسالة «استلمنا عدة رسائل من هذا الاتصال»",
      en: "I saw “we received several messages from this connection”",
    },
    answer: {
      ar: "هذه حماية من الإرسال الآلي: يُسمح بخمسة استفسارات في الساعة من نفس الاتصال بالإنترنت. انتظر قليلًا وأعد المحاولة، أو راسلنا على واتساب فورًا — واتساب غير مقيّد بهذا الحد.",
      en: "That is spam protection: five inquiries per hour are allowed from the same internet connection. Wait a while and try again, or message us on WhatsApp right away — WhatsApp is not affected by this limit.",
    },
  },
  {
    id: "form-lost",
    topic: "form",
    question: {
      ar: "أغلقت الصفحة بالخطأ — هل ضاع ما كتبته؟",
      en: "I closed the page by mistake — is what I typed lost?",
    },
    answer: {
      ar: "لا. ما تكتبه في النموذج يُحفظ على جهازك أنت فقط، وعند العودة إلى الصفحة نستعيده لك مع إشعار يمكنك مسحه. يُحذف هذا المحفوظ فور إرسال الاستفسار بنجاح.",
      en: "No. What you type in the form is saved on your own device only, and when you return to the page we restore it with a notice you can dismiss. It is deleted as soon as the inquiry is sent successfully.",
    },
  },
  {
    id: "form-offline",
    topic: "form",
    question: {
      ar: "الإرسال فشل بسبب ضعف الاتصال",
      en: "Sending failed because of a weak connection",
    },
    answer: {
      ar: "نصك يبقى محفوظًا على جهازك، ويتحول زر الإرسال إلى «إعادة المحاولة». أعد المحاولة بعد عودة الاتصال، أو استخدم رابط واتساب الظاهر داخل رسالة الخطأ نفسها.",
      en: "Your text stays saved on your device and the submit button becomes “Try again”. Retry once you reconnect, or use the WhatsApp link shown inside the error message itself.",
    },
  },
  {
    id: "data-collected",
    topic: "privacy",
    question: {
      ar: "ما البيانات التي تُجمع عند إرسال استفسار؟",
      en: "What data is collected when I send an inquiry?",
    },
    answer: {
      ar: "ما تكتبه أنت فقط: الاسم والرسالة، والبريد والهاتف والمسار إن اخترت تعبئتها، بالإضافة إلى الصفحة التي انطلقت منها. لا يستخدم الموقع أدوات تتبع إعلانية ولا يشارك بياناتك مع طرف ثالث للتسويق.",
      en: "Only what you write: your name and message, plus email, phone and track if you choose to fill them, along with the page you started from. The site uses no advertising trackers and does not share your data with third parties for marketing.",
    },
  },
  {
    id: "data-delete",
    topic: "privacy",
    question: {
      ar: "كيف أطلب حذف استفساري؟",
      en: "How do I ask for my inquiry to be deleted?",
    },
    answer: {
      ar: "راسلنا على واتساب أو البريد مع رقم المرجع واطلب الحذف، وسنحذف السجل. لا توجد آلية حذف ذاتية داخل الموقع لأن الاستفسارات لا ترتبط بحساب مستخدم.",
      en: "Message us on WhatsApp or by email with the reference number and ask for deletion, and we will remove the record. There is no self-service deletion inside the site because inquiries are not tied to a user account.",
    },
  },
  {
    id: "channels",
    topic: "channels",
    question: {
      ar: "ما أسرع طريقة للوصول إليكم؟",
      en: "What is the fastest way to reach you?",
    },
    answer: {
      ar: "واتساب. زر واتساب ثابت في كل صفحة ولا يتطلب تعبئة نموذج. البريد الإلكتروني مناسب للمرفقات والملفات، والنموذج مناسب لوصف منظم يصل إلينا مرتبًا.",
      en: "WhatsApp. The WhatsApp button is fixed on every page and requires no form. Email suits attachments and files, and the form suits a structured description that reaches us organised.",
    },
    link: { to: "/contact", label: { ar: "عرض كل القنوات", en: "See all channels" } },
  },
  {
    id: "language-link",
    topic: "channels",
    question: {
      ar: "لماذا يظهر /ar أو /en في الرابط؟ وكيف أشارك النسخة الإنجليزية؟",
      en: "Why does the link contain /ar or /en, and how do I share the English version?",
    },
    answer: {
      ar: "لكل لغة عنوان مستقل، حتى تستطيع مشاركة النسخة التي تريدها بالضبط. الرابط الذي ترسله يفتح باللغة نفسها عند من يستقبله، مهما كانت لغة جهازه. زر اللغة في أعلى الصفحة يبدّل النسخة ويبقيك في الصفحة نفسها.",
      en: "Each language has its own address, so you can share exactly the version you mean. A link you send opens in the same language for whoever receives it, whatever their device language. The language button at the top switches versions and keeps you on the same page.",
    },
  },
  {
    id: "privacy-page",
    topic: "privacy",
    question: {
      ar: "أين أقرأ تفاصيل ما تفعلونه ببياناتي؟",
      en: "Where can I read the detail of what you do with my data?",
    },
    answer: {
      ar: "في صفحة «بياناتك وخصوصيتك»: ما الذي يُجمع بالضبط، ولماذا، وأين يُحفظ، ومن يصل إليه، وكيف تطلب نسخة أو تصحيحًا أو حذفًا. مكتوبة كوصف دقيق لما يفعله النظام فعلًا.",
      en: "On the “Your data and privacy” page: exactly what is collected, why, where it is stored, who can reach it, and how to request a copy, a correction or deletion. It is written as a precise description of what the system actually does.",
    },
    link: { to: "/privacy", label: { ar: "فتح صفحة بياناتك", en: "Open the data page" } },
  },
  {
    id: "languages",
    topic: "channels",
    question: {
      ar: "هل تعملون بالعربية والإنجليزية؟",
      en: "Do you work in Arabic and English?",
    },
    answer: {
      ar: "نعم. الموقع نفسه ثنائي اللغة — زر اللغة في أعلى الصفحة يبدّل كامل المحتوى واتجاه الصفحة. راسلنا باللغة التي تريحك وسنرد بها.",
      en: "Yes. The site itself is bilingual — the language button at the top switches all content and the page direction. Write to us in whichever language suits you and we will reply in it.",
    },
  },
];

export function articlesForTopic(topic: HelpTopicId): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.topic === topic);
}

export function searchArticles(query: string, locale: AppLocale): HelpArticle[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((article) =>
    `${article.question[locale]} ${article.answer[locale]}`.toLowerCase().includes(needle),
  );
}

/** FAQPage structured data, so the answers can surface directly in search results. */
export function faqJsonLd(locale: AppLocale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: HELP_ARTICLES.map((article) => ({
      "@type": "Question",
      name: article.question[locale],
      acceptedAnswer: { "@type": "Answer", text: article.answer[locale] },
    })),
  };
}
