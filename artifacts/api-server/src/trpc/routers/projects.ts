import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { projects, PROJECT_STATUS_VALUES } from "@workspace/db";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { recordAudit } from "../../lib/admin-authorization";

const projectStatusEnum = z.enum(PROJECT_STATUS_VALUES);
const localizedText = z.object({
  ar: z.string().trim().max(10000),
  en: z.string().trim().max(10000),
});
const localizedList = z.object({
  ar: z.array(z.string().trim().min(1).max(255)).max(24),
  en: z.array(z.string().trim().min(1).max(255)).max(24),
});
const contentBlocks = z.object({
  overview: localizedText.optional(),
  challenge: localizedText.optional(),
  direction: localizedText.optional(),
  solution: localizedText.optional(),
  features: localizedList.optional(),
  journey: localizedList.optional(),
}).default({});
const galleryItem = z.object({
  url: z.string().trim().url(),
  label: localizedText.optional(),
  caption: localizedText.optional(),
  kind: z.enum(["brand", "platform", "campaign", "commerce", "launch", "automation", "dashboard", "story"]).optional(),
  layout: z.enum(["wide", "standard", "tall"]).optional(),
});

const projectInput = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(10000).optional(),
  imageUrl: z.string().trim().url().optional(),
  projectUrl: z.string().trim().url().optional(),
  repositoryUrl: z.string().trim().url().optional(),
  contentBlocks,
  gallery: z.array(galleryItem).max(24).default([]),
  relatedServices: z.array(z.string().trim().min(1).max(255)).max(24).default([]),
  status: projectStatusEnum.default("draft"),
  sortOrder: z.number().int().min(0).default(0),
});

export const projectsRouter = createRouter({
  listPublished: publicQuery.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  }),

  getPublishedBySlug: publicQuery
    .input(z.object({ slug: z.string().trim().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(projects)
        .where(and(eq(projects.slug, input.slug), eq(projects.status, "published")))
        .limit(1);
      return result[0] ?? null;
    }),

  list: adminQuery.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  }),

  create: adminQuery
    .input(projectInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(projects).values(input).returning();
      return result[0];
    }),

  update: adminQuery
    .input(projectInput.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const result = await ctx.db
        .update(projects)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
      if (!existing) return { success: true }; // idempotent
      await ctx.db.delete(projects).where(eq(projects.id, input.id));
      await recordAudit(ctx, {
        action: "project.delete",
        subjectType: "project",
        subjectId: input.id,
        reason: input.reason,
        details: { slug: existing.slug, status: existing.status, title: existing.title },
      });
      return { success: true };
    }),
});
