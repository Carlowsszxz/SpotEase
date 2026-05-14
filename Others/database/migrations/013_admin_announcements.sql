-- =====================================================
-- Admin announcements for student dashboard notifications
--
-- - Admins can create/update/delete announcements
-- - Authenticated users can read only active, in-window announcements
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  start_at timestamptz NULL,
  end_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_time_window_chk CHECK (
    end_at IS NULL OR start_at IS NULL OR end_at >= start_at
  )
);

CREATE INDEX IF NOT EXISTS announcements_visible_idx
  ON public.announcements (is_active, start_at, end_at, created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements read visible" ON public.announcements;
CREATE POLICY "Announcements read visible"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  )
);

DROP POLICY IF EXISTS "Announcements admin insert" ON public.announcements;
CREATE POLICY "Announcements admin insert"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Announcements admin update" ON public.announcements;
CREATE POLICY "Announcements admin update"
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Announcements admin delete" ON public.announcements;
CREATE POLICY "Announcements admin delete"
ON public.announcements
FOR DELETE
TO authenticated
USING (public.is_admin());
