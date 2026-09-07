import greetingArMorningUrl from "@/assets/assistant/greeting-ar-morning.mp3?url";
import greetingArAfternoonUrl from "@/assets/assistant/greeting-ar-afternoon.mp3?url";
import greetingArEveningUrl from "@/assets/assistant/greeting-ar-evening.mp3?url";
import greetingEnMorningUrl from "@/assets/assistant/greeting-en-morning.mp3?url";
import greetingEnAfternoonUrl from "@/assets/assistant/greeting-en-afternoon.mp3?url";
import greetingEnEveningUrl from "@/assets/assistant/greeting-en-evening.mp3?url";
import type { SupportedLocale } from "@/lib/locale";

/**
 * Spoken welcome — the assistant introduces herself out loud.
 *
 * Six pre-recorded clips ship inside the bundle (no provider call, no egress —
 * the browser plays a local asset). The clip is chosen by interface language
 * and the visitor's local time of day, mirroring the written greeting.
 */

export type GreetingPeriod = "morning" | "afternoon" | "evening";

const GREETING_AUDIO: Record<SupportedLocale, Record<GreetingPeriod, string>> = {
  ar: {
    morning: greetingArMorningUrl,
    afternoon: greetingArAfternoonUrl,
    evening: greetingArEveningUrl,
  },
  en: {
    morning: greetingEnMorningUrl,
    afternoon: greetingEnAfternoonUrl,
    evening: greetingEnEveningUrl,
  },
};

export function greetingPeriod(date: Date = new Date()): GreetingPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

export function greetingAudioUrl(locale: SupportedLocale, period: GreetingPeriod = greetingPeriod()): string {
  return GREETING_AUDIO[locale][period];
}
