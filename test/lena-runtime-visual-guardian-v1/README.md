# LENA Runtime Integrity + Visual QA Guardian v1

Automated protection layer for LENA: routes, Sacred Core, mobile/RTL/theme/reduced-motion safety, accessibility sanity and visual regression. It verifies **external behavior only** — it does not redesign LENA features owned by parallel branches.

## Suites

| Suite | Files | What it proves |
| --- | --- | --- |
| **Static asset integrity** | `scripts/verify-assets.mjs` | Canonical assets exist, are non-empty, valid by magic bytes; WebP payloads structurally complete (catches truncated/alpha-only artwork); Sacred Core stylesheet contract (canonical v3 url(), transparent center, no v2 reference, no synthetic black disk); built output resolution; critical route inventory. Pure Node — runs inside `pnpm verify`. |
| **Route smoke** | `tests/route-smoke.spec.ts` | Every critical route boots: main landmark, owner element, stable canonical URL, no page error / console.error / failed critical request / unhandled rejection. |
| **Sacred Core runtime** | `tests/sacred-core.spec.ts` | Core renders with real dimensions, canonical CSS contract, and the embedded artwork **decodes and paints identity pixels in the browser**. Includes the explicit regression canary: *eye/glow visible while the Sacred Core artwork is missing* **must fail CI**. |
| **Spatial journey** | `tests/spatial-journey.spec.ts` | Home → World → Portal → Chamber → Inner Space; browser Back works both steps; no stuck portal overlay / aria-busy / pointer-blocking layer. |
| **Mobile / theme / RTL / reduced motion** | `tests/safety.spec.ts` | No horizontal overflow at 390×844 and 360×800, no clipped CTAs, no covering fixed element, menu usable, headings readable; dark/light contrast sanity; Arabic RTL vs English LTR direction/nav/back-arrow/menu; reduced-motion never leaves an element at `opacity: 0` (world field, orbit, inner constellation). |
| **Console / network watch** | `tests/console-network.spec.ts` | Narrow explicit allowlist (only `/api/*` may fail — the SPA must run without backend during frontend QA). Everything else fails. |
| **Accessibility sanity** | `tests/a11y.spec.ts` | Duplicate IDs, unnamed interactive elements, landmarks, skip link, keyboard reachability + visible focus (lightweight — not a WCAG audit). |
| **Visual regression** | `tests/visual-regression.spec.ts` | Baseline matrix below. 2% pixel tolerance + perceptual threshold; anti-aliasing noise never fails, disappearance does. |

## Baseline matrix

| Surface | Mobile dark (390×844) | Mobile light | Desktop dark (1280×800) | Notes |
| --- | --- | --- | --- | --- |
| Home | ✅ | ✅ | ✅ | |
| World | ✅ | — | ✅ | |
| Chamber (`/world/property`) | ✅ | — | ✅ | |
| Home (Arabic RTL) | ✅ | — | — | Required RTL screenshot |

Baselines live in `screenshots/<spec file>/<name>.png` (Linux/Chromium reference). Regenerate after intentional visual changes with `pnpm test:update`.

> ⚠️ **Baselines captured against a known artifact defect** (see “Known defect”): the Home/World baselines currently include the broken Sacred Core placeholder. The dedicated runtime + static gates are the ones that go red; visual baselines should be regenerated (`pnpm test:update`) **after** the owning branch lands the corrected artwork.

## Run locally

```bash
# boot + build not needed if dist exists; from repo root:
#   pnpm install && pnpm run build

cd test/lena-runtime-visual-guardian-v1
pnpm install            # or npm ci
pnpm verify:assets      # static gate (no browser)
pnpm test:smoke         # fast browser gate
pnpm test:safety
pnpm test:visual        # compare baselines
pnpm test:update        # regenerate baselines (visual project)
```

The config auto-starts `vite preview` on `127.0.0.1:4173` (see `scripts/start-preview.mjs`) and rebuilds the lena workspace if `dist` is missing.

### Restricted sandbox (no system Chrome deps)

CI uses real Chromium (`playwright install --with-deps chromium`). In sandboxes where system libraries cannot be installed, Playwright can launch the bundled `@sparticuz/chromium` binary with a minimal NSS/NSPR stub:

```bash
export LENA_LOCAL_BROWSER=1
export LD_LIBRARY_PATH=/tmp/nss-stub   # libnspr4.so + libnss3.so + libnssutil3.so stubs
npx playwright test --project=smoke
```

**This is a local-only fallback**; it is never used in CI.

## Adding routes (future parallel branches)

Append to `routes.config.json` (plus the matching `<Route>` in `App.tsx`):

```json
{ "path": "/world/command", "name": "world-command", "owner": ".lena-world-command", "locales": ["en"] }
```

Static inventory check and all browser suites pick the route up automatically. `/world/command` and `/world/atlas` are already pre-registered as `futureRoutes`.

## Artifacts / diagnosability

- `test-results/qa-artifacts.jsonl` — machine-readable per-test record: route, viewport, locale, theme, status, error, attachments.
- Playwright HTML report + `test-results/` (screenshots, traces) uploaded by CI on failure.
- Visual diffs include expected / actual / diff images automatically.
- Add `test.info()` annotations in tests to populate route/viewport/locale/theme.

## Console / network allowlist

`helpers/app.mjs` — only `/api/*` (backend optional for frontend QA) and favicon-ico misses are allowed. `console.error` from application code always fails. Add to the allowlist only with an explicit reason.

## Known defect (found while building the harness — reported, not fixed)

At `main` HEAD (`ca0288a`) **both Sacred Core artwork payloads are truncated/structurally invalid** and render as a broken-image placeholder in the browser:

- `artifacts/lena/src/assets/lena-sacred-core-v3-inline.svg` — embedded WebP declares RIFF size 23 560 bytes (and 11 456-byte ALPH chunk) but the file is only 7 506 bytes and has **no VP8/VP8L bitstream chunk** (alpha-only fragment).
- `artifacts/lena/src/assets/lena-sacred-core.webp` — RIFF/VP8 declares 35 186 bytes but the file is 7 497 bytes.

The runtime result is the exact regression this suite guards: the eye glow (`::after`) remains visible while the core artwork is missing. The guardian gates are **red at HEAD** (by design) until the owning branch replaces the artwork:
- `verify:assets` — 2 fails (truncated payloads),
- `sacred-core.spec.ts` — fails with “SACRED CORE ARTWORK MISSING …”.

No product/design change was made; the corrected artwork belongs to the Sacred Core owner. The smallest functional fix needed for the harness itself has not been required — the harness already works without it.
