# Product & Domain Review

**Date:** 2026-08-20 · **Method:** the running application first, repository second, domain research third.
**Reviewer roles:** product strategy, domain, UX research, service design, visual design, accessibility, content.

---

## 1. Diagnosis: the site sells one business, the founder runs another

This is the finding everything else depends on.

| | |
|---|---|
| **What the site says it does** | "نصنع حضورًا رقميًا لا يُنسى" — digital marketing, visual identity, content design, brand building, campaign work. Eight service tracks, all creative. |
| **What the founder actually builds** (his own account) | Operations software for specific industries: property management (Malek), spa and health centres (LENA Beauty), dress-rental showrooms (LENA Dressroom), investment operations (Terranix), event hospitality, and a weighbridge system for recycling warehouses (Kayyal). |
| **Overlap** | **None.** |

These are two different businesses with different buyers, different objections, different sales cycles and different prices. A café owner looking for a logo and a scrap-warehouse owner losing money at the weighbridge are not the same person, and no single headline serves both.

**Domain evidence for which one to keep.** Current practice for software firms is unambiguous: *"Should a dev agency go niche or stay horizontal? Niche, almost always — at least on the marketing surface. Firms that pick one vertical on the website rank better, get cited by AI more often, and book more qualified pipeline than horizontal firms at the same size. Operationally you can still take horizontal work; that is an internal choice, not a positioning one."* ([100signals, 2026](https://100signals.com/resources/for-software-development-agencies/)) The same source warns that the low-end brochure/branding market is being eaten by cheap generation, and the response is *"platform-and-vertical specialism… integration and governance work on complex stacks."* ([100signals, 2026](https://100signals.com/resources/for-web-development-agencies/))

The creative-agency positioning is the commoditised half. The operations-software work is the defensible half — and it is the half the founder actually has six examples of.

**The site is currently positioned on the wrong half of its own capability.**

---

## 1b. Correction to the diagnosis — the business model (owner, 2026-08-20)

An earlier version of this review recorded the business as "project services sold off-platform".
**That was wrong**, and the correction matters more than the original finding.

The owner's actual model: **each application is a product he owns and keeps developing.** It reaches a
business that genuinely needs it **as a web application they use and benefit from — ownership is not
transferred.** Monetisation is **per product: outright sale or subscription, depending on the
product.**

This is not an agency and not bespoke contracting. It is **a portfolio of vertical software products
with a single builder-operator.** Consequences that follow directly:

| Because the model is products, not projects | Implication |
|---|---|
| The buyer licenses access, he does not commission a build | The page must sell a *working product*, not a service engagement |
| The founder keeps developing after delivery | "What happens after handover" becomes a selling point, not a risk |
| Subscription is on the table for some products | Recurring billing, plan management and customer accounts become real future needs — **none of which exist today** |
| The same product serves many businesses in one trade | Multi-tenancy, per-customer data isolation and onboarding become real future needs |
| Provenance is uniform | All six are "built and owned by us" — the strongest label available, and honest |

**None of that is built now, and none of it should be built before a paying customer exists.** It is
recorded so that the first subscription sale does not arrive as a surprise requiring an emergency
rebuild.

## 2. What the product should be

> **A small portfolio of working software products, each one the operating system for a specific
> trade, built and kept running by someone who ran that trade before he automated it.**

Not "a digital house for creative solutions". The founder's own biography already says this: he managed an office operating real-estate assets before writing his first line of code, and every application since started from an operational problem he lived. **The biography and the homepage currently contradict each other.**

---

## 3. Users and jobs to be done

| Role | Job | Success | Currently served? |
|---|---|---|---|
| **Owner/manager of an operating business** (warehouse, property portfolio, spa, showroom) | "Stop losing money and hours to work run on paper and WhatsApp" | Sees a system already running in a business like theirs | **No** — the site offers branding |
| **Their operator** (the person at the weighbridge, the front desk) | "Do my job faster without new burden" | Sees the tool is built for standing up, one-handed, offline | **No** — never mentioned |
| **Technical evaluator** | "Is this real work or a template?" | Opens a case study with depth | **Partly** — depth exists, but for projects that are not real |
| **Founder (admin)** | Triage inquiries, publish work | Dashboard | **Yes** |

**Missing actor entirely:** the *operator*. In operations software the buyer and the daily user are different people, and the daily user kills adoption. The site speaks to neither.

---

## 4. Journey map, as observed

```
Search / shared link
  └─ Home: "we create unforgettable digital presence"        ← promise mismatch
       └─ Solutions: 8 creative tracks                        ← none matches the real work
            └─ Work: 8 case studies, none of them real        ← credibility risk (§5.1)
                 └─ Contact: form + 3 local numbers           ← this part is sound
```

The mechanics of the journey are in good order — language addressing, draft recovery, reference numbers, error differentiation, three contact channels, a real 404, a crash boundary. **The failure is not mechanical. It is that the whole funnel argues for the wrong business.**

---

## 5. Missing or wrong domain expectations

### 5.1 Portfolio shows work that does not exist — and says nothing about it *(defect, critical)*
Eight published case studies (`riwaq`, `nizwa-homes`, `cool-season`, `atelier`, `sahl`, `lena-flow`, `mizan`, `oman-routes`) have **zero overlap** with the six real applications, and **not one carries a provenance label**. A prospect who asks "tell me about Riwaq" receives silence. In a trust-selling business this is the single highest-risk defect on the site.

### 5.2 No proof of a system actually running *(missing capability)*
Operations software is bought on evidence that it survives contact with reality — a real warehouse, a real front desk. Nothing on the site states whether anything is live with a real user. Kayyal reportedly is; that fact is currently invisible.

### 5.3 No industry entry point *(missing capability)*
Buyers of vertical software navigate by their own industry, not by "visual identity" or "content design". There is no way for a property manager to find the property system.

### 5.4 The operator is never addressed *(missing capability)*
No mention of training, of working offline, of what changes for staff on day one. Kayyal's specification is full of exactly this thinking — offline, one-handed, corrections by reversal — and none of it is public.

### 5.5 Admin can publish content that no visitor can ever see *(defect, high)*
`content_entries` has full CRUD and a dashboard tab; no public page reads it. Publishing appears to succeed and changes nothing.

### 5.6 Lifecycle vocabulary is thin for the domain *(recommendation)*
Inquiry statuses (`new → in_progress → qualified → closed/archived`) suit lead capture, not software delivery. Operations-software engagements normally pass through discovery → scoping → pilot → rollout. Not urgent while volume is low; wrong the moment a second project runs in parallel.

### 5.7 Business model is never stated *(recommendation)*
The site never says whether this is a fixed-price project, a build-and-hand-over, or a licence with ongoing support. That is the first question a business owner asks about software, and it is unanswered.

---

## 6. What is genuinely good and must not be broken

Language as an address with correct `hreflang`; device-based detection that a shared link overrides; draft recovery on the contact form; a reference number and a stated reply time; four distinguished failure states with a WhatsApp fallback; masked contact details with reasoned, audited reveal; an append-only audit trail enforced by the database; zero third-party requests; a crash boundary that leaks nothing; 206 automated assertions.

**The engineering is ahead of the product story.** That is an unusual and fortunate position: the expensive part is done.
