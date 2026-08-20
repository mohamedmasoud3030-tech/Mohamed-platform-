import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createHmac } from "crypto";
import { count, desc, eq, lt, sql } from "drizzle-orm";
import { inquiries, inquiryRateLimits, INQUIRY_STATUS_VALUES } from "@workspace/db";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { maskEmail, maskPhone, recordAudit } from "../../lib/admin-authorization";
import { sendNewInquiryNotification, summariseTransportError } from "../../lib/mailer";
import type { TrpcContext } from "../context";

const inquiryStatusEnum = z.enum(INQUIRY_STATUS_VALUES);
const INQUIRY_MINIMUM_COMPLETION_MS = 1500;
const INQUIRY_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const INQUIRY_RATE_LIMIT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const INQUIRY_RATE_LIMIT_MAX_ATTEMPTS = 5;

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function rejectAutomatedInquiry(website: string | undefined, submittedAt: number) {
  if (website || Date.now() - submittedAt < INQUIRY_MINIMUM_COMPLETION_MS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid inquiry." });
  }
}

function getRateLimitSecret() {
  const secret = process.env.INQUIRY_RATE_LIMIT_SECRET;
  if (secret) return secret;
  if (isProductionRuntime()) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Inquiry rate limiting is not configured." });
  }
  return process.env.APP_SECRET || "local-development-only";
}

function normalizeClientIp(ctx: TrpcContext) {
  const address = (ctx.req.ip || ctx.req.socket.remoteAddress || "unknown").trim().toLowerCase();
  return address.startsWith("::ffff:") ? address.slice(7) : address;
}

function hashNetworkIdentifier(ctx: TrpcContext) {
  return createHmac("sha256", getRateLimitSecret()).update(normalizeClientIp(ctx)).digest("hex");
}

async function enforceInquiryRateLimit(ctx: TrpcContext) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - INQUIRY_RATE_LIMIT_WINDOW_MS);
  const retentionCutoff = new Date(now.getTime() - INQUIRY_RATE_LIMIT_RETENTION_MS);
  const identifierHash = hashNetworkIdentifier(ctx);

  await ctx.db.delete(inquiryRateLimits).where(lt(inquiryRateLimits.updatedAt, retentionCutoff));

  const result = await ctx.db
    .insert(inquiryRateLimits)
    .values({ identifierHash, source: "contact", attempts: 1, windowStart: now, updatedAt: now })
    .onConflictDoUpdate({
      target: inquiryRateLimits.identifierHash,
      set: {
        attempts: sql<number>`case when ${inquiryRateLimits.windowStart} < ${windowStart} then 1 else ${inquiryRateLimits.attempts} + 1 end`,
        windowStart: sql<Date>`case when ${inquiryRateLimits.windowStart} < ${windowStart} then ${now} else ${inquiryRateLimits.windowStart} end`,
        updatedAt: now,
      },
    })
    .returning({ attempts: inquiryRateLimits.attempts, windowStart: inquiryRateLimits.windowStart });

  const current = result[0];
  if (current && current.windowStart > windowStart && current.attempts > INQUIRY_RATE_LIMIT_MAX_ATTEMPTS) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many inquiry submissions. Please try again later." });
  }
}

export const inquiriesRouter = createRouter({
  /**
   * Contact details are masked here. Seeing them requires an explicit, reasoned
   * and audited reveal (operations.revealInquiryContact), so the working list
   * cannot double as a quiet contact-harvesting surface.
   */
  list: adminQuery.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    return rows.map((row) => ({
      ...row,
      email: maskEmail(row.email),
      phone: maskPhone(row.phone),
      hasEmail: Boolean(row.email),
      hasPhone: Boolean(row.phone),
    }));
  }),

  countNew: adminQuery.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: count() })
      .from(inquiries)
      .where(eq(inquiries.status, "new"));
    return result[0]?.count ?? 0;
  }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(320).optional(),
        phone: z.string().trim().max(50).optional(),
        service: z.string().trim().max(255).optional(),
        message: z.string().trim().min(1).max(5000),
        // Entry context of the inquiry: which page the visitor started from.
        // Activation attribution only — contains no personal data.
        source: z
          .string()
          .trim()
          .max(50)
          .regex(/^(contact|service:[a-z0-9-]{1,40}|work:[a-z0-9-]{1,40})$/)
          .default("contact"),
        website: z.string().trim().max(255).optional(),
        submittedAt: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      rejectAutomatedInquiry(input.website, input.submittedAt);
      await enforceInquiryRateLimit(ctx);

      const result = await ctx.db
        .insert(inquiries)
        .values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          service: input.service,
          message: input.message,
          source: input.source,
          status: "new",
        })
        .returning();

      const inquiry = result[0];
      if (inquiry) {
        sendNewInquiryNotification(inquiry).catch((error) =>
          console.error("[inquiries] notification error:", summariseTransportError(error))
        );
      }

      return inquiry;
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number().int().positive(), status: inquiryStatusEnum }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(inquiries).where(eq(inquiries.id, input.id)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found." });
      // Idempotent: repeating the same change is a no-op, not a duplicate audit entry.
      if (existing.status === input.status) return { ...existing, email: null, phone: null };

      const result = await ctx.db
        .update(inquiries)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(inquiries.id, input.id))
        .returning();

      await recordAudit(ctx, {
        action: "inquiry.status",
        subjectType: "inquiry",
        subjectId: input.id,
        details: { from: existing.status, to: input.status },
      });

      const updated = result[0];
      return { ...updated, email: maskEmail(updated.email), phone: maskPhone(updated.phone) };
    }),

  // One-click permanent deletion of a potential client has been retired.
  // Reversible: operations.archiveInquiry. Irreversible: operations.purgeInquiry,
  // which requires typed confirmation, a written reason, and an audit record.
});
