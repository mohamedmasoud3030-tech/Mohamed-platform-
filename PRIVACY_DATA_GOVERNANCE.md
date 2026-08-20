# LENA — Privacy & Data Governance

**Version:** 1.0 · **Date:** 2026-08-20 · **Baseline:** `aa7534e`
**Companion:** `ADMIN_SUPPORT_OPERATIONS_SPEC.md`, `AI_FEATURE_SYSTEM.md`, `docs/RUNBOOK.md`

> **Scope boundary, stated plainly.** This document is engineering and product practice. It is **not
> legal advice**, it does not assert compliance with GDPR, PDPL or any other regime, and it claims no
> certification. Where a real legal determination is required it is listed in §9 as an open question
> for a qualified lawyer, not answered here.

---

## 1. Data inventory

| Data | Source | Purpose | Stored where | Who can reach it | Sensitivity |
|---|---|---|---|---|---|
| Inquiry name | Typed by the visitor | Address them in the reply | `inquiries.name` | Admin after sign-in | Personal |
| Inquiry message | Typed by the visitor | Understand the request | `inquiries.message` | Admin after sign-in | Personal, possibly commercially confidential |
| Inquiry email | Optional, typed | Reply | `inquiries.email` | **Masked in the list**; full value only via a reasoned, audited reveal | Personal |
| Inquiry phone | Optional, typed | Reply | `inquiries.phone` | Same as email | Personal |
| Service / track | Optional, chosen | Route the request | `inquiries.service` | Admin | Non-personal |
| Entry context (`source`) | Derived from the page | Know which page produces clients | `inquiries.source` | Admin | **Non-personal by construction** — a page identifier only |
| Inquiry status | Set by the operator | Workflow | `inquiries.status` | Admin | Non-personal |
| Network fingerprint | Derived at submission | Rate limiting | `inquiry_rate_limits.identifier_hash` | Server only | **Salted one-way HMAC — not the address**, expires after 30 days |
| Admin identifier | Sign-in provider | Authenticate the operator | `users.union_id` | Server | Pseudonymous |
| Admin display name | Sign-in provider | Show who is signed in | `users.name` | Admin | Personal (the founder's own) |
| Admin avatar URL | Sign-in provider | **None — removed** | Column retained, **no longer written** | — | Was collected and never displayed; see §3 |
| Session cookie | Issued at sign-in | Keep the operator signed in | Browser, httpOnly, 1 year | The operator's browser | Sensitive credential |
| Audit events | Operator actions | Accountability | `admin_audit_events` | Admin, read-only | **Contains no personal data by design and by test** |
| Language / theme preference | The visitor's choice | Serve the right version | Visitor's `localStorage` | The visitor only | Non-personal |
| Inquiry draft | Typed, before sending | Do not lose text on refresh | Visitor's `localStorage` | The visitor only | Personal, **never transmitted** |
| Project content and media | Authored by the founder | Public portfolio | Database + object storage | Public once published | Non-personal |

**Not collected anywhere:** IP addresses in raw form, user agents, referrers, device or advertising
identifiers, page-view logs, location, payment data, or any special-category data.

## 2. Flow map

```
Visitor ──types──▶ browser localStorage (draft, preferences)  ─── never leaves the device
   │
   └──submits──▶ API ──▶ inquiries (name, message, optional email/phone, source)
                   │
                   ├──▶ inquiry_rate_limits (salted HMAC of the network address, 30-day expiry)
                   └──▶ email notification to the owner  [only if SMTP is configured]

Operator ──signs in──▶ OAuth provider ──▶ users (identifier, display name, last sign-in)
   │
   ├──reads──▶ inquiries with email and phone MASKED
   ├──reveals (reason required)──▶ full contact details  ──▶ admin_audit_events (that it happened, never what)
   └──archives / purges / exports (reason required)      ──▶ admin_audit_events

Third parties receiving data: the sign-in provider (operator identity only)
                              the email service (notification contents, only if configured)
No analytics. No advertising. No embeds. No AI provider. No fonts or scripts from other origins.
```

Cross-border considerations visible from the project: the sign-in provider, the email service, the
database host and the object-storage host may process data outside Oman. Which regions apply depends
on the accounts the owner configures — this is a factual dependency to record per provider, not a
compliance conclusion (§9).

## 3. Minimisation — what changed in this pass

| Finding | Action |
|---|---|
| The OAuth avatar URL was collected and stored on every sign-in and **displayed nowhere in the product** | **Stopped collecting it.** The column remains but is never written; dropping it is an owner decision (§9) |
| Mail transport failures were logged with the full error object, which routinely carries the recipient address and envelope | **Redacted.** Only the error name, code and a message with any address pattern replaced by `[redacted]`, truncated to 200 characters |
| The successful-notification log line included the destination address | Removed; only the inquiry number is logged |
| Contact details were fully visible in the operator's list view | **Masked by default**; full values require a written reason and are audited |
| Permanent deletion of an inquiry was one click | **Downgraded to reversible archiving**, with irreversible deletion gated behind typed confirmation, a reason, and an audit record |

Already minimal before this pass, and confirmed: no trackers, no third-party requests, no raw IP
storage, drafts never transmitted, entry context carries no personal data.

## 4. Access control

Server-enforced, never interface-enforced. Verified with 30 automated assertions against a real
database and real sessions (`ADMIN_SUPPORT_OPERATIONS_SPEC.md` §6): anonymous and signed-in
non-admin identities are refused every privileged read and action, including direct endpoint calls.
Contact details are masked in list views; unmasking is per-record, reasoned and audited.

## 5. Legal basis — reasoning, not a ruling

| Processing | Practical basis | Consent needed? |
|---|---|---|
| Storing and replying to an inquiry | The person deliberately contacted a business to ask for a service | **No.** A consent banner for data someone typed into a contact form is a dark pattern, not a protection |
| Rate-limit fingerprint | Necessary to keep the form usable; one-way and short-lived | **No** |
| Language/theme preference and form draft in `localStorage` | Strictly necessary to deliver what the user asked for, stored on their own device, never transmitted | **No** — cookie-consent rules generally target tracking, which this product does none of |
| Operator session cookie | Strictly necessary for authentication | **No** |
| Analytics, advertising, profiling | **Not performed.** If ever added, it would require genuine, revocable, opt-in consent **before** loading | Would be **yes** |

**Position: no consent banner today**, because there is nothing to consent to. That position becomes
invalid the moment any analytics or third-party embed is added — which is exactly why the egress guard
(`tools/check-egress.mjs`) fails the build when a new outbound host appears.

## 6. Retention — recommended, not yet enforced

| Data | Current behaviour | Recommendation |
|---|---|---|
| Inquiries | Kept indefinitely | **Anonymise or delete after 24 months** of no status change. Long enough for a real sales cycle and repeat clients; short enough that a stale database is not a liability |
| Rate-limit fingerprints | Deleted after 30 days | Keep as is |
| Audit events | Kept indefinitely | Keep — no personal data, and accountability loses its value if it expires |
| Admin user rows | Kept indefinitely | Keep while the person is an operator; remove within 30 days of them stopping |
| Project media | Kept indefinitely | Keep — published business content |
| Server logs | Host-dependent | Confirm the host's rotation window and record it |

**Retention is a policy commitment, not an engineering preference — it needs owner approval before any
automated deletion runs.** See §10.

## 7. User rights — implemented workflow

Provider-neutral and account-free, because visitors have no account:

1. **Request** — WhatsApp or email, quoting the reference number shown after submission.
2. **Identity check** — the reference number, or a reply from the same channel the inquiry used. **No
   password, no verification code, and no identity document is ever requested.** A request that cannot
   be tied to the original submission is declined, with an explanation.
3. **Fulfil** — *Copy*: the operator sends back the stored record. *Correction*: edited on request.
   *Deletion*: the gated purge, which requires a typed confirmation and a written reason.
4. **Confirm** — in writing, quoting the reference.
5. **What survives a deletion** — one audit event proving a deletion occurred: when the record was
   created, its status and source, and whether it had an email or phone. **No name, no message, no
   contact value.**
6. **Failure recovery** — if the deletion fails, nothing is reported as done; the operator retries and
   the failure is visible in the audit trail.

**Backups:** whatever the database host retains is outside application control. The honest statement is
that a deleted record may persist in host backups until those backups roll over, and that it will not
be restored into the live system. Confirming the host's window is an open item (§9).

**Account closure:** not applicable — visitors have no account. If an operator leaves, remove their
identifier from `OWNER_UNION_ID` and delete their `users` row.

## 8. Technical controls in place

Masking by default · reasoned, audited unmasking · append-only audit trail with no personal data ·
server-side authorization on every privileged path · one-way salted hashing with expiry for abuse
prevention · redacted transport-error logs · no request bodies, headers, cookies or authorization
values in logs · drafts kept on the device and deleted on submission · rate limiting and honeypot on
the only public write · signed, type-and-size-limited media uploads · a build-blocking egress guard ·
and a documented rule that **no visitor data is ever sent to an AI provider**.

## 9. Open questions for qualified legal review

1. Which regimes actually apply, given an Oman-based operator serving Arabic and English markets that
   may include the EU and UK.
2. Whether a formal privacy notice with specific statutory disclosures is required in addition to the
   factual `/privacy` page now published.
3. The lawful basis and any transfer mechanism needed for the sign-in provider, the email service, the
   database host and the object-storage host — including their processing regions and whether data
   processing agreements are required.
4. The defensible retention period for business inquiries in the applicable jurisdictions.
5. Whether the recommendation to name clients in case studies requires written consent in a specific
   form (`FEATURE_GAP_STRATEGY.md` §D1).
6. Backup retention windows at each host, and whether the deletion statement in §7 is sufficient.

**Recommendation: a short review by a qualified lawyer before the English market is actively marketed
to.** Nothing above should be read as a determination.

## 10. Tests

| Test | Where | Result |
|---|---|---|
| Non-admins cannot reach any personal data or privileged action | `e2e/verify-admin.sh` | 17/17 refused |
| Contact details are masked in list views | `e2e/verify-admin.sh` | pass |
| Unmasking requires a real reason and is audited | `e2e/verify-admin.sh` | pass |
| The audit trail contains no personal data | `e2e/verify-admin.sh` | pass (asserted against real values) |
| Deletion is gated, idempotent, and leaves no personal data behind | `e2e/verify-admin.sh` | pass |
| The support report captures no personal data even with a hostile URL | `e2e/verify-support.mjs` | pass |
| Crash reports leak no personal data or stack traces to the screen | `e2e/verify-boundary.mjs` | pass |
| Form drafts never leave the device and survive hostile storage | `e2e/verify-draft.mjs` | pass |
| No AI SDK, model endpoint or undeclared outbound host exists | `tools/check-egress.mjs` (runs in every build) | pass |

**Still to be built when retention is approved:** an automated retention job, plus a test proving it
deletes exactly the intended rows and nothing else.
