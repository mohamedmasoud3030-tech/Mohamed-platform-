-- Admin accountability: an append-only record of every privileged action.
--
-- Rationale: a single-admin product still needs an answer to "who changed this,
-- when, and why" — for the owner's own investigation, for a future second
-- operator, and for any data-deletion request that must be evidenced.
--
-- The table is deliberately append-only: no UPDATE or DELETE path exists in the
-- application, and revoking those rights at the database role level is
-- recommended in ADMIN_SUPPORT_OPERATIONS_SPEC.md.

CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id serial PRIMARY KEY,
  actor_user_id integer REFERENCES public.users(id) ON DELETE SET NULL,
  actor_union_id varchar(255),
  actor_role varchar(50) NOT NULL DEFAULT 'admin',
  action varchar(64) NOT NULL,
  subject_type varchar(32) NOT NULL,
  subject_id varchar(64),
  -- Short human reason captured at the moment of the action. Never optional for
  -- destructive or data-revealing actions.
  reason text,
  -- Before/after summary. Must never contain full personal data: values are
  -- summarised or masked by the caller.
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  outcome varchar(16) NOT NULL DEFAULT 'success',
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_at_idx
  ON public.admin_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_events_subject_idx
  ON public.admin_audit_events (subject_type, subject_id);

ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
