import type { AnalyticsPayload, AnalyticsSink } from "./index";
import { withBase } from "@/lib/base-path";

/**
 * First-party aggregate sink.
 *
 * Posts a single counter increment to this site's own API. No third party, no
 * cookie, no identifier, no address. The server re-validates every field against
 * a closed vocabulary, so the browser is never trusted.
 *
 * `keepalive` lets the request survive a page navigation. Failure is ignored on
 * purpose: a missing counter is acceptable, a broken page is not.
 */

/** The one extra low-cardinality dimension the counter table stores. */
function dimensionFor(payload: AnalyticsPayload): string {
  const p = payload.properties;
  if (p.channel) return p.channel;
  if (p.reason) return p.reason;
  if (p.surface) return p.surface;
  if (p.context) return p.context;
  if (payload.event === "help_searched") return p.has_results ? "results" : "no_results";
  return "";
}

export const firstPartySink: AnalyticsSink = (payload) => {
  try {
    void fetch(withBase("/api/trpc/analytics.record"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        json: {
          event: payload.event,
          route: payload.properties.route ?? "/",
          locale: payload.properties.locale ?? "ar",
          dimension: dimensionFor(payload),
        },
      }),
    }).catch(() => undefined);
  } catch {
    /* measurement never surfaces to the visitor */
  }
};
