import { useState } from "react";
import { Archive, Eye, ShieldAlert, Trash2, X } from "lucide-react";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";

const COPY = {
  ar: {
    reveal: "إظهار بيانات التواصل",
    revealTitle: "إظهار بيانات التواصل",
    revealWhy: "بيانات التواصل مخفية افتراضيًا. اكتب سبب حاجتك لها — يُسجَّل في سجل المراجعة.",
    archive: "أرشفة",
    archiveTitle: "أرشفة الاستفسار",
    archiveWhy: "يخرج من قائمة العمل ويمكن استرجاعه في أي وقت. السبب اختياري.",
    purge: "حذف نهائي",
    purgeTitle: "حذف نهائي لا يمكن التراجع عنه",
    purgeWhy: "سيُحذف السجل من قاعدة البيانات ولا يمكن استرجاعه. يبقى في سجل المراجعة أثر بالحذف بلا بيانات شخصية.",
    purgeConfirm: "للتأكيد، اكتب رقم الاستفسار",
    reason: "السبب",
    reasonHint: "٨ أحرف على الأقل",
    cancel: "إلغاء",
    confirm: "تأكيد",
    working: "جارٍ التنفيذ...",
    revealed: "بيانات التواصل الكاملة",
    failed: "تعذر تنفيذ العملية.",
    reasonShort: "السبب قصير جدًا.",
    confirmMismatch: "الرقم غير مطابق.",
    hidden: "مخفي",
  },
  en: {
    reveal: "Reveal contact details",
    revealTitle: "Reveal contact details",
    revealWhy: "Contact details are masked by default. Write why you need them — it is written to the audit trail.",
    archive: "Archive",
    archiveTitle: "Archive inquiry",
    archiveWhy: "Removes it from the working list and can be undone at any time. The reason is optional.",
    purge: "Delete permanently",
    purgeTitle: "Permanent deletion, no undo",
    purgeWhy: "The record is removed from the database and cannot be recovered. The audit trail keeps proof of the deletion without any personal data.",
    purgeConfirm: "To confirm, type the inquiry number",
    reason: "Reason",
    reasonHint: "at least 8 characters",
    cancel: "Cancel",
    confirm: "Confirm",
    working: "Working...",
    revealed: "Full contact details",
    failed: "The action could not be completed.",
    reasonShort: "The reason is too short.",
    confirmMismatch: "The number does not match.",
    hidden: "hidden",
  },
} as const;

type Mode = "reveal" | "archive" | "purge" | null;

export default function InquiryOperations({
  inquiryId,
  status,
  can,
}: {
  inquiryId: number;
  status: string;
  can: { reveal: boolean; archive: boolean; purge: boolean };
}) {
  const { locale } = usePreferences();
  const text = COPY[locale];
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<{ email: string | null; phone: string | null } | null>(null);

  const close = () => {
    setMode(null);
    setReason("");
    setConfirmId("");
    setError("");
  };

  const onError = () => setError(text.failed);
  const reveal = trpc.operations.revealInquiryContact.useMutation({
    onSuccess: (data) => {
      setRevealed({ email: data.email, phone: data.phone });
      close();
    },
    onError,
  });
  const archive = trpc.operations.archiveInquiry.useMutation({
    onSuccess: async () => {
      await utils.inquiries.invalidate();
      await utils.operations.auditTrail.invalidate();
      close();
    },
    onError,
  });
  const purge = trpc.operations.purgeInquiry.useMutation({
    onSuccess: async () => {
      await utils.inquiries.invalidate();
      await utils.operations.auditTrail.invalidate();
      close();
    },
    onError,
  });

  const pending = reveal.isPending || archive.isPending || purge.isPending;

  function submit() {
    setError("");
    if (mode === "reveal") {
      if (reason.trim().length < 8) return setError(text.reasonShort);
      return reveal.mutate({ id: inquiryId, reason: reason.trim() });
    }
    if (mode === "archive") {
      return archive.mutate({ id: inquiryId, reason: reason.trim() || undefined });
    }
    if (mode === "purge") {
      if (reason.trim().length < 8) return setError(text.reasonShort);
      if (Number(confirmId) !== inquiryId) return setError(text.confirmMismatch);
      return purge.mutate({ id: inquiryId, confirmId: Number(confirmId), reason: reason.trim() });
    }
  }

  const titles: Record<Exclude<Mode, null>, { title: string; why: string }> = {
    reveal: { title: text.revealTitle, why: text.revealWhy },
    archive: { title: text.archiveTitle, why: text.archiveWhy },
    purge: { title: text.purgeTitle, why: text.purgeWhy },
  };

  return (
    <div className="inquiry-ops">
      <div className="inquiry-ops-buttons">
        {can.reveal && !revealed && (
          <button type="button" onClick={() => setMode("reveal")}>
            <Eye size={15} />
            {text.reveal}
          </button>
        )}
        {can.archive && status !== "archived" && (
          <button type="button" onClick={() => setMode("archive")}>
            <Archive size={15} />
            {text.archive}
          </button>
        )}
        {can.purge && (
          <button type="button" className="inquiry-ops-danger" onClick={() => setMode("purge")}>
            <Trash2 size={15} />
            {text.purge}
          </button>
        )}
      </div>

      {revealed && (
        <dl className="inquiry-ops-revealed" aria-live="polite">
          <dt>{text.revealed}</dt>
          <dd dir="ltr">{revealed.email ?? "—"}</dd>
          <dd dir="ltr">{revealed.phone ?? "—"}</dd>
        </dl>
      )}

      {mode && (
        <div className={`inquiry-ops-panel${mode === "purge" ? " is-danger" : ""}`} role="group" aria-label={titles[mode].title}>
          <div className="inquiry-ops-panel-head">
            {mode === "purge" && <ShieldAlert size={16} />}
            <strong>{titles[mode].title}</strong>
            <button type="button" onClick={close} aria-label={text.cancel}>
              <X size={15} />
            </button>
          </div>
          <p>{titles[mode].why}</p>
          <label>
            <span>
              {text.reason} {mode !== "archive" && <small>{text.reasonHint}</small>}
            </span>
            <textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          {mode === "purge" && (
            <label>
              <span>
                {text.purgeConfirm} <strong dir="ltr">{inquiryId}</strong>
              </span>
              <input inputMode="numeric" dir="ltr" value={confirmId} onChange={(event) => setConfirmId(event.target.value)} />
            </label>
          )}
          {error && (
            <p className="inquiry-ops-error" role="alert">
              {error}
            </p>
          )}
          <div className="inquiry-ops-actions">
            <button type="button" onClick={close}>
              {text.cancel}
            </button>
            <button
              type="button"
              className={mode === "purge" ? "inquiry-ops-danger" : "inquiry-ops-primary"}
              disabled={pending}
              onClick={submit}
            >
              {pending ? text.working : text.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
