# Open Decisions & Pending Tasks — complete register

> **ALL ANSWERED by the owner on 2026-08-20.** The register below is kept for traceability; the
> answers and what each one changed are recorded in §Answers at the end. Only two items remain open,
> both because the owner does not yet have the value: a second admin account id (C1, approved in
> principle) and permission to name the hospitality client (B4, deliberately withheld).

**Date:** 2026-08-20 · **Purpose:** the owner asked for *every* deferred decision and task in one
place, with nothing held back.

Two lists, deliberately separated:

- **Part A — needs the owner.** Facts, credentials, money, legal, or commercial policy. I cannot
  invent these. Each carries my recommendation so the answer can be one word.
- **Part B — mine to do.** Technical work needing no owner input. Listed for visibility, not approval.
  These proceed on the next pass unless the owner says otherwise.

Nothing else is outstanding anywhere in the repository. This register supersedes the scattered
"pending" markers in the other documents.

---

# Part A — needs the owner

## A. Business model (new, from the 2026-08-20 correction)

| # | Question | My recommendation | Why it matters |
|---|---|---|---|
| **A1** | For each of the six products: **sale** or **subscription**? | Subscription for the ones with daily operational use (Kayyal, property, spa, rental); outright sale for the ones bought as a one-off tool (investment, hospitality). Subscription matches continuous development. | Determines the page's call to action, and whether recurring billing is ever needed |
| **A2** | Do we **publish prices** on the site? | **No, not yet.** Publish "from" pricing only once one product has a repeatable price. Until then the current procedural answer is correct. | Publishing a wrong price is harder to undo than publishing none |
| **A3** | **Who hosts it?** You host the product and the customer logs in, or you deploy a copy for each customer? | You host it. One codebase, one deployment, customers separated by account. Deploying copies multiplies maintenance by the number of customers. | This is the single most consequential technical decision in the whole product; everything about accounts, billing and updates follows from it |
| **A4** | What do you commit to **after** a customer starts using it? | "Updates and fixes are included while the subscription is active." No response-time promise yet. | It is the first question a buyer asks about software, and it is currently unanswered |
| **A5** | Is any product **live with a real paying or using customer today**? | If Kayyal is running in a real warehouse, it leads the whole site. | "Running in a real warehouse" outweighs every feature list on the page |

## B. Content needed before the site can prove anything

| # | Needed | Why |
|---|---|---|
| **B1** | **3 screenshots per product** (6 products) | The site now says the right thing and shows nothing. This is the single biggest gap |
| **B2** | **One line per product: who exactly uses it** ("the warehouse owner and one worker at the weighbridge") | Turns a feature list into a recognisable person |
| **B3** | **Stage for each product**: live / in pilot / built and available | Buyers of operational software buy evidence of real use |
| **B4** | **Written permission** to name the hospitality client | Third-party proof is the strongest asset you have; the name cannot be published without it |
| **B5** | Do you want your **nationality** shown on the site? | Recommendation: **no** — it does not help win a project. One word either way |

## C. Access, credentials, cost

| # | Item | My recommendation | Blocked because |
|---|---|---|---|
| **C1** | A **second admin identity** for the allowlist | Give me a second provider account id; the mechanism is built and tested | Today one lost account locks you out permanently |
| **C2** | **SMTP credentials** | Provide them, or accept that the dashboard is the only place inquiries appear | Without them the notification email silently does nothing |
| **C3** | **CI permission** — four lines in `.github/workflows/ci.yml` | Either grant the connection `workflows` permission, or paste the four lines yourself (`docs/CI_VERIFY_STEP.md`) | GitHub refuses workflow edits from this connection |
| **C4** | **AI draft translation** in the editor (paid provider) | **Approve it.** Under 1 USD/month at realistic volume; it removes the two-language content burden, the biggest sustainability risk in the plan | Introduces a recurring cost, so it needs your word |

## D. Legal and policy

| # | Item | My recommendation |
|---|---|---|
| **D1** | **Retention: anonymise inquiries after 24 months.** The mechanism is built, tested and **never runs on its own** | Approve 24 months. Nothing is deleted automatically; you trigger it |
| **D2** | **Legal review** of the privacy questions (six recorded in `PRIVACY_DATA_GOVERNANCE.md` §9) | Do it before actively marketing to the English market, not before launch |
| **D3** | Wording of the **pricing answer** in the FAQ | Keep as written: no price list, scope and cost defined before any commitment |
| **D4** | Reply-time promise is published as **one business day** | Keep it, and let the measurement confirm you meet it. Change it before a client discovers otherwise |

## E. Product decisions still open

| # | Decision | My recommendation |
|---|---|---|
| **E1** | Which product **leads** the homepage | Kayyal — the only one with a measurable promise ("under 30 seconds") and a named operator |
| **E2** | Do the hidden creative tracks ever come back? | Only as *capabilities inside a product page*, never as products for sale |
| **E3** | Delivery lifecycle statuses (discovery → pilot → rollout) | Not yet. Add when a second engagement runs in parallel |
| **E4** | Which contact number is **primary** for the floating button | Currently Oman. Say the word to change it |

---

# Part B — mine to do, no approval needed

Proceeding on the next pass unless told otherwise. Ordered by risk reduction.

| # | Task | Evidence | Effort |
|---|---|---|---|
| **B-1** | Remove the unused `orval` / `api-client-react` chain | Zero files import it; it carries **5 high advisories** | S |
| **B-2** | Resolve `multer` — remove if dead, upgrade if used | High advisory on a public server | S |
| **B-3** | Security patch bumps: `react-router` ≥7.18, `nodemailer` ≥9.0.1, `vite` ≥7.3.5 | Advisories reaching shipped code | S |
| **B-4** | Exclude `mockup-sandbox` from the production build | Ships nothing; ~25% of build time | XS |
| **B-5** | Delete `artifacts/api-server/uploads/` (1.6 MB of a previous product) | Not served, not referenced | XS |
| **B-6** | Align Node version across CI, sandbox and production | Declared 24, running 22 | S |
| **B-7** | Minimal PWA: manifest + offline fallback page | Specified, never built | S |
| **B-8** | Dashboard status filter for inquiries | Flat list stops working at volume | M |
| **B-9** | Clean `src/const.ts` of the previous product's data | Dead constants | XS |
| **B-10** | Operator section on each product page (D6) | Needs B1/B2 content first | M |
| **B-11** | Accessibility audit with assistive technology | **Blocked:** no browser can be installed in this environment | — |
| **B-12** | Low-end device performance measurement | **Blocked:** same reason | — |
| **B-13** | Pagination for `inquiries.list` | Deliberately deferred to ~500 inquiries | M |

---

## How to answer

Answering **A1–A5, B1–B5, C1–C4, D1–D4, E1–E4** in any form — a sentence each is enough — clears
every open decision in the project. Part B needs nothing from you.


---

# Answers received — 2026-08-20

| # | Owner's answer | What changed |
|---|---|---|
| A1 | Per product: some are **outright sale with ownership transfer**, some **subscription** | Recorded. **Not published** — no commercial model is claimed on the site |
| A2 | Do not publish prices | Unchanged; no price appears anywhere |
| A3 | Hosting **per product**; do not force one model | No architecture built. Recorded as a per-product decision taken at sale time |
| A4 | Subscription → ongoing updates and support. Outright sale → a **separate support agreement per product** | Published as the after-delivery answer |
| A5 | **Property (Malek) and Hospitality are in real use** | Both now carry an "In real use" badge — the strongest proof on the site |
| B1 | Screenshots later | Portfolio keeps its honest "being prepared" state |
| B2 | Not a one-liner — **full detail per product**: what it is, how it is used, who benefits | Each product now has industry, stage, problem, how it is used, who benefits, and what it runs |
| B3 | Everything is **trial**, except the two products in real use | Two stages implemented: `in-use` and `trial` |
| B4 | **Do not name the hospitality client** until explicit approval | No client name appears. Still open |
| B5 | Do not show nationality | Not shown |
| C1 | **Approved** — second admin identity | Mechanism built and tested; awaiting the actual account id |
| C2 | SMTP not ready, defer | Dashboard remains the reliable source; documented in the runbook |
| C3 | Leave CI wiring for now | `pnpm run verify` stays manual; the four lines remain documented |
| C4 | **No** AI draft translation | Recorded as rejected. No AI anywhere; the egress guard keeps it that way |
| D1 | **Approved** — anonymise after 24 months | Policy confirmed. Still never runs automatically; the owner triggers it |
| D2 | No lawyer for now | Recorded as an accepted, owner-known risk |
| D3 | Keep the pricing answer; prices given per product and case on request | Wording updated to say exactly that |
| D4 | Keep the one-business-day promise | Unchanged |
| E1 | Order: **Bio Beauty**, then **LENA Dressroom**, then the rest. **Kayyal must not lead** | Implemented as an explicit `order` field |
| E2 | Keep the creative tracks; hide them only, restore later as standalone services | Hidden, not deleted. Eight tracks and eight concept projects preserved |
| E3 | **Yes** — a real delivery pipeline | Implemented: new → contacted → quoted → agreed → in delivery → completed → closed → archived |
| E4 | Oman number for the floating button | Unchanged, already Oman |

**Two interpretations the agent made, flagged for correction if wrong:** "منتج الفتاتين" was read as
**الفساتين** (LENA Dressroom), and "بيو بيوتي" was taken as the product name for the health-centre and
spa system previously referred to as LENA Beauty.
