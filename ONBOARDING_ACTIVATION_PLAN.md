# LENA Digital House — Onboarding & Activation Plan

**Baseline:** commit `e8acd9b` on `arena/01a01ef6-platform`
**Date:** 2026-08-20
**Update (2026-08-20):** since this plan was written, each language received its own address
(`/ar/...`, `/en/...`). The journeys below are unchanged in shape, but a first-time visitor is now
routed by device language to a real, shareable URL, and a shared link always opens in the language it
was shared in. Activation measurement described in §5 is now implemented as a provider-neutral,
collection-disabled event layer — see `PRODUCT_MEASUREMENT_PLAN.md`.

**Method:** entered the running application as a stranger, then as the owner; every claim below is
backed by repository evidence or by a command executed against a real running stack
(PGlite Postgres + the real API server + the real frontend).

---

## 1. What this product's onboarding actually is

Most onboarding frameworks assume signup → verification → profile → workspace → invite team.
**None of that exists here, and none of it should be built.** The repository has no signup route, no
registration procedure, no team or organisation model, and exactly two roles (`user`, `admin`) with
admin pinned to a single `OWNER_UNION_ID`. Inventing an account funnel would add friction in front of
a service business whose buyers convert by sending one message.

So this product has **two distinct onboarding journeys**, and they have opposite shapes:

| | Visitor (prospective client) | Owner (single admin) |
|---|---|---|
| **Population** | ~100% of traffic | 1 person |
| **First meaningful value** | *Sending the first inquiry and receiving a credible acknowledgement that a human will reply* | *Seeing a real inquiry arrive and being able to act on it* |
| **Minimum information before value** | A name and a description of the need. Nothing else. | Nothing — the owner signs in and the workspace already exists |
| **Correct model** | **No account, proof-first, single primary action, zero mandatory steps** | **Zero-configuration, guided empty states** |
| **Anti-pattern to avoid** | account walls, multi-step wizards, product tours, modals | setup checklists, sample/demo data |

### Selected onboarding model

> **Progressive, account-free activation: the site teaches by showing work, keeps exactly one
> primary action visible everywhere, carries the visitor's context into that action, protects
> anything they have typed, and confirms completion with a verifiable reference.
> The owner gets no wizard — only empty states that explain themselves and a workspace that is
> already correct on first sign-in.**

**On sample/demo data:** deliberately **not** implemented. Seeding fake inquiries or placeholder
projects into a one-owner production database creates real risk (fake leads published as real work)
for a cosmetic benefit. Guided empty states carry the same explanatory load with none of the risk.

---

## 2. Journey — visitor, first visit to first value

```
Search result / shared link
  └─ Landing (any page, each now with its own title and description)
       ├─ Header: brand · nav · language · theme · "لنتحدث"  ← the single primary action
       ├─ Proof: services grid, case studies, process
       └─ Every section ends in one CTA + WhatsApp
            └─ /contact?service=…  or  /contact?work=…      ← context travels with the visitor
                 ├─ Track pre-selected, shown as "بخصوص: …"
                 ├─ Required: name + details. Everything else optional and labelled optional.
                 ├─ Anything typed is kept on the device (refresh-safe)
                 └─ Submit
                      ├─ Success  → reference #id · what happens next · WhatsApp escalation
                      ├─ Rate-limited → explains the wait · WhatsApp fallback · text preserved
                      ├─ Rejected  → explains what to fix · WhatsApp fallback · text preserved
                      ├─ Offline   → says so · text preserved · retry
                      └─ Failure   → retry (button relabels to "إعادة المحاولة") · WhatsApp fallback
```

**Return visit:** the browser restores the draft if the visitor left mid-sentence; `autoComplete`
lets the browser refill name/email/phone; language and theme persist from the previous session.

## 3. Journey — owner, first sign-in and every return

```
/login  (locale-aware, explains what the button does, links back to the site)
  ├─ arrives with ?reason=session  → "انتهت صلاحية جلستك…"
  ├─ arrives with ?error=…         → a specific human sentence per failure cause
  └─ Continue → provider → returns to the page originally requested (allowlisted), not a generic home
       └─ /dashboard
            ├─ "N جديد" badge on inquiries  ← return-visit orientation
            ├─ Empty inquiries → what this screen is, how items arrive, "open the contact page" to test
            ├─ Empty projects  → why projects matter, draft-then-publish explained, link to the editor
            ├─ Load failure    → plain language + "إعادة المحاولة", no mention of migrations
            └─ Each inquiry shows where it came from ("صفحة خدمة: ui-ux", "دراسة حالة: riwaq")
```

---

## 4. Friction found and decisions taken

| # | Friction (evidence) | Decision | Status |
|---|---|---|---|
| F1 | **On phones the primary action disappears.** `responsive.css` sets `.lena-nav-cta{display:none}` below 720px and the mobile menu contained only nav links. The single most important button was unreachable without scrolling. | Add the CTA to the mobile menu using the existing `lena-primary` pattern, full width, 44px. | Fixed |
| F2 | **Context was thrown away at the door.** A visitor reading the UI/UX service page landed on a blank form and had to re-explain themselves; `service` defaulted to empty. | `/contact?service=…` and `?work=…`; the track is pre-selected and echoed as "بخصوص: …". | Fixed |
| F3 | **Abandoned progress was destroyed.** No persistence anywhere; a refresh, a back-navigation or a failed submit erased a long message. | Device-local draft (`lib/inquiryDraft.ts`), restored with a dismissible notice, wiped on success. Never transmitted. | Fixed |
| F4 | **Completion feedback was a one-line sentence** with no reference, no expectation, no next step, no focus move — indistinguishable from nothing happening. | Success panel: reference `#id`, what happens next, WhatsApp escalation, "send another", focus moved and announced via `role="status"`. | Fixed |
| F5 | **All failures looked identical.** Rate-limit, bot-rejection and server error rendered the same sentence; the "use WhatsApp" advice was not a link. | Four distinguished states with specific copy and a real WhatsApp link; submit relabels to "إعادة المحاولة" and the text is preserved. | Fixed |
| F6 | **Sign-in failures returned raw JSON.** `{"error":"Invalid OAuth state"}` on a white page, and a missing env var produced a 500 JSON body — to a non-technical owner. | Every failure path redirects to `/login?error=<cause>` with a specific human sentence. | Fixed |
| F7 | **Expired session was a silent teleport.** `useAuth` navigated to `/login` with no explanation and no memory of the destination. | Redirect carries `?next=<path>&reason=session`; login explains; the provider round-trip returns to the original page. | Fixed |
| F8 | **Open-redirect risk in the new return path.** | `next` is accepted only if it matches `^/dashboard(/…)?$`; everything else is discarded server-side and client-side. Verified with hostile inputs. | Fixed |
| F9 | **Login page ignored the language system**: hard-coded `dir="rtl"` and Arabic-only strings, so an English visitor hit an RTL Arabic wall. | Locale-aware copy and `dir={direction}`, plus a "back to the site" escape hatch. | Fixed |
| F10 | **Empty screens left the owner lost.** Every empty tab said "لا توجد بيانات حتى الآن." | Per-tab guided empty states: what it is, how things arrive, one action. | Fixed |
| F11 | **Technical language in an owner-facing error:** "تأكد من تطبيق migration الجديدة واتصال قاعدة البيانات." | Plain-language failure card + a retry button that refetches. | Fixed |
| F12 | **`inquiries.countNew` existed on the server and was never called.** No orientation on return visits. | Wired to a badge on the inquiries card; invalidated when a status changes. | Fixed |
| F13 | **No activation measurement at all.** | Reuse of the existing `source` column to record entry context (`contact`, `service:<id>`, `work:<slug>`). No new table, no new column, no cookie, no third party, no personal data. Rendered for the owner in readable form. | Fixed |
| F14 | **The journey could not be tested locally.** `vite.config.ts` had no `/api` proxy while the client calls relative `/api/trpc`, so a local frontend could never reach the API. | Dev-only proxy to `http://127.0.0.1:8080`, overridable via `API_PROXY_TARGET`. | Fixed |
| F15 | Mobile keyboards showed the wrong layout for email/phone; returning visitors retyped everything. | `type`/`inputMode`/`autoComplete` on the relevant inputs. | Fixed |

### Explicitly rejected

- **Product tour / coach marks / welcome modal** — a six-page brochure site does not need a guided
  tour; it needs one visible action. Tours here are pure interruption.
- **Account creation or email verification for visitors** — would destroy the primary outcome.
- **Mandatory phone or email** — the form deliberately requires only name and message; making
  contact details mandatory trades reachable leads for unsent ones. WhatsApp remains a zero-field path.
- **Demo/sample data in the owner's database** — see §1.
- **Analytics vendor, cookie banner, visitor fingerprinting** — activation is measured from data the
  product already stores about its own records.
- **Fake urgency, countdowns, "limited slots"** — dishonest and off-brand for a studio selling trust.

---

## 5. Activation events (measured without collecting personal data)

No tracker, no cookie, no third party. Everything below is derivable from rows the product already
owns:

| Event | Where it comes from | Question it answers |
|---|---|---|
| `inquiry_created` | `inquiries` row insert | How many strangers reached first value? |
| `inquiry_entry_context` | `inquiries.source` (`contact` / `service:<id>` / `work:<slug>`) | Which page actually produces clients? |
| `inquiry_channel_left` | whether `email` / `phone` is non-null | Can we even reply? |
| `time_to_first_response` | `created_at` → first `updated_at` with a status change | Speed-to-lead, the top conversion lever |
| `inquiry_qualified` | `status` reaching `qualified` | Lead quality per entry context |
| `owner_backlog` | `inquiries.countNew` | Is the owner keeping up? |

**Not collected:** IP addresses (only a salted HMAC, already used for rate limiting and expired
after 30 days), user agents, referrers, device identifiers, cross-site identifiers, page-view logs.

---

## 6. Acceptance criteria

1. On a 375px viewport the primary action is reachable from the header menu without scrolling.
2. Opening a service page and pressing "ابدأ مشروعك" lands on the form with that track pre-selected
   and shown as context.
3. Typing into the form and reloading the page restores the text with a dismissible notice.
4. A successful submission shows a reference number, the next step, a WhatsApp link, and moves focus
   to the confirmation.
5. Rate-limited, rejected, offline and server errors each produce distinct copy, keep the typed text,
   and offer a working WhatsApp fallback.
6. The server accepts only `contact`, `service:<id>` and `work:<slug>` as entry context and rejects
   anything else.
7. Visiting `/dashboard` with no session lands on `/login?next=/dashboard&reason=session` with an
   explanation, and sign-in returns to the requested page.
8. `next` values pointing off-site, protocol-relative, or outside `/dashboard` are discarded.
9. No sign-in failure ever renders raw JSON.
10. Every dashboard tab's empty and error state explains itself and offers one action.
11. The inquiries card shows a "new" badge driven by `inquiries.countNew`.
12. `/login` renders in the active language and direction.
13. No new mandatory field, modal, tour, or third-party script is introduced.

## 7. Verification performed

Executed against a real stack (PGlite Postgres with the project's own migrations, the built API
server, and the Vite dev server):

| Case | Result |
|---|---|
| Migrations applied, real schema | `content_entries, inquiries, inquiry_rate_limits, projects, users` |
| First value from a service page | inquiry `#1` created, `source=service:visual-identity`, `status=new` |
| First value from a case study, through the dev proxy | inquiry `#6` created, `source=work:riwaq` |
| Hostile entry context (`javascript:alert(1)`) | rejected by validation |
| Bot/honeypot submission | `BAD_REQUEST` → maps to the "rejected" message |
| 6th submission within the hour | `TOO_MANY_REQUESTS` → maps to the "rate" message |
| Admin endpoints anonymously | `UNAUTHORIZED` ×3; public reads still `200` |
| `countNew` value behind the badge | `6` |
| Sign-in with provider unavailable | `302 → /login?error=unavailable` (previously a 500 JSON body) |
| Callback `access_denied` / `server_error` / missing code / bad state | `→ /login?error=cancelled / provider / incomplete / expired` |
| `next=https://evil.example/steal`, `//evil.example`, `/etc/passwd` | discarded, nothing stored |
| `next=/dashboard/projects-editor`, `/dashboard` | preserved |
| Draft recovery harness (12 assertions incl. corrupted JSON, wrong types, injected keys, private mode, absent storage) | all passed |
| Structural mobile/RTL/a11y checks (15 assertions) | all passed |
| `pnpm run typecheck` / `pnpm run build` | pass |

**Honest limitation:** no browser could be installed in this environment (Playwright's Chromium
download is blocked), so mobile and desktop rendering was verified structurally — breakpoints, touch
targets, direction handling, focus and ARIA roles — and through the live dev server, **not** by pixel
inspection. A human glance at the live preview at 375px and 1440px is still worth one minute.

## 8. Success signals

- **Primary:** inquiries per 100 visitors to `/contact` (industry median for a professional-services
  site is ~3–5%).
- **Activation quality:** share of inquiries that arrive with a reachable channel (email or phone).
- **Attribution:** share of inquiries whose `source` is a service or case-study page — if it stays
  near zero after the SEO work lands, the proof pages are not persuading.
- **Owner responsiveness:** median hours from `created_at` to first status change; target under 4.
- **Recovery health:** proportion of submissions that hit an error state; target under 3%.
- **Return-visit friction:** draft restorations followed by a completed submission (visible only as
  a rise in completion rate — nothing is instrumented client-side).

## 9. Owner-controlled decisions still open

1. **Privacy notice** (`/privacy`) — the form collects name, message and optional contact details;
   publishing a retention statement is a legal decision only the owner can author.
2. **Response-time promise** — the confirmation currently says "we review manually and reply on the
   channel you left". Turning that into an explicit commitment ("within one business day") is a
   commercial promise, so it was deliberately not invented.
3. **SMTP credentials** — until these exist, the confirmation panel is the *only* acknowledgement the
   visitor receives; the owner-notification email silently no-ops.
