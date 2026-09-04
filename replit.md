# LENA Digital House

بيت رقمي يبني أنظمة تشغيل للأعمال — إدارة العقارات، والمراكز الصحية، وصالات العرض، وشركات
الاستثمار، وخدمات الضيافة، ومخازن إعادة التدوير — ويعرضها على منصة ثنائية اللغة تستقبل استفسارات
العملاء وتديرها من لوحة تحكم.

A digital house building operations systems for businesses, presented on a bilingual platform that
captures and manages client inquiries.

> **This file replaces an earlier version that described a different product entirely** (the former
> hospitality application, with tables and endpoints that do not exist). The hospitality application
> it referred to is a real client project — see `docs/PROJECT_INVENTORY.md` §5 — but it is not what
> this repository contains.

## Documents that matter

| Document | What it answers |
|---|---|
| `PRODUCT_DEFINITION.md` | What the product is, who it serves, what is in and out of scope |
| `FEATURE_GAP_STRATEGY.md` | What is missing, what should be removed, in what order |
| `ONBOARDING_ACTIVATION_PLAN.md` | First visit through first value |
| `HELP_SUPPORT_SYSTEM.md` | Help content map, support intake, escalation |
| `ADMIN_SUPPORT_OPERATIONS_SPEC.md` | Roles, capabilities, audit, risk controls |
| `PRIVACY_DATA_GOVERNANCE.md` | Data inventory, retention, user rights |
| `PRODUCT_MEASUREMENT_PLAN.md` | North star, event dictionary, dashboards |
| `AI_FEATURE_SYSTEM.md` | Why there is no AI, and the policy if that changes |
| `docs/RUNBOOK.md` | Operating procedures, severity, escalation |
| `docs/PROJECT_INVENTORY.md` | The six applications and what each still needs |

## Stack

pnpm workspace · TypeScript 5.9 · React 19 + Vite 7 (bilingual AR/EN, RTL and LTR) ·
Express 5 + tRPC v11 · PostgreSQL + Drizzle · Supabase Storage for project media · OAuth for the
single admin.

| Artifact | Path | Purpose |
|---|---|---|
| `artifacts/lena` | `/` | Public site and admin dashboard |
| `artifacts/api-server` | `/api` | API |
| `artifacts/mockup-sandbox` | — | Component preview, development only |

## Routes

Every public page lives under a language segment: `/ar/...` and `/en/...`. A link opens in the
language it was shared in; an unprefixed link is moved to the visitor's language without losing the
query string.

`/` · `/services` · `/services/:id` · `/portfolio` · `/work/:slug` · `/about` · `/ai-solutions` ·
`/contact` · `/help` · `/privacy` · `/login` · `/dashboard` · `/dashboard/projects-editor`

## Commands

```bash
pnpm install
pnpm run typecheck                                   # all packages
pnpm run build                                       # egress guard, typecheck, then build
pnpm run verify:egress                               # no AI SDKs, no undeclared outbound hosts
pnpm --filter @workspace/api-server dev              # API
pnpm --filter @workspace/lena dev                  # site (proxies /api to localhost:8080)
pnpm --filter @workspace/db migrate                  # apply migrations
bash tools/prepare-founder-photo.sh <photo>          # portrait + social card, metadata stripped
```

## Environment

Copy `.env.example`. Required in production: `DATABASE_URL`, `APP_SECRET`,
`INQUIRY_RATE_LIMIT_SECRET`, the OAuth values, and `SITE_URL` for canonical URLs and the sitemap.
Without `SMTP_*` the inquiry notification silently does nothing — the dashboard remains the reliable
source (`docs/RUNBOOK.md` §R2).

## Verification

Automated checks live in `tools/`. They cover authorization, the measurement layer, help-content
freshness, and outbound egress. `pnpm run build` runs the egress guard first, so a new AI provider or
an undeclared outbound host fails the build.
