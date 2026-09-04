# LENA Digital House — Feature Gap & Product Strategy

> **Historical baseline — not current product/runtime authority.** This document records the
> 2026-08-20 audit and the product assumptions that existed at that time. Since then LENA moved to
> the operating-systems / World architecture and several findings below were completed, removed, or
> superseded. Current truth is owned by `artifacts/lena/src/content/systems.ts`,
> `artifacts/lena/src/features/world/content/evidence.ts`,
> `artifacts/lena/src/features/world/content/product-contract.ts`, and the canonical World Graph.
> If this document conflicts with those contracts or with later merged architecture, treat the
> conflicting statement below as historical only.

**Owner:** non-technical product owner
**Author:** Arena orchestration agent (single-agent mode with separated plan / build / adversarial-review phases)
**Date:** 2026-08-20
**Baseline commit:** `b78f19a` (branch `arena/01a01ef6-platform`)

---

## 1. Product read (historical 2026-08-20 baseline)

| Dimension | Finding | Evidence |
|---|---|---|
| **Category** | Bilingual (AR/EN, RTL-first) creative-studio / digital-agency marketing website with a lead capture form and a lightweight admin back office. Not a SaaS, not a marketplace. | `artifacts/lena` routes, `src/content/services.ts` (8 service tracks), `src/content/caseStudies.ts` |
| **Target users** | (a) Prospective clients in Oman / Gulf — SMEs, founders, F&B and retail brands looking for identity, web, content, automation. (b) The studio owner (single admin). | `SITE_CONFIG.locationLabel = "سلطنة عمان"`, `+968` phone, Arabic-first `index.html` (`lang="ar" dir="rtl"`) |
| **Primary outcome** | A qualified stranger discovers LENA, trusts it via case studies, and starts a conversation (WhatsApp, email, or the inquiry form). Everything else is supporting. | Every page ends in `LenaCta`; `WhatsAppFAB` is global; `inquiries.create` is the only public write endpoint |
| **Roles** | `user` and `admin` only. Admin = owner, granted through `OWNER_UNION_ID`. No team/multi-seat concept. | `lib/db/src/schema/enums.ts`, `artifacts/api-server/src/auth/oauth.ts` |
| **Lifecycle** | Visit → browse services/work → submit inquiry → inquiry row (`status: new`) → owner reviews in `/dashboard` → status moves `new → in_progress → qualified → closed/archived`. Delivery happens off-platform. | `inquiries` table, `Dashboard.tsx` inquiries tab |
| **Business model** | Project-based services sold off-platform. The product is a **top-of-funnel + inbox**, not a transactional system. No pricing, cart, invoicing, or contracts anywhere. | No payment/billing code; `uploads/invoice_export.pdf` is a 0-byte placeholder |
| **Maturity** | Solid engineering skeleton, thin product surface. Typecheck and build pass; security hardening (rate limiting, honeypot, RLS, signed uploads) is above average for this stage; but discovery, trust-recovery, and measurement layers are absent. | `pnpm run typecheck` ✅, `pnpm run build` ✅ (verified 2026-08-20) |

### Domain grounding (external, current)

- Median B2B website visitor→lead conversion is ~2.9%; the single biggest lever on lead-to-opportunity conversion is **speed-to-lead under 5 minutes** [SalesHive 2026](https://saleshive.com/blog/b2b-lead-benchmarks-digital-marketing-gen).
- 78% of B2B buyers are more likely to consider a vendor that publishes case studies — the portfolio is the sales asset, not decoration [Lead Scrape 2026](https://www.leadscrape.com/lead-generation-for-agencies.html).
- Content/SEO is the compounding inbound channel for agencies and produces ~3x more leads than outbound at ~62% lower cost [Lead Scrape 2026](https://www.leadscrape.com/lead-generation-for-agencies.html).
- Confirmation/welcome emails average ~82% open rate — the highest-attention message in the whole funnel [Marketing LTB 2026](https://marketingltb.com/blog/statistics/lead-generation-statistics/).

**Strategic consequence:** this product's value is *discoverability + credibility + fast, reliable response*. Any feature that does not serve one of those three should be deferred or rejected.

---

## 2. Findings by category

Each item: evidence → affected users → domain rationale → value → dependencies → risk → ongoing cost → smallest viable version (SVV) → acceptance criteria → success measure.

### A. Missing capability that blocks the core outcome

---

#### A1. The site is invisible and unshareable — no per-page SEO metadata, no `robots.txt`, no `sitemap.xml`, no structured data, soft-404s

- **Evidence:** `artifacts/lena/index.html` contains one hard-coded `<title>LENA Digital House</title>` and one description for **all 11 routes**. No component anywhere sets `document.title`, canonical, or per-route Open Graph tags (`grep` over `artifacts/lena/src` returns zero hits for `title`, `canonical`, `og:` outside `index.html`). `artifacts/lena/public/` contains only `favicon.svg` and `lena-og.svg` — no `robots.txt`, no `sitemap.xml`. `App.tsx` routes `*` to `<Navigate to="/" replace />`, so every wrong URL becomes a **soft 404** (HTTP 200 + home page), which search engines treat as a quality defect and users experience as silent teleportation.
- **Affected users:** every prospective client who searches for a studio, and anyone who pastes a LENA link into WhatsApp/LinkedIn (all previews show the same generic card).
- **Domain rationale:** for an agency with no paid-media budget in the repo and no outbound tooling, organic search + link sharing *is* the acquisition channel. Eight service pages and eight case studies are eight+eight indexable assets currently collapsed into one.
- **Expected value:** unlocks the compounding inbound channel; makes every case study a shareable sales asset (the 78% case-study effect only works if the link renders a real title and summary).
- **Dependencies:** none technical. Production domain should be set as `SITE_URL` for absolute canonical/sitemap URLs (Vercel supplies `VERCEL_PROJECT_PRODUCTION_URL` as an automatic fallback).
- **Risk:** Low. Additive, no schema change, no data touched, fully reversible.
- **Ongoing cost:** ~near zero. One metadata entry per new page.
- **SVV:** route-aware `<SeoHead>` (title, description, canonical, robots, OG, Twitter) on every public route; `Organization` + `WebSite` JSON-LD on home; generated `robots.txt` + `sitemap.xml` at build time; a real 404 page marked `noindex` instead of the redirect.
- **Acceptance criteria:** see `docs/specs/SEO_DISCOVERABILITY_SPEC.md`.
- **Success measure:** Google Search Console — indexed pages goes from ~1 to ≥ 18; organic impressions and clicks trend, tracked monthly.

**→ This is the selected Now #1 and its first vertical slice is implemented in this change.**

---

#### A2. No proof that an inquiry ever reached a human

- **Evidence:** `inquiries.create` calls `sendNewInquiryNotification(...).catch(console.error)` — fire and forget. `mailer.ts` returns silently when `SMTP_USER`/`SMTP_PASS` are unset (`console.warn` only). There is no delivery record, no retry, no `notified_at` column, and no in-app "new inquiries" alert outside opening the dashboard. The visitor receives only an in-page success sentence and **no confirmation email**, even when they supplied one.
- **Affected users:** every lead (uncertainty → they message a competitor); the owner (a mis-typed SMTP password silently destroys the pipeline while the UI says "sent successfully").
- **Domain rationale:** speed-to-lead under 5 minutes is the top conversion lever; you cannot be fast about something you were never told about. Confirmation emails are the highest-open-rate message in the funnel (~82%).
- **Expected value:** protects 100% of captured demand; converts "did they get it?" anxiety into a branded touchpoint with a reference number.
- **Dependencies:** working SMTP credentials (owner-controlled); a small `inquiries.notified_at` / `notification_status` column (additive, nullable — non-destructive).
- **Risk:** Medium-low. Sending mail to real third parties requires correct sender identity and an unsubscribe-free transactional framing; a misconfigured sender can damage domain reputation.
- **Ongoing cost:** SMTP mailbox already assumed; ~0 additional if Gmail/Workspace is used.
- **SVV:** (1) auto-reply to the visitor in their submitted locale with inquiry reference `#id`, only when an email was supplied; (2) persist notification outcome; (3) surface an unmissable red banner in `/dashboard` when the last notification attempt failed.
- **Acceptance criteria:** submitting with an email yields exactly one visitor email and one owner email; forced SMTP failure still stores the inquiry, marks it `notification_failed`, and shows the dashboard banner; no duplicate sends on retry.
- **Success measure:** notification failure rate < 1%; median time from inquiry creation to first `status` change (proxy for speed-to-lead) below 4 hours.

---

### B. Missing trust / safety / recovery capability

#### B1. Single-point-of-failure authentication with no recovery path
- **Evidence:** `/login` offers exactly one button → `/api/oauth/login` (Kimi OAuth). Admin identity is pinned to `OWNER_UNION_ID`. If that provider is unreachable, the account changes, or the env var is wrong, **the owner is permanently locked out of the only management surface** — with no fallback, no second admin, and no break-glass path.
- **Affected users:** the owner exclusively; blast radius = total loss of lead access.
- **Domain rationale:** industry standard for single-admin back offices is at minimum a documented, credential-verified recovery route.
- **Value:** eliminates a catastrophic, non-recoverable failure mode.
- **Dependencies:** owner decision on the second factor (magic-link email vs. a second `OWNER_UNION_ID`). **Second-owner or email-based login touches account/credential policy → owner approval required.**
- **Risk:** Medium — any additional auth path is an additional attack surface; must be rate-limited and single-purpose.
- **Ongoing cost:** negligible.
- **SVV:** support a comma-separated `OWNER_UNION_IDS` allowlist (2 identities) — no new auth mechanism, no new attack surface, purely a config widening.
- **Acceptance:** both listed identities receive `role=admin`; unlisted identities still get `role=user`; empty/blank entries are ignored.
- **Success measure:** documented, tested recovery drill completed once.

#### B2. Admin destructive actions have no undo and no audit trail
- **Evidence:** `inquiries.delete` and `projects.delete` are hard `DELETE`s guarded only by a browser `confirm()` (`Dashboard.tsx`, `text.confirmDelete`). A mis-click permanently destroys a sales lead. `archived` already exists in `INQUIRY_STATUS_VALUES` but hard delete still bypasses it.
- **Affected users:** owner; and indirectly the lead whose request vanishes.
- **Rationale:** for low-volume, high-value records (a lead is worth thousands of OMR), soft delete is the standard.
- **Value:** removes an irreversible data-loss path at almost no cost.
- **Dependencies:** none — `archived` status already exists.
- **Risk:** Very low.
- **SVV:** dashboard "delete" becomes "archive" (sets `status='archived'`, hidden by default behind an "Archived" filter); the hard-delete procedure stays server-side but is no longer reachable from one click.
- **Acceptance:** archiving hides the row from the default list and is reversible from the archived view; no rows are removed from the database.
- **Success measure:** zero unintended permanent deletions; measured as `count(inquiries)` never decreasing month-over-month.

#### B3. The public form's success state is not resilient
- **Evidence:** `Contact.tsx` clears the whole form (`setForm(createEmptyInquiry())`) only on success — correct — but on failure it shows one generic sentence and the message text is retained *without any offline/retry affordance*; a rate-limited visitor (`TOO_MANY_REQUESTS`) sees the same message as a server outage, and the honeypot's 1.5s minimum-completion rule silently rejects fast legitimate pasters as "Invalid inquiry."
- **Affected users:** genuine leads who hit the guardrails.
- **Value:** recovers demand that the anti-spam layer currently discards silently.
- **Risk:** Very low.
- **SVV:** distinguish three error states (rate limited / rejected as automated / server error) with distinct copy, and always show the WhatsApp fallback CTA inside the error block.
- **Acceptance:** each of the three tRPC error codes renders its own message + a working WhatsApp link.
- **Success measure:** form submission error rate visible and < 3%.

#### B4. No cookie / privacy statement while setting a 1-year session cookie and storing personal data
- **Evidence:** `SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60`; `inquiries` stores name, email, phone, free-text message; `inquiry_rate_limits` stores an HMAC of the visitor IP. There is no privacy page, no retention statement, and no consent copy anywhere in `src/pages`.
- **Rationale:** collecting personal data through a public form without a published privacy notice is below baseline expectation for a professional studio and is a commercial/legal exposure for Gulf and EU-facing clients.
- **Dependencies:** **owner-authored legal content — requires owner decision, cannot be invented by an agent.**
- **SVV:** a `/privacy` page whose text the owner supplies, linked from the footer and referenced by one line under the contact form.
- **Success measure:** page exists, is linked, and is the target of the form's consent line.

---

### C. Expected usability support

#### C1. No search-engine-visible language variants despite a full AR/EN system
- **Evidence:** `PreferencesProvider` stores locale in `localStorage` and mutates `document.documentElement.lang/dir`. **The URL never changes.** `/services` in Arabic and `/services` in English are the same URL, so only one language can ever be indexed or shared.
- **Value:** doubles the addressable indexable surface and makes "send the English version to my investor" possible.
- **Risk:** Medium — introducing `/en/*` routing touches every internal link and all canonical logic. Should follow, not precede, A1.
- **SVV:** `/en/...` path prefix with `hreflang` alternates; Arabic stays at the root.
- **Acceptance:** every public route resolves under both prefixes; locale is derived from the URL first and `localStorage` second; `hreflang` pairs are emitted.
- **Success measure:** English pages indexed and receiving impressions in Search Console.

#### C2. Dashboard is a raw table, not a follow-up workspace
- **Evidence:** `Dashboard.tsx` renders the inquiry list with a status `<select>` and a delete button. No search, no filter by status, no sort, no notes field, no "new since last visit" indicator (`inquiries.countNew` exists on the server but **is never called by the frontend**).
- **Value:** at 5–10 leads/month the table is fine; at 50 it fails. Wire up the *existing* `countNew` first — that is a 3-line change with real value.
- **SVV:** status filter chips + a "new" count badge using the existing endpoint.
- **Success measure:** median time-to-first-status-change decreases.

#### C3. Local development cannot reach the API
- **Evidence:** `vite.config.ts` defines **no `server.proxy`**, while `providers/trpc.tsx` calls the relative URL `/api/trpc`. Running the frontend dev server alone means every data-driven screen fails.
- **Affected users:** every future maintainer (a real, recurring cost).
- **SVV:** add a `/api` dev proxy to `http://localhost:8080`.
- **Risk:** none (dev-only config).
- **Success measure:** `pnpm --filter @workspace/lena dev` renders dashboard data without extra steps.

#### C4. The Open Graph image is an SVG
- **Evidence:** `index.html` → `og:image = /lena-og.svg`; `public/` has no raster image. WhatsApp, LinkedIn, X and Facebook do not render SVG previews — shared links currently show **no image at all**.
- **SVV:** one 1200×630 PNG brand card. **Requires a real brand asset from the owner — an agent-generated image would misrepresent the brand.**
- **Success measure:** link preview renders an image on WhatsApp and LinkedIn.

---

### D. Competitive / growth opportunity

#### D1. Case studies carry no outcome evidence
- **Evidence:** `caseStudies.ts` supplies `overview / challenge / direction / solution / features / journey` — all process narrative. There is **no result, metric, timeline, client name, or testimonial field** anywhere in the schema or the content.
- **Rationale:** the case-study effect on buyer consideration comes from *proof*, not process description. Competing studios lead with numbers.
- **SVV:** add an optional `results` block (2–4 label/value pairs, bilingual) to the existing `ProjectContentBlocks` JSON type — additive, no migration needed since `content_blocks` is already `jsonb`.
- **Risk:** Low technically; **the owner must supply truthful numbers — fabricated results are a commercial and reputational risk and will not be invented.**
- **Success measure:** contact-page visits originating from case-study pages.

#### D2. No measurement of the primary outcome
- **Evidence:** zero analytics of any kind (`grep` for `gtag|analytics|plausible|posthog|umami` over the frontend returns nothing). Nobody can currently answer "how many people saw the contact page and did not submit?"
- **Rationale:** every recommendation in this document, including this one, is unfalsifiable without a conversion baseline.
- **SVV:** privacy-friendly, cookieless page + `inquiry_submitted` event counting. **Any hosted analytics vendor is a recurring cost and a data-processing decision → owner approval.** A zero-cost alternative is a self-owned `page_views` counter, but that adds maintenance; recommendation is to defer until A1 produces traffic worth measuring.
- **Success measure:** contact-page → submission conversion rate is reportable.

#### D3. Structured data for local discovery
- **Evidence:** no JSON-LD at all today. LENA has a physical market (Oman), a phone number, and a service catalogue — all first-class structured-data entities.
- **SVV:** `Organization` + `WebSite` now (**included in the Now #1 slice**), `Service` and `BreadcrumbList` later.
- **Success measure:** rich-result eligibility in Search Console.

---

### E. Optional features that should wait

| Feature | Why it waits |
|---|---|
| **Client portal / project status tracking** | Zero demand evidence. There is no `clients` table, no delivery workflow, no multi-user model. Building it means inventing an operations product for one owner. |
| **Quotes, pricing pages, payments, invoicing** | `uploads/invoice_export.pdf` is a 0-byte placeholder — a ghost of an abandoned idea. Pricing is a commercial policy the owner has not set. Payments add PCI scope, refunds policy, and recurring cost for a service business that closes deals in WhatsApp. |
| **Blog / content hub** | Correct long-term SEO play, but it needs an editorial commitment (≥2 posts/month). Publishing three posts and stopping is worse than not starting. Revisit only after A1 shows organic traffic and the owner commits to a cadence. |
| **CRM integration (HubSpot/Pipedrive)** | Premature at current volume; the dashboard plus a reliable email is sufficient until inquiries exceed ~30/month. |
| **AI chatbot / lead qualification bot** | Trendy, high maintenance, high hallucination risk against a brand promise. WhatsApp already provides an instant human channel with better conversion. |
| **Newsletter / drip sequences** | Requires consent management, unsubscribe handling, and content supply. Not before D2 and B4. |

### F. Existing features to simplify, merge, hide, or remove

| # | Item | Evidence | Recommendation |
|---|---|---|---|
| F1 | **Two competing project editors** | `/dashboard` (projects tab, `Dashboard.tsx`) and `/dashboard/projects-editor` (`ProjectsCms.tsx`) both create/update/delete the *same* `projects` rows through the *same* endpoints, with different field coverage. The dashboard version cannot edit `contentBlocks` or `gallery`; the CMS version can. | **Merge.** Keep `ProjectsCms` (superset) as the single editor; the dashboard projects tab becomes a read-only list that links to it. Removes a whole class of "I edited it in the other screen and lost my gallery" bugs. |
| F2 | **The `content_entries` CMS is a ghost feature** | Full stack exists: table, four tRPC procedures, `listPublished` + `getPublishedByKey`, and a dashboard tab. **Nothing in the public site ever reads it** — all copy comes from the static `src/content/site-copy.ts` via `useSiteCopy`. `grep` for `trpc.content` outside `Dashboard.tsx` returns nothing. | **Hide, don't delete.** Remove the dashboard tab (an admin publishing content that never appears is an active trust bug), keep the server code and table. Re-expose only when a real editable surface is defined. |
| F3 | **Dead 404 components** | `pages/NotFound.tsx` **and** `pages/not-found.tsx` both exist; `grep` proves neither is imported anywhere. Meanwhile the app has no 404 route at all. | **Consolidate into one branded 404** and actually route to it (part of the Now #1 slice); delete the duplicate. |
| F4 | **Duplicated `use-mobile` hook** | `hooks/use-mobile.ts` and `hooks/use-mobile.tsx` are both present; two different consumers import `@/hooks/use-mobile`, resolution depends on extension order. | Delete the `.ts` duplicate, keep one. Low risk, removes ambiguity. |
| F5 | **`lib/api-spec` (orval) is scaffolding for an API style this project does not use** | The project is tRPC end-to-end; `orval.config.ts` generates a REST client into `lib/api-client-react`, which the frontend declares as a dependency but never imports. | Keep the packages (they are inert and cheap) but **do not extend them**. Reject any future work that maintains two API paradigms. |
| F6 | **`artifacts/mockup-sandbox`** | A full second Vite app with a duplicated `components/ui` tree, built on every `pnpm run build`. | Keep as a dev tool but **exclude from the production build** to cut build time; it ships nothing to users. |
| F7 | **`replit.md` describes a different product** | It documents the former hospitality application, tables `leads`/`portfolio`/`instagram_posts` that do not exist, and endpoints that were removed. | **Rewrite or delete.** A stale handoff document is how the next agent breaks production. |
| F8 | **Hard-coded owner contact details as code fallbacks** | `src/config/site.ts` falls back to a literal personal phone number and Outlook address when env vars are missing; `mailer.ts` hard-codes the same address as `NOTIFY_EMAIL` default. | Keep the fallbacks (they prevent a blank site) but **fail loudly in production logs** when the env vars are absent, so a misconfigured deploy is visible. |

---

## 3. Recommended sequence

### NOW — ship in this order, nothing else in parallel

1. **Discoverability & shareability foundation (A1 + D3 + F3).** Per-route metadata, canonical, Open Graph/Twitter, `Organization`+`WebSite` JSON-LD, `robots.txt`, generated `sitemap.xml`, real `noindex` 404 replacing the soft-404 redirect. *Zero dependencies, zero cost, fully reversible, unblocks every other growth item.* **← implemented in this change (first vertical slice).**
2. **Inquiry delivery reliability + visitor auto-reply (A2).** Needs owner SMTP credentials.
3. **Archive-instead-of-delete + login allowlist widening (B2 + B1 SVV).**
4. **Hygiene: merge the two project editors, hide the ghost content CMS, delete dead duplicates, fix the dev API proxy, rewrite `replit.md` (F1, F2, F3, F4, C3, F7).**

### NEXT — after Now is live and stable

5. Static prerendering of route HTML so social crawlers (WhatsApp/LinkedIn) read real per-page Open Graph tags — phase 2 of A1, requires verification against real Vercel routing.
6. Contact-form error differentiation with a WhatsApp fallback (B3).
7. Dashboard follow-up workspace: status filters + the already-built `countNew` badge (C2).
8. Case-study `results` block, populated with owner-supplied truthful numbers (D1).
9. `/privacy` page from owner-supplied text (B4).
10. Real 1200×630 raster OG image from an owner-supplied brand asset (C4).

### LATER — only if the earlier stages produce evidence

11. `/en` URL-based localisation with `hreflang` (C1) — do this only once Arabic pages are actually indexed.
12. Conversion analytics (D2) — once there is traffic worth measuring; approval needed if a paid vendor is chosen.
13. `Service` + `BreadcrumbList` structured data (D3 phase 2).
14. Editorial blog — only with a written publishing commitment.

### DO NOT BUILD

- Client portal / project status tracking for clients.
- Pricing pages, quotes, payments, invoicing.
- CRM integration below ~30 inquiries/month.
- AI chatbot lead qualification.
- Newsletter / drip campaigns before consent management exists.
- Any second API paradigm (REST/orval) alongside tRPC.
- Any feature whose success cannot be stated as a measurable sentence before it is built.

---

## 4. Open decisions that genuinely require the owner

| # | Decision | Why an agent must not decide it |
|---|---|---|
| 1 | Production domain value for `SITE_URL` | Owned asset / DNS |
| 2 | SMTP sender identity for visitor auto-replies | Credential + sender reputation |
| 3 | Second admin identity for lockout recovery | Account access policy |
| 4 | Privacy-notice text and data-retention period | Legal |
| 5 | Real, truthful case-study result numbers | Commercial truth claims |
| 6 | Whether to pay for hosted analytics | Recurring cost |
