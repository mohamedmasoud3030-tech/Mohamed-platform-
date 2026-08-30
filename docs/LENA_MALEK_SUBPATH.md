# LENA Digital House — parent brand and independent deploys

LENA Digital House is the parent company / master corporate brand.
MALEK, Terranex, LENA Beauty, LENA Dress and future products are independent
products developed by LENA. They are not white-labels of one another, and
MALEK is never renamed “LENA MALEK”.

```
LENA Digital House
├── MALEK
├── Terranex
├── LENA Beauty
├── LENA Dress
└── future products
```

Public relationship on a product surface:

```
MALEK — Developed by LENA Digital House
تم تطوير MALEK بواسطة LENA Digital House
```

## Canonical production: two Vercel projects

MALEK keeps its existing Vercel project and domain. LENA Digital House is
deployed independently from `mohamedmasoud3030-tech/platform`. The company
website does **not** live inside a product as `/lena`.

| Project | Repo | `BASE_PATH` | Public origin |
| --- | --- | --- | --- |
| LENA Digital House | `platform` | `/` | LENA custom domain (preferred) |
| MALEK | `malek` | `/` | existing MALEK domain |

Platform production environment:

```env
BASE_PATH=/
SITE_URL=https://<LENA_PUBLIC_DOMAIN>
VITE_SITE_URL=https://<LENA_PUBLIC_DOMAIN>
```

`SITE_URL` / `VITE_SITE_URL` must be **this** site's public origin, never a
MALEK domain and never an internal preview host used as the brand destination.

MALEK production environment:

```env
VITE_LENA_HOUSE_ORIGIN=https://<LENA_PUBLIC_DOMAIN>
```

The MALEK login endorsement is a native `<a>` to LENA’s **normal homepage**
(`/{ar|en}?from=malek`). It must not land on `/products/malek`, support, or a
chooser screen.

`from=malek` is a non-PII referral marker for analytics/context only. It must
not change the LENA homepage into a support flow, force the visitor back into
MALEK, or open a product-selector. Products (MALEK, Terranex, LENA Beauty,
LENA Dress) are discovered inside the ordinary LENA company content.

## What this architecture rejects

- Reverse-proxying `MALEK_DOMAIN/lena/*` as the canonical company website
- Requiring MALEK production to rewrite `/lena` to Platform
- Iframing Platform into MALEK
- Redirecting users to GitHub
- Exposing a random `*.vercel.app` preview host as the intended public brand URL
- Merging the two repositories or copying the LENA frontend into MALEK

MALEK must not depend on Platform for boot, authentication, core assets or
runtime. A LENA outage cannot take down MALEK login or APIs.

## Optional capability: `BASE_PATH=/lena/`

The `/lena` engineering in this repository is **preserved as an optional
mount**, not as the canonical production design. It remains useful for a
future embed or a path-based host, and every public URL, API call, asset path,
locale prefix, canonical tag, cookie `Path` and OAuth callback still goes
through `lib/base-path.ts`.

```env
BASE_PATH=/lena/
SITE_URL=https://<THAT_HOST>
VITE_SITE_URL=https://<THAT_HOST>
```

Do not concatenate `BASE_PATH` at call sites. Do not treat this mode as the
LENA marketing site.

This project's `vercel.json` still maps `/lena/api`, `/lena/assets`, public
files and the LENA SPA so the optional mount keeps working. Standalone
production continues to use `/api` and `/` as well.

## Security (both modes)

- Admin UI (`/login`, `/dashboard`, CMS) stays authenticated.
- Session cookies (`kimi_sid`) use `Path=/lena` only when `BASE_PATH=/lena/`.
  Canonical production uses `Path=/`.
- OAuth `next` values are accepted only after stripping the base path and
  locale, and only if the remainder is `/dashboard...`.
- `robots.txt` disallows login and dashboard under both `/` and `/lena`.
