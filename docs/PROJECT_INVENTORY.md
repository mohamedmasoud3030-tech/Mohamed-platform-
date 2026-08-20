# Project inventory — raw input from the founder

**Captured:** 2026-08-20 · **Status:** founder's own account, recorded verbatim in substance.
**Not yet published.** Each entry needs the fields required by `PRODUCT_DEFINITION.md` FR-4
(industry, business problem, intended user, 3–6 capabilities, ≥3 screens, provenance label) before it
appears on the site. This file exists so nothing is lost between now and then.

> **Correction to the product definition:** the plan assumed **five** applications. There are **six**,
> and one of them was built for a named client rather than self-initiated. `PRODUCT_DEFINITION.md`
> has been updated.

---

## 1. Malek — property management
**Industry:** real estate / asset operation.
**What it does:** operating and leasing properties, rent collection, maintenance, reporting.
**Why it is credible:** this is the founder's own former job. He ran an office operating real-estate
assets for other owners before building the tool.
**Provenance:** built and owned by the founder.
**Still needed:** the business problem in two sentences, intended user, 3–6 capabilities, ≥3 screens.

## 2. LenaBeauty — health centres and spa management
**Industry:** wellness / personal care.
**What it does:** manages health centres and spas.
**Provenance:** built and owned by the founder.
**Still needed:** problem, user, capabilities, screens.

## 3. LENA Dressroom — evening-wear showroom and rental
**Industry:** retail / rental.
**What it does:** manages showrooms and the rental of evening and wedding dresses.
**Provenance:** built and owned by the founder.
**Still needed:** problem, user, capabilities, screens.

## 4. Terranix — investment company operations
**Industry:** investment.
**What it does:** three divisions — livestock, agricultural, real estate.
**Provenance:** built and owned by the founder.
**Still needed:** problem, user, capabilities, screens.

## 5. Hospitality app — for "مشاريع جودة الانطلاقة"
**Industry:** events and hospitality services.
**What it does:** runs an office that provides hospitality services for events and occasions.
**Provenance:** **built for a named client.** The client's name, and any result, may only be published with
**written permission** (`FEATURE_GAP_STRATEGY.md` §D1, `PRIVACY_DATA_GOVERNANCE.md` §9.5).
**Note:** this explains the stale `replit.md` that described "Jiwdah Hospitality" — it was a real
client project, not a leftover from an unrelated product.
**Current deployment evidence:** the repository does not establish a live Hospitality production
instance. Until a current production deployment is independently evidenced, the public site must not
label this product as "in real use".
**Still needed:** permission decision, production evidence if available, then problem, user, capabilities, screens.

## 6. Kayyal (كيّال) — "the weigher" · recycling warehouse management, Egypt
**Industry:** recycling / scrap trading.
**Status:** newest project.
**The problem it solves, in the founder's own framing:** an Arabic mobile application used standing
next to the weighbridge. Every purchase, sale and cash movement is recorded in under 30 seconds, so
at the end of each day the warehouse owner knows exactly: what came in, what went out, what is left
in the cash box, and what was actually earned.

**First version scope, as specified by the founder:**
- Items by type and grade, with today's prices
- Purchase
- Sale
- Counterparties with open balances
- Cash box with a daily physical count close
- Derived stock
- Numbered receipts, sent over WhatsApp and printable
- Daily summary for the owner
- Two roles only: owner and worker
- Arabic RTL interface designed for someone standing at the weighbridge
- PWA that works offline
- Corrections by reversal, never by deletion
- Data export

**Why this one is worth leading with:** it is the only entry that already states a measurable promise
("under 30 seconds", "knows at end of day"), it names a specific operator standing in a specific
place, and its design constraints — offline, one-handed, reversal instead of deletion — are evidence
of real operational understanding rather than a feature list.

**Still needed:** intended user in one line, ≥3 screens, and confirmation of whether it is live with
a real warehouse yet (a running deployment with a real user would make it the single strongest proof
on the site).

---

## Resolved: the studio publishes no location

**Decision (2026-08-20, founder):** no country is published as the studio's location. The address was
removed from the structured data entirely.

What replaces it is stronger than a location: a **local number in each of three markets** — Oman,
Egypt and Saudi Arabia — so a client dials a familiar country code rather than an international one.
Each is published as its own `ContactPoint` with its own `areaServed`. "Location undetermined" would
read as evasive; "reachable locally in three markets" is a verifiable fact that supports the
bilingual, cross-market positioning in `PRODUCT_DEFINITION.md`.


---

## Product facts read from the products' own sign-in screens (2026-08-20)

The owner sent five screenshots. They could not be saved into the workspace, but the following was
read from them and applied to `src/content/systems.ts`:

| Product | Corrected fact |
|---|---|
| **TERRANEX** | Spelled **TERRANEX**, not "Terranix". Its own strapline is "للاستثمار الحيواني والتنمية الزراعية" — livestock investment and agricultural development |
| **LenaBeauty** | Its sign-in screen states the scope precisely: "نظام التشغيل اليومي لمركز تجميل واحد — المواعيد ونقطة البيع والعملاء والمخزون والموظفون في مكان واحد", plus three facts worth publishing: it is for the centre's team and **not a customer booking site**, accounts are created by the centre's administrator with **no self-registration**, and each centre's data stays in its own database. Point of sale and inventory were previously unknown and are now listed |
| **LENA (showroom)** | Its screen reads "تسجيل الدخول لإدارة المعرض" — showroom management, confirming the reading of the owner's note |
| **Hospitality** | Sign-up flow is "أنشئ حسابك ثم منشأتك لبدء إدارة مناسباتك" — a facility is created first, then occasions are run from it |
| **MALEK** | "سجّل الدخول إلى مساحة عملك في MALEK" — confirmed |

### Corrections resolved from repository evidence

1. **Official product name:** **LenaBeauty**. The earlier "Bio Beauty / بيو بيوتي" interpretation is
   superseded; the public site now uses the product's actual name.
2. **Hospitality stage:** a live production deployment is **not established by the repository**. The
   screenshot with the environment-configuration error is not evidence of a live production instance,
   so the public site keeps Hospitality at **trial** until current production use is evidenced.
3. **Interior screenshots:** no interior product screenshots are currently committed in the inspected
   product repositories. Login/configuration screens must not be used as substitutes or represented as
   evidence of operational use.

### Why the screenshots are not yet on the site

They are **sign-in screens**. They prove the products exist and are branded, which is worth something,
but a login form shows nothing about what the system does. Interior screens — the appointment day, the
weighbridge entry, the owner's daily summary — are what convince a buyer. Both are welcome; interiors
matter more.

**To get them into the repository:** commit them exactly as the founder photograph was committed. The
image pipeline (`tools/prepare-founder-photo.sh`) already strips metadata and resizes, and the same
approach will be extended to product screens once the files land.