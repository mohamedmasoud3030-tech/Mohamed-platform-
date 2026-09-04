import type { WorldPresence } from "@/features/world/signals";
import type { AppLocale } from "@/providers/preferences";

/**
 * World presence, in words.
 *
 * Atlas may *display* the presence the Global Signal Layer already derived; it
 * must not re-derive it and must never show a colored dot as the only meaning.
 * This is the one-line vocabulary mapping that keeps the promise, so no
 * component re-invents lifecycle wording.
 */
const PRESENCE_WORDS: Record<WorldPresence, { ar: string; en: string }> = {
  unavailable: { ar: "غير متاح", en: "unavailable" },
  quiet: { ar: "هادئ", en: "quiet" },
  active: { ar: "نشط", en: "active" },
  attention: { ar: "انتباه", en: "attention" },
  critical: { ar: "حرج", en: "critical" },
};

export function presenceLabel(presence: WorldPresence | undefined, locale: AppLocale): string | null {
  if (!presence) return null;
  return PRESENCE_WORDS[presence]?.[locale] ?? null;
}
