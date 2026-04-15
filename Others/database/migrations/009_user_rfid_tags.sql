-- =====================================================
-- User RFID Tags (recommended approach)
--
-- Why not a single column on users?
-- - Supports multiple cards per user
-- - Supports replacements / revocations with history
-- - Enforces global uniqueness (one card can't belong to two users)
--
-- Notes:
-- - RC522 UID is an identifier, not a secret.
-- - RLS: authenticated users can read their own tags; only admins can write.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_rfid_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Raw UID as provided by the device/app (e.g., "858D3102")
  tag_uid text NOT NULL,

  -- Normalized UID used for uniqueness checks (uppercase, no whitespace)
  tag_uid_norm text GENERATED ALWAYS AS (
    upper(regexp_replace(tag_uid, '\\s+', '', 'g'))
  ) STORED,

  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

-- Basic validation: your firmware outputs hex UIDs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_rfid_tags_tag_uid_norm_hex_check'
  ) THEN
    ALTER TABLE public.user_rfid_tags
      ADD CONSTRAINT user_rfid_tags_tag_uid_norm_hex_check
      CHECK (tag_uid_norm ~ '^[0-9A-F]+$');
  END IF;
END $$;

-- One physical card/tag may only be assigned to one user
CREATE UNIQUE INDEX IF NOT EXISTS user_rfid_tags_tag_uid_norm_uniq
  ON public.user_rfid_tags(tag_uid_norm);

CREATE INDEX IF NOT EXISTS user_rfid_tags_user_id_idx
  ON public.user_rfid_tags(user_id);

ALTER TABLE public.user_rfid_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rfid_tags FORCE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "RFID tags self read" ON public.user_rfid_tags;
DROP POLICY IF EXISTS "RFID tags admin insert" ON public.user_rfid_tags;
DROP POLICY IF EXISTS "RFID tags admin update" ON public.user_rfid_tags;
DROP POLICY IF EXISTS "RFID tags admin delete" ON public.user_rfid_tags;

-- Users can see their own assigned tags; admins can see all.
CREATE POLICY "RFID tags self read"
ON public.user_rfid_tags
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Only admins can assign/remove/modify tags
CREATE POLICY "RFID tags admin insert"
ON public.user_rfid_tags
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "RFID tags admin update"
ON public.user_rfid_tags
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "RFID tags admin delete"
ON public.user_rfid_tags
FOR DELETE
TO authenticated
USING (public.is_admin());
