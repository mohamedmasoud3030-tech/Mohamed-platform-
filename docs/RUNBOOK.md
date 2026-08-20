# LENA Digital House — Support Runbook

Operational reference for whoever maintains this system. Every entry below was verified against the
code at commit `4a1bad8` or later. **If behaviour changes, this file changes in the same pull request.**

Terminology used consistently across the product, the help page and this runbook:

| Term (AR) | Term (EN) | Means |
|---|---|---|
| استفسار | inquiry | A row in `inquiries`, created by the public form only |
| مشروع | project | A row in `projects`, shown publicly only when `status = published` |
| مسار | track / service | One of the eight entries in `content/services.ts` (static, not database-driven) |
| المصدر | source | Entry context of an inquiry: `contact`, `service:<id>`, `work:<slug>` |
| رقم المرجع | reference | `#<inquiry id>` for visitors, `LENA-YYMMDD-XXXX` for error/support reports |

---

## 1. Severity, response and escalation

| Severity | Definition | Examples | First response | Escalation |
|---|---|---|---|---|
| **S1 — Critical** | Lead capture is broken, or data/credentials may be exposed | Contact form fails for everyone; dashboard exposes data to non-admins; a secret leaked into the repository or logs | Immediately | Take the affected surface out of service, rotate the affected secret, then diagnose. Never wait for a scheduled window. |
| **S2 — High** | Owner cannot work, or inquiries are invisible | Owner locked out; dashboard cannot load inquiries; notification email silently failing | Same working day | If unresolved within one working day, disable the failing path and post a plain-language notice on the contact page. |
| **S3 — Normal** | A feature misbehaves with a workaround | Upload rejects a file; a project will not publish; wrong text | Within one business day (matches the public promise) | Batch into the next change. |
| **S4 — Low** | Cosmetic or content | Typo, spacing, outdated wording | Next scheduled change | — |

**Security, personal-data and payment issues are always S1 regardless of blast radius.** There is no
payment surface in this product today; if one is ever added, it inherits S1 by default.

Rules that never bend:
- Never ask a user for a password, token, OTP or session cookie. No support flow in this product ever needs one.
- Never paste an inquiry's contents, a visitor's email or phone number into an external tool or chat.
- Rotate `APP_SECRET` and every user is signed out — this is the intended lockout kill-switch.

---

## 2. Runbook entries

### R1 — "The contact form is broken" (S1 if reproducible for everyone)

1. Check the API is alive: `GET /api/healthz` → `{"status":"ok"}` and `GET /api/trpc/ping`.
2. Reproduce with a real submission. Read the tRPC error code, not the UI text:
   - `TOO_MANY_REQUESTS` → **not a bug.** Five inquiries per hour per network (`INQUIRY_RATE_LIMIT_MAX_ATTEMPTS`). The visitor's own network is rate limited; WhatsApp is unaffected.
   - `BAD_REQUEST` → the honeypot or the 1.5-second minimum completion time rejected it, or a field failed validation (name ≤ 255, message ≤ 5000, `source` must match `contact|service:<id>|work:<slug>`).
   - `INTERNAL_SERVER_ERROR` with "Inquiry rate limiting is not configured" → `INQUIRY_RATE_LIMIT_SECRET` is missing in production. **This blocks every inquiry.** Set it and redeploy.
   - Anything else → check the database connection.
3. While diagnosing, the visitor path is not dead: WhatsApp and email are on every page.

### R2 — "I am not receiving inquiry notification emails" (S2)

Verified behaviour: `sendNewInquiryNotification` returns silently after a `console.warn` when
`SMTP_USER` or `SMTP_PASS` is unset, and failures are caught and logged only. **The inquiry is still
saved.** The dashboard is the source of truth, not the inbox.

1. Confirm the inquiry exists in the dashboard. If yes, this is a notification problem, not data loss.
2. Check `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `NOTIFY_EMAIL` on the server.
3. Look for `[mailer]` lines in the server log: "SMTP credentials not configured" (unset) or "Failed to send notification" (rejected by the provider).
4. Until fixed, tell the owner plainly: check the dashboard daily; email is not currently a reliable trigger.

### R3 — "The owner cannot sign in" (S2, S1 if permanent)

1. Which message appears on `/login`? Each maps to one cause:
   `cancelled` (declined at the provider) · `provider` (provider refused) · `incomplete` (missing code/state) · `expired` (state cookie expired or mismatched — usually a slow or reopened tab) · `failed` (token exchange or profile fetch failed) · `unavailable` (`APP_ID`/`APP_SECRET`/`KIMI_AUTH_URL`/`KIMI_OPEN_URL` missing).
2. Signed in but everything says "no access"? The account authenticated but is `role = user`. Admin is granted only when the provider's `user_id` equals `OWNER_UNION_ID`. Verify that value.
3. **Known single point of failure:** one identity, one provider, no fallback. See `FEATURE_GAP_STRATEGY.md` §B1. Widening `OWNER_UNION_ID` to an allowlist is the smallest safe fix and needs owner approval.

### R4 — "A project does not appear on the site" (S3)

In order of likelihood: status is still `draft` (visitors see `published` only) · the page was cached
in the browser (hard refresh) · the slug was changed after sharing, so the old link 404s · the project
exists but has no cover image, so it renders without a visual. Nothing here requires a deployment.

### R5 — "Media upload fails" (S3)

Verified limits: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, OGV — max **100MB** per file.

| Response | Meaning | Action |
|---|---|---|
| `415` | Unsupported file type | Convert the file |
| `413` | Over 100MB | Compress it |
| `400` | Empty or unreadable file | Re-export it |
| `503` | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing | Configure storage; meanwhile paste an external image URL |
| `401` / `403` | Session expired, or the account is not admin | Sign in again; see R3 |

### R6 — "The dashboard shows a load error" (S2)

The owner now sees plain language and a retry button. Behind it: the API is unreachable, or
`DATABASE_URL` is wrong, or migrations were never applied. Confirm with `/api/healthz`, then check
that `inquiries`, `projects`, `content_entries`, `users` and `inquiry_rate_limits` exist.

### R7 — "The page is blank / an error reference appeared" (S2)

The error boundary shows `LENA-YYMMDD-XXXX` and keeps the full error in the browser console only.
Ask for the reference, the route and the app version shown on screen — never a screenshot of an
inquiry's contents. Reproduce on the same route, then read the console.

### R8 — "A visitor asks to delete their inquiry" (S2 — personal data)

1. Verify the request comes from the same channel or reference as the original inquiry.
2. Delete the specific row from the dashboard. `inquiry_rate_limits` holds only a salted HMAC of the network address and expires after 30 days; it contains nothing identifying and needs no action.
3. Confirm in writing that the record is deleted.

---

## 3. Freshness tests

Run these whenever the interface, limits or messages change. If any fails, the help content is wrong:

1. Every upload limit quoted in `content/help.ts` and `AdminSupport.tsx` matches `PROJECT_MEDIA_MAX_BYTES` and `PROJECT_MEDIA_MIME_EXTENSIONS`.
2. The rate limit quoted to visitors matches `INQUIRY_RATE_LIMIT_MAX_ATTEMPTS` and its window.
3. Every status name in the dashboard help matches `INQUIRY_STATUS_VALUES`.
4. Every `link.to` in `content/help.ts` resolves to a route registered in `App.tsx`.
5. Each `?error=` value produced by `oauth.ts` has a matching sentence in `Login.tsx`.
6. The published reply-time promise appears identically on `/contact` and `/help`.
7. No help text mentions a feature that does not exist (search `content/help.ts` for anything not in the router).

---

## 4. Language addressing (added with M1)

Every public page lives under a language segment: `/ar/...` and `/en/...`.

- **Priority:** the URL wins, then the visitor's stored choice, then the device language, then English.
- **Old links keep working.** An unprefixed path such as `/services` is moved client-side to the
  visitor's language, preserving the query string and hash. Nothing 404s.
- **Never prefixed:** `/api/*`, `/assets/*`, `/robots.txt`, `/sitemap.xml`, and the icon files.
- **Switching language** rewrites only the language segment, so the visitor stays on the same page.
- **Search engines** receive a self-canonical plus `hreflang` alternates for both languages and
  `x-default` pointing at English; the sitemap lists both versions with mutual alternates.
- **Admin routes** are `noindex` and deliberately emit no alternates.

Freshness test: `sitemap.xml` must contain exactly twice the number of public routes, and every
`<loc>` must begin with a supported language segment.
