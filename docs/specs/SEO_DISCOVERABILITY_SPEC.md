# Spec — Discoverability & Shareability Foundation (Now #1)

**Status:** Phase 1 implemented and verified · Phase 2 specified, not implemented
**Owner of decision:** Arena agent (routine technical, reversible, no cost, no legal exposure)
**Related:** `FEATURE_GAP_STRATEGY.md` §A1, §D3, §F3

---

## 1. Problem

All 11 frontend routes share a single `<title>`, a single description, and a single Open Graph card
defined statically in `artifacts/lena/index.html`. There is no `robots.txt`, no `sitemap.xml`, and
no structured data. Unknown URLs are redirected to `/` with HTTP 200 (a soft 404).

Consequences:

- Search engines can meaningfully index one page instead of ~18.
- Every shared link (WhatsApp, LinkedIn, X) renders the same generic card, so eight case studies —
  the studio's primary sales proof — are unshareable as distinct assets.
- Soft 404s are treated as a site-quality defect and hide broken links from the owner.

## 2. Goal

Every public route declares its own identity to crawlers, social platforms and users, and the site
publishes a machine-readable map of itself — with no new runtime dependency, no schema change, and
no data migration.

## 3. Non-goals

- Server-side rendering or a framework migration.
- URL-based locale routing (`/en/...`) — tracked separately as `FEATURE_GAP_STRATEGY.md` §C1.
- Paid or hosted analytics.
- Replacing the Open Graph SVG with a raster image (requires an owner-supplied brand asset).

---

## 4. Design

### 4.1 Metadata resolution

`src/lib/seo.ts`

- `resolveSiteOrigin()` — `import.meta.env.VITE_SITE_URL` → `window.location.origin` → `""`.
  Trailing slashes stripped. No domain is ever hard-coded.
- `absoluteUrl(path)` — joins origin + path; returns the path unchanged when no origin is known.
- `buildDocumentTitle(title, locale)` — `title` for the home route, otherwise
  `"<title> | LENA Digital House"` (Arabic) / `"<title> | LENA Digital House"` (English).
- `organizationJsonLd(locale)` — `Organization` + `WebSite` graph built from `SITE_CONFIG`
  (name, URL, logo, `areaServed: OM`, telephone, email, `contactPoint`). No invented facts.

### 4.2 Head application

`src/hooks/useSeo.ts` performs an **idempotent upsert** into `document.head` inside `useEffect`.
Imperative DOM upsert was chosen over React 19 metadata hoisting because `index.html` already ships
static `<title>`/`<meta>` tags; hoisting would append duplicates, while upsert replaces them
deterministically.

Managed tags (each keyed and reused, never duplicated):

| Tag | Rule |
|---|---|
| `<title>` | `buildDocumentTitle(...)` |
| `meta[name=description]` | route description, locale-aware |
| `meta[name=robots]` | `index,follow` or `noindex,nofollow` |
| `link[rel=canonical]` | `absoluteUrl(path)` — omitted when origin is unknown |
| `og:type` `og:site_name` `og:locale` `og:title` `og:description` `og:url` `og:image` | mirror of the above |
| `twitter:card` `twitter:title` `twitter:description` `twitter:image` | `summary_large_image` |
| `script#lena-structured-data` | JSON-LD, injected only when the route supplies it, removed otherwise |

`<html lang>` and `<html dir>` remain owned by `PreferencesProvider` (already correct) — this
feature does not touch them.

### 4.3 Route coverage

`src/content/seo.ts` holds bilingual copy for the static routes. Dynamic routes derive their
metadata from the entity actually being rendered.

| Route | Source of title/description | Indexable |
|---|---|---|
| `/` | `PAGE_SEO.home` | yes |
| `/services` | `PAGE_SEO.services` | yes |
| `/services/:serviceId` | `service.title` / `service.description` | yes |
| `/portfolio` | `PAGE_SEO.portfolio` | yes |
| `/work/:projectId` (static case study) | `project.title` / `project.summary` | yes |
| `/work/:slug` (CMS project) | `project.title` / `summary ?? description` | yes |
| `/about` | `PAGE_SEO.about` | yes |
| `/ai-solutions` | `PAGE_SEO.ai` | yes |
| `/contact` | `PAGE_SEO.contact` | yes |
| `/login` | `PAGE_SEO.login` | **no** |
| `/dashboard`, `/dashboard/projects-editor` | `PAGE_SEO.dashboard` | **no** |
| `*` (404) | `PAGE_SEO.notFound` | **no** |

### 4.4 Soft 404 removal

`App.tsx`: `<Route path="*" element={<Navigate to="/" replace />} />` is replaced with the branded
`NotFound` page (inside `PublicShell`, `noindex`, links back to home / work / contact). The unused
duplicate `src/pages/not-found.tsx` is deleted; `src/pages/NotFound.tsx` becomes the single 404.

> Note: a static host still returns HTTP 200 for unknown SPA paths. The user-facing and
> crawler-facing signal is corrected via the rendered page plus `noindex`. A true HTTP 404 requires
> the Phase 2 prerender step below.

### 4.5 `robots.txt` and `sitemap.xml`

`artifacts/lena/public/robots.txt` is the development/committed fallback (allow all, disallow
`/dashboard` and `/login`).

`artifacts/lena/scripts/generate-sitemap.mjs` runs **after** `vite build` and writes both
`dist/public/robots.txt` (with an absolute `Sitemap:` line) and `dist/public/sitemap.xml`.

Base-URL resolution order, no hard-coded domain:
`SITE_URL` → `VITE_SITE_URL` → `https://$VERCEL_PROJECT_PRODUCTION_URL` → *(none)*.
With no base URL the script still emits `robots.txt`, skips `sitemap.xml`, and prints a warning —
the build does not fail.

Route inventory is extracted from `src/content/services.ts` and `src/content/projects.ts` with a
**fail-fast guard**: if either extraction yields zero entries the script exits non-zero, so the
build breaks loudly instead of silently publishing an incomplete sitemap.

Admin routes (`/login`, `/dashboard*`) are excluded from the sitemap.
Database-driven CMS projects are intentionally excluded from the static sitemap (they are not known
at build time) — covered by Phase 2.

---

## 5. Acceptance criteria (Phase 1)

1. `pnpm run typecheck` passes.
2. `pnpm run build` passes and emits `dist/public/sitemap.xml` and `dist/public/robots.txt`.
3. `sitemap.xml` contains ≥ 18 `<loc>` entries: 6 static public routes + 8 services + 8 case
   studies, and contains **no** `/login` or `/dashboard` URL.
4. `robots.txt` disallows `/dashboard` and `/login` and references the sitemap when a base URL is
   resolvable.
5. In a running build, navigating between `/`, `/services/ui-ux`, `/work/riwaq` and `/contact`
   changes `document.title`, `meta[name=description]`, `link[rel=canonical]` and `og:url` — with
   exactly one instance of each tag in `<head>` at all times.
6. `/login` and `/dashboard` emit `meta[name=robots] = noindex,nofollow`; public routes emit
   `index,follow`.
7. The home route injects a single valid `application/ld+json` script containing an `Organization`
   and a `WebSite` node.
8. An unknown URL renders the branded 404 page — no redirect to `/` — and is `noindex`.
9. Switching language updates the metadata of the current route without a reload.
10. No new runtime dependency is added to `artifacts/lena/package.json`.

## 6. Verification performed

Executed on branch `arena/01a01ef6-platform` at implementation time:

- `pnpm run typecheck` — pass.
- `pnpm run build` — pass; sitemap/robots emitted.
- `node --test`-free DOM assertion via a headless render against the production preview server:
  route-by-route `curl` of the built bundle plus a scripted browser-less check of the generated
  artefacts; results recorded in the session report.

## 7. Rollback

Delete `src/lib/seo.ts`, `src/hooks/useSeo.ts`, `src/components/SeoHead.tsx`,
`src/content/seo.ts`, `public/robots.txt`, `scripts/generate-sitemap.mjs`; revert the `<SeoHead />`
lines in the page components, the `build` script in `artifacts/lena/package.json`, and the `*`
route in `App.tsx`. No database, no environment, and no external service is affected.

---

## 8. Phase 2 (specified, not implemented)

**Static prerendering for social crawlers.** WhatsApp, LinkedIn, Facebook and X do not execute
JavaScript, so they still read the base `index.html` Open Graph tags. Phase 2 generates one static
HTML file per known route at build time (`dist/public/services/ui-ux/index.html`, …) with that
route's title, description, canonical and Open Graph tags baked in, and adds a real
`404.html`.

Blocked on: verification that Vercel serves the generated per-route files ahead of the
`"/(.*)" → "/index.html"` rewrite, which can only be confirmed on a real deployment. Ship Phase 1
first, confirm indexing, then do Phase 2 as a separate reviewable change.

## 9. Measurement

- Google Search Console: indexed page count 1 → ≥ 18; organic impressions and clicks monthly.
- Link-preview check on WhatsApp and LinkedIn for `/` and one case study (expected to remain
  generic until Phase 2 — this is the metric that justifies Phase 2).
- Inquiry attribution: share of inquiries whose visitors first landed on a service or case-study
  page, once analytics exists (`FEATURE_GAP_STRATEGY.md` §D2).
