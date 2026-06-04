-- Production hardening for LENA project media and public inquiry abuse limits.
-- Supabase Storage setup safely no-ops on plain PostgreSQL deployments.

CREATE TABLE IF NOT EXISTS public.inquiry_rate_limits (
  identifier_hash varchar(128) PRIMARY KEY,
  source varchar(50) DEFAULT 'contact' NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  window_start timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS inquiry_rate_limits_updated_at_idx ON public.inquiry_rate_limits (updated_at DESC);

ALTER TABLE public.inquiry_rate_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'lena-project-media',
      'lena-project-media',
      true,
      104857600,
      ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
        'video/mp4',
        'video/webm',
        'video/ogg'
      ]::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      updated_at = now();
  END IF;
END $$;
