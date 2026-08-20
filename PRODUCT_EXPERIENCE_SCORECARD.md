# Product Experience Scorecard

**Date:** 2026-08-20 · Scores are evidence-based, 1–5, where 3 = meets normal expectation for the domain.

| Dimension | Score | Evidence |
|---|---|---|
| **Positioning clarity** | **1** | Home promises creative branding; the founder builds operations software. No overlap between the two vocabularies. |
| **Proof / credibility** | **1** | 8 published case studies, 0 of them real, 0 labelled. Six real applications, 0 published. |
| **Information architecture** | **2** | Navigation is organised by creative discipline, not by the buyer's industry or problem. |
| **Onboarding / first value** | **4** | Account-free, one primary action, context carried into the form, draft recovery, reference number. |
| **Core journey mechanics** | **4** | Verified end-to-end against a real server and database. |
| **Forms & validation** | **4** | Two required fields, optional fields labelled, four distinguished error states, WhatsApp fallback. |
| **Empty / loading / error / offline states** | **4** | Guided empty states, plain-language failures with retry, offline handling, branded 404, crash boundary. |
| **Localization & RTL** | **4** | Per-language URLs, `hreflang`, logical properties, RTL-aware floating button, isolated Latin names. |
| **Accessibility** | **3** | 44px targets, focus rings, `aria-live`, skip link, reduced-motion. Not yet audited with a screen reader or against contrast ratios. |
| **Mobile** | **4** | Primary action restored to the mobile menu, single-column collapse, correct keyboards. Verified structurally, not visually. |
| **Trust & privacy** | **5** | Zero third-party requests, factual `/privacy`, masked contact data, audited reveals, no trackers. |
| **Admin operations** | **4** | Least privilege, reasoned destructive actions, immutable audit, idempotency. One ghost tab remains. |
| **Content quality** | **3** | Well written, but arguing for the wrong business. |
| **Performance** | **3** | 100KB gzip main bundle, lazy routes, 22KB portrait. Not measured on a low-end device. |
| **Technical foundation** | **5** | 206 automated assertions, egress guard, typecheck and build clean. |

**Weighted overall: 3.0 / 5** — an unusually strong machine pointed at the wrong destination.

---

## Launch blockers

A "launch blocker" here means: do not spend money driving traffic until it is fixed.

| # | Blocker | Why it blocks | Status |
|---|---|---|---|
| **B1** | Portfolio publishes work that does not exist, unlabelled | One question from a serious prospect destroys credibility permanently | **FIXED** — every item now carries an explicit provenance label |
| **B2** | Positioning contradicts the founder's own stated capability | Traffic arrives expecting branding; the founder sells operations software. Every visit is mis-qualified | **FIXED** — repositioned around six industry systems; the eight creative tracks and eight concept projects are hidden, not deleted |
| **B3** | Admin can "publish" content no visitor can see | The operator cannot trust what the dashboard tells them | **FIXED** — surface removed |
| **B4** | No real application is published | The six real systems are the entire argument, and none is visible | **BLOCKED** on owner content (screens + one line per app) |

B1 and B3 are closed. B2 needs one yes/no. B4 needs material only the founder has.
