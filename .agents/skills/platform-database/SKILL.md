---
name: platform-database
description: "Engineer and review Platform PostgreSQL and Drizzle changes. Use for schemas, migrations, SQL queries, indexes, transactions, connection behavior, performance, data integrity, RLS, permissions, or any future tenant-isolation design."
---

# Platform Database

Use PostgreSQL as the database authority and Drizzle as the current schema/migration layer.

## Ground rules

1. Inspect the current schema, migrations, query paths, and deployment model before changing data behavior.
2. Do not assume Supabase-only database functions or auth context in code that must also work on plain PostgreSQL.
3. Supabase Storage behavior is a separate integration boundary; do not let Storage-specific assumptions leak into general database design.
4. Do not invent multi-tenancy. Current tenant isolation requirements must come from actual product architecture.

## Schema and migration workflow

1. Define the data invariant first.
2. Prefer additive, backward-compatible migration steps when production data may already exist.
3. Add a new migration instead of rewriting an already-applied historical migration unless the repository is explicitly resetting an unreleased baseline.
4. Separate data backfill from destructive cleanup when rollback risk exists.
5. Validate constraints, nullability, defaults, uniqueness, foreign keys, and indexes against real query paths.
6. Define rollback or forward-recovery behavior for risky migrations.

## Query and performance workflow

- Avoid N+1 access patterns.
- Add indexes for demonstrated query predicates, joins, ordering, and foreign-key access rather than indexing by habit.
- Use EXPLAIN/EXPLAIN ANALYZE when performance is the reason for a change and a database environment is available.
- Consider connection limits and pooling for serverless/concurrent deployment.
- Keep transactions as small as correctness allows and reason about locking for writes.

## RLS and tenant isolation

If Platform becomes multi-tenant:
- application WHERE filters are not sufficient isolation by themselves;
- enforce tenant boundaries in PostgreSQL with RLS or an equivalently strong database boundary;
- use a validated request/session context and set it transaction-locally;
- default deny when tenant context is missing;
- index columns used by RLS policies;
- add explicit cross-tenant denial tests;
- review privileged/service-role paths separately.

Do not add RLS merely because a generic Supabase example uses auth.uid(). Adapt the policy to Platform's real authentication and connection model.

Read references/postgres-rls.md for the detailed checklist and source adaptation rules.
