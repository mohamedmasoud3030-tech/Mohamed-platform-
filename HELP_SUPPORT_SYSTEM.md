# LENA Digital House — Help & Support System

**Baseline:** `4a1bad8` on `arena/01a01ef6-platform` · **Date:** 2026-08-20
**Companion documents:** `docs/RUNBOOK.md` (operator procedures), `ONBOARDING_ACTIVATION_PLAN.md`,
`FEATURE_GAP_STRATEGY.md`

---

## 1. Sizing decision: why there is no help centre

The instinct for "support" is a documentation site. That would be wrong here, and the evidence is in
the product itself:

- The public surface is **six informational pages and one form**. A help centre explaining a six-page
  brochure would be longer than the brochure and would restate the interface.
- The administrative surface has **one user** and **three tabs**. Documentation written for one
  person, stored away from where they work, is documentation nobody opens.
- There is **no billing, no subscription, no team, no integrations, no API consumers, no SLA** —
  the five things that normally justify a knowledge base. (`FEATURE_GAP_STRATEGY.md` §E documents why
  none of them should be built yet.)
- Every extra page is a page that goes stale. The repository already contains one stale document
  (`replit.md`, describing a different product) — proof that this project's real risk is unmaintained
  content, not missing content.

**Decision: help lives as close to the moment of confusion as possible, and only questions the product
actually produces get written down.** One public FAQ page, contextual help inside the dashboard, an
error boundary that hands out a reference, and a runbook in the repository. Nothing else.

---

## 2. Content map

| Layer | Where | Audience | Content | Owner | Update trigger |
|---|---|---|---|---|---|
| **Inline guidance** | Contact form: "only name and details are required"; optional labels; entry-context chip; restored-draft notice | Visitor | Micro-copy at the field | Whoever changes the form | Any field/validation change |
| **Contextual help** | `/dashboard` → collapsible "Quick questions about this screen", per tab | Owner | 2–5 verified answers per tab | Whoever changes that tab | Any behaviour/limit/status change |
| **Troubleshooting (self-service)** | Form error states; dashboard failure cards with retry; error boundary | Both | Cause-specific message + a way out | Feature owner | Any new error path |
| **FAQ / searchable answers** | `/help` — 16 articles, 6 topics, client-side search, `FAQPage` JSON-LD | Visitor | Task-based Q&A | Whoever changes the described behaviour | See freshness tests |
| **Contact support** | WhatsApp (fixed on every page), email, the inquiry form, and `/help` sidebar | Visitor | Three channels, no ticket system | — | Channel change |
| **Status information** | Dashboard "Connection status": live `ping`, healthy/unreachable, app version, re-check | Owner | Real state from the running app | — | — |
| **Support intake** | Dashboard "Report a problem" → structured, previewed, manually sent report | Owner | Safe diagnostic context | — | New context field |
| **Data practices** | `/privacy`, linked from every footer | Visitor | What is collected, why, where, who reaches it, how to request a copy/correction/deletion | Whoever changes data handling | Any change to collection, storage, sharing or retention |
| **Runbook** | `docs/RUNBOOK.md` | Operator | Severity, 8 procedures, escalation, freshness tests | Whoever changes the system | Same PR as the change |

### Deliberately not built

Ticketing system · live chat widget · community forum · video tutorials · a per-feature documentation
tree · a public status page (there is nothing multi-tenant to report on; the dashboard check tells the
only user what they need) · in-app chat with a third party.

---

## 3. Search and navigation

- `/help` filters client-side across question **and** answer text in the active language. No index to
  rebuild, no server round-trip, works offline once loaded.
- Result count is announced with `aria-live` so screen-reader users know filtering happened.
- Answers are grouped under six task topics, not product areas — people search by problem, not by module.
- Every article has a stable `id` and is a `<details>` element, so `/help#form-blocked` is a shareable
  deep link to one answer.
- Articles carry optional deep links **into** the product (`/contact`, `/services`, `/portfolio`), so
  the answer ends in the action rather than in more reading.
- Entry points: footer on every page, the `/help` sidebar's own escalation block, and search engines
  via `FAQPage` structured data.

---

## 4. Support intake design

Captured automatically (`src/lib/support.ts`):

`reference` (LENA-YYMMDD-XXXX) · `build` (short commit + build date) · `route` (**pathname only**) ·
`role` (visitor / signed-in / admin) · `locale` · `viewport` · `online` · `occurredAt`.

Provided by the person, in free text: what they were doing, what they expected, what happened.

**Never captured:** passwords, tokens, cookies, session identifiers, form values, inquiry contents,
visitor names, emails or phone numbers, query strings, `localStorage`, stack traces, IP addresses.
The route is taken as `window.location.pathname` specifically so a query string can never smuggle
personal data into a report.

**Nothing is transmitted automatically.** The full report is rendered on screen first; the person then
chooses Copy, WhatsApp, or email. There is no telemetry endpoint, no third-party SDK, and no network
call in the entire support path.

Acknowledgement and expectations:

| Channel | Acknowledgement | Response expectation |
|---|---|---|
| Inquiry form | Immediate on-screen confirmation with reference `#id` | **One business day** (owner-approved commitment, stated identically on `/contact` and `/help`) |
| WhatsApp | The visitor's own client confirms delivery | Fastest channel; same one-business-day commitment |
| Owner problem report | The reference exists before sending, so it can be quoted immediately | Per severity table in `docs/RUNBOOK.md` |

Routing: visitor questions → owner, via the existing channels. Owner technical problems → maintainer,
via a report containing a reference the maintainer can correlate with server logs.

---

## 5. Privacy position (as implemented, not as aspiration)

- The site sets **no analytics, advertising or third-party cookies**. There is no tracker in the
  bundle (`grep` for `gtag|analytics|plausible|posthog|umami` returns nothing).
- The contact-form draft lives in `localStorage` on the visitor's own device and is deleted on
  successful submission. It is never transmitted.
- Rate limiting stores a **salted HMAC** of the network address, not the address, and rows expire
  after 30 days.
- Activation is measured only from data the product already owns (`inquiries.source`), never from
  visitor tracking.
- Deletion requests are handled manually and documented in `docs/RUNBOOK.md` §R8.

**Open owner item:** a `/privacy` page. The help page states what is collected and how to request
deletion, which is honest and useful — but a retention period and a formal notice are legal text the
owner must author. Tracked in `FEATURE_GAP_STRATEGY.md` §B4.

---

## 6. Escalation for security, data and payment

Security, personal-data and payment issues are **S1 by default**, independent of how many people are
affected. Procedure, thresholds and the non-negotiable rules (never request credentials; never move
inquiry contents into an external tool; rotate `APP_SECRET` to force a global sign-out) are in
`docs/RUNBOOK.md` §1. There is no payment surface today; if one is added it inherits S1 automatically.

---

## 7. Freshness tests

Content that drifts from behaviour is worse than no content. Seven checks, listed in
`docs/RUNBOOK.md` §3, cover: upload limits, the inquiry rate limit, status names, help deep-link
validity, sign-in error coverage, the reply-time promise appearing identically in both places, and no
help text describing a non-existent feature.

Four of these are **executable** and were run for this change (§8). The remaining three are review
questions at pull-request time.

**Update triggers:** the owner of a change updates the help content in the same pull request. A change
to a limit, a status name, an error message, a route, or the reply promise is not complete until the
corresponding help text moves with it.

---

## 8. Verification performed

| Check | Result |
|---|---|
| `pnpm run typecheck` | pass |
| `pnpm run build` | pass, sitemap now 23 URLs (`/help` included) |
| Every help deep link resolves to a registered route | pass (automated) |
| Upload limits in help text match `PROJECT_MEDIA_MAX_BYTES` / MIME map | pass (automated) |
| Rate limit quoted to visitors matches the server constant | pass (automated) |
| Every `?error=` value emitted by `oauth.ts` has a sentence in `Login.tsx` | pass (automated) |
| Reply-time promise identical on `/contact` and `/help` | pass (automated) |
| Support report contains no secrets, no personal data, no query string | pass (automated, incl. hostile input) |
| Error boundary renders a reference and a recovery path instead of a blank page | pass (component harness) |
| `/help` reachable, deep links work, FAQ JSON-LD valid | pass (live server) |
| No new runtime dependency | pass |

**Honest limitation:** as in the previous round, no browser could be installed in this environment, so
`/help` and the dashboard panels were verified through the live server, structural checks and
component harnesses — not by pixel inspection. Mobile layout follows the existing breakpoints and the
44px touch-target rule already enforced in `styles/onboarding.css`.

## 9. Owner-controlled items still open

1. **`/privacy` page text** — legal, owner-authored (§5).
2. **SMTP credentials** — until set, the visitor's only acknowledgement is the on-screen confirmation,
   and the owner must check the dashboard rather than rely on email (`docs/RUNBOOK.md` §R2).
3. **Pricing answer wording** — the FAQ states there is no fixed price list and that scope and cost are
   defined before commitment. That is procedural and safe, but it is commercial language: review it.
4. **Second admin identity** — the sign-in lockout in `docs/RUNBOOK.md` §R3 has no recovery path today.
