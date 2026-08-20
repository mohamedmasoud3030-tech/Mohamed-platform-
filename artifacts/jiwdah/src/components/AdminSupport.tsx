import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, Copy, HelpCircle, LifeBuoy, MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import {
  APP_BUILD,
  collectSupportContext,
  copyToClipboard,
  createErrorReference,
  formatSupportReport,
} from "@/lib/support";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

export type AdminHelpTab = "inquiries" | "projects" | "content";

type Note = { q: string; a: string };

const HELP: Record<AdminHelpTab, Record<"ar" | "en", Note[]>> = {
  inquiries: {
    ar: [
      {
        q: "من أين تصل الاستفسارات؟",
        a: "من نموذج «ابدأ مشروعك» في الموقع العام فقط. رسائل واتساب والبريد لا تظهر هنا لأنها تصلك مباشرة على قنواتك.",
      },
      {
        q: "ماذا تعني الحالات؟",
        a: "«استفسار جديد» لم تفتحه بعد · «تم التواصل» رددت عليه · «عرض سعر» أرسلت له السعر · «متفق» وافق وبدأتم · «تحت التنفيذ» العمل جارٍ · «مكتمل» سُلِّم · «مغلق» انتهى بلا اتفاق · «مؤرشف» أخرجته من قائمة العمل.",
      },
      {
        q: "لماذا لم يصلني إشعار بالبريد؟",
        a: "إشعارات البريد تعمل فقط عند ضبط بيانات SMTP على الخادم. إن لم تُضبط، يُحفظ الاستفسار هنا بشكل سليم لكن لا يخرج أي بريد. هذه اللوحة هي المصدر المؤكد.",
      },
      {
        q: "ما معنى حقل «المصدر»؟",
        a: "الصفحة التي انطلق منها الزائر: «نموذج التواصل» أو «صفحة خدمة: …» أو «دراسة حالة: …». يخبرك أي صفحة تجلب العملاء فعلًا.",
      },
      {
        q: "لماذا بيانات التواصل مخفية؟",
        a: "تظهر مخفية افتراضيًا حتى لا تكون القائمة قابلة للحصاد. اضغط «إظهار بيانات التواصل» واكتب سببًا — يُسجَّل أن الكشف حدث، لا ما الذي كُشف.",
      },
      {
        q: "ما الفرق بين «أرشفة» و«حذف نهائي»؟",
        a: "الأرشفة تخرج الاستفسار من قائمة العمل ويمكن التراجع عنها. الحذف النهائي يزيل السجل بلا رجعة، ولذلك يطلب منك كتابة رقم الاستفسار نفسه وسببًا مكتوبًا. استخدم الأرشفة إلا إذا طلب صاحب البيانات الحذف.",
      },
      {
        q: "أين أرى ما جرى من إجراءات؟",
        a: "في «سجل المراجعة» أعلى الصفحة: كل إجراء إداري مع سببه ونتيجته، بما فيها المحاولات المرفوضة. السجل للقراءة فقط ولا يحتوي أي بيانات شخصية.",
      },
    ],
    en: [
      {
        q: "Where do inquiries come from?",
        a: "Only from the “Start a project” form on the public site. WhatsApp and email messages do not appear here because they reach your own channels directly.",
      },
      {
        q: "What do the statuses mean?",
        a: "“New inquiry” not opened yet · “Contacted” you replied · “Quoted” price sent · “Agreed” they accepted · “In delivery” work under way · “Completed” delivered · “Closed” ended without agreement · “Archived” removed from your working list.",
      },
      {
        q: "Why did I not receive an email notification?",
        a: "Email notifications only work when SMTP settings are configured on the server. If they are not, the inquiry is still stored here correctly but no email goes out. This dashboard is the reliable source.",
      },
      {
        q: "What is the “Source” field?",
        a: "The page the visitor started from: “Contact form”, “Service page: …” or “Case study: …”. It tells you which page actually produces clients.",
      },
      {
        q: "Why are contact details hidden?",
        a: "They are masked by default so the list cannot double as a contact-harvesting surface. Press “Reveal contact details” and write a reason — the audit records that a reveal happened, never what was revealed.",
      },
      {
        q: "What is the difference between Archive and Delete permanently?",
        a: "Archiving removes the inquiry from your working list and can be undone. Permanent deletion removes the record for good, which is why it asks you to type the inquiry number back and write a reason. Use archiving unless the person asked to be deleted.",
      },
      {
        q: "Where can I see what was done?",
        a: "In the “Audit trail” at the top of the page: every administrative action with its reason and outcome, including refused attempts. It is read only and contains no personal data.",
      },
    ],
  },
  projects: {
    ar: [
      {
        q: "أضفت مشروعًا ولا يظهر للزوار — لماذا؟",
        a: "الزوار يرون المشاريع المنشورة فقط. غيّر الحالة من «مسودة» إلى «منشور» ثم حدّث صفحة الأعمال.",
      },
      {
        q: "ما هو «المعرّف المختصر»؟",
        a: "الجزء الإنجليزي في رابط المشروع (حروف صغيرة وأرقام وشرطات فقط). تغييره بعد النشر يكسر أي رابط قديم تمت مشاركته.",
      },
      {
        q: "ما الملفات المسموح رفعها؟",
        a: "صور JPG وPNG وWebP وGIF وAVIF، وفيديو MP4 وWebM وOGV، بحد أقصى 100 ميغابايت للملف الواحد. أي نوع آخر يُرفض.",
      },
      {
        q: "ظهرت رسالة أن التخزين غير مهيأ",
        a: "رفع الوسائط يحتاج إعدادات التخزين على الخادم. إلى أن تُضبط، يمكنك لصق رابط صورة جاهز في حقل رابط الصورة بدل الرفع.",
      },
      {
        q: "أين أحرر دراسة الحالة الكاملة؟",
        a: "في «محرر المشاريع الكامل». هذا التبويب يغطي البيانات الأساسية فقط؛ الأقسام والمعرض والخدمات المرتبطة تُحرَّر هناك.",
      },
    ],
    en: [
      {
        q: "I added a project and visitors cannot see it — why?",
        a: "Visitors only see published projects. Change the status from “Draft” to “Published”, then refresh the work page.",
      },
      {
        q: "What is the “Slug”?",
        a: "The English part of the project link (lowercase letters, numbers and dashes only). Changing it after publishing breaks any old link that was shared.",
      },
      {
        q: "Which files can I upload?",
        a: "JPG, PNG, WebP, GIF and AVIF images, and MP4, WebM and OGV video, up to 100MB per file. Any other type is rejected.",
      },
      {
        q: "I saw a message that storage is not configured",
        a: "Media upload needs storage settings on the server. Until they are configured you can paste a ready image URL into the image field instead of uploading.",
      },
      {
        q: "Where do I edit the full case study?",
        a: "In the full project editor. This tab covers basic data only; sections, gallery and related services are edited there.",
      },
    ],
  },
  content: {
    ar: [
      {
        q: "ما هذا التبويب؟",
        a: "مساحة لمقاطع نصية معادة الاستخدام. لا تعرض صفحات الموقع الحالية أيًا منها، لذا لا يؤثر ما تكتبه هنا على ما يراه الزائر اليوم.",
      },
      {
        q: "هل أحتاج استخدامه الآن؟",
        a: "لا. تجاهله ما لم نربطه بمساحة عرض فعلية.",
      },
    ],
    en: [
      {
        q: "What is this tab?",
        a: "A space for reusable text blocks. No current site page reads them, so what you write here does not affect what visitors see today.",
      },
      { q: "Do I need it now?", a: "No. Ignore it until it is connected to a real display surface." },
    ],
  },
};

const UI = {
  ar: {
    help: "أسئلة سريعة عن هذه الشاشة",
    status: "حالة الاتصال",
    online: "الاتصال بالخادم سليم",
    offline: "تعذر الوصول إلى الخادم",
    checking: "جارٍ الفحص...",
    build: "إصدار التطبيق",
    recheck: "إعادة الفحص",
    report: "الإبلاغ عن مشكلة",
    reportIntro:
      "يُنشئ تقريرًا فنيًا مختصرًا لا يحتوي على كلمات مرور ولا محتوى الاستفسارات. لا يُرسل شيء تلقائيًا — أنت من يقرر إرساله.",
    steps: "ماذا كنت تفعل؟",
    expected: "ما الذي توقعته؟",
    actual: "ما الذي حدث فعلًا؟",
    preview: "التقرير الذي سيُرسل",
    copy: "نسخ التقرير",
    copied: "تم النسخ",
    send: "إرسال عبر واتساب",
    sendEmail: "إرسال بالبريد",
    reference: "رقم المرجع",
  },
  en: {
    help: "Quick questions about this screen",
    status: "Connection status",
    online: "Server connection is healthy",
    offline: "Cannot reach the server",
    checking: "Checking...",
    build: "App version",
    recheck: "Check again",
    report: "Report a problem",
    reportIntro:
      "Creates a short technical report that contains no passwords and no inquiry content. Nothing is sent automatically — you decide whether to send it.",
    steps: "What were you doing?",
    expected: "What did you expect?",
    actual: "What actually happened?",
    preview: "The report that will be sent",
    copy: "Copy the report",
    copied: "Copied",
    send: "Send on WhatsApp",
    sendEmail: "Send by email",
    reference: "Reference",
  },
} as const;

export default function AdminSupport({ tab, isAdmin }: { tab: AdminHelpTab; isAdmin: boolean }) {
  const { locale } = usePreferences();
  const text = UI[locale];
  const notes = HELP[tab][locale];

  const ping = trpc.ping.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });

  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [copied, setCopied] = useState(false);
  const [reference] = useState(() => createErrorReference());

  const report = useMemo(
    () =>
      formatSupportReport({
        context: collectSupportContext({ reference, role: isAdmin ? "admin" : "signed-in", locale }),
        steps,
        expected,
        actual,
      }),
    [reference, isAdmin, locale, steps, expected, actual],
  );

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.primaryWhatsApp}?text=${encodeURIComponent(report)}`;
  const mailtoUrl = `mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent(
    `LENA support ${reference}`,
  )}&body=${encodeURIComponent(report)}`;

  return (
    <section className="dashboard-support" aria-label={text.help}>
      <details className="dashboard-support-block">
        <summary>
          <HelpCircle size={16} aria-hidden="true" />
          {text.help}
        </summary>
        <dl className="dashboard-support-notes">
          {notes.map((note) => (
            <div key={note.q}>
              <dt>{note.q}</dt>
              <dd>{note.a}</dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="dashboard-support-status" role="status" aria-live="polite">
        <Activity size={15} aria-hidden="true" />
        <span className={ping.isError ? "is-offline" : ping.isLoading ? "" : "is-online"}>
          {ping.isLoading ? text.checking : ping.isError ? text.offline : text.online}
        </span>
        <code dir="ltr">
          {text.build}: {APP_BUILD}
        </code>
        <button type="button" onClick={() => ping.refetch()}>
          {text.recheck}
        </button>
      </div>

      <details
        className="dashboard-support-block"
        open={open}
        onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>
          <LifeBuoy size={16} aria-hidden="true" />
          {text.report}
        </summary>
        <div className="dashboard-support-report">
          <p>{text.reportIntro}</p>
          <p className="dashboard-support-reference">
            {text.reference}: <strong dir="ltr">{reference}</strong>
          </p>
          <label>
            <span>{text.steps}</span>
            <textarea rows={2} value={steps} onChange={(event) => setSteps(event.target.value)} />
          </label>
          <label>
            <span>{text.expected}</span>
            <textarea rows={2} value={expected} onChange={(event) => setExpected(event.target.value)} />
          </label>
          <label>
            <span>{text.actual}</span>
            <textarea rows={2} value={actual} onChange={(event) => setActual(event.target.value)} />
          </label>
          <p className="dashboard-support-preview-label">{text.preview}</p>
          <pre className="dashboard-support-preview" dir="ltr">
            {report}
          </pre>
          <div className="dashboard-guide-actions">
            <button
              type="button"
              onClick={async () => {
                setCopied(await copyToClipboard(report));
              }}
            >
              {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
              {copied ? text.copied : text.copy}
            </button>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={16} />
              {text.send}
            </a>
            <a href={mailtoUrl}>{text.sendEmail}</a>
          </div>
        </div>
      </details>
    </section>
  );
}
