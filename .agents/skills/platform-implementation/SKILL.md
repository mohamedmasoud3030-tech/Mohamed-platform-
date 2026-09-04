---
name: platform-implementation
description: "Implement or fix production code in Platform with source-driven framework decisions, incremental changes, prove-it tests for bugs, repository-specific conventions, verification gates, and same-pass cleanup. Use for features, bug fixes, refactors, API work, frontend work, and integration changes."
---

# Platform Implementation

Use this skill when code must change.

## Before editing

1. Read AGENTS.md and the relevant current runtime authorities.
2. Inspect the current implementation, tests, and package versions.
3. If a framework or library API is version-sensitive, verify it against official documentation before choosing the implementation pattern.
4. If official documentation cannot be reached, avoid speculative APIs and state what remains unverified.

## Implementation discipline

1. Work in the smallest coherent vertical slice.
2. Preserve existing contracts unless the task explicitly changes them.
3. Reuse current repository patterns before introducing abstractions.
4. For bug fixes, use the prove-it pattern when practical:
   - add or identify a test that fails for the bug;
   - confirm the failure represents the bug;
   - implement the fix;
   - confirm the same test passes.
5. Do not enforce arbitrary global coverage percentages. Test the behavior and risk that changed.
6. Keep security-sensitive defaults fail-closed where the repository's contract requires it.
7. Do not fabricate unavailable operational data, signals, evidence, permissions, or success states.
8. Do not introduce Nx, NestJS, Better Auth, or other future-stack choices without an approved architecture decision.

## Source-driven rule

For React, Vite, Express, tRPC, Drizzle, PostgreSQL, Vitest, Vercel, or any changing dependency:
- first identify the installed version;
- prefer the project's existing usage;
- consult official docs/repositories for unfamiliar or changed APIs;
- distinguish documented behavior from inference.

## Cleanup rule

Before finishing:
- find old files, helpers, tests, contracts, flags, comments, or adapters made redundant by the change;
- prove they are no longer referenced;
- remove them in the same change;
- do not leave parallel sources of truth.

## Verification order

1. Narrow test or reproduction check.
2. Package-level tests/typecheck for changed packages.
3. pnpm run typecheck.
4. pnpm run build.
5. pnpm run verify when the change touches guarded behavior or before merge.

Read references/source-and-test-discipline.md when working with unfamiliar APIs, regressions, or broad refactors.
