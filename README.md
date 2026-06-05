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
- `SUPABASE_URL` for Supabase Storage signed-upload authorization.
- `SUPABASE_SERVICE_ROLE_KEY` for server-side Storage signing only. Never expose this through `VITE_*`.
- `INQUIRY_RATE_LIMIT_SECRET` for HMAC hashing of normalized trusted client IP addresses. This is required in production.
- `TRUST_PROXY_HOPS`, defaulting to `1` for Vercel. Override it only when the deployment proxy topology differs.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `NOTIFY_EMAIL` for inquiry notifications.
- `APP_ID`, `APP_SECRET`, `KIMI_AUTH_URL`, `KIMI_OPEN_URL`, and `OWNER_UNION_ID` for OAuth/admin access.

CMS media uploads use an admin-authorized signed URL. The browser requests `/api/upload/sign`, then uploads file bytes directly to the fixed public Supabase bucket `lena-project-media`; media bytes do not pass through Vercel Functions. The API validates the approved MIME list and the 100MB limit before issuing the signed URL.

Public inquiry rate limiting trusts `req.ip` after Express `trust proxy` configuration, stores only an HMAC digest, allows five attempts per hour, and opportunistically deletes limiter rows older than 30 days.

## Vercel deployment

- Frontend output: `artifacts/jiwdah/dist/public`
- API requests under `/api/*` route to `api/[...path].ts`
- Before production approval, verify `/`, `/services`, `/portfolio`, `/contact`, `/login`, `/dashboard`, and `/api/trpc/ping`.
