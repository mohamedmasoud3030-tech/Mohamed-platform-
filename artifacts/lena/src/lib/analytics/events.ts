import { stripBase } from "@/lib/base-path";

/**
 * Product measurement — event taxonomy.
 *
 * Deliberately tiny. Each event exists because a specific decision depends on it
 * (see PRODUCT_MEASUREMENT_PLAN.md §4). Anything that cannot change a decision is
 * not measured, however easy it would be to collect.
 *
 * Names are stable and past-tense. Renaming one breaks history, so it is treated
 * as a schema change, not a tidy-up.
 */

export const ANALYTICS_EVENTS = [
  "page_viewed", // denominator for every conversion rate
  "primary_action_clicked", // the single CTA, wherever it appears
  "world_entered", // the homepage gateway into LENA World
  "contact_channel_opened", // WhatsApp / email / phone — the zero-field path
  "inquiry_started", // first keystroke in the form: intent, not just arrival
  "inquiry_submitted", // activation
  "inquiry_failed", // the guardrails refusing a real person
  "inquiry_draft_restored", // abandoned progress actually recovered
  "language_switched", // was the language we chose for them wrong?
  "help_searched", // what people cannot find
  "assistant_opened", // the help bot panel was opened
  "assistant_asked", // a question was sent to the help bot
  "assistant_teaser_shown", // the proactive welcome bubble reached the visitor
  "assistant_greeting_played", // the spoken welcome actually reached the visitor's ears
  "app_error_shown", // crash boundary reached
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * The complete list of property names any event may carry.
 * An event carrying anything else is dropped, not sanitised, so a mistake is
 * loud in tests rather than silent in production.
 */
export const ALLOWED_PROPERTIES = [
  "route", // normalised route pattern, never a real path with identifiers
  "locale", // "ar" | "en"
  "surface", // where in the page: "header" | "footer" | "section" | "cta" | "mobile_menu"
  "channel", // "whatsapp" | "email" | "phone"
  "context", // bounded product/UI context — never free text or personal data
  "reason", // failure class only: "rate_limited" | "rejected" | "offline" | "server"
  "outcome", // "success" | "failure"
  "has_results", // boolean, for search
  "query_length", // number, never the query itself
] as const;

export type AllowedProperty = (typeof ALLOWED_PROPERTIES)[number];

export type AnalyticsProperties = Partial<{
  route: string;
  locale: string;
  surface: string;
  channel: string;
  context: string;
  reason: string;
  outcome: string;
  has_results: boolean;
  query_length: number;
}>;

/**
 * Route normalisation.
 *
 * A raw path can identify a person indirectly and can carry secrets in a query
 * string. Only the shape of the route is ever recorded, and the query string and
 * hash are discarded before anything else happens.
 */
export function normaliseRoute(pathname: string): string {
  const withoutQuery = pathname.split("?")[0].split("#")[0];
  // Strip the deployment base path first so `/lena/ar/services` classifies as `/services`.
  const stripped = stripBase(withoutQuery);
  const segments = stripped.split("/").filter(Boolean);
  const [first, ...rest] = segments;
  const body = first === "ar" || first === "en" ? rest : segments;

  if (body.length === 0) return "/";
  const [head, second] = body;

  switch (head) {
    case "services":
      return second ? "/services/:service" : "/services";
    case "work":
      return second ? "/work/:project" : "/work";
    case "dashboard":
      return second ? "/dashboard/:section" : "/dashboard";
    case "world":
      if (!second) return "/world";
      if (second === "command" || second === "atlas") return `/world/${second}`;
      return "/world/:system";
    case "portfolio":
    case "about":
    case "ai-solutions":
    case "contact":
    case "help":
    case "privacy":
    case "login":
      return `/${head}`;
    default:
      // Anything unrecognised collapses to one bucket: an unknown path must never
      // become a free-text field in the analytics stream.
      return "/other";
  }
}

/** Values that must never appear in a property, whatever the caller intended. */
const FORBIDDEN_VALUE = /(@|\+?\d[\d\s-]{6,}|Bearer\s|eyJ[A-Za-z0-9_-]{10,}|https?:\/\/|password|token|secret|cookie)/i;

export type ValidationResult =
  | { ok: true; event: AnalyticsEvent; properties: AnalyticsProperties }
  | { ok: false; reason: string };

/**
 * Validation is the privacy boundary. Nothing reaches a sink without passing it.
 */
export function validateEvent(event: string, properties: Record<string, unknown> = {}): ValidationResult {
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(event)) {
    return { ok: false, reason: `unknown event "${event}"` };
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) continue;
    if (!(ALLOWED_PROPERTIES as readonly string[]).includes(key)) {
      return { ok: false, reason: `property "${key}" is not in the allowed list` };
    }
    if (typeof value === "string") {
      if (value.length > 64) return { ok: false, reason: `property "${key}" is too long` };
      if (FORBIDDEN_VALUE.test(value)) return { ok: false, reason: `property "${key}" looks like personal or secret data` };
      clean[key] = value;
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) return { ok: false, reason: `property "${key}" is not a finite number` };
      clean[key] = value;
    } else if (typeof value === "boolean") {
      clean[key] = value;
    } else {
      return { ok: false, reason: `property "${key}" has an unsupported type` };
    }
  }

  return { ok: true, event: event as AnalyticsEvent, properties: clean as AnalyticsProperties };
}
