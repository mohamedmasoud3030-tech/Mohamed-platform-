# PostgreSQL and RLS Reference

## Change checklist

Schema:
- Correct types and nullability
- Explicit uniqueness and referential integrity
- Indexes matched to actual access paths
- No duplicated source-of-truth columns without synchronization contract
- Migration order supports deployed old and new code where required

Queries:
- Parameterized values
- Bounded result sets for list paths
- No accidental N+1 behavior
- Stable pagination where needed
- Transactions cover the real atomicity boundary

Connections:
- Serverless connection pressure considered
- Pooling and limits match deployment
- Long transactions avoided
- Lock-heavy migrations identified before production

RLS:
- Enabled on every tenant-owned table when multi-tenancy exists
- Policies default deny without validated tenant context
- WITH CHECK mirrors write isolation requirements
- Privileged bypass roles are tightly scoped
- Policy columns are indexed
- Cross-tenant read/write tests exist
- Session context cannot leak across pooled connections

## Platform adaptation

Supabase's Postgres guidance is useful for PostgreSQL engineering, but examples using auth.uid(), Supabase Auth, or Supabase-specific helpers are not Platform defaults.

If tenant identity is propagated through a PostgreSQL setting in the future:
- set it within the transaction/request scope;
- validate the value before using it;
- clear or isolate it automatically through transaction-local semantics;
- never trust an arbitrary client-provided tenant identifier.

Current repository support for plain PostgreSQL means migrations must not require Supabase-only database objects unless the migration explicitly guards that path.

## Upstream sources studied

Supabase Postgres best practices:
https://github.com/supabase/agent-skills/blob/main/skills/supabase-postgres-best-practices/SKILL.md

Supabase RLS performance guidance:
https://github.com/supabase/agent-skills/blob/main/skills/supabase-postgres-best-practices/references/security-rls-performance.md

Agent Skills source is used for engineering knowledge only; this project does not adopt Supabase as a blanket application architecture.
