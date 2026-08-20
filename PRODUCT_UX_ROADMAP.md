# Product UX Roadmap

Ordered by user value, domain correctness, risk, effort and reversibility. Each item has testable
acceptance criteria. Status labels: **DONE**, **READY** (specified, safe, not yet built), **BLOCKED**.

---

## Now — done in this pass

### R1. Provenance on every portfolio item — **DONE**
*Defect · critical · all visitors*

**Was:** eight published case studies, none corresponding to real work, none labelled.
**Now:** every card shows a badge; every case study opens with a banner naming what it is and what it
is not.

**Acceptance criteria**
1. Every portfolio card renders a provenance badge. ✅
2. Every case study renders the banner above the title. ✅
3. Labels exist in Arabic and English. ✅ (verified in the shipped bundle)
4. No item can be added without a provenance value. ✅ (required by the type)

**Evidence:** `عمل مفاهيمي`, `Concept work` and the explanatory note all present in
`ProjectVisual-DmNgAcrN.js`; `/ar/portfolio`, `/en/portfolio`, `/ar/work/riwaq` all return 200.

### R2. Remove the tab that publishes nothing — **DONE**
*Defect · high · founder*

**Acceptance criteria:** the content tab is absent from the dashboard ✅; the server procedures and
table are untouched ✅; typecheck and build pass ✅.

---

## Next — specified, safe, awaiting D1 approval

### R3. Reposition the homepage and services around operations software — **DONE**
**Acceptance criteria**
1. The H1 names the outcome for an operating business, not "digital presence".
2. Every service track maps to a capability used in a real system.
3. The homepage states who it is for within the first screen, on mobile.
4. No claim appears that the founder cannot substantiate.
5. Arabic and English carry identical meaning.

### R4. Industry entry points — **DONE**
Home and the services page are organised by industry: property, wellness, rental showrooms,
investment, hospitality, recycling. Each links straight to the form carrying its own context.

**Verified:** `/ar/services` and `/en/services` return 200; the new promise and all six industries are
present in the shipped bundle; the sitemap dropped from 48 to 16 URLs because hidden pages are no
longer advertised.

### R4b. Hidden-not-deleted mechanism — **DONE**
Owner constraint honoured: a `visibility` field on services and projects. Eight creative tracks and
eight concept projects remain in the repository and are excluded from every listing, the contact
picker, related-service lookups, and the sitemap. Restoring any one of them is a single word.
**Acceptance criteria:** a visitor can reach the relevant system in one click from the homepage; each
industry page opens with a recognisable operational problem; each links to at least one application or
states plainly that a demonstration is in progress.

### R5. Publish the six real applications — **BLOCKED on owner content**
Needs, per application: intended user in one line, and at least three screens.
**Acceptance criteria:** each has industry, problem, user, 3–6 capabilities, ≥3 screens with alt text,
provenance, one primary action, both languages, a stable URL, and appears in the sitemap.

### R6. Stage badge: live / pilot / available — **BLOCKED on owner facts**
**Acceptance criteria:** every application shows exactly one stage; no metric is shown unless
substantiated; the badge is visible on the card without a click.

### R7. Operator section on each application — **READY after R5**
**Acceptance criteria:** each application answers what changes for daily staff, offline behaviour, and
how mistakes are corrected, in under 80 words.

---

## Later — real but not urgent

### R8. Accessibility verification with assistive technology
Structural checks pass; no screen-reader or contrast-ratio audit has been run. **Not claimed as done.**
**Acceptance criteria:** every interactive element reachable and announced; contrast ≥ 4.5:1 in both
themes; the contact form completable by keyboard alone in both directions.

### R9. Delivery lifecycle vocabulary
Inquiry statuses suit lead capture, not software delivery. Add discovery → scoping → pilot → rollout
only when a second project runs in parallel.

### R10. State the engagement model
One short section: how a project starts, what the founder delivers, what happens after handover.
Requires owner input on support policy — commercial, not inferable.

---

## Explicitly not doing

Pricing pages · client portal · blog · chatbot · CRM · testimonial carousel with no testimonials ·
framework, database or design-system replacement · any third-party script.

---

## The single next action

**Approve D1.** Everything from R3 to R7 is sequenced behind one decision: whether the site argues for
the business the founder actually runs. Until then the funnel is well-built and pointed at the wrong
audience.
