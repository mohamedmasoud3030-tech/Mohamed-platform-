import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { analyticsDaily } from "@workspace/db";
import { createRouter, publicQuery, adminQuery } from "../middleware";

/**
 * Aggregate-only product measurement.
 *
 * The server re-validates everything the browser sends. A client is untrusted
 * input, so the closed vocabularies below — not the frontend — are what actually
 * protects the data. Anything outside them is rejected, and nothing that could
 * describe a person has a field to arrive in.
 */

const EVENTS = [
  "page_viewed",
  "primary_action_clicked",
  "contact_channel_opened",
  "inquiry_started",
  "inquiry_submitted",
  "inquiry_failed",
  "inquiry_draft_restored",
  "language_switched",
  "help_searched",
  "app_error_shown",
] as const;

/** Route shapes only. An unrecognised path can never become a free-text value. */
const ROUTES = [
  "/",
  "/services",
  "/services/:service",
  "/portfolio",
  "/work",
  "/work/:project",
  "/about",
  "/ai-solutions",
  "/contact",
  "/help",
  "/privacy",
  "/login",
  "/dashboard",
  "/dashboard/:section",
  "/other",
] as const;

/** One low-cardinality extra dimension per event: channel, surface, reason or context. */
const DIMENSIONS = [
  "",
  "whatsapp",
  "email",
  "phone",
  "header",
  "footer",
  "mobile_menu",
  "fab",
  "cta",
  "section",
  "contact",
  "service",
  "work",
  "rate_limited",
  "rejected",
  "offline",
  "server",
  "results",
  "no_results",
] as const;

const recordInput = z.object({
  event: z.enum(EVENTS),
  route: z.enum(ROUTES).default("/"),
  locale: z.enum(["ar", "en"]).default("ar"),
  dimension: z.enum(DIMENSIONS).default(""),
});

export const analyticsRouter = createRouter({
  /**
   * Public because visitors are anonymous. Writes a counter, never a record.
   * Failure is silent by design: measurement must never surface to a visitor.
   */
  record: publicQuery.input(recordInput).mutation(async ({ ctx, input }) => {
    const day = new Date().toISOString().slice(0, 10);
    try {
      await ctx.db
        .insert(analyticsDaily)
        .values({ day, ...input, count: 1, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [analyticsDaily.day, analyticsDaily.event, analyticsDaily.route, analyticsDaily.locale, analyticsDaily.dimension],
          set: { count: sql`${analyticsDaily.count} + 1`, updatedAt: new Date() },
        });
    } catch {
      /* a measurement failure is never a visitor-facing failure */
    }
    return { ok: true };
  }),

  /** The three dashboards defined in PRODUCT_MEASUREMENT_PLAN.md §6, as data. */
  summary: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).default({ days: 30 }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const rows = await ctx.db
        .select()
        .from(analyticsDaily)
        .where(gte(analyticsDaily.day, since))
        .orderBy(desc(analyticsDaily.day));

      const total = (event: string, filter?: (row: (typeof rows)[number]) => boolean) =>
        rows.filter((row) => row.event === event && (filter ? filter(row) : true)).reduce((sum, row) => sum + row.count, 0);

      const contactViews = total("page_viewed", (row) => row.route === "/contact");
      const submitted = total("inquiry_submitted");

      return {
        sinceDay: since,
        funnel: {
          contactPageViews: contactViews,
          inquiryStarted: total("inquiry_started"),
          inquirySubmitted: submitted,
          whatsappOpened: total("contact_channel_opened", (row) => row.dimension === "whatsapp"),
          failures: total("inquiry_failed"),
          conversionPercent: contactViews > 0 ? Math.round((submitted / contactViews) * 1000) / 10 : null,
        },
        byLocale: {
          ar: total("inquiry_submitted", (row) => row.locale === "ar"),
          en: total("inquiry_submitted", (row) => row.locale === "en"),
          switches: total("language_switched"),
        },
        proofPages: rows
          .filter((row) => row.event === "page_viewed" && (row.route === "/work/:project" || row.route === "/services/:service"))
          .reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.route]: (acc[row.route] ?? 0) + row.count }), {}),
        health: {
          errorsShown: total("app_error_shown"),
          helpSearchesWithoutResults: total("help_searched", (row) => row.dimension === "no_results"),
          draftsRestored: total("inquiry_draft_restored"),
        },
      };
    }),

  /** Raw counters, for when the founder wants to check a number himself. */
  raw: adminQuery
    .input(z.object({ days: z.number().int().min(1).max(90).default(14) }).default({ days: 14 }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return ctx.db
        .select()
        .from(analyticsDaily)
        .where(and(gte(analyticsDaily.day, since), eq(analyticsDaily.locale, analyticsDaily.locale)))
        .orderBy(desc(analyticsDaily.day))
        .limit(500);
    }),
});
