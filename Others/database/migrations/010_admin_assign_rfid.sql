-- =====================================================
-- Admin RFID assignment RPC + optional tag name
--
-- Adds:
-- - public.user_rfid_tags.tag_name (optional)
-- - public.admin_assign_rfid_tag(...) RPC
--
-- Purpose:
-- - Admin can assign an RC522 UID to a user from the Admin Panel
-- - Upserts on tag UID (reassigns tag if already registered)
-- =====================================================

ALTER TABLE IF EXISTS public.user_rfid_tags
  ADD COLUMN IF NOT EXISTS tag_name text;

CREATE OR REPLACE FUNCTION public.admin_assign_rfid_tag(
  p_user_id uuid,
  p_tag_uid text,
  p_tag_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_uid text;
  v_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_tag_uid IS NULL OR btrim(p_tag_uid) = '' THEN
    RAISE EXCEPTION 'tag_uid is required';
  END IF;

  -- Normalize UID: uppercase, remove whitespace
  v_uid := upper(regexp_replace(p_tag_uid, '\\s+', '', 'g'));

  IF v_uid !~ '^[0-9A-F]+$' THEN
    RAISE EXCEPTION 'tag_uid must be hex (0-9, A-F)';
  END IF;

  v_name := NULLIF(btrim(p_tag_name), '');

  INSERT INTO public.user_rfid_tags (user_id, tag_uid, is_active, tag_name)
  VALUES (p_user_id, v_uid, true, v_name)
  ON CONFLICT (tag_uid_norm) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        tag_uid = EXCLUDED.tag_uid,
        is_active = true,
        tag_name = EXCLUDED.tag_name;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_assign_rfid_tag(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_assign_rfid_tag(uuid, text, text) TO authenticated;
