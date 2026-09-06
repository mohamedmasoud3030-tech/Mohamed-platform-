---
name: platform-review
description: "Review Platform diffs, branches, or pull requests with risk-selected reviewer perspectives, evidence-backed findings, severity and confidence, deduplication, and independent merge-readiness judgment. Use for code review, adversarial review, security-sensitive review, or pre-merge validation."
---

# Platform Review

Review must be independent from implementation logic. Do not silently convert review into a fix pass.

## Workflow

1. Establish review scope.
   - Identify the exact diff/PR/commit range.
   - Read affected contracts and nearby tests, not the whole repository indiscriminately.

2. Classify change surfaces.
   Select only relevant reviewer perspectives:
   - architecture/boundaries
   - auth/security/privacy
   - database/migrations/RLS
   - API/contracts
   - frontend/runtime/accessibility
   - testing/verification
   - deployment/operations
   - product/evidence authority

3. Review adversarially.
   Look for correctness failures, missing edge cases, stale assumptions, security boundary breaks, migration hazards, duplicated authority, false availability/success states, and cleanup residue.

4. Keep security scoped correctly.
   - When auth, secrets, uploads, outbound network, database isolation, or trust boundaries changed, apply a security-focused pass.
   - Do not silently generate a full threat model unless the user requested threat modeling.
   - If a new trust boundary or future multi-tenant boundary clearly needs a threat model, raise that as a finding.

5. Report findings only when supported by evidence.
   Every finding must include:
   - severity P0, P1, P2, or P3;
   - confidence High, Medium, or Low;
   - evidence path and behavior;
   - impact;
   - recommended owner;
   - fix class: required-before-merge, follow-up, or advisory.

6. Deduplicate and prioritize.
   Merge overlapping findings. Prefer a small set of high-confidence issues over speculative noise.

7. Review cleanup.
   Check for dead tests, obsolete contracts, duplicate files, temporary adapters, stale docs, or abandoned code paths introduced or exposed by the change.

## Merge judgment

State one of:
- Ready
- Ready with follow-ups
- Not ready

The judgment must follow from the findings and verification evidence. A clean review is not proof unless relevant tests and checks are known.

Read references/review-rubric.md for severity, security, and reviewer selection details.
