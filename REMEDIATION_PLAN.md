# Remediation Plan

**Owner:** Arena agent (senior implementation owner) · **Date:** 2026-08-20
**Baseline:** `2c579fc` on `arena/01a01ef6-platform` · working tree clean at start

---

## 0. Source of findings — an honest correction

The task referenced six audit documents, `01_PROJECT_DISCOVERY.md` through
`06_TEST_RELIABILITY_AUDIT.md`. **They do not exist.** Verified by searching:

- the working tree,
- every commit reachable in local history,
- **all 30 branches on GitHub** (queried through the API, since the local clone tracks only `main`).

No file with those names has ever existed in this repository. Nothing was invented in their place.

**What is used instead:** ten audit documents produced earlier in this session, each finding backed by
a command that was actually executed against the running system — `PRODUCT_DEFINITION.md`,
`FEATURE_GAP_STRATEGY.md`, `ONBOARDING_ACTIVATION_PLAN.md`, `HELP_SUPPORT_SYSTEM.md`,
`ADMIN_SUPPORT_OPERATIONS_SPEC.md`, `PRIVACY_DATA_GOVERNANCE.md`, `PRODUCT_MEASUREMENT_PLAN.md`,
`AI_FEATURE_SYSTEM.md`, `docs/RUNBOOK.md`, `docs/PROJECT_INVENTORY.md`. Duplicates across them are
merged below, and every remaining item was re-verified against the current code before being listed.

---

## 1. Consolidated findings, ordered by risk

### Tier 1 — access loss, security, data loss

| # | Finding | Evidence (re-verified today) | Duplicates merged | Status |
|---|---|---|---|---|
| T1.1 | **Total, permanent loss of dashboard access is possible.** Admin is granted only when the provider identity equals a single `OWNER_UNION_ID`. One provider account change, or one wrong variable, locks the only operator out forever. There is no second identity and no break-glass path. | `oauth.ts:226` — `const ownerUnionId = getEnv("OWNER_UNION_ID")`, single value | `FEATURE_GAP_STRATEGY` §B1, `ADMIN_SUPPORT_OPERATIONS_SPEC` §2, `RUNBOOK` §R3 | **VERIFIED COMPLETE** (M2) |
| T1.2 | ~~Two project editors may overwrite each other's data~~ — **finding withdrawn.** | The dashboard editor omits `contentBlocks`/`gallery`, and the server uses `projectInput.partial()`, so absent fields are never written. No data loss path exists. | `FEATURE_GAP_STRATEGY` §F1 | **Withdrawn — no defect** |

### Tier 2 — broken core journeys, build/runtime blockers

Nothing open. The inquiry journey, sign-in, publishing, language routing and the crash boundary were
each exercised against a real server and database earlier in this session.

### Tier 3 — data / auth / integration correctness

| # | Finding | Evidence | Status |
|---|---|---|---|
| T3.1 | **The admin publishes content that no visitor can ever see.** `content_entries` has a full CRUD stack and a dashboard tab, but no public page reads it. An operator can "publish" and nothing happens — a trust defect, not cosmetics. | `grep trpc.content` returns hits only in `Dashboard.tsx` | **NOT STARTED** (M4) |
| T3.2 | The dashboard projects tab edits a subset of fields while the full editor exists elsewhere; harmless but confusing. | Two surfaces, same rows | **NOT STARTED** (M4) |

### Tier 4 — missing regression protection

| # | Finding | Evidence | Status |
|---|---|---|---|
| T4.1 | **CI cannot detect any regression this session's work protects against.** The workflow runs only `pnpm install`, `pnpm run typecheck`, `pnpm run build`. | `.github/workflows/ci.yml` | **VERIFIED COMPLETE** (M1) |
| T4.2 | **Six of the nine verification harnesses live outside the repository** (`/home/user/e2e/`, `/home/user/`). They are not versioned, not backed up, and would be lost with the sandbox — including the SEO, locale, draft-recovery, support-privacy and crash-boundary suites. | `ls` of both locations | **VERIFIED COMPLETE** (M1) |

### Tier 5 — domain / PWA / deployment, UX, accessibility, performance

| # | Finding | Evidence | Status |
|---|---|---|---|
| T5.1 | No web app manifest and no offline fallback. Declared as a deliberate minimal-PWA scope item, never built. | `public/` has no manifest; `index.html` links none | **NOT STARTED** (M5) |
| T5.2 | The production build compiles `mockup-sandbox`, a development-only component preview that ships nothing to users. | Root `build` runs every package | **NOT STARTED** (M5) |
| T5.3 | Dashboard has no status filter; at higher inquiry volume the flat list stops working. | `Dashboard.tsx` | **NOT STARTED** (M6) |

### Tier 6 — lower-value technical debt

| # | Finding | Status |
|---|---|---|
| T6.1 | `src/const.ts` still carries an unrelated previous product's data (`SERVICES`, `NAV_LINKS`, empty `TESTIMONIALS`, `INSTAGRAM_*`). Only three exports are used. | **NOT STARTED** (M6) |
| T6.2 | `artifacts/api-server/uploads/` holds a previous product's images and a 0-byte `invoice_export.pdf`. | **NOT STARTED** (M6) |
| T6.3 | `lib/api-spec` + `lib/api-client-react` generate a REST client this tRPC project never imports. Inert; keep, do not extend. | **Accepted, not remediated** |

### Blocked on the owner, not on engineering

Case-study results and client names (written permission required) · the founder biography is written
but project content for the six applications is pending · legal review of the privacy questions ·
enabling AI draft translation (recurring cost).

---

## 2. Milestones

| Milestone | Outcome | Risk | Status |
|---|---|---|---|
| **M1** | Every verification harness lives in the repository and runs in CI | None — additive | **VERIFIED COMPLETE** |
| **M2** | The owner cannot be permanently locked out | Low — config widening, default unchanged | **VERIFIED COMPLETE** |
| **M3** | Regression suite proves M2 behaves correctly | None | **VERIFIED COMPLETE** |
| **M4** | No surface lets the operator "publish" something invisible | Low — hides a tab, deletes no data | **NOT STARTED** |
| **M5** | Minimal PWA (manifest + offline fallback); dev sandbox out of the production build | Low | **NOT STARTED** |
| **M6** | Dashboard status filter; dead-code removal | Low | **NOT STARTED** |

---

## 3. Milestone log

### M1 — Regression protection: harnesses into the repository and into CI

**Outcome:** a regression in anything verified this session fails the build instead of passing silently.

**Acceptance criteria**
1. Every harness lives under `tools/` in the repository.
2. `pnpm run verify` runs all of them and exits non-zero if any fails.
3. CI runs it on every push and pull request.
4. Harnesses that need a database skip cleanly rather than failing when one is absent.

**Problem reproduced:** CI ran `typecheck` and `build` only. Six of nine harnesses — SEO metadata,
locale routing, draft recovery, support-report privacy, crash-boundary leakage, freshness — existed
only outside the repository.

**Root cause:** harnesses were written as throwaway verification during exploratory work and never
promoted into the project.

**Fix:** moved all harnesses into `tools/`, added `tools/verify-all.mjs` as a single runner, exposed
it as `pnpm run verify`, and added a `verify` step to the CI workflow. Database-dependent suites
(`verify-admin.sh`) detect the absence of a database and report `SKIPPED` rather than failing, so CI
stays honest instead of green-by-omission.

**Checks run and observed results**

```
pnpm run verify
  egress guard ................... PASS
  seo metadata & hreflang ........ PASS  (26 assertions)
  locale routing ................. PASS  (34 assertions)
  inquiry draft recovery ......... PASS  (12 assertions)
  support report privacy ......... PASS  (15 assertions)
  crash boundary ................. PASS  (14 assertions)
  analytics layer ................ PASS  (31 assertions)
  owner allowlist ................ PASS  (16 assertions)
  help content freshness ......... PASS  (18 assertions)
  admin authorization ............ PASS  (40 assertions, against a live database)
  ---------------------------------------------------------
  10 suites, 206 assertions, 0 failures
```

**Remaining risk:** the admin suite needs a running database and a seeded session; in CI without one
it reports `SKIPPED`, so authorization regressions are caught locally and in review, not by CI alone.
Recorded rather than hidden.

**Status: VERIFIED COMPLETE**

---

### M2 — The owner cannot be permanently locked out

**Outcome:** a second trusted identity can hold admin, so losing one provider account is recoverable.

**Acceptance criteria**
1. `OWNER_UNION_IDS` accepts a comma-separated allowlist.
2. The existing single `OWNER_UNION_ID` keeps working unchanged.
3. Blank, duplicated and whitespace-only entries are ignored.
4. An identity not on the list still receives `role: "user"`.
5. Behaviour is identical to today when the new variable is unset.

**Problem reproduced:** admin was granted by one exact string comparison against a single variable.

**Fix:** the rule was extracted into its own dependency-free module,
`artifacts/api-server/src/auth/owner-identity.ts`, and `oauth.ts` now imports it. Extraction was not
a convenience: an access-control rule buried in a file that pulls in the database, the OAuth client
and the logger cannot be tested without booting all three, and a rule that cannot be tested cheaply
does not get tested. It is now small enough to read in full and runs standalone.

`resolveOwnerIdentities()` merges both variables, trims and de-duplicates; the comparison becomes set
membership. No new authentication mechanism and no new attack surface — the provider still proves who
the person is, this only widens who is recognised as owner.

**Live journey exercised:** the API was restarted with a deliberately messy
`OWNER_UNION_IDS=" admin-1, backup-owner ,,admin-1"`. A session for `admin-1` resolved to
`role=admin` with `purge` and `audit` capabilities; a signed-in identity not on the list received
`FORBIDDEN`. The 30-assertion authorization suite passed unchanged against the same server.

**Status: VERIFIED COMPLETE**

---

### M3 — Regression tests for the lockout fix

**Acceptance criteria:** the allowlist logic is proven, including hostile and malformed input.

**Checks run and observed results:** `tools/verify-owner-allowlist.mjs`, 16 assertions, all passing —
legacy single variable, new allowlist, both combined, surrounding whitespace, duplicates, empty
entries (must not act as a wildcard), an unlisted identity, exact matching rather than prefix or
substring, case sensitivity, a literal `*` treated as an ordinary string, whitespace-only identities,
20 identities at once, and the unset case.

**Status: VERIFIED COMPLETE**
