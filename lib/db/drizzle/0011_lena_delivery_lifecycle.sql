-- Delivery lifecycle statuses, as specified by the owner (2026-08-20).
--
-- The original set described lead capture only: new, in_progress, qualified,
-- closed, archived. Selling software products needs the stages of an actual
-- engagement: contacted, quoted, agreed, completed.
--
-- Strictly additive. No existing value is removed and no row is rewritten, so
-- every historical record stays valid and readable. `qualified` is retained as a
-- legacy value: it is no longer offered in the interface, but rows that already
-- carry it continue to render.
--
-- PostgreSQL requires ALTER TYPE ... ADD VALUE outside a transaction block in
-- older versions; IF NOT EXISTS keeps this migration safe to re-run.

ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'contacted';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'quoted';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'agreed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'completed';
