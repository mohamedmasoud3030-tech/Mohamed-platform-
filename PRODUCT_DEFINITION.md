# LENA — Product Definition & PRD

**Version:** 1.0 · **Date:** 2026-08-20 · **Baseline:** `0ad0e63` on `arena/01a01ef6-platform`
**Status:** Approved direction, ready to implement. No technology choices are made here — the existing
stack is retained because the founder's binding constraint is minimum cost.

Founder decisions on record (2026-08-20):

| Decision | Answer |
|---|---|
| Brand identity | **Hybrid** — LENA is the brand, the founder is the visible face behind it |
| Market | **Arabic and English as two equal, real markets** (not Gulf-only) |
| Default language | **Detected from the visitor's device**, always switchable |
| 6-month goal | **New paying project clients** |
| Proof | **5 web applications across different industries**, plus the existing industry/service pages retained |
| Binding constraint | **Cost** — no new paid services, no new recurring spend |

---

## 1. Value proposition

**One sentence:**
> LENA is where a business owner sees five working web applications that already solve real problems
> in their industry — then talks directly to the person who built them, in Arabic or English.

Why this wording holds: it names the proof (working applications, not mockups), the relevance
(their industry), the differentiator (direct access to the builder, not an account manager), and the
market (two languages as equals). It promises nothing the product cannot deliver today.

**Rejected alternatives and why:** "creative digital house" (says nothing a buyer can verify);
"we turn ideas into experiences" (current copy — unfalsifiable); "Oman's leading studio" (contradicts
the new market and cannot be substantiated).

---

## 2. Target users and jobs-to-be-done

### Primary — the decision-maker (owner / founder / marketing lead of a small or mid-size business)

| Job | Trigger | Success for them |
|---|---|---|
| "Find someone who has already built something like what I need" | An operational pain: manual bookings, no online presence, scattered orders | Sees a working application in a familiar industry within 60 seconds |
| "Judge whether this person is competent before I expose my business" | Burned before by a vendor who over-promised | Can inspect depth — screens, flow, decisions — not just a logo |
| "Understand what this will involve before I ask" | Fear of a sales trap | Knows the process and can start a conversation with no form-filling ceremony |
| "Talk to a real person in my language" | Non-English speaker, or English speaker abroad | Gets a reply in the language they wrote in, within one business day |

### Secondary — the technical evaluator (CTO, IT lead, or a trusted friend asked to "check this guy out")

| Job | Success |
|---|---|
| "Check if this is real work or a template" | Can open a specific application page by direct link and see actual depth |
| "Send it to my boss with a comment" | Link preview shows the right title and description in the right language |

### Operator — the founder (single admin)

| Job | Success |
|---|---|
| "Publish a new application without touching code" | Existing dashboard editor, draft → publish |
| "Know which application brings clients" | Entry-context attribution already recorded per inquiry |
| "Reply fast enough to win the work" | New inquiries visible with a count badge on arrival |

### Explicitly **not** users

Clients tracking delivery (no portal), job recruiters (goal is clients, not employment),
other developers, students seeking tutorials, and anyone requiring a signed enterprise procurement
process.

---

## 3. Pain points and expected outcomes

| # | Pain (evidenced in the current product) | Expected outcome |
|---|---|---|
| P1 | The site says "we" everywhere while the work is one person's. A visitor cannot tell who they are hiring. | The visitor knows the founder's name, face and background before they contact. |
| P2 | Region is hard-coded: "سلطنة عمان" in config, a `+968` number as the primary and only channel, `ar-OM` date formatting. A visitor from Cairo, Amman or Berlin reads it as "not for me". | Location becomes a fact about the founder, never a limit on who is served. |
| P3 | English exists but has **no URL of its own** — locale lives in `localStorage`. The English site cannot be indexed by Google, cannot be shared as a link, and cannot be bookmarked. Half the declared market is invisible. | Each language is a real, shareable, indexable address. |
| P4 | Portfolio is 8 conceptual entries with no client name, no result, no measurable claim; testimonials and statistics arrays are literally empty in code. | 5 applications, each stating the industry, the problem, what it does, and what changed. |
| P5 | Nothing distinguishes "work done for a client" from "product I built myself". Left ambiguous, it becomes a credibility bomb if a prospect asks. | Every item is honestly labelled; ambiguity is designed out. |
| P6 | Services are described as abstract "tracks" (identity, content, automation) rather than outcomes a business owner recognises. | Industry pages connect a familiar problem to a demonstrated solution. |

---

## 4. Assumptions requiring validation

| # | Assumption | Confidence | Cheapest validation |
|---|---|---|---|
| A1 | Business owners find self-built applications persuasive enough to make contact, without client references | **Low — the riskiest assumption in this document** | Ship 5 app pages; measure app-page → inquiry rate over 30 days. Under 1%, the proof model is wrong, not the design |
| A2 | The English market responds at a rate worth the cost of maintaining two languages | Medium | Compare inquiries by locale after 60 days; if English is under 15% of the total, stop investing in English content |
| A3 | Five applications is enough breadth; a visitor finds one relevant to them | Medium | Track which app pages get opened; if one industry takes over 60% of the traffic, specialise instead of broadening |
| A4 | Visitors will contact a stranger through a form/WhatsApp with no pricing shown | Medium-high (normal for the category) | Already measurable via the existing entry-context attribution |
| A5 | The founder can answer within one business day in both languages, sustainably | Medium | The promise is already published; measure median time to first status change |
| A6 | Screens and a short recording persuade as well as a live demo | Medium | A/B is too expensive at this volume — instead, add a "request a live walkthrough" action and count requests |

---

## 5. MVP scope

**Guiding rule:** the smallest change set that makes a non-Gulf, non-Arabic-speaking business owner
believe this person can solve *their* problem — and nothing else.

### In scope

1. **Identity correction (hybrid).** Founder named, pictured and described; brand retained; copy voice corrected so it never claims a team that does not exist.
2. **De-regionalisation.** Remove Oman as a market boundary; keep it as the founder's location. All contact details, phone formats and date formats become configuration, not literals.
3. **Language as an address.** Every public page reachable at a per-language URL, both indexable, cross-linked, with device-based detection on first visit and a persistent manual switch.
4. **Five application case studies.** Each with: industry, the business problem, who it is for, what the application does, key screens, an honest provenance label, and one primary action.
5. **Retained industry/service pages** (founder's explicit requirement), rewritten to lead with the business problem and to link to the relevant application.
6. **Trust layer.** Founder bio, an honest "how I work" sequence, and the already-published one-business-day reply commitment.
7. **Conversion path.** Existing inquiry form and WhatsApp, with entry-context attribution extended so the founder knows which application produced each inquiry.

### Out of scope (and the reason, so nobody re-proposes it)

| Excluded | Reason |
|---|---|
| Client portal / project tracking | No delivery workflow exists; invents an operations product for one person |
| Pricing pages, quotes, payments, invoicing | Founder has set no pricing policy; adds PCI scope and recurring cost against the binding constraint |
| Blog / content hub | Requires an editorial cadence nobody has committed to; three posts then silence is worse than none |
| Newsletter, drip campaigns | Needs consent management that does not exist |
| AI chatbot | High maintenance, hallucination risk against a trust-selling brand; WhatsApp already gives an instant human |
| Live chat widget / paid support desk | Recurring cost, third-party data transfer, for one inbox |
| Push notifications, install prompts, background sync | Nobody installs a portfolio site; these are the definition of fashionable-but-unnecessary |
| Third language | Not before A2 is validated for the second |
| Testimonial carousel | Empty in code today; a carousel of nothing is worse than no carousel |
| Recruiter/CV features | Founder chose clients, not employment |
| Separate deployments for the 5 applications | Each live app is a hosting cost and a maintenance surface — see §14 owner decision |

---

## 6. Roles and permissions

| Capability | Visitor (anonymous) | Founder (admin) |
|---|---|---|
| View published pages, applications, industry pages, help | ✅ | ✅ |
| Switch language and theme | ✅ | ✅ |
| Submit an inquiry / open WhatsApp | ✅ | ✅ |
| View inquiries and their entry context | ❌ | ✅ |
| Change inquiry status | ❌ | ✅ |
| Create, edit, publish, unpublish an application | ❌ | ✅ |
| Upload media | ❌ | ✅ |
| See draft (unpublished) content | ❌ | ✅ |

**No third role is introduced.** An authenticated non-admin account remains possible (the provider may
authenticate anyone) and must see exactly what a visitor sees, plus a clear "you do not have access"
message. Draft content must never be reachable by URL guessing.

---

## 7. Core user journeys

**J1 — English-speaking business owner, mobile, first visit (the journey the current product fails).**
Arrives from search → the site opens in English at an English URL, LTR → sees a headline naming what
the founder builds → opens the application closest to their industry → reads problem, solution,
screens → sends an inquiry in English, or messages WhatsApp → receives an on-screen confirmation with
a reference and the one-business-day promise.

**J2 — Arabic-speaking business owner, mobile.** Same path, opens in Arabic RTL, WhatsApp is the
prominent channel (it is the dominant business channel in the region).

**J3 — Evaluator receives a shared link.** Opens a direct application URL → the link preview and the
page are in the language of the link → can judge depth without navigating → shares onward.

**J4 — Founder publishes a sixth application.** Signs in → opens the editor → fills industry, problem,
solution, screens → saves as draft → previews → publishes → the application appears publicly and in
the sitemap.

**J5 — Founder triages inquiries.** Signs in → sees the new-inquiry count → opens an inquiry → sees
which application produced it → replies on the visitor's channel → sets the status.

---

## 8. Functional requirements

Each requirement is independently testable. "Verified" means a person or a check can confirm it
without reading code.

### FR-1 — Founder identity is present and consistent
> **Status (2026-08-20): partially implemented.** The founder is named — Mohamed Masoud /
> محمد مسعود — on the About page, in `SITE_CONFIG.ownerName`, and as `founder` in the Organization
> structured data. The photograph and the biography are pending: `tools/prepare-founder-photo.sh`
> processes the photograph and builds the social preview card in one command, and the biography stays
> empty (and its block unrendered) until the founder writes it. Nothing about him is invented.
The About page presents the founder by name, photo, background and the reason the work is credible.
Copy elsewhere never implies a team that does not exist.
**Acceptance:** (a) About shows name, photo, and a bio of 60–150 words in both languages. (b) No public
page uses a plural-team claim that cannot be substantiated. (c) The founder's name appears in the
Organization structured data as `founder`.

### FR-2 — Geography is a fact, not a boundary
**Acceptance:** (a) No public page states or implies that service is limited to Oman or the Gulf.
(b) The founder's location appears only in the About page and structured data. (c) Contact details are
read from configuration with no hard-coded fallback number in shipped code. (d) Dates render in a
locale-appropriate, region-neutral format.

### FR-3 — Language has its own address
**Acceptance:** (a) Every public page is reachable at a distinct per-language URL. (b) Each page
declares the alternate language version and a canonical for itself. (c) First-time visitors are routed
by device language; a returning visitor's explicit choice always wins. (d) Switching language keeps the
visitor on the same page, never sends them home. (e) `html lang` and `dir` match the URL's language.
(f) Both language versions appear in the sitemap.

### FR-4 — Five application case studies
**Acceptance:** For each of the five: (a) industry label; (b) the business problem in one paragraph;
(c) who it is for; (d) what the application does, as 3–6 capabilities; (e) at least three screens;
(f) an honest provenance label; (g) exactly one primary action; (h) complete in both languages;
(i) a stable, shareable URL.

### FR-5 — Honest provenance labelling
Every portfolio item declares what it is: an application built and owned by the founder, work delivered
for a client, or a concept.
**Acceptance:** (a) The label is visible without expanding anything. (b) No item is unlabelled.
(c) No client name or logo appears without recorded permission. (d) No fabricated metric appears
anywhere.

### FR-6 — Industry pages lead with the problem
The retained industry/service pages open with a recognisable business problem and link to the
application that demonstrates the solution.
**Acceptance:** (a) The first paragraph describes a problem, not a service category. (b) Each page links
to at least one application, or explicitly states that a demonstration is in progress. (c) Each page
ends with the same single primary action.

### FR-7 — One primary action everywhere
**Acceptance:** (a) Exactly one primary action is visible on every public page at both mobile and
desktop widths. (b) It is reachable on mobile without scrolling. (c) WhatsApp remains available on
every page as a zero-field alternative.

### FR-8 — Inquiry carries its origin
**Acceptance:** (a) An inquiry started from an application records that application. (b) An inquiry
started from an industry page records that page. (c) The founder sees this in readable form.
(d) Origin values are validated against a fixed pattern and contain no personal data.

### FR-9 — Language-correct reply expectation
**Acceptance:** (a) The confirmation states the one-business-day commitment in the visitor's language.
(b) The identical promise appears on the contact and help pages in both languages. (c) The reference
number is shown and is quotable.

### FR-10 — Founder can publish without help
**Acceptance:** (a) All fields required by FR-4 are editable in the dashboard in both languages.
(b) Draft content is never publicly reachable, including by direct URL. (c) Publishing makes the item
public without a deployment. (d) A validation error names the field and the fix in plain language.

### FR-11 — Media has stated limits
**Acceptance:** (a) Accepted types and the size limit are stated before upload. (b) A rejected upload
explains which rule it broke. (c) When storage is unconfigured, the editor says so and offers the
external-URL alternative.

### FR-12 — Shareable link previews
**Acceptance:** (a) Each application and industry page produces a title and description specific to it
and to the language of the link. (b) A raster preview image of at least 1200×630 is used.

### FR-13 — Search engines see both markets
**Acceptance:** (a) Both language versions of every public page are indexable. (b) The sitemap lists
both. (c) No two indexable URLs share the same canonical unless intended. (d) Structured data declares
the correct language per page.

### FR-14 — Nothing regresses
**Acceptance:** The already-shipped behaviours remain true: per-page metadata, branded 404,
draft recovery on the inquiry form, differentiated error states, expired-session return path, guided
dashboard empty states, help page and safe support report, and the global crash boundary.

---

## 9. Non-functional requirements

**Security.** Admin-only data is refused server-side, never merely hidden. Draft content is
unreachable without an admin session. Sign-in redirect targets stay same-origin and admin-scoped. No
secret reaches the browser bundle. Session expiry returns the user to their destination. Uploads are
authorised server-side with type and size enforced there. Rate limiting on public writes remains.

**Performance.** Largest Contentful Paint under 2.5s on a mid-range Android over 4G for the home page
and any application page; interaction latency under 200ms; total JavaScript for a first visit under
250KB compressed. Images lazy-loaded below the fold with explicit dimensions. Screen recordings never
autoplay with sound and never block first paint. Budget rationale: the target visitor is on a phone,
possibly on a slow network, and will not wait.

**Accessibility (WCAG 2.2 AA as the working bar).** Full keyboard operation with a visible focus
indicator. Text contrast at least 4.5:1 in both themes. Touch targets at least 44×44px. Every image
has appropriate alternative text; decorative images are marked as such. Form errors are announced and
tied to their field. Language and direction are declared correctly. Motion respects the
reduced-motion preference. Screen recordings have a text description — a visitor who cannot watch the
video must still learn what the application does.

**Privacy.** No advertising or analytics trackers. No third-party script that receives visitor data.
Collect only what is typed plus the page of origin. The form draft stays on the visitor's device. Rate
limiting keeps a salted hash, never a raw address, expiring within 30 days. A privacy statement is
published before any additional collection. Deletion on request is honoured manually.

**PWA — deliberately minimal.** A web app manifest (name, icons, theme, start URL) and an offline
fallback page so a lost connection produces an explanation and the WhatsApp escape rather than the
browser's error screen. **Explicitly excluded:** install prompts, push notifications, background sync,
full offline caching of case studies, app-store packaging. Rationale: nobody installs a portfolio
site; these add maintenance and permission prompts with no benefit to the goal.

**Localisation.** Arabic and English are peers: same information, same depth, same actions — a
translation gap is a defect, not a nice-to-have. Direction, alignment, icon mirroring and number
formatting follow the active language. Latin product names inside Arabic text are isolated so they do
not corrupt the reading order. Nothing is hard-coded to one country's phone shape, currency or date
convention. Untranslated content is hidden rather than shown in the wrong language.

---

## 10. Edge cases and failure states

| Situation | Required behaviour |
|---|---|
| Device language is neither Arabic nor English | Default to English; the switch remains available |
| Visitor previously chose a language, then arrives from a link in the other | The link's language wins for that page; the preference is not silently overwritten |
| Application published in one language only | Not shown as published until both languages exist, or clearly marked as available in one language |
| Screen recording fails to load or the visitor cannot play video | Static screens and the text description carry the full meaning |
| Slow network | Text and screens render before media; nothing blocks on video |
| Media storage unconfigured | Editor explains it and offers the external-URL path; publishing still works |
| Inquiry submitted while offline | Text preserved on the device, explicit offline message, retry, WhatsApp alternative |
| Rate limit reached | Explains the limit and offers WhatsApp, which is unaffected |
| Application URL changed after sharing | Old link must not silently 404 into nothing — the branded 404 offers the portfolio and contact |
| Draft URL guessed by a stranger | Treated as not found; no title, no content, no existence signal |
| Sign-in provider unavailable | Human sentence with the cause and a path back to the site |
| Session expired mid-edit | Returns to the same page after signing in |
| A render error occurs | Crash boundary with a reference and a recovery path; no blank screen |
| JavaScript disabled or fails | At minimum the contact channels must be discoverable; treated as a known limitation of the current architecture and stated, not pretended away |
| Two applications claim the same industry | Allowed; ordering is explicit, not accidental |

---

## 11. Success metrics

**North star:** qualified inquiries per month, where "qualified" means the founder marks it as such.

| Metric | Why | 90-day target |
|---|---|---|
| Inquiries per 100 contact-page visitors | Primary conversion | ≥ 3 |
| Share of inquiries originating from an application page | Whether the proof model works (validates A1) | ≥ 40% |
| Share of inquiries from the English site | Whether the second market is real (validates A2) | ≥ 15% |
| Indexed pages per language | Whether both markets are reachable at all | ≥ 20 each |
| Median hours to first reply | The single largest conversion lever | < 8 working hours |
| Inquiries with a usable reply channel | Whether the funnel produces contactable leads | ≥ 90% |
| Form error-state rate | Whether guardrails block real people | < 3% |

**Counter-metric (guards against vanity):** if traffic rises while inquiries per 100 visitors falls,
the site is attracting the wrong audience — fix targeting, not volume.

---

## 12. Prioritised backlog

### Must — without these the stated goal cannot be reached

| # | Item | Serves |
|---|---|---|
| M1 | Per-language URLs with alternates, detection and a page-preserving switch | P3, FR-3 |
| M2 | Five application case studies, complete in both languages | P4, FR-4 |
| M3 | Remove Oman as a market boundary; contact details fully configuration-driven | P2, FR-2 |
| M4 | Founder identity: About page, photo, bio, corrected voice site-wide | P1, FR-1 |
| M5 | Honest provenance labels on every portfolio item | P5, FR-5 |
| M6 | Application-level inquiry attribution surfaced to the founder | FR-8 |
| M7 | Raster social preview image per language | FR-12 |

### Should — materially improves conversion, not survival

| # | Item |
|---|---|
| S1 | Industry pages rewritten problem-first, each linking to a demonstrating application |
| S2 | "How I work" sequence with realistic durations |
| S3 | Minimal PWA: manifest plus offline fallback page |
| S4 | Screen recordings with text descriptions for each application |
| S5 | Privacy statement published |
| S6 | Archive-instead-of-delete for inquiries |

### Could — only after Must and Should are live and measured

| # | Item |
|---|---|
| C1 | Industry filter on the portfolio (justified only once there are more than ~8 items) |
| C2 | "Request a live walkthrough" action, to validate A6 cheaply |
| C3 | First real client testimonial, published with written permission |
| C4 | Second admin identity for lockout recovery |
| C5 | Structured data for individual services |

### Later — revisit only with evidence

Blog; third language; live demo deployments of all five applications; client portal; pricing page;
analytics platform; CRM; newsletter.

---

## 13. Risks and cheapest validation

| # | Risk | Impact | Cheapest way to test it |
|---|---|---|---|
| R1 | Self-built applications do not convince buyers without client references (A1) | Fatal to the goal | Publish the five, measure application → inquiry rate for 30 days. Below 1% means the *proof model* failed, not the design — pivot to acquiring one real client reference at cost price |
| R2 | Two languages double the content burden and both end up shallow | Both markets underperform | Complete English for the two strongest applications first; if the founder cannot sustain it, ship English for those two only and mark the rest clearly |
| R3 | Founder cannot sustain one-business-day replies in two languages | Published promise broken — worse than never promising | Track median reply time for 30 days; if it slips, change the published promise before a client discovers it |
| R4 | Five applications across five industries reads as unfocused | Weak positioning | Ask five people in the target segment which one they would open first; if answers scatter, lead with one industry and keep the rest as secondary |
| R5 | Demonstrations become stale or break | Credibility damage | Quarterly review; a broken or outdated application is unpublished, not left rotting |
| R6 | Hosting five live applications introduces recurring cost against the binding constraint | Budget violation | Start with screens and recordings inside the existing site — zero new cost. See §14 |
| R7 | Global positioning attracts unqualified enquiries from everywhere | Founder's time drains | Watch the qualified share; if it drops, add a light qualifying question rather than a barrier |
| R8 | Language detection sends a bilingual Gulf visitor to the wrong version | Bounce | The switch is always visible and one tap; measure switch usage — high usage means detection is wrong |

---

## 14. Compact PRD for an implementing agent

> Implement in this order. Do not add features not listed. Do not introduce a paid service. The
> existing stack is retained: the founder's binding constraint is cost.

**Context.** A bilingual portfolio and lead-generation site for one founder operating under the LENA
brand. Goal: paying project clients from Arabic and English markets. Proof: five self-built web
applications across different industries. Existing surface: home, services (8 tracks), service detail,
portfolio, work detail, about, ai-solutions, contact, help, login, dashboard, project editor. Existing
data model already supports rich case studies (localised content blocks, gallery, related services,
status, sort order) — **no schema change is required for the five applications.**

**Deliver, in order:**

1. **Per-language routing.** Every public page gets a distinct per-language URL. Root detects device
   language on first visit and routes accordingly; an explicit user choice persists and wins on later
   visits. The switcher keeps the visitor on the current page. `lang`/`dir` derive from the URL.
   Emit alternate-language links and a self-canonical per page. Include every language variant in the
   sitemap. Do not break existing shared links — old paths must resolve, not 404.
2. **De-regionalisation.** Remove Oman-as-market from all copy and metadata; keep it only as the
   founder's location in About and structured data. Move every contact literal into configuration.
   Make date formatting language-based, not country-based.
3. **Five application case studies.** Use the existing project entity. Each requires: industry label,
   business problem, intended user, 3–6 capabilities, ≥3 screens with alt text, provenance label,
   one primary action, both languages complete. Publishing gates on both languages being present.
4. **Founder identity.** Rewrite About around the named founder with photo and bio in both languages.
   Audit all public copy for unsupported team claims. Add the founder to Organization structured data.
5. **Attribution surfacing.** Inquiries already record entry context; ensure an application-originated
   inquiry displays the application's readable name to the founder.
6. **Social preview.** One raster image per language, at least 1200×630, referenced per page.
7. **Then Should-tier items** in backlog order.

**Definition of done for every item:** works at 375px and 1440px; keyboard-operable with a visible
focus ring; correct in both languages and both directions; no new runtime dependency; no new recurring
cost; existing verified behaviours (§FR-14) still pass.

**Never do without explicit founder approval:** publish a client name, logo or testimonial; publish a
metric that cannot be substantiated; add a paid service or recurring cost; collect personal data
beyond the inquiry form; change the published reply commitment; add push notifications or install
prompts.

**Resolved owner decision (2026-08-20):** the five applications are presented as **screens plus
short recordings inside this site**, with a "request a live walkthrough" action for anyone who wants
to see one running. Separate hosting for the five applications is **rejected** — zero additional
recurring cost, less maintenance, and the walkthrough requests measure real interest instead of
assuming it. Any single application may still be published live later without rebuilding anything.
