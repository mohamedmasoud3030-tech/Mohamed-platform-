# Platform Implementation Plan Contract

## Required sections

### 1. Objective
One precise outcome.

### 2. Current-state evidence
List the files, contracts, package versions, tests, and runtime authorities that define current behavior.

### 3. Scope
- In scope
- Out of scope
- Explicit non-goals
- Owner decisions or external dependencies

### 4. Risk and dependency map
Classify relevant risk:
- architecture
- auth/security
- database/migration
- API/contract
- frontend/runtime
- deployment/operations
- data/evidence integrity

### 5. Phases

For every phase include:
- Goal
- Dependencies
- Exact paths expected to change
- Tasks
- Acceptance criteria
- Verification
- Cleanup/removals
- Rollback or recovery where applicable

### 6. Final verification
State the exact commands and behavior checks that close the plan.

### 7. Review handoff
Name the review surfaces that need independent review after implementation.

## Planning rules

- Do not turn vague requirements into invented product decisions.
- Do not add new frameworks to make implementation easier unless architecture approved them.
- Do not produce duplicate registries or compatibility layers without a removal condition.
- A migration plan is incomplete without data compatibility and rollback thinking.
- A bug fix should include a reproducible failing check when practical.

## Upstream sources studied

GitHub official create-implementation-plan:
https://github.com/github/awesome-copilot/blob/main/skills/create-implementation-plan/SKILL.md

GitHub implementation plan agent:
https://github.com/github/awesome-copilot/blob/main/agents/implementation-plan.agent.md

EveryInc compound engineering planning/review patterns:
https://github.com/EveryInc/compound-engineering-plugin

This project contract adapts the ideas to Platform rather than copying upstream output templates.
