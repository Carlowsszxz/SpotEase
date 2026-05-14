-- =====================================================
-- Admin assignable users lookup
--
-- Returns only users who do not already have an active RFID tag.
-- Used by the RFID assignment UI to hide already-assigned users.
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_list_assignable_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role varchar,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email, u.name, u.role, u.created_at::timestamptz, u.updated_at::timestamptz
  FROM public.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_rfid_tags t
    WHERE t.user_id = u.id
      AND t.is_active = true
  )
  ORDER BY
    (u.name IS NULL) ASC,
    lower(u.name) ASC,
    (u.email IS NULL) ASC,
    lower(u.email) ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_assignable_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_assignable_users() TO authenticated;