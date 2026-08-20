-- Two governance controls that need database-level enforcement.
--
-- 1. Aggregate product measurement.
--    Pure counters: a row describes a day, an event and a route shape — never a
--    person. There is no identifier, no session, no address, and no way to
--    reconstruct an individual's path from this table.
--
-- 2. Audit immutability.
--    The application already exposes no update or delete path for audit events.
--    A trigger closes the remaining gap so that even a future code change, or a
--    direct connection, cannot rewrite history. A trigger is used rather than a
--    role GRANT because the application's database role name differs across
--    hosts, and this works identically everywhere.

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  day date NOT NULL,
  event varchar(48) NOT NULL,
  route varchar(64) NOT NULL DEFAULT '/',
  locale varchar(8) NOT NULL DEFAULT 'ar',
  dimension varchar(32) NOT NULL DEFAULT '',
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (day, event, route, locale, dimension)
);

CREATE INDEX IF NOT EXISTS analytics_daily_day_idx ON public.analytics_daily (day DESC);

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Audit events are append-only, enforced by the database itself.
CREATE OR REPLACE FUNCTION public.admin_audit_events_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_events is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_audit_events_no_update ON public.admin_audit_events;
CREATE TRIGGER admin_audit_events_no_update
  BEFORE UPDATE ON public.admin_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_events_append_only();

DROP TRIGGER IF EXISTS admin_audit_events_no_delete ON public.admin_audit_events;
CREATE TRIGGER admin_audit_events_no_delete
  BEFORE DELETE ON public.admin_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.admin_audit_events_append_only();
