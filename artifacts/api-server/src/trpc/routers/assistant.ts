import { createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { logger } from "../../lib/logger";
import { geminiEnabled, geminiModel, generateText } from "../../lib/assistant/gemini";
import {
  ASSISTANT_SYSTEM_PROMPT,
  buildContents,
  composeFallbackAnswer,
  sanitiseModelAnswer,
  sourcesFromMatches,
  type AssistantTurn,
} from "../../lib/assistant/prompt";
import { retrieveArticles } from "../../lib/assistant/retrieval";
import { SlidingWindowLimiter } from "../../lib/assistant/rate-limit";
import type { TrpcContext } from "../context";

/**
 * LENA Assistant — a grounded help bot for visitors.
 *
 * Ground truth is the verified help corpus (@workspace/content). Gemini may
 * only rephrase it; when the key is missing, invalid, over budget or slow, the
 * endpoint answers deterministically from the same corpus, so the feature
 * degrades to the help page's own behaviour and never breaks (mode: "fallback").
 *
 * Privacy contract: visitor questions are sent to the model provider to be
 * answered and are never persisted, never logged, and never associated with an
 * inquiry. The limiter key is a hashed IP held in memory for minutes only.
 */

const ASSISTANT_RATE_LIMIT = 20;
const ASSISTANT_WINDOW_MS = 10 * 60 * 1000;
const limiter = new SlidingWindowLimiter(ASSISTANT_RATE_LIMIT, ASSISTANT_WINDOW_MS);

function limiterKey(ctx: TrpcContext): string {
  const address = (ctx.req.ip || ctx.req.socket.remoteAddress || "unknown").trim().toLowerCase();
  const normalised = address.startsWith("::ffff:") ? address.slice(7) : address;
  return createHash("sha256").update(normalised).digest("hex");
}

const turnSchema = z.object({
  role: z.enum(["visitor", "assistant"]),
  content: z.string().trim().min(1).max(800),
});

export const assistantRouter = createRouter({
  /** Whether the generative mode is active. Exposes nothing about the key. */
  status: publicQuery.query(() => ({
    enabled: geminiEnabled(),
    model: geminiEnabled() ? geminiModel() : null,
  })),

  ask: publicQuery
    .input(
      z.object({
        message: z.string().trim().min(1).max(800),
        locale: z.enum(["ar", "en"]).default("ar"),
        history: z.array(turnSchema).max(6).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!limiter.check(limiterKey(ctx))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many assistant messages. Please try again later.",
        });
      }

      const startedAt = Date.now();
      const matches = retrieveArticles(input.message, input.locale);

      let mode: "gemini" | "fallback" = "fallback";
      let answer: string;
      let failureKind: string | null = null;

      const result = await generateText({
        systemInstruction: ASSISTANT_SYSTEM_PROMPT,
        contents: buildContents(input.message, input.locale, input.history as AssistantTurn[]),
      });

      if (result.ok) {
        const sanitised = sanitiseModelAnswer(result.text);
        if (sanitised.length > 0) {
          mode = "gemini";
          answer = sanitised;
        } else {
          failureKind = "empty_answer";
          answer = composeFallbackAnswer(input.locale, matches).answer;
        }
      } else {
        failureKind = result.kind;
        answer = composeFallbackAnswer(input.locale, matches).answer;
      }

      const sources = mode === "gemini" ? sourcesFromMatches(input.locale, matches) : composeFallbackAnswer(input.locale, matches).sources;

      // Operational log only: shape of the call, never its content.
      logger.info(
        { route: "assistant.ask", mode, failureKind, locale: input.locale, latencyMs: Date.now() - startedAt },
        "assistant turn answered",
      );

      return { mode, answer, sources };
    }),
});
