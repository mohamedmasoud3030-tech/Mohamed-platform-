import type { TrpcContext } from "../trpc/context";
import { adminAuditEvents } from "@workspace/db";

/**
 * Capability model.
 *
 * Roles exist so that duties can be separated the day a second person helps —
 * without rewriting every procedure then. Today only `admin` is granted, but
 * every privileged procedure asks for a capability rather than a role, so
 * adding a limited operator later is a one-line change here, not a refactor.
 */
export const CAPABILITIES = [
  "inquiry.read", // see the inquiry list with contact details masked
  "inquiry.reveal", // unmask one inquiry's contact details (audited)
  "inquiry.status", // move an inquiry through its workflow
  "inquiry.archive", // reversible removal from the working list
  "inquiry.purge", // irreversible deletion — highest risk action in the product
  "inquiry.export", // bulk read of contact details (audited, capped)
  "project.read",
  "project.write",
  "project.delete",
  "content.read",
  "content.write",
  "content.delete",
  "audit.read", // read the accountability trail
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Least privilege by construction: a role receives only what its duties need.
 * `support` is defined but not yet granted to anyone — it is the shape a future
 * helper would take: can see and progress inquiries, can never delete or export.
 */
const ROLE_CAPABILITIES: Record<string, readonly Capability[]> = {
  admin: CAPABILITIES,
  support: ["inquiry.read", "inquiry.reveal", "inquiry.status", "inquiry.archive", "project.read", "content.read"],
  user: [],
};

export function capabilitiesFor(role: string | undefined): readonly Capability[] {
  return ROLE_CAPABILITIES[role ?? "user"] ?? [];
}

export function hasCapability(role: string | undefined, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability);
}

/** Actions that may never be taken without a written reason. */
export const REASON_REQUIRED: ReadonlySet<Capability> = new Set([
  "inquiry.reveal",
  "inquiry.purge",
  "inquiry.export",
  "project.delete",
  "content.delete",
]);

export type AuditInput = {
  action: string;
  subjectType: "inquiry" | "project" | "content" | "session" | "system";
  subjectId?: string | number | null;
  reason?: string | null;
  details?: Record<string, unknown>;
  outcome?: "success" | "denied" | "failed";
};

/**
 * Appends an immutable accountability record.
 *
 * Never throws into the caller: a failure to write the audit row must not
 * silently roll back the operator's work, but it must be visible in the server
 * log so the gap is discoverable.
 */
export async function recordAudit(ctx: TrpcContext, input: AuditInput): Promise<void> {
  try {
    await ctx.db.insert(adminAuditEvents).values({
      actorUserId: ctx.user?.id ?? null,
      actorUnionId: ctx.user?.unionId ?? null,
      actorRole: ctx.user?.role ?? "unknown",
      action: input.action,
      subjectType: input.subjectType,
      subjectId: input.subjectId == null ? null : String(input.subjectId).slice(0, 64),
      reason: input.reason?.trim() ? input.reason.trim().slice(0, 2000) : null,
      details: input.details ?? {},
      outcome: input.outcome ?? "success",
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}

/**
 * Masking helpers.
 *
 * The operator list shows enough to recognise a person and decide what to do,
 * but not enough to quietly harvest a contact list. Full values require an
 * explicit, reasoned, audited reveal.
 */
export function maskEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!domain) return "•••";
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : "";
  return `${head}${"•".repeat(Math.max(2, Math.min(local.length - 2, 6)))}${tail}@${domain}`;
}

export function maskPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  return `${"•".repeat(Math.max(2, digits.length - 3))}${digits.slice(-3)}`;
}
