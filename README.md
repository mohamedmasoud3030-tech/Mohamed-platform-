# LENA Digital House

منصة رقمية ثنائية اللغة لعرض الحلول الإبداعية والتجارب والمشاريع واستقبال استفسارات العملاء وإدارتها من لوحة تحكم.

## Project structure

```text
api/[...path].ts                 Vercel API entry
artifacts/jiwdah/                React + Vite frontend
artifacts/api-server/            Express + tRPC API
lib/db/                          Drizzle schema and migrations
lib/api-zod/                     Shared validation types
vercel.json                      Vercel routing configuration
```

## Requirements

- Node.js 24+
- pnpm
- PostgreSQL

## Local development

```bash
pnpm install
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/jiwdah dev
```

## Verification

```bash
pnpm run typecheck
pnpm run build
```

## Database

Apply migrations before using the inquiry form or dashboard CRUD screens:

```bash
pnpm --filter @workspace/db migrate
```

Migration `0008_lena_project_media_bucket` is idempotent. On Supabase it creates or updates the public `lena-project-media` Storage bucket with a 100MB object limit and the approved image/video MIME list. On plain PostgreSQL it safely skips the Storage bucket setup and still creates the DB-backed inquiry rate-limit table.

## Environment variables

Copy `.env.example` to `.env` and configure the same values in Vercel. The contact channels used by the public experience are `VITE_PRIMARY_WHATSAPP` and `VITE_CONTACT_EMAIL`. Set `NOTIFY_EMAIL` to receive inquiry-form notifications.

Server-only production settings:

- `DATABASE_URL` for PostgreSQL/Supabase.
- `SUPABASE_URL` for Supabase Storage object uploads.
- `SUPABASE_SERVICE_ROLE_KEY` for server-side Storage writes. Never expose this through `VITE_*`.
- `LENA_PROJECT_MEDIA_BUCKET`, defaulting to `lena-project-media`.
- `INQUIRY_RATE_LIMIT_SECRET` for keyed hashing of inquiry rate-limit identifiers. `APP_SECRET` is used as a fallback when this is omitted.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAIL` for inquiry notifications.
- `APP_ID`, `APP_SECRET`, `KIMI_AUTH_URL`, `KIMI_OPEN_URL`, and `OWNER_UNION_ID` for OAuth/admin access.

In production or Vercel, CMS media uploads fail fast with `Project media storage is not configured for production.` if Supabase Storage credentials are missing. Local development without Supabase credentials falls back to `uploads/` served from `/api/uploads/*`.

## Vercel deployment

- Frontend output: `artifacts/jiwdah/dist/public`
- API requests under `/api/*` route to `api/[...path].ts`
- Before production approval, verify `/`, `/services`, `/portfolio`, `/contact`, `/login`, `/dashboard`, and `/api/trpc/ping`.
