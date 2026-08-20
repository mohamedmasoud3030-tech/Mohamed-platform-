import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, desc, eq, lt, ne } from "drizzle-orm";
import { adminAuditEvents, inquiries, INQUIRY_STATUS_VALUES } from "@workspace/db";
import { createRouter, adminQuery } from "../middleware";
import { hasCapability, maskEmail, maskPhone, recordAudit, type Capability } from "../../lib/admin-authorization";
import type { TrpcContext } from "../context";

const inquiryStatusEnum = z.enum(INQUIRY_STATUS_VALUES);

/** A reason is a sentence a human wrote, not a checkbox. */
const reasonSchema = z.string().trim().min(8, "A reason of at least 8 characters is required.").max(500);

const EXPORT_LIMIT = 200;

/**
 * Retention.
 *
 * Old inquiries are ANONYMISED, not deleted: the personal fields are cleared
 * while the row survives, so historical counts, attribution and the audit trail
 * stay truthful. Nothing runs on a schedule — there is no cron and no automatic
 * deletion. The founder previews first, then applies deliberately.
 */
const RETENTION_MONTHS = Number(process.env.INQUIRY_RETENTION_MONTHS ?? 24);

function retentionCutoff() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - (Number.isFinite(RETENTION_MONTHS) && RETENTION_MONTHS > 0 ? RETENTION_MONTHS : 24));
  return cutoff;
}

/**
 * Authorization is enforced here, server-side, on every privileged path.
 * A hidden button in the interface grants nothing.
 */
function authorize(ctx: TrpcContext, capability: Capability) {
  if (!hasCapability(ctx.user?.role, capability)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
  }
}

function maskInquiry(row: typeof inquiries.$inferSelect) {
  return {
    ...row,
    email: maskEmail(row.email),
    phone: maskPhone(row.phone),
    hasEmail: Boolean(row.email),
    hasPhone: Boolean(row.phone),
  };
}

export const operationsRouter = createRouter({
  /** Everything the operator is allowed to do, so the interface can hide what it must not offer. */
  capabilities: adminQuery.query(({ ctx }) => ({
    role: ctx.user?.role ?? "user",
    can: {
      reveal: hasCapability(ctx.user?.role, "inquiry.reveal"),
      archive: hasCapability(ctx.user?.role, "inquiry.archive"),
      purge: hasCapability(ctx.user?.role, "inquiry.purge"),
      export: hasCapability(ctx.user?.role, "inquiry.export"),
      audit: hasCapability(ctx.user?.role, "audit.read"),
    },
  })),

  /** Contact details are masked until someone gives a reason for needing them. */
  revealInquiryContact: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: reasonSchema }))
    .mutation(async ({ ctx, input }) => {
      authorize(ctx, "inquiry.reveal");
      const [row] = await ctx.db.select().from(inquiries).where(eq(inquiries.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found." });

      await recordAudit(ctx, {
        action: "inquiry.reveal",
        subjectType: "inquiry",
        subjectId: row.id,
        reason: input.reason,
        // Records that details were revealed — never the details themselves.
        details: { revealed: [row.email ? "email" : null, row.phone ? "phone" : null].filter(Boolean) },
      });

      return { id: row.id, email: row.email, phone: row.phone };
    }),

  /**
   * Reversible removal from the working list. This is the default "delete"
   * offered by the interface, because an inquiry is a potential client.
   */
  archiveInquiry: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      authorize(ctx, "inquiry.archive");
      const [row] = await ctx.db.select().from(inquiries).where(eq(inquiries.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found." });
      if (row.status === "archived") return { id: row.id, status: row.status, changed: false }; // idempotent

      const [updated] = await ctx.db
        .update(inquiries)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(inquiries.id, input.id))
        .returning();

      await recordAudit(ctx, {
        action: "inquiry.archive",
        subjectType: "inquiry",
        subjectId: input.id,
        reason: input.reason,
        details: { from: row.status, to: "archived" },
      });

      return { id: updated.id, status: updated.status, changed: true };
    }),

  /**
   * Irreversible. Requires the operator to type the inquiry's own id back as a
   * confirmation, plus a written reason. Both are checked on the server.
   */
  purgeInquiry: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        confirmId: z.number().int().positive(),
        reason: reasonSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      authorize(ctx, "inquiry.purge");
      if (input.confirmId !== input.id) {
        await recordAudit(ctx, {
          action: "inquiry.purge",
          subjectType: "inquiry",
          subjectId: input.id,
          reason: input.reason,
          outcome: "denied",
          details: { rejected: "confirmation-mismatch" },
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Confirmation does not match this inquiry." });
      }

      const [row] = await ctx.db.select().from(inquiries).where(eq(inquiries.id, input.id)).limit(1);
      if (!row) return { id: input.id, deleted: false }; // idempotent: already gone

      await ctx.db.delete(inquiries).where(eq(inquiries.id, input.id));

      await recordAudit(ctx, {
        action: "inquiry.purge",
        subjectType: "inquiry",
        subjectId: input.id,
        reason: input.reason,
        // Enough to prove what was destroyed, without preserving the personal data itself.
        details: {
          createdAt: row.createdAt.toISOString(),
          status: row.status,
          source: row.source,
          hadEmail: Boolean(row.email),
          hadPhone: Boolean(row.phone),
        },
      });

      return { id: input.id, deleted: true };
    }),

  /** Bulk read of contact details: capped, reasoned, audited. */
  exportInquiries: adminQuery
    .input(z.object({ reason: reasonSchema, status: inquiryStatusEnum.optional() }))
    .mutation(async ({ ctx, input }) => {
      authorize(ctx, "inquiry.export");
      const rows = await ctx.db
        .select()
        .from(inquiries)
        .where(input.status ? eq(inquiries.status, input.status) : undefined)
        .orderBy(desc(inquiries.createdAt))
        .limit(EXPORT_LIMIT);

      await recordAudit(ctx, {
        action: "inquiry.export",
        subjectType: "inquiry",
        subjectId: null,
        reason: input.reason,
        details: { rows: rows.length, status: input.status ?? "all", cap: EXPORT_LIMIT },
      });

      return {
        exportedAt: new Date().toISOString(),
        rows: rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          source: row.source,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          message: row.message,
        })),
        truncated: rows.length === EXPORT_LIMIT,
      };
    }),

  /** Dry run: exactly what a retention pass would touch, changing nothing. */
  retentionPreview: adminQuery.query(async ({ ctx }) => {
    authorize(ctx, "inquiry.read");
    const cutoff = retentionCutoff();
    const rows = await ctx.db
      .select()
      .from(inquiries)
      .where(and(lt(inquiries.updatedAt, cutoff), ne(inquiries.name, "")));
    const affected = rows.filter((row) => row.email || row.phone || row.name !== "[anonymised]");
    return {
      retentionMonths: Number.isFinite(RETENTION_MONTHS) && RETENTION_MONTHS > 0 ? RETENTION_MONTHS : 24,
      cutoff: cutoff.toISOString().slice(0, 10),
      affected: affected.length,
      oldest: rows[0]?.createdAt?.toISOString().slice(0, 10) ?? null,
    };
  }),

  /**
   * Applies the retention policy. Manual, reasoned, audited, and idempotent.
   * Personal fields are cleared; the row, its status, its date and its entry
   * context remain so history and measurement stay correct.
   */
  applyRetention: adminQuery
    .input(z.object({ reason: reasonSchema, confirm: z.literal("ANONYMISE") }))
    .mutation(async ({ ctx, input }) => {
      authorize(ctx, "inquiry.purge");
      const cutoff = retentionCutoff();
      const rows = await ctx.db.select().from(inquiries).where(lt(inquiries.updatedAt, cutoff));
      const targets = rows.filter((row) => row.name !== "[anonymised]" || row.email || row.phone);

      for (const row of targets) {
        await ctx.db
          .update(inquiries)
          .set({ name: "[anonymised]", email: null, phone: null, message: "[anonymised]", updatedAt: new Date() })
          .where(eq(inquiries.id, row.id));
      }

      await recordAudit(ctx, {
        action: "inquiry.retention",
        subjectType: "inquiry",
        subjectId: null,
        reason: input.reason,
        details: { cutoff: cutoff.toISOString().slice(0, 10), anonymised: targets.length, months: RETENTION_MONTHS },
      });

      return { anonymised: targets.length, cutoff: cutoff.toISOString().slice(0, 10) };
    }),

  /** Read-only investigation: what happened, to what, by whom, and why. */
  auditTrail: adminQuery
    .input(
      z
        .object({
          subjectType: z.enum(["inquiry", "project", "content", "session", "system"]).optional(),
          subjectId: z.string().trim().max(64).optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      authorize(ctx, "audit.read");
      const rows = await ctx.db
        .select()
        .from(adminAuditEvents)
        .where(input.subjectType ? eq(adminAuditEvents.subjectType, input.subjectType) : undefined)
        .orderBy(desc(adminAuditEvents.createdAt))
        .limit(input.limit);
      const filtered = input.subjectId ? rows.filter((row) => row.subjectId === input.subjectId) : rows;
      const [total] = await ctx.db.select({ value: count() }).from(adminAuditEvents);
      return { events: filtered, total: total?.value ?? 0 };
    }),
});

export { maskInquiry };
