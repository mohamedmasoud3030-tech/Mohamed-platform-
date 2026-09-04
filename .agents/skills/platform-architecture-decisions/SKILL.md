---
name: platform-architecture-decisions
description: "Make repository-grounded architecture and system-design decisions for Platform. Use when choosing technologies, defining service or module boundaries, changing API or data models, writing ADRs, evaluating major refactors, or introducing infrastructure that changes system structure."
---

# Platform Architecture Decisions

Use this skill for decisions that alter structure, boundaries, long-term coupling, or technology commitments.

## Workflow

1. Establish current truth from the repository before proposing architecture.
   - Read package manifests, relevant entrypoints, current contracts, and the current runtime authorities listed in AGENTS.md.
   - Separate current implementation from historical plans and future ideas.

2. Classify the decision.
   - Local and reversible: solve inside the existing architecture without an ADR unless the choice has durable consequences.
   - Architectural: use the decision record in references/decision-record.md.

3. Verify external facts.
   - Check the installed package or tool version.
   - Prefer official documentation and official repositories for version-sensitive claims.
   - If official sources are unavailable, mark the affected claim as unverified.

4. Compare only credible options.
   - Include the status quo when it is viable.
   - Evaluate compatibility, migration cost, operational burden, security, reversibility, performance, and maintenance.
   - Do not choose a technology because it is fashionable or because a generic skill recommends it.

5. Protect Platform-specific boundaries.
   - Do not introduce Nx or NestJS into the current pnpm/Express workspace without an explicit architecture decision.
   - Do not replace current product/runtime authorities with a second registry or duplicate source of truth.
   - Do not broaden Supabase-specific assumptions beyond the repository's actual use.

6. Produce a decision that implementation can execute.
   - State context, decision, alternatives, consequences, migration path, rollback, and measurable validation.
   - Record assumptions and owner-controlled decisions explicitly.

## Completion gate

A decision is not complete if it depends on an unverified API, invents a requirement, creates duplicate authority, or leaves the migration/rollback boundary undefined.

Read references/decision-record.md when an ADR or architecture proposal is required.
