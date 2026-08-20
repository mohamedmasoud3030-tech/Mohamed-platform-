import {
  normaliseRoute,
  validateEvent,
  type AnalyticsEvent,
  type AnalyticsProperties,
} from "./events";

/**
 * Provider-neutral measurement layer.
 *
 * Three deliberate properties:
 *  1. **It sends nothing by default.** With no sink configured every call is a
 *     no-op, so instrumentation can live in the code before any collection
 *     decision has been made or approved.
 *  2. **Validation happens before the sink**, so no adapter can ever be handed a
 *     value the taxonomy forbids.
 *  3. **The adapter is one function.** Swapping to a different backend later
 *     touches this file only.
 */

export type AnalyticsPayload = {
  event: AnalyticsEvent;
  properties: AnalyticsProperties;
  /** Local day bucket. There is no timestamp precise enough to correlate people. */
  day: string;
};

export type AnalyticsSink = (payload: AnalyticsPayload) => void;

type Environment = "production" | "preview" | "development" | "test";

let sink: AnalyticsSink | null = null;
let environment: Environment = "production";
let enabled = false;
const dropped: string[] = [];

/** Events already sent this page-view, so a re-render cannot double-count. */
const seenOnce = new Set<string>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function detectEnvironment(): Environment {
  if (typeof window === "undefined") return "test";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return "development";
  // Sandbox and preview hosts must never pollute production numbers.
  if (host.endsWith(".e2b.app") || host.includes("-preview") || host.endsWith(".vercel.app")) return "preview";
  return "production";
}

/**
 * Traffic we must not count: automation, previews, and anyone who has asked not
 * to be measured. Do Not Track is honoured even though this layer collects no
 * personal data — the visitor's stated preference outranks our own assessment.
 */
function shouldMeasure(): boolean {
  if (!enabled || !sink) return false;
  if (environment !== "production") return false;
  if (typeof navigator === "undefined") return false;
  if (navigator.webdriver) return false;
  if (navigator.doNotTrack === "1" || (window as { doNotTrack?: string }).doNotTrack === "1") return false;
  if (/bot|crawl|spider|headless|lighthouse|preview/i.test(navigator.userAgent ?? "")) return false;
  return true;
}

export function configureAnalytics(options: { sink?: AnalyticsSink | null; environment?: Environment; enabled?: boolean } = {}) {
  if (options.sink !== undefined) sink = options.sink;
  if (options.environment !== undefined) environment = options.environment;
  else environment = detectEnvironment();
  if (options.enabled !== undefined) enabled = options.enabled;
  seenOnce.clear();
  dropped.length = 0;
}

/** Test and diagnostic helper: which events were refused, and why. */
export function droppedEvents(): readonly string[] {
  return dropped;
}

export function resetOnceGuard() {
  seenOnce.clear();
}

/**
 * Record an event. Never throws: a measurement bug must not break a page.
 */
export function track(event: string, properties: Record<string, unknown> = {}): void {
  try {
    const result = validateEvent(event, properties);
    if (!result.ok) {
      // Loud in development and in tests, silent for the visitor.
      dropped.push(`${event}: ${result.reason}`);
      if (environment === "development") console.warn(`[analytics] dropped ${event} — ${result.reason}`);
      return;
    }
    if (!shouldMeasure()) return;
    sink?.({ event: result.event, properties: result.properties, day: today() });
  } catch {
    /* measurement must never surface to the user */
  }
}

/**
 * Record an event at most once per key for this page-view. Used for anything a
 * React re-render or a Strict Mode double-invoke could otherwise duplicate.
 */
export function trackOnce(key: string, event: string, properties: Record<string, unknown> = {}): void {
  if (seenOnce.has(key)) return;
  seenOnce.add(key);
  track(event, properties);
}

export function trackPageView(pathname: string, locale: string): void {
  const route = normaliseRoute(pathname);
  trackOnce(`page:${route}:${locale}`, "page_viewed", { route, locale });
}

export { normaliseRoute };
