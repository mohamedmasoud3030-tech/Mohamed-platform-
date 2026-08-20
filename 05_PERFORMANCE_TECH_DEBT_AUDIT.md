# Performance & Technical Debt Audit

**Date:** 2026-08-20 · **Baseline commit:** `879b564` · **Read-only assessment — nothing was changed.**
**Environment:** Node v22.22.3 (project targets 24), pnpm 10.34.5, API and PostgreSQL on the same host.

> Every number below was measured in this sandbox, not estimated. Where a measurement was impossible,
> it says so rather than guessing.

---

## 1. Repeatable baseline

```bash
rm -rf artifacts/jiwdah/dist
SITE_URL=https://example.com pnpm run build      # full production build
cd artifacts/jiwdah/dist/public/assets && for f in *.js; do gzip -c $f | wc -c; done
pnpm audit                                        # advisories
pnpm run verify                                   # 10 suites, 206 assertions
```

| Metric | Measured |
|---|---|
| Full production build (all 3 packages) | **23.7 s** |
| Entry JavaScript, first visit | **103 KB gzip** (328 KB raw) |
| Entry CSS | **27 KB gzip** (160 KB raw) |
| Heaviest lazy route (`Dashboard`) | 12 KB gzip — admin only |
| Public route chunks | 2–6 KB gzip each |
| Images shipped | 68 KB total, lazy, below the fold |
| Third-party requests | **0** |
| Web fonts | **0** (system stack) |
| Service worker | none |
| `ping` latency | p50 **1.6 ms**, p95 2.1 ms |
| `projects.listPublished` | p50 **3.1 ms**, p95 4.3 ms, max 7.6 ms |
| `inquiries.list` (admin) | p50 **1.7 ms**, p95 1.9 ms |
| Response payloads | 31–59 bytes |
| Automated checks | 10 suites, **206 assertions**, 0 failing |

**Verdict on performance: there is no measured performance problem.** 103 KB of JavaScript with zero
third-party requests and no web fonts is well inside a healthy budget for a content site. Every route
except the admin dashboard is a few kilobytes. API latency is single-digit milliseconds. Optimisation
work here would be effort spent against a number that is already good.

**The honest gap:** no measurement was taken on a real low-end device or a throttled network, because
no browser could be installed in this environment (Chromium download is blocked). Bundle size, request
count and payload size are measured; Largest Contentful Paint, long tasks, rerenders, hydration cost
and memory behaviour are **not**. They are not claimed.

---

## 2. Highest-impact findings

### F1 — Five high-severity advisories come from a package the project never uses
**Severity: high · Effort: small · Defer: no**

`lib/api-spec` (orval) and `lib/api-client-react` generate a REST client for an API that does not
exist — this project is tRPC end-to-end. **Zero files import either package.** They drag in
`typedoc → markdown-it → linkify-it`, `js-yaml`, `brace-expansion`, `fast-uri`: five distinct high
advisories and a large share of the 516 installed packages.

- **Evidence:** `grep` for `api-spec` and `@workspace/api-client-react` outside their own directories returns **0 matches**; advisory paths all read `lib__api-spec>orval>…`.
- **Impact:** no user impact — build tooling only. The cost is install time, audit noise, and a maintenance surface that makes real advisories harder to see.
- **Smallest remediation:** remove the two workspace packages and the `@workspace/api-client-react` dependency from `artifacts/jiwdah/package.json`.
- **Expected benefit:** roughly a third of all advisories disappear; fewer packages to install.
- **Regression risk:** low — but `jiwdah/tsconfig.json` references `api-client-react` as a project reference, so removal must be done in one coherent change with a typecheck.
- **Tests:** `pnpm run typecheck`, `pnpm run build`, `pnpm run verify`.
- **Rollback:** revert one commit.

### F2 — `multer` carries a high advisory and may be dead code
**Severity: high (if reachable) · Effort: small · Defer: no**

Uploads were moved to signed direct-to-storage. `multer` still appears in 4 source references and in
production dependencies, with a DoS advisory fixed in 2.2.0.

- **Impact:** if a multipart route is still mounted, it is a reachable DoS vector on a public server.
- **Smallest remediation:** confirm whether any route still uses it. If not, remove the dependency; if yes, upgrade to ≥ 2.2.0.
- **Deferring is not reasonable** for a public endpoint.

### F3 — `react-router` and `nodemailer` advisories reach production
**Severity: high · Effort: small · Defer: partially**

| Package | Installed path | Fixed in | Reachable here? |
|---|---|---|---|
| `react-router` | `artifacts/jiwdah` | ≥ 7.15.0 (high), ≥ 7.18.0 (moderate) | The DoS is in the `__manifest` endpoint, a framework-mode server feature. This app is a client-side SPA with no such endpoint, so **the advisory is real but likely not reachable**. Upgrade anyway — it is a patch bump. |
| `nodemailer` | `artifacts/api-server` | ≥ 9.0.1 | The advisory concerns the message-level `raw` option; this code never uses it. **Not reachable as written**, but it sends mail from a public path. Upgrade. |
| `qs`, `body-parser` | via `express` | ≥ 6.15.2 / ≥ 2.3.0 | Transitive through Express, which is production. Moderate/low. |

**Correction to a common misreading:** the raw count of "21 high" is misleading. Only **7 distinct
advisories touch shipped code**, and of those, two are not reachable given how the code is written.
Sixteen are build tooling that never reaches a user.

### F4 — Two unbounded queries
**Severity: moderate · Effort: small · Defer: yes, for now**

`inquiries.list` and the retention scan select every matching row with no `LIMIT`.

- **Evidence:** `inquiries.ts:79`, `operations.ts:227`.
- **Impact:** none today at a handful of inquiries; the dashboard degrades linearly and the retention scan loads the whole tail into memory once volume grows.
- **Smallest remediation:** paginate `inquiries.list` (50 per page) and batch the retention scan.
- **Trigger to act:** more than ~500 inquiries. Deferring until then is reasonable and is recorded as a decision, not an oversight.

### F5 — One N+1 write loop in the retention path
**Severity: low · Effort: small · Defer: yes**

`operations.ts:230` issues one `UPDATE` per row. It runs manually, rarely, on old records. A single
`UPDATE … WHERE updated_at < cutoff` would replace it. Not worth changing until volume justifies it.

### F6 — The production build compiles a development-only package
**Severity: low · Effort: trivial · Defer: no**

`mockup-sandbox` is a component preview that ships nothing to users, yet builds on every deploy.
Excluding it removes roughly a quarter of the 23.7 s build with zero user-facing change.

### F7 — 1.6 MB of a previous product's files are committed
**Severity: low · Effort: trivial**

`artifacts/api-server/uploads/` holds a previous product's images and a 0-byte `invoice_export.pdf`.
Not served, not referenced. Repository weight and confusion only.

### F8 — Runtime version drift
**Severity: moderate (operational) · Effort: none technical**

The project declares Node 24; this environment runs 22.22.3. Everything builds and passes, so the
mismatch is currently harmless — but CI, the sandbox and production should agree, or a failure will
appear in exactly one of them.

---

## 3. What is genuinely healthy — and should not be "improved"

| Signal | Measurement |
|---|---|
| TODO / FIXME / HACK markers | **0** |
| `@ts-ignore` / `@ts-expect-error` | **0** |
| `eslint-disable` | **0** |
| `: any` annotations | **0** |
| Third-party scripts, trackers, embeds | **0** |
| Web fonts | **0** |
| Circular dependencies observed | none |
| Largest module | 477 lines (`Dashboard.tsx`) — large but coherent |
| Automated assertions | 206, passing |
| Egress guard | blocks undeclared outbound hosts at build time |

This is an unusually clean codebase for its age. **No suppression, no disabled check, no dead type
escape hatch.** That is the strongest technical signal in this audit and it should be protected.

---

## 4. Debt register, ranked by Risk Reduction ÷ Effort

| Rank | Item | Risk reduction | User value | Effort | Verdict |
|---|---|---|---|---|---|
| 1 | Remove unused `api-spec` / `api-client-react` (F1) | High | None direct | S | **Do now** |
| 2 | Resolve `multer` — remove or upgrade (F2) | High | None direct | S | **Do now** |
| 3 | Upgrade `react-router`, `nodemailer` (F3) | Medium | None direct | S | **Do now** |
| 4 | Exclude `mockup-sandbox` from production build (F6) | Low | None | XS | **Do now** |
| 5 | Delete legacy `uploads/` (F7) | Low | None | XS | **Do now** |
| 6 | Align Node version across environments (F8) | Medium | None | S | Next |
| 7 | Paginate `inquiries.list` (F4) | Low today | Medium later | M | Defer to ~500 inquiries |
| 8 | Batch the retention update (F5) | Low | None | S | Defer |
| 9 | Measure on a real low-end device | Unknown | Potentially high | M | Next, needs a browser |

## 5. Update now vs postpone

**Now (security, all patch/minor):** `react-router` → ≥ 7.18.0 · `nodemailer` → ≥ 9.0.1 ·
`multer` → ≥ 2.2.0 or remove · `vite` → ≥ 7.3.5 (dev-only but trivial).

**Postpone:** everything else. React 19, Express 5, Drizzle, tRPC v11 and Tailwind v4 are current and
healthy. There is no measured reason to touch them, and a major upgrade would risk a working system
against no benefit.

## 6. Safe quick wins (under an hour, no user-visible risk)

Remove the unused orval chain · delete legacy uploads · exclude the sandbox from the production build ·
three security patch bumps · pin the Node version consistently.

## 7. Changes that would add unjustified complexity — explicitly rejected

Microservices · a framework rewrite · server-side rendering (an SPA at 103 KB with no third-party
requests does not need it) · a CDN or image pipeline for 68 KB of images · Redis or a caching layer for
3 ms queries · a service worker beyond a simple offline fallback · code-splitting beyond what already
exists · replacing pnpm, Vite, Drizzle or tRPC · adding an APM or observability vendor at this scale.

## 8. Phased roadmap, no rewrite

**Phase 1 — hygiene (1 session, low risk).** Items 1–5 above. Measurable: distinct advisories drop
from 23 to roughly 5; build time falls by about a quarter; installed packages drop noticeably.

**Phase 2 — environment truth.** Align Node across CI, sandbox and production; wire `pnpm run verify`
into CI (currently blocked on a GitHub `workflows` permission).

**Phase 3 — real measurement.** Once a browser is available, measure LCP, long tasks and rerenders on a
throttled mid-range profile. Only then consider rendering-level work.

**Phase 4 — scale-triggered.** Pagination and batching when inquiry volume crosses ~500. Not before.
