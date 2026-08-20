# Product Decisions

Each decision states the choice, the decisive reason, and how to reverse it. Assumptions are marked so
they can be revisited against evidence rather than opinion.

---

## D1 — Reposition the site around operations software for specific industries
**Status: RECOMMENDED — requires one owner approval (market/brand decision).**

**Decision.** Replace the creative-agency promise with a vertical operations-software promise: systems
that run a business's daily work, built by someone who ran that work first. Keep design, content and
branding as *capabilities inside a project*, not as the products being sold.

**Decisive reason.** The founder has six operations systems and zero real branding case studies. The
site argues for the half of the business with no evidence behind it, and that half is precisely the
commoditised one — current practice is explicit that niche positioning on the marketing surface
outperforms horizontal positioning at the same firm size, and that the low-end brochure/branding
market is being taken by cheap generation. Positioning follows evidence; the evidence is the six
systems.

**Not a change of who the customer is** in the founder's own words — his biography already describes
exactly this business. It is the homepage that disagrees with the biography.

**Reversible:** copy and taxonomy only. No schema, no data, no integrations. One commit to revert.

---

## D2 — Label every portfolio item with its provenance
**Status: IMPLEMENTED.**

**Decision.** Every item declares what it is: concept work, a product we built and operate, or a client
project. The eight existing published items are labelled **concept work**, because that is what they
factually are.

**Decisive reason.** Eight published case studies had no counterpart in reality and no label. One
question from a serious prospect — "tell me about Riwaq" — ends the conversation permanently. Deleting
them would leave an empty portfolio, which is worse; labelling them is honest, keeps the demonstration
of method, and costs nothing.

**Reversible:** one field per item; changing a label is a one-word edit.

---

## D3 — Remove the content tab rather than wire it up
**Status: IMPLEMENTED.**

**Decision.** The dashboard tab for `content_entries` is removed. The table and the server procedures
are untouched.

**Decisive reason.** No public page reads it, so "publishing" succeeded and changed nothing. A control
that silently does nothing is worse than a missing control, because it teaches the operator to distrust
the dashboard. Wiring it up would mean inventing a content surface nobody asked for.

**Reversible:** the backend is intact; restoring the tab is a UI change.

---

## D4 — Navigate by industry, not by creative discipline
**Status: RECOMMENDED, sequenced after D1.**

**Decision.** The primary browse axis becomes the buyer's industry — property, wellness, retail
rental, investment, hospitality, recycling — with capabilities as supporting detail.

**Decisive reason.** Buyers of operations software search by their own industry. Nobody managing a
warehouse browses "visual identity". This is also what makes each page rank for a real query.

**Reversible:** navigation and page grouping; content is reused, not rewritten.

---

## D5 — Publish whether a system is live, and with whom
**Status: RECOMMENDED, blocked on owner facts.**

**Decision.** Each application states its stage: live with a real user, in pilot, or built and
available. No numbers are published unless the founder can substantiate them.

**Decisive reason.** Operations software is bought on evidence it survives real use. "Live in a
working warehouse" outweighs any amount of feature description. Kayyal reportedly is live; that is
currently invisible.

**Conservative default until told otherwise:** show the stage, never a metric.

---

## D6 — Speak to the operator, not only the buyer
**Status: RECOMMENDED.**

**Decision.** Each application page gains a short section on what changes for the staff who use it
daily — offline behaviour, one-handed use, corrections without deletion, training effort.

**Decisive reason.** In operations software the buyer signs and the operator decides whether it
survives. Kayyal's specification is full of this thinking and none of it is public.

---

## D7 — Do not state pricing; state the shape of an engagement
**Status: IMPLEMENTED in help content, retained.**

**Decision.** No price list. The site explains that scope and cost are defined before any commitment.

**Decisive reason.** Pricing is an owner-controlled commercial policy. A procedural statement answers
the buyer's real anxiety ("will I be trapped?") without inventing a number.

---

## D8 — Keep the existing architecture
**Status: DECIDED, no action.**

**Decision.** No framework, database, auth, state or design-system replacement.

**Decisive reason.** Nothing measured justifies it: build and typecheck are clean, 206 assertions pass,
the bundle is modest, there are zero third-party requests. A rewrite would trade a working system for
risk and cost, against a binding constraint of minimum spend.

---

## Reversible assumptions to revisit with evidence

| # | Assumption | Revisit when |
|---|---|---|
| A1 | Industry-first navigation beats discipline-first | Application-page → inquiry rate after 30 days |
| A2 | Concept work still helps while labelled | If labelled concept pages produce no inquiries, remove them |
| A3 | Arabic and English deserve equal investment | English share of inquiries after 60 days |
| A4 | Six industries is focus, not scatter | If one industry takes >60% of traffic, specialise further |
