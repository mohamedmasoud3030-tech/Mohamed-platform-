import { History } from "lucide-react";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

const COPY = {
  ar: {
    title: "سجل المراجعة",
    intro: "سجل غير قابل للتعديل لكل إجراء إداري: من نفّذه، على ماذا، ولماذا. للقراءة فقط.",
    empty: "لا توجد إجراءات مسجّلة بعد.",
    loading: "جارٍ التحميل...",
    failed: "تعذر تحميل السجل.",
    total: (n: number) => `${n} إجراء مسجّل`,
    actions: {
      "inquiry.status": "تغيير حالة استفسار",
      "inquiry.reveal": "إظهار بيانات تواصل",
      "inquiry.archive": "أرشفة استفسار",
      "inquiry.purge": "حذف نهائي لاستفسار",
      "inquiry.export": "تصدير استفسارات",
      "project.delete": "حذف مشروع",
    } as Record<string, string>,
    outcomes: { success: "تم", denied: "مرفوض", failed: "فشل" } as Record<string, string>,
    reason: "السبب",
  },
  en: {
    title: "Audit trail",
    intro: "An unchangeable record of every administrative action: who did it, to what, and why. Read only.",
    empty: "No actions recorded yet.",
    loading: "Loading...",
    failed: "Could not load the trail.",
    total: (n: number) => `${n} recorded actions`,
    actions: {
      "inquiry.status": "Inquiry status changed",
      "inquiry.reveal": "Contact details revealed",
      "inquiry.archive": "Inquiry archived",
      "inquiry.purge": "Inquiry permanently deleted",
      "inquiry.export": "Inquiries exported",
      "project.delete": "Project deleted",
    } as Record<string, string>,
    outcomes: { success: "done", denied: "denied", failed: "failed" } as Record<string, string>,
    reason: "Reason",
  },
} as const;

export default function AuditTrail({ enabled }: { enabled: boolean }) {
  const { locale } = usePreferences();
  const text = COPY[locale];
  const trail = trpc.operations.auditTrail.useQuery({ limit: 50 }, { enabled });

  if (!enabled) return null;

  return (
    <details className="dashboard-support-block">
      <summary>
        <History size={16} aria-hidden="true" />
        {text.title}
        {trail.data ? <span className="audit-count">{text.total(trail.data.total)}</span> : null}
      </summary>
      <div className="audit-body">
        <p>{text.intro}</p>
        {trail.isLoading ? (
          <p>{text.loading}</p>
        ) : trail.error ? (
          <p role="alert">{text.failed}</p>
        ) : trail.data && trail.data.events.length > 0 ? (
          <ol className="audit-list">
            {trail.data.events.map((event) => (
              <li key={event.id} className={event.outcome !== "success" ? "is-flagged" : ""}>
                <div className="audit-line">
                  <strong>{text.actions[event.action] ?? event.action}</strong>
                  {event.subjectId && (
                    <code dir="ltr">
                      {event.subjectType} #{event.subjectId}
                    </code>
                  )}
                  <span className="audit-outcome">{text.outcomes[event.outcome] ?? event.outcome}</span>
                  <time dir="ltr">
                    {new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(event.createdAt))}
                  </time>
                </div>
                {event.reason && (
                  <p className="audit-reason">
                    {text.reason}: {event.reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p>{text.empty}</p>
        )}
      </div>
    </details>
  );
}
