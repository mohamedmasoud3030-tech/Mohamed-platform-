import type { AppLocale } from "@/providers/preferences";

/**
 * Locale-aware formatting, in one place.
 *
 * Before this module, date formatting was duplicated in two components with a
 * hardcoded `en-GB` fallback, numbers were never formatted at all, and there was
 * no plural handling. Arabic pluralisation has six categories against English's
 * two, so "3 استفسارات" versus "3 inquiries" cannot be produced by string
 * concatenation without being wrong in one language or the other.
 *
 * No new dependency: the platform's own Intl implementation does all of it.
 */

/** BCP-47 tags. Region-neutral on purpose — the studio publishes no country. */
const TAG: Record<AppLocale, string> = { ar: "ar", en: "en-GB" };

export function formatDate(value: Date | string | number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(TAG[locale], { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value: Date | string | number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(TAG[locale], { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** Short form for dense lists such as the audit trail. */
export function formatShortDateTime(value: Date | string | number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(TAG[locale], { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(TAG[locale]).format(value);
}

/**
 * Relative time ("منذ ٣ أيام"), which reads far better than a raw date for
 * recent activity and is what an operator scanning a list actually needs.
 */
export function formatRelative(value: Date | string | number, locale: AppLocale): string {
  const then = new Date(value).getTime();
  const seconds = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(TAG[locale], { numeric: "auto" });
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.348],
    ["month", 12],
    ["year", Infinity],
  ];
  let amount = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) return rtf.format(Math.round(amount), unit);
    amount /= size;
  }
  return formatDate(value, locale);
}

/**
 * Correct plural selection for both languages.
 *
 * Arabic uses zero/one/two/few/many/other. Callers supply only the forms their
 * language needs; anything missing falls back to `other`, so a partial set can
 * never render `undefined`.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export function plural(count: number, locale: AppLocale, forms: PluralForms): string {
  const rule = new Intl.PluralRules(TAG[locale]).select(count);
  const template = forms[rule] ?? forms.other;
  return template.replace("{n}", formatNumber(count, locale));
}

/**
 * Isolates a Latin string inside Arabic text.
 *
 * Without an isolate, a product name or a phone number placed in an RTL sentence
 * can reorder around neighbouring punctuation and render in the wrong position.
 */
export function isolate(value: string): string {
  return `\u2068${value}\u2069`;
}
