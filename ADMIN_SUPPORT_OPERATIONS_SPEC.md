# LENA — Admin & Support Operations Spec

**Version:** 1.0 · **Date:** 2026-08-20 · **Baseline:** `aa7534e`
**Companion:** `docs/RUNBOOK.md` (procedures), `PRIVACY_DATA_GOVERNANCE.md` (data rules)

---

## 1. What operations actually means here

One operator. A few inquiries a week. A handful of projects. The real operational job is small:
**read an inquiry, contact the person, record what happened, publish work.** Everything else that a
generic admin panel offers — user management, impersonation, bulk editing, refunds, feature flags —
either has no subject in this product or is a liability.

So the design goal is the opposite of the usual one: **not "what can we let the admin do", but "what
is the least the operator needs, and how do we make the dangerous parts hard to do by accident".**

### Every privileged capability, challenged

| Capability | Verdict |
|---|---|
| Read inquiries | **Keep** — this is the product's whole purpose |
| See contact details | **Keep, but masked by default.** Reading a list should not be the same as harvesting it. Full details require a reason and are audited |
| Change inquiry status | **Keep** — core workflow, now idempotent and audited |
| Delete an inquiry | **Downgraded.** One click permanently destroying a potential client was the single most dangerous control in the product. Default is now reversible archiving |
| Permanently delete an inquiry | **Keep, heavily gated.** Legitimately needed for deletion requests. Requires typed confirmation of the record's own id, a written reason, and an audit record |
| Export inquiries | **Keep, capped and audited.** Legitimate for backup and offline follow-up; capped at 200 rows, reason required |
| Create/edit/publish projects | **Keep** — publishing is the founder's job |
| Delete a project | **Keep, reasoned and audited** |
| Content entries | **Keep read/write**, but the tab is a ghost feature (`FEATURE_GAP_STRATEGY.md` §F2) |
| **Impersonation** | **Rejected.** There is no user account to impersonate. It would exist only to view visitor data, which no workflow needs |
| **User management / role editing** | **Rejected for now.** Admin is granted by a single environment identity. A UI to change roles is a privilege-escalation surface with no current use |
| **Bulk actions** | **Rejected.** At this volume they save seconds and can destroy everything in one click |
| **Feature flags / live configuration editing** | **Rejected.** Configuration is environment variables reviewed at deploy time |
| **Raw SQL / query console** | **Rejected outright.** The definition of a dangerous super-admin dashboard |
| **Refunds, cancellations, credits** | **Not applicable** — no payment surface exists. If one is ever added, these inherit the highest risk tier |

---

## 2. Role and capability matrix

Capabilities are checked server-side by name, never by role literal scattered through the code, so
separating duties later is a one-line change.

| Capability | `user` (signed in, not staff) | `support` (defined, not yet granted) | `admin` (the founder) |
|---|---|---|---|
| `inquiry.read` (masked) | ✗ | ✓ | ✓ |
| `inquiry.reveal` (unmask, reasoned, audited) | ✗ | ✓ | ✓ |
| `inquiry.status` | ✗ | ✓ | ✓ |
| `inquiry.archive` (reversible) | ✗ | ✓ | ✓ |
| `inquiry.purge` (irreversible) | ✗ | **✗** | ✓ |
| `inquiry.export` (bulk contact data) | ✗ | **✗** | ✓ |
| `project.read` | ✗ | ✓ | ✓ |
| `project.write` / `project.delete` | ✗ | ✗ | ✓ |
| `content.read` | ✗ | ✓ | ✓ |
| `content.write` / `content.delete` | ✗ | ✗ | ✓ |
| `audit.read` | ✗ | ✗ | ✓ |

`support` exists as a shape, not as a grant: nobody holds it. It encodes the judgement that a helper
should be able to progress work and contact people **without** being able to destroy records or walk
away with the contact list. Granting it later requires only adding the role value — no procedure
changes.

**Self-lockout protection:** there is no interface that can remove the founder's own access. Admin is
derived from `OWNER_UNION_ID`, which lives outside the application. The known consequence — a single
identity with no recovery path — is tracked in `FEATURE_GAP_STRATEGY.md` §B1 and `docs/RUNBOOK.md` §R3,
and its fix (a second allowlisted identity) needs owner approval.

---

## 3. Workflows

**W1 — Triage.** Sign in → the inquiries card shows how many are new → open the list (contact details
masked) → read the message and the entry context → set the status. Status changes are idempotent and
audited; setting the same status twice records nothing.

**W2 — Contact a person.** Press *Reveal contact details* → write why (minimum 8 characters) →
the full email and phone are returned for that one record and an audit event is written recording
*that* they were revealed, never *what* they were.

**W3 — Clear the working list.** *Archive* removes an inquiry from the active list, is reversible, and
is idempotent.

**W4 — Honour a deletion request.** *Delete permanently* → type the inquiry's own number back → write
a reason → confirm. The row is destroyed. The audit event keeps proof: when it was created, its status
and source, and whether it had an email or phone — **never the values**. Repeating the deletion returns
success rather than an error, so a double-click cannot produce a confusing failure.

**W5 — Export.** Reason required, capped at 200 rows, audited with the row count and filter.

**W6 — Investigate.** Open *Audit trail*: a read-only list of what happened, to what, by whom, with
what outcome and reason — including refused attempts.

---

## 4. Risk controls, and where each is enforced

| Control | Implementation |
|---|---|
| Server-side authorization | Every privileged procedure calls `authorize(ctx, capability)`; the interface only hides buttons, it never grants |
| Scoped data access | `inquiries.list` returns masked contact fields; full values exist only in the single-record reveal path |
| Sensitive-field masking | `maskEmail` / `maskPhone` keep a record recognisable without being harvestable |
| Action preview | Every gated action states, before confirmation, exactly what will happen and whether it can be undone |
| Confirmation for high impact | Permanent deletion requires typing the record's own id, checked **server-side**, not just in the browser |
| Reason capture | Required for reveal, purge, export and content deletion; enforced by schema, minimum 8 characters |
| Immutable audit events | Append-only table; the application exposes no update or delete path |
| Idempotency | Repeated status changes, archives and purges are no-ops that report success |
| Bulk limits | Export capped at 200 rows and reported as truncated |
| Partial-failure recovery | A failed audit write is logged but never rolls back the operator's action; the gap is visible in the server log |
| No hidden-button trust | Verified: a signed-in non-admin calling the endpoints directly receives `FORBIDDEN` |
| No backdoors | No hardcoded credential, no bypass token, no debug route. The egress guard blocks new undeclared outbound hosts |

**Audit rows never contain personal data.** This is asserted by an automated test, not by convention.

---

## 5. UX states

Each gated action has five: **idle** (button) → **explaining** (what it does, whether reversible) →
**collecting** (reason, and confirmation for destructive actions) → **working** (disabled, "working…")
→ **result** (revealed values announced with `aria-live`, or the list refreshed). Errors are specific:
a too-short reason and a mismatched confirmation say different things. Destructive panels are visually
distinct. All targets meet the 44px rule, and everything works in Arabic and English, RTL and LTR.

The audit trail has its own empty state ("no actions recorded yet"), a loading state, and a failure
state, following the same guided pattern as the rest of the dashboard.

---

## 6. Tests (executed, not aspirational)

`e2e/verify-admin.sh` runs against a real server, a real PostgreSQL database and real signed sessions
for two identities (`role=admin`, `role=user`). **30 assertions, all passing:**

| Group | Result |
|---|---|
| Anonymous cannot reach 6 privileged reads, nor purge, reveal or export | 9/9 refused with `UNAUTHORIZED` |
| Signed-in non-admin cannot reach any privileged read or action | 8/8 refused with `FORBIDDEN` |
| Public endpoints still work for everyone | 2/2 |
| Admin list masks contact details; no full email or phone appears | 3/3 |
| Reveal rejects a token reason, accepts a real one, returns full values | 3/3 |
| Purge refuses mismatched confirmation and short reasons, succeeds correctly, and is idempotent | 4/4 |
| Archive is reversible and idempotent | 3/3 |
| Status change is idempotent | 1/1 |
| Audit trail records reveal, purge, archive **and the refused attempt**, always with a reason, and **contains no personal data** | 6/6 |

Re-run with: start the test database, seed two sessions, then `bash e2e/verify-admin.sh`.

---

## 7. Not implemented, deliberately

Impersonation · user/role management UI · bulk operations · raw query tools · live configuration
editing · refunds and financial actions (no payment surface) · scheduled deletion jobs (retention is a
policy decision — see `PRIVACY_DATA_GOVERNANCE.md`) · notification of the operator on privileged
actions (one operator; the audit trail is sufficient).

## 8. Owner decision required

Database-level enforcement of audit immutability: revoking `UPDATE` and `DELETE` on
`admin_audit_events` from the application's database role. The application already exposes no such
path, so this closes the gap where a future code change, or direct database access, could rewrite
history. It is a one-statement change with no downtime and is fully reversible, but it is a production
database operation and therefore needs owner authorisation.
