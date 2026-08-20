/**
 * Safe support context.
 *
 * Everything here is deliberately non-sensitive: route, build id, role, locale,
 * viewport, connection state and a generated reference. It never reads form
 * values, inquiry contents, cookies, tokens, storage, or query-string values —
 * only the pathname is taken from the URL.
 *
 * Nothing is transmitted automatically. The report is rendered as text that the
 * person explicitly chooses to copy or send.
 */

export type SupportRole = "visitor" | "admin" | "signed-in";

export type SupportContext = {
  reference: string;
  build: string;
  route: string;
  role: SupportRole;
  locale: string;
  viewport: string;
  online: boolean;
  occurredAt: string;
};

export const APP_BUILD = typeof __APP_BUILD__ === "string" ? __APP_BUILD__ : "dev";

/**
 * Short, human-readable, non-guessable-enough reference used to tie a user's
 * report to a moment in time. Not an identifier of the person.
 */
export function createErrorReference(date = new Date()): string {
  const stamp = [
    String(date.getUTCFullYear()).slice(2),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LENA-${stamp}-${suffix}`;
}

export function collectSupportContext(options: {
  reference?: string;
  role?: SupportRole;
  locale?: string;
} = {}): SupportContext {
  const hasWindow = typeof window !== "undefined";
  return {
    reference: options.reference ?? createErrorReference(),
    build: APP_BUILD,
    // Pathname only — query strings and hashes are excluded on purpose.
    route: hasWindow ? window.location.pathname : "unknown",
    role: options.role ?? "visitor",
    locale: options.locale ?? (hasWindow ? document.documentElement.lang || "ar" : "ar"),
    viewport: hasWindow ? `${window.innerWidth}x${window.innerHeight}` : "unknown",
    online: hasWindow ? window.navigator.onLine !== false : true,
    occurredAt: new Date().toISOString(),
  };
}

export type SupportReportInput = {
  context: SupportContext;
  expected?: string;
  actual?: string;
  steps?: string;
};

/** Renders the report the user will read before deciding to send it. */
export function formatSupportReport({ context, expected, actual, steps }: SupportReportInput): string {
  const lines = [
    "LENA — support report",
    `Reference:   ${context.reference}`,
    `Build:       ${context.build}`,
    `Route:       ${context.route}`,
    `Role:        ${context.role}`,
    `Language:    ${context.locale}`,
    `Viewport:    ${context.viewport}`,
    `Online:      ${context.online ? "yes" : "no"}`,
    `Occurred at: ${context.occurredAt}`,
  ];
  if (steps?.trim()) lines.push("", `Steps:    ${steps.trim()}`);
  if (expected?.trim()) lines.push("", `Expected: ${expected.trim()}`);
  if (actual?.trim()) lines.push("", `Actual:   ${actual.trim()}`);
  return lines.join("\n");
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the manual path */
  }
  return false;
}
