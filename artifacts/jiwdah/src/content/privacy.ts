import type { AppLocale } from "@/providers/preferences";

/**
 * Factual data-practices content.
 *
 * Every statement here describes behaviour that exists in this codebase today.
 * This is engineering transparency, not a legal notice — that distinction is
 * stated on the page itself and in PRIVACY_DATA_GOVERNANCE.md.
 */

export type PrivacySection = {
  id: string;
  title: Record<AppLocale, string>;
  body: Record<AppLocale, string[]>;
};

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "what-we-collect",
    title: { ar: "ما الذي نجمعه", en: "What we collect" },
    body: {
      ar: [
        "عند إرسال استفسار: اسمك ورسالتك، وبريدك وهاتفك والمسار إن اخترت تعبئتها، والصفحة التي انطلقت منها.",
        "لا نجمع أي شيء آخر عن الزائرين. لا حسابات، ولا ملفات تعريف، ولا سجل تصفح.",
        "عند تسجيل دخول فريق LENA: معرّف الحساب لدى مزوّد الدخول، والاسم المعروض، ووقت آخر دخول — لا أكثر.",
      ],
      en: [
        "When you send an inquiry: your name and message, plus email, phone and track if you choose to fill them, and the page you started from.",
        "Nothing else is collected about visitors. No accounts, no profiles, no browsing history.",
        "When the LENA team signs in: the account identifier at the sign-in provider, the display name, and the last sign-in time — nothing more.",
      ],
    },
  },
  {
    id: "why",
    title: { ar: "لماذا نجمعها", en: "Why we collect it" },
    body: {
      ar: [
        "غرض واحد فقط: الرد على استفسارك ومتابعته حتى ننتهي منه.",
        "صفحة الانطلاق تُحفظ لنعرف أي صفحة تفيد الزوار — وهي لا تحتوي أي معلومة عنك.",
        "لا نستخدم بياناتك لإعلانات، ولا نبيعها، ولا نشاركها مع أي جهة لأغراض تسويقية.",
      ],
      en: [
        "One purpose only: replying to your inquiry and following it through to a conclusion.",
        "The page you started from is stored so we know which pages help visitors — it contains nothing about you.",
        "Your data is not used for advertising, is not sold, and is not shared with anyone for marketing.",
      ],
    },
  },
  {
    id: "no-tracking",
    title: { ar: "لا تتبّع ولا كوكيز إعلانية", en: "No tracking, no advertising cookies" },
    body: {
      ar: [
        "هذا الموقع لا يحمّل أي أداة تحليلات أو تتبّع أو إعلانات، ولا أي محتوى من طرف ثالث.",
        "نحسب عدّادات مجمّعة على خادمنا نحن فقط: كم مرة فُتحت صفحة، وبأي لغة، وكم استفسارًا أُرسل في اليوم. لا تحتوي هذه العدّادات على أي معرّف ولا كوكي ولا عنوان شبكة، ولا يمكن ربط أي رقم فيها بشخص. ولا تُرسل إلى أي جهة خارجية.",
        "إن فعّلت خيار «عدم التتبّع» في متصفحك، لا نحسبك في هذه العدّادات إطلاقًا.",
        "الكوكي الوحيد الذي نضعه هو كوكي جلسة لفريق LENA عند تسجيل الدخول. الزائر العادي لا يستقبل أي كوكي منّا.",
        "نحفظ على جهازك أنت — لا على خوادمنا — تفضيل اللغة والمظهر، وما تكتبه في نموذج التواصل قبل إرساله حتى لا يضيع عند تحديث الصفحة. يمكنك مسحه من زر «مسح المسودة» أو بمسح بيانات المتصفح.",
      ],
      en: [
        "This site loads no analytics, tracking or advertising tool, and no third-party content.",
        "We keep aggregate counters on our own server only: how many times a page was opened, in which language, and how many inquiries were sent per day. These counters contain no identifier, no cookie and no network address, and no number in them can be tied to a person. They are never sent to anyone else.",
        "If you have enabled “Do Not Track” in your browser, you are not counted at all.",
        "The only cookie we set is a session cookie for the LENA team when signing in. An ordinary visitor receives no cookie from us.",
        "Stored on your own device — not on our servers — are your language and theme preference, and whatever you type into the contact form before sending it, so a page refresh does not lose it. You can clear it with the “Clear draft” button or by clearing your browser data.",
      ],
    },
  },
  {
    id: "spam-protection",
    title: { ar: "الحماية من الإرسال الآلي", en: "Spam protection" },
    body: {
      ar: [
        "لمنع الإرسال الآلي نحفظ بصمة مشفّرة أحادية الاتجاه لعنوان الشبكة — وليس العنوان نفسه — ولا يمكن استرجاع العنوان منها.",
        "تُحذف هذه البصمات تلقائيًا بعد 30 يومًا.",
      ],
      en: [
        "To prevent automated submissions we store a one-way cryptographic fingerprint of the network address — not the address itself — and the address cannot be recovered from it.",
        "These fingerprints are deleted automatically after 30 days.",
      ],
    },
  },
  {
    id: "where",
    title: { ar: "أين تُحفظ ومن يصل إليها", en: "Where it is stored and who can reach it" },
    body: {
      ar: [
        "الاستفسارات تُحفظ في قاعدة بيانات المنصة، ويصل إليها فريق LENA فقط بعد تسجيل دخول آمن.",
        "بيانات التواصل تظهر مخفية افتراضيًا داخل لوحة التحكم، ولا تُكشف إلا بسبب مكتوب يُسجَّل في سجل مراجعة غير قابل للتعديل.",
        "قد تصلك رسالة إشعار عبر خدمة البريد التي نستخدمها للرد عليك. لا يوجد أي مزوّد آخر يستقبل بياناتك، ولا نرسل أي شيء إلى أنظمة ذكاء اصطناعي.",
      ],
      en: [
        "Inquiries are stored in the platform database, reachable only by the LENA team after a secure sign-in.",
        "Contact details appear masked by default inside the dashboard, and are revealed only with a written reason that is recorded in an unchangeable audit trail.",
        "A notification may pass through the email service we use to reply to you. No other provider receives your data, and nothing is ever sent to an AI system.",
      ],
    },
  },
  {
    id: "your-choices",
    title: { ar: "حقوقك وكيف تمارسها", en: "Your choices and how to use them" },
    body: {
      ar: [
        "يمكنك طلب نسخة من استفسارك، أو تصحيحه، أو حذفه نهائيًا.",
        "راسلنا على واتساب أو البريد مع رقم المرجع الذي ظهر لك بعد الإرسال (مثل ‎#12‎). نطلب هذا الرقم أو الرد من نفس القناة للتأكد أن الطلب منك أنت.",
        "نؤكد لك التنفيذ كتابيًا. الحذف نهائي ولا يمكن التراجع عنه، ويبقى في سجلنا أثر بأن حذفًا تم — بلا أي بيان شخصي.",
        "لا تحتاج حسابًا لممارسة أي من ذلك، ولا نطلب منك أبدًا كلمة مرور أو رمز تحقق.",
      ],
      en: [
        "You can ask for a copy of your inquiry, a correction to it, or its permanent deletion.",
        "Message us on WhatsApp or by email with the reference number shown after you submitted (for example #12). We ask for that number, or a reply from the same channel, to confirm the request is really yours.",
        "We confirm in writing once it is done. Deletion is permanent and cannot be undone; our records keep proof that a deletion happened — with no personal detail in it.",
        "No account is needed for any of this, and we will never ask you for a password or a verification code.",
      ],
    },
  },
];

export const PRIVACY_INTRO: Record<AppLocale, { note: string; contact: string }> = {
  ar: {
    note: "هذه الصفحة تشرح بدقة ما يفعله هذا الموقع ببياناتك، كما هو مطبَّق فعليًا في نظامه. هي بيان ممارسات تقنية وليست وثيقة قانونية.",
    contact: "لأي سؤال عن بياناتك، راسلنا مباشرة.",
  },
  en: {
    note: "This page explains precisely what this site does with your data, exactly as implemented in its system. It is a statement of technical practice, not a legal document.",
    contact: "For any question about your data, contact us directly.",
  },
};
