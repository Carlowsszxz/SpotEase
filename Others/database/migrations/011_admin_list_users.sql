-- Admin-only helper to list users for admin UIs.
-- Avoids loosening RLS on public.users (which is currently self-only).

CREATE OR REPLACE FUNCTION public.admin_list_users()
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
  ORDER BY
    (u.name IS NULL) ASC,
    lower(u.name) ASC,
    (u.email IS NULL) ASC,
    lower(u.email) ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Optional hardening: prevent clients from elevating themselves by updating role.
-- Keep name/updated_at editable; auth.email is managed in auth.users.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (name, updated_at) ON public.users TO authenticated;
