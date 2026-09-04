# Architecture Decision Reference

## Project decision record shape

Use this structure for durable architecture decisions:

# ADR: Decision title

- Status: Proposed | Accepted | Superseded
- Date: YYYY-MM-DD
- Scope: affected packages, services, routes, data, or infrastructure

## Context

Describe the current repository state and the problem. Cite concrete files and package versions. Distinguish facts from assumptions.

## Decision drivers

List the forces that matter: product constraint, compatibility, security, data integrity, performance, cost, operability, reversibility, and team/agent maintainability.

## Options considered

For each credible option:
- What changes.
- What remains unchanged.
- Benefits.
- Costs and risks.
- Migration complexity.
- Rollback path.

Always include the current architecture when keeping it is a viable option.

## Decision

State one choice and why it dominates the alternatives under current constraints.

## Consequences

Cover positive consequences, accepted trade-offs, new operational obligations, security implications, data/migration implications, and future constraints.

## Validation

Define measurable checks that prove the decision works after implementation.

## Project adaptations

- Current backend is Express 5 + tRPC 11, not NestJS.
- Current workspace is pnpm, not Nx.
- PostgreSQL + Drizzle are current database authorities.
- Supabase-specific behavior must not be assumed for plain PostgreSQL paths.
- Product/runtime truth is code-first in the authorities listed in AGENTS.md.

## Upstream sources studied

- Anthropic knowledge-work-plugins engineering architecture/system-design patterns:
  https://github.com/anthropics/knowledge-work-plugins
- Agent Skills open standard:
  https://agentskills.io/specification

This project file is a synthesis. It is not a verbatim copy of upstream skills.
