/**
 * Inquiry draft recovery.
 *
 * The draft never leaves the visitor's browser: it exists only so that a refresh,
 * an accidental navigation, or a failed submission does not destroy what someone
 * already typed. It is removed as soon as the inquiry is sent or the visitor clears it.
 */

export type InquiryDraft = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

export const DRAFT_STORAGE_KEY = "lena-digital-house.inquiry-draft";

export const DRAFT_FIELDS: Array<keyof InquiryDraft> = ["name", "email", "phone", "service", "message"];

export function emptyDraft(): InquiryDraft {
  return { name: "", email: "", phone: "", service: "", message: "" };
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readDraft(): InquiryDraft | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InquiryDraft> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const draft = emptyDraft();
    let hasValue = false;
    for (const field of DRAFT_FIELDS) {
      const value = parsed[field];
      if (typeof value === "string" && value.trim()) {
        draft[field] = value;
        hasValue = true;
      }
    }
    return hasValue ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(values: InquiryDraft): void {
  const store = storage();
  if (!store) return;
  try {
    const hasValue = DRAFT_FIELDS.some((field) => values[field].trim());
    if (!hasValue) {
      store.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    const draft = emptyDraft();
    for (const field of DRAFT_FIELDS) draft[field] = values[field];
    store.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or unavailable (private mode): the form still works, it just cannot be restored */
  }
}

export function clearDraft(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
