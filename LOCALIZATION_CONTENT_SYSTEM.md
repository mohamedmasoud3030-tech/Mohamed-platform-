# Localization & Content System

**Date:** 2026-08-20 · Applies to `artifacts/jiwdah` (public site and dashboard) and to server-generated
copy in `artifacts/api-server`.

---

## 1. Supported locale policy

| | |
|---|---|
| **Locales** | `ar` (default, RTL) and `en` (LTR) — **peers, not primary and secondary** |
| **Addressing** | Every public page lives at `/ar/...` and `/en/...`; both indexable, both shareable |
| **Selection order** | URL → the visitor's stored choice → device language → English |
| **Fallback** | English, for a visitor whose language we do not publish. **Never a blank string** |
| **Switching** | Rewrites only the language segment; the visitor stays on the same page |
| **SEO** | Self-canonical per language, `hreflang` for both plus `x-default` → English, both in the sitemap |
| **Hydration** | Not applicable — client-rendered SPA, language resolved before mount, so no server/client mismatch is possible |
| **Adding a third locale** | Not before English proves itself (`PRODUCT_DECISIONS.md` A3) |

## 2. Translation architecture — one canonical system

**Decision: typed Arabic/English object pairs in TypeScript, no translation library.**

**Why not `i18next` or similar:** it would add a dependency, a runtime, a key namespace and a loading
story to a two-language site whose copy is already fully typed. The compiler currently guarantees that
`title.en` exists; a key-based library replaces that guarantee with a runtime lookup that fails
silently. That is a downgrade, paid for with a dependency.

Three patterns exist in the code today. They are now ranked, not merged by force:

| Tier | Pattern | Where | Verdict |
|---|---|---|---|
| **A — canonical** | Shared modules in `src/content/*.ts` with `{ ar, en }` | 9 modules: services, projects, help, privacy, seo, founder, navigation, case studies, site copy | **Preferred.** All durable product copy belongs here |
| **B — acceptable** | Component-local `COPY`/`TEXT` dictionaries | 8 components, mostly admin | **Allowed** where copy is genuinely component-scoped and never reused |
| **C — discouraged** | Inline `locale === "ar" ? … : …` | 22 components, densest in `CmsProjectDetails` (9) and `FloatingHeader` (7) | **Do not add more.** Unreviewable by a non-developer, easy to leave half-translated |

Tier C is not mass-refactored: touching 22 files to move working strings is a large diff with real
regression risk and no user-visible benefit. It is contained instead — the integrity suite makes an
unpaired or empty string fail the build, which is the actual risk Tier C creates.

## 3. Glossary — one term per concept, both languages

| Concept | Arabic | English | Never use |
|---|---|---|---|
| Inquiry from the form | استفسار | inquiry | طلب, lead, ticket |
| Reference number | رقم المرجع | reference | ID, رقم تعريفي |
| Published project | مشروع | project | عمل, portfolio item |
| Service track | مسار | track | خدمة (reserved for the offering) |
| Provenance: self-built | منتج من بنائي | Built and owned by us | — |
| Provenance: client work | مشروع لعميل | Client project | — |
| Provenance: concept | عمل مفاهيمي | Concept work | نموذج, demo |
| Archive (reversible) | أرشفة | archive | حذف |
| Permanent deletion | حذف نهائي | delete permanently | إزالة |
| Audit trail | سجل المراجعة | audit trail | سجل الأحداث |
| Contact channel | قناة تواصل | contact channel | — |
| Dashboard | لوحة التحكم | dashboard | الإدارة |

Enforced by the freshness suite for the status vocabulary; the rest is review discipline.

## 4. Formatting

All formatting goes through **`src/lib/format.ts`**. Building an `Intl` formatter anywhere else now
fails the build.

| Concern | Rule | Status |
|---|---|---|
| Dates | `formatDate` / `formatDateTime` / `formatShortDateTime`, tags `ar` and `en-GB` | **Fixed** — was duplicated in two components with a hardcoded fallback |
| Region in locale tags | Region-neutral; `ar-OM` and `en-US` fail the check | **Fixed** — `ar-OM` removed earlier |
| Numbers | `formatNumber` | **Added** — there was no number formatting at all |
| Plurals | `plural()` via `Intl.PluralRules` | **Added** — Arabic has six categories, English two; concatenation was wrong in one language by construction |
| Relative time | `formatRelative` | **Added** for activity lists |
| Time zone | Never hardcoded; the visitor's own zone is used | Verified: 0 hardcoded zones |
| Currency | **Not implemented, deliberately** — no price is published (`PRODUCT_DECISIONS.md` D7) |
| Mixed direction | `isolate()` wraps Latin text in Unicode isolates | **Added** |
| String expansion | English runs ~20–30% longer; layouts use flexible widths, no fixed-width labels | Verified in build |

## 5. RTL correctness

Logical properties throughout (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`); the check
fails the build on `margin-left`, `padding-right` or `text-align: left/right` in the stylesheets we
own. The floating WhatsApp button flips side under `[dir=rtl]`; the honeypot uses
`insetInlineStart`; `<html lang>` and `dir` derive from the URL. Icons are direction-neutral
(no chevron implies "next"), so no mirroring map is needed yet — **if a directional arrow is
introduced, it must be mirrored.**

Fonts: the system stack renders Arabic natively on every target platform. **No web font is loaded** —
zero font requests, no FOIT, and no Arabic shaping risk from a Latin-first webfont.

## 6. Content ownership

| Content | Owner | Changes via | Review |
|---|---|---|---|
| Interface copy (labels, states, errors) | Developer | `src/content/*` or component dictionary | Both languages in the same change |
| Product/marketing copy (home, services, about) | Founder, drafted by the developer | `src/content/site-copy.ts`, `services.ts` | Founder approves wording |
| Case studies and applications | Founder supplies facts | Dashboard editor (database) | Provenance label required |
| Help answers | Whoever changes the behaviour | `src/content/help.ts` | Freshness suite enforces truthfulness |
| Privacy / data practices | Founder, with legal review pending | `src/content/privacy.ts` | Never machine-translated |
| User-generated (inquiry text) | The visitor | — | Never edited, never translated |

**On a CMS: not recommended.** A CMS earns its keep when non-developers publish frequently and
independently. Here there is one operator who publishes a project occasionally, and a project editor
already exists in the dashboard for exactly that. Adding a CMS would add infrastructure, a second
source of truth, and a new place for Arabic and English to drift apart.

**Machine translation is not authoritative** for privacy, legal, contractual or pricing wording. Those
are written by a human in both languages and, where required, reviewed by a lawyer
(`PRIVACY_DATA_GOVERNANCE.md` §9).

## 7. Translation workflow

1. Add or change copy in Tier A, in **both** languages in the same commit.
2. Run `pnpm run verify` — an unpaired or empty string fails.
3. If behaviour changed, update the help answer that describes it in the same commit.
4. For legal or commercial wording, the founder approves the exact sentence before it ships.

## 8. QA matrix

| Case | Arabic | English |
|---|---|---|
| Home, services, service detail, portfolio, case study, about, help, privacy, contact | ✅ 200 | ✅ 200 |
| Language switch preserves the page | ✅ | ✅ |
| Shared link opens in its own language | ✅ | ✅ |
| Unprefixed legacy link resolves | ✅ | ✅ |
| `hreflang` + canonical per page | ✅ | ✅ |
| Form errors, success, draft restore | ✅ | ✅ |
| Dashboard, audit trail, operations | ✅ | ✅ |
| Crash boundary | ✅ | ✅ |
| 404 | ✅ | ✅ |
| Dates and numbers | ✅ shared formatter | ✅ shared formatter |
| Screen-reader announcement | **not verified** — no assistive technology available in this environment |

## 9. Tests

`tools/verify-i18n.mjs`, part of `pnpm run verify` — **12 assertions, all passing**:

unpaired Arabic strings across 77 files · empty translations shipped as blank labels · any component
building its own `Intl` formatter · country-locked locale tags · physical left/right CSS in owned
stylesheets · help articles present in both languages · Arabic plural selecting a different form from
English · correct singulars · missing plural forms falling back instead of rendering `undefined` ·
number formatting · date formatting in both languages · Latin isolation.

**It caught a real defect on its first run:** two components had built their own `Intl.DateTimeFormat`
with a hardcoded `en-GB` fallback. Both now use the shared formatter.

**Gate result:** 11 suites, **218 assertions**, 0 failing.
