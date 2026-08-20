# LENA — Product Measurement Plan

**Version:** 1.0 · **Date:** 2026-08-20 · **Baseline:** `ddf16ba`
**Companions:** `PRODUCT_DEFINITION.md` (goals), `PRIVACY_DATA_GOVERNANCE.md` (data rules),
`ONBOARDING_ACTIVATION_PLAN.md` (activation)

---

## 1. Audit of what exists today

| Area | Finding |
|---|---|
| Analytics tool | **None.** No script, no SDK, no pixel. Confirmed by grep and by the build-blocking egress guard |
| Event tracking | **None** |
| Consent mechanism | **None needed today** — nothing is tracked (`PRIVACY_DATA_GOVERNANCE.md` §5) |
| Operational logs | Present and correctly separated: request method, path without query, status, duration. No bodies, no headers, no cookies. Mail errors redacted |
| Duplicate or missing events | Not applicable — the funnel is entirely unmeasured |
| Environment pollution | Would be a real risk: development, the sandbox preview and Vercel preview hosts share the production bundle |
| Bot and test traffic | Unfiltered today because nothing is counted |
| User identity | **None exists for visitors** — no accounts, no cookies, no identifiers. This is an asset, not a gap |
| Dashboards | None |
| Already-owned measurement data | `inquiries` (day, entry context, channel left, status) and `admin_audit_events` (when the operator acted) |

**The one real gap: there is no denominator.** The product knows how many inquiries arrived, but not
how many people saw the contact page and left. Every conversion metric in `PRODUCT_DEFINITION.md` §11
is therefore currently uncomputable.

---

## 2. Product model (inferred, not asked)

- **Primary user outcome:** a business owner reaches a person who can build what they need.
- **Activation point:** an inquiry submitted, or a WhatsApp conversation opened. WhatsApp is a real
  activation, not a leak — measuring only form submissions would understate the product.
- **Critical journeys:** find → judge (application/industry page) → act (form or WhatsApp).
- **Retention behaviour:** **there is none, and there should not be.** A client engages once per
  project. Chasing weekly returning visitors on a studio portfolio would optimise the wrong thing.
  The correct "retention" analogue is repeat and referral work, which happens off-platform.
- **Business model:** project services sold off-platform. **No monetisation events exist in the
  product**, so none are defined. Revenue is recorded in the founder's own accounting, not here.

## 3. North star and indicators

**North star:** **qualified inquiries per month** — an inquiry the founder marks `qualified`. It is the
only number that maps directly to income, and it already exists in the database.

| Type | Indicator | Source | Why it earns its place |
|---|---|---|---|
| Leading | Contact-page → inquiry conversion | events + `inquiries` | The single tunable number in the funnel |
| Leading | Share of inquiries from application/industry pages | `inquiries.source` | Tests the riskiest assumption in the product definition (A1: does self-built proof convince?) |
| Leading | Share of English-language activation | events + `inquiries` | Tests A2: is the second market real, or is it costing content effort for nothing? |
| Leading | Inquiry failure rate | `inquiry_failed` | Guardrails refusing real people is silent lost revenue |
| Lagging | Qualified inquiries per month | `inquiries.status` | North star |
| Lagging | Median hours to first reply | `inquiries` + audit | Largest known conversion lever, and a published promise |
| Lagging | Reachable-channel rate | `inquiries` | An inquiry we cannot answer is not a lead |

**Counter-metric:** if page views rise while contact-page conversion falls, the site is attracting the
wrong audience. Volume alone is never treated as progress.

**Explicitly not measured:** sessions, bounce rate, time on page, scroll depth, heatmaps, weekly
returning users, page-view totals as a headline. None of them changes a decision here.

## 4. Event dictionary

Ten events. Each exists because a listed decision depends on it.

| Event | Fires when | Properties | Decision it serves |
|---|---|---|---|
| `page_viewed` | Once per route change | `route`, `locale` | Denominator for every rate |
| `primary_action_clicked` | The single CTA is used | `surface`, `locale` | Is the CTA findable, especially on mobile? |
| `contact_channel_opened` | WhatsApp/email/phone opened | `channel`, `surface` | Is the zero-field path the real activation route? |
| `inquiry_started` | First keystroke in the form | `locale`, `context` | Separates "arrived" from "intended" |
| `inquiry_submitted` | Activation | `locale`, `context` | North-star input |
| `inquiry_failed` | A guardrail or error refuses | `locale`, `reason` | Are we refusing real people? |
| `inquiry_draft_restored` | Abandoned text recovered | `locale` | Does recovery actually save inquiries? |
| `language_switched` | Visitor changes language | `locale`, `surface` | Was our language detection wrong? |
| `help_searched` | ≥3 characters typed in help | `query_length`, `has_results`, `locale` | What can people not find? |
| `app_error_shown` | Crash boundary reached | `route` | Real-world crash rate |

**Property vocabulary is a closed list:** `route`, `locale`, `surface`, `channel`, `context`, `reason`,
`outcome`, `has_results`, `query_length`. Anything else is refused by validation.

**Naming rules:** `subject_verbpast`, lowercase, stable. Renaming is a schema change, not a tidy-up.

## 5. Privacy rules (enforced in code, not by convention)

1. **No identifiers.** No user id, session id, visitor id, cookie, device id or fingerprint. Events
   cannot be joined into a person's journey — by construction, not by policy.
2. **Route shapes only.** `/ar/work/riwaq` → `/work/:project`; query strings and hashes are discarded
   before anything else runs, so a secret in a URL can never enter the stream.
3. **Closed property list.** An unknown property drops the whole event.
4. **Pattern refusal.** Any value resembling an email, phone number, bearer token, JWT, URL, password
   or cookie drops the event. Verified against hostile inputs.
5. **Day-level time only.** No timestamp precise enough to correlate two events to one person.
6. **Never sent:** passwords, tokens, form contents, inquiry text, names, contact details, payment or
   health data, full URLs, IP addresses, user agents.
7. **Product analytics and operational logs stay separate.** Logs are for debugging, are not an
   analytics source, and are never joined to events.
8. **Do Not Track is honoured**, even though no personal data is collected — the visitor's stated
   preference outranks our own assessment.
9. **Off by default.** With no sink configured, every call validates and then does nothing.

## 6. Dashboard definitions

Three views. No tool required — each is a query the founder can be shown.

**A. Funnel (weekly).** `page_viewed[/contact]` → `inquiry_started` → `inquiry_submitted`, plus
`contact_channel_opened[whatsapp]` as a parallel activation path, and `inquiry_failed` broken down by
reason. *Answers: where do we lose people, and are we refusing real ones?*

**B. Proof performance (monthly).** Inquiries grouped by `inquiries.source`, alongside
`page_viewed` for `/work/:project` and `/services/:service`. *Answers: which work actually produces
clients — the direct test of assumption A1.*

**C. Market and service health (monthly).** Activation split by `locale`; `language_switched` rate;
median hours to first reply; reachable-channel rate; `app_error_shown` per 1,000 page views.
*Answers: is the English market real, are we keeping the reply promise, is the site healthy?*

## 7. Data-quality tests

`e2e/verify-analytics.mjs` — **35 assertions, all passing** against the compiled module:

| Group | Result |
|---|---|
| Unknown events and undeclared properties are refused | 3/3 |
| Hostile values (email, phone, bearer token, JWT, URL, password) are refused | 7/7 |
| Route normalisation, including a query-string secret | 8/8 |
| Exactly-once firing across 12 re-renders; a real navigation counts again | 4/4 |
| Development, preview, automated browsers, crawlers and Do Not Track excluded | 5/5 |
| Off by default; a broken sink cannot break the page | 2/2 |
| Payload carries a day bucket and no identifier of any kind | 2/2 |

**Ongoing checks once collection is live:** `inquiry_submitted` count must equal new `inquiries` rows
per day (any drift means double-firing or loss); `page_viewed` must never exceed a plausible ceiling;
no property value may ever appear that is not in the vocabulary.

## 8. Recommended backend — and why not the obvious ones

| Option | Verdict |
|---|---|
| Google Analytics | **Rejected.** Advertising-grade tracking, consent banner required, contradicts the published privacy position for a denominator |
| Plausible / Fathom (hosted) | Good privacy, but a recurring subscription against the founder's binding cost constraint, and a third party receiving visitor data |
| Vercel Web Analytics | Convenient, but a paid tier at any real volume and another processor |
| Self-hosted Umami | No vendor cost, but a second service to run, patch and back up — real maintenance for one person |
| **First-party aggregate counters in the existing database** | **Recommended.** No vendor, no cookie, no identifier, no recurring cost. A tiny table of `(day, event, route, locale, count)` incremented server-side. Pure counters cannot be de-anonymised because no row ever describes a person |

Cost: effectively zero. Maintenance: one table and one endpoint. Privacy: strictly better than every
hosted option, and consistent with what `/privacy` already tells visitors.

**Known limits, stated honestly:** counters are directional, not forensic. A public endpoint can be
inflated, so it is rate-limited, allowlisted to known route shapes, and never used for anything
adversarial. No funnels per person are possible — which is the point.

## 9. What is implemented now

- Provider-neutral event layer with a single-function adapter interface.
- Validation as the privacy boundary: closed event list, closed property vocabulary, pattern refusal.
- Route normalisation that discards query strings and hashes.
- Exactly-once guard, reset per navigation.
- Environment filtering for development, sandbox and preview hosts; bot, headless and Do Not Track
  exclusion.
- Instrumentation across every critical journey and failure state.
- 35 automated assertions.
- **Collection is disabled.** No sink is installed, so every call is a validated no-op and **no data
  leaves any browser.** Enabling is one call, and requires owner approval.

## 10. Decisions this will let the owner make

Not a metrics list — the actual choices the data unlocks:

1. **Is the five-application proof model working?** If application pages get traffic but produce under
   ~1% inquiries, the proof model is wrong and the answer is one real client reference, not a redesign.
2. **Should English content continue?** If English activation stays under 15% after 60 days, stop
   writing everything twice and serve English only for the two strongest applications.
3. **Is language detection right?** A high `language_switched` rate means we are guessing wrong and
   should change the default.
4. **Are the anti-spam guardrails costing real clients?** A rising `inquiry_failed` rate with
   `rate_limited` or `rejected` means loosening them.
5. **Is the CTA reachable on mobile?** `primary_action_clicked` by `surface` answers whether the mobile
   menu fix worked.
6. **Which industry deserves focus?** Concentrated `/work/:project` traffic says specialise instead of
   broadening.
7. **Is the reply promise being kept?** Median hours to first reply against the published one business
   day — change the promise before a client discovers it is untrue.
8. **What is missing from the help content?** `help_searched` with `has_results: false`.
