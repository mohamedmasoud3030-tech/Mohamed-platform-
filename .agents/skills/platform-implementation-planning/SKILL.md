---
name: platform-implementation-planning
description: "Create execution-ready implementation plans for Platform. Use before non-trivial features, refactors, migrations, infrastructure changes, architecture changes, or multi-file work that needs explicit phases, dependencies, acceptance criteria, verification, cleanup, and rollback."
---

# Platform Implementation Planning

Turn an approved requirement or architecture decision into an implementation plan that another agent or engineer can execute without inventing missing intent.

## Workflow

1. Read the repository before planning.
   - Confirm current branch/base, package versions, entrypoints, runtime authorities, tests, and existing related code.
   - Reject stale planning assumptions that conflict with current main.

2. Lock scope.
   - State objective, in-scope behavior, out-of-scope behavior, acceptance criteria, and owner-controlled decisions.
   - If a required owner decision is missing, mark it as a blocker instead of guessing.

3. Decompose into atomic phases.
   - Each phase must have a clear purpose, exact affected paths, dependencies, implementation tasks, and measurable completion criteria.
   - Order schema/data changes before code that depends on them.
   - Keep independent work parallel only when it is actually safe.

4. Plan verification with the work.
   - For bugs, include a failing proof test before the fix when practical.
   - Include unit/integration/browser/contract checks only where they protect the changed behavior.
   - Include pnpm run typecheck, pnpm run build, or pnpm run verify where appropriate.

5. Plan migration and rollback.
   - For database or contract changes, define compatibility and rollback.
   - For high-risk changes, identify a safe checkpoint before irreversible steps.

6. Plan cleanup explicitly.
   - List old files, tests, duplicate contracts, temporary adapters, feature flags, or stale docs that become obsolete.
   - Do not create a second cleanup backlog for residue introduced by the same plan.

7. Handoff.
   - The plan must contain enough repository evidence and exact paths to execute, but it must not pre-write the implementation.
   - Avoid brittle line-number dependencies unless a line range is necessary for disambiguation.

Read references/plan-contract.md for the required plan structure.
