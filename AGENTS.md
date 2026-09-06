# Platform Agent Operating Contract

This repository uses a small, project-specific Agent Skills layer. The goal is consistent engineering behavior, not a large marketplace of generic prompts.

## Canonical skills location

The only project-level Agent Skills authority is .agents/skills/.

When a task matches a skill description, load that skill before acting. Do not create parallel copies under skills/, .claude/skills/, or .github/skills/. If a client needs another native location later, generate it from the canonical source rather than maintaining two independent versions.

## Current repository truth

Current stack:
- pnpm workspace
- TypeScript 5.9
- React 19 + Vite 7
- Express 5 + tRPC 11
- PostgreSQL + Drizzle
- Supabase Storage only where the repository already uses it
- Vitest plus the repository verification and Guardian checks

Current product/runtime authorities:
- artifacts/lena/src/content/systems.ts — public product facts; `publicSystems()` is the publication filter
- artifacts/lena/src/content/site-copy.ts — public copy and navigation labels
- artifacts/lena/src/features/world/content/evidence.ts — publishable product evidence
- artifacts/lena/src/features/world/content/product-contract.ts — derived product contract, not a second registry
- artifacts/lena/src/graph/ — World Graph; Atlas and World remain distinct surfaces
- artifacts/lena/src/features/core-intelligence/ — derived read-only intelligence; not a second product registry. Production graph seam is CanonicalWorldGraphAdapter.
- artifacts/lena/src/features/world/signals/ — observation and mutation adapter. Production source stays unavailable until an authorized product source exists.

Hidden `LENA_SERVICES` and `STUDIO_PROJECTS` records stay in the repository unpublished. Do not restore them as a public catalog.

Historical planning documents are provenance, not runtime authority when they conflict with current code contracts.

## Skill routing

- platform-architecture-decisions: architecture, system design, service boundaries, ADRs, technology choices, major refactors.
- platform-implementation-planning: implementation plans for non-trivial features, refactors, migrations, infrastructure, or architecture changes.
- platform-implementation: production implementation, bug fixing, refactoring, source-driven framework work, and test-first fixes.
- platform-review: PR/diff review, adversarial review, merge readiness, security-sensitive review, and change-risk classification.
- platform-database: PostgreSQL, Drizzle, schema, migrations, queries, indexes, connection behavior, and RLS/tenant isolation.
- platform-skill-engineering: creating, modifying, merging, deleting, or evaluating Agent Skills and agent workflows.

## Global engineering invariants

1. Prefer repository evidence over memory.
2. For version-sensitive framework or library decisions, verify the installed version and consult official documentation before implementation. If official documentation cannot be reached, label the decision unverified rather than inventing an API or pattern.
3. Do not introduce Nx, NestJS, Better Auth, or any other future stack choice merely because it appears in planning discussions. Such adoption requires an explicit architecture decision first.
4. Keep planning, implementation, and review logically separated. Review is not proof that the authoring pass is correct.
5. Never invent live operational data, product evidence, tenant boundaries, permissions, or owner decisions. Do not reintroduce Jiwdah or production `DEMO_SIGNALS`. Demo signals may exist only as explicit test fixtures.
6. Database isolation must be enforced at the correct boundary. Application filtering alone is not a substitute for database-enforced tenant isolation when multi-tenancy is introduced.
7. Every implementation pass must remove obsolete files, tests, contracts, helpers, or duplicated authorities made redundant by the change, after proving they are no longer referenced. Do not leave dead residue for a later cleanup pass.
8. Use pnpm only. Do not introduce package-lock.json or yarn.lock.
9. Before declaring completion, run the narrowest relevant tests, then the repository verification gates appropriate to the change. At minimum, code changes should consider pnpm run typecheck, pnpm test, pnpm run build, and pnpm run verify.
10. Do not blindly rebaseline Guardian visual snapshots. Inspect the actual diff first and refresh a baseline only when the new output is the intended canonical UI.

## Skill maintenance

Agent Skills must follow the open Agent Skills specification. Keep SKILL.md focused and use references/ for detail. Descriptions must clearly state what the skill does and when it should trigger. Avoid adding a new skill when an existing project skill can absorb the capability coherently.

Run pnpm run verify:skills after any skill change.
