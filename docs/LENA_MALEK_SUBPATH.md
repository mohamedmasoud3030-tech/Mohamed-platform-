# LENA under MALEK `/lena`

LENA Digital House remains an independent product of this repository. MALEK is a
separate product, developed by LENA. The public relationship is:

```
MALEK  →  Developed by LENA Digital House  →  LENA Digital House
```

This document is the deployment contract that makes that relationship true in
the browser without merging the two repositories or using an iframe.

## Public addresses

When reverse-proxied from MALEK, every LENA URL lives under the MALEK origin:

- `https://<MALEK_PUBLIC_DOMAIN>/lena`
- `https://<MALEK_PUBLIC_DOMAIN>/lena/ar`
- `https://<MALEK_PUBLIC_DOMAIN>/lena/ar/services`
- `https://<MALEK_PUBLIC_DOMAIN>/lena/en/about`
- `https://<MALEK_PUBLIC_DOMAIN>/lena/api/*`

The browser never sees the internal Platform Vercel host.

## Environment (Platform Vercel project)

| Variable | Production value behind MALEK |
| --- | --- |
| `BASE_PATH` | `/lena/` |
| `SITE_URL` | `https://<MALEK_PUBLIC_DOMAIN>` |
| `VITE_SITE_URL` | `https://<MALEK_PUBLIC_DOMAIN>` |

`SITE_URL` / `VITE_SITE_URL` must be the **MALEK public origin**, not this
project's `*.vercel.app` host. Canonical tags, Open Graph URLs and the sitemap
are built from that origin plus `BASE_PATH`.

Standalone deploys keep `BASE_PATH=/` and may omit `SITE_URL` (Vercel production
URL is then used).

`BASE_PATH` is the only input. Vite `base`, the React router basename, API
clients, cookie `Path`, OAuth callback URLs, canonical tags and the sitemap all
read it through `lib/base-path.ts`. Do not concatenate it at call sites.

## Vercel

This project's `vercel.json` already maps:

- `/lena/api/*` → the Platform API function
- `/lena/assets/*` → Vite assets
- `/lena/*` → the LENA SPA
- `/api/*` → the same API, for a standalone origin

MALEK's Vercel project must **rewrite** (not redirect) `/lena/:path*` to this
deployment's `/lena/:path*` **before** MALEK's SPA fallback. A Platform outage
then fails only under `/lena`; MALEK login, dashboard and APIs keep working.

## Security

- Admin UI (`/login`, `/dashboard`, CMS) is still authenticated. Same-domain
  proxying is not permission.
- Session cookies (`kimi_sid`) use `Path=/lena` when `BASE_PATH=/lena/`, so they
  are not sent to MALEK routes.
- OAuth `next` values are accepted only after stripping the base path and
  locale, and only if the remainder is `/dashboard...`.
- `robots.txt` disallows login and dashboard under both `/` and `/lena`.

## Referral marker

The MALEK login endorsement may link to `/lena/ar?from=malek`. That query is a
non-sensitive source marker. No user id, email, tenant id or auth state is
transferred.
