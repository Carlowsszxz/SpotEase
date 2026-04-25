-- =====================================================
-- Phase: Chat sender name lookup helper
--
-- Goal:
-- - Allow chat clients to resolve sender names/emails for IDs visible in a conversation
-- - Keep public.users RLS self-only by using a scoped SECURITY DEFINER RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.chat_list_visible_user_briefs(
  p_conversation_id uuid,
  p_user_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_allowed boolean := false;
BEGIN
  IF p_conversation_id IS NULL THEN
    RETURN;
  END IF;

  SELECT (
    public.is_admin()
    OR public.chat_is_room_forum(p_conversation_id)
    OR public.chat_is_participant(p_conversation_id, auth.uid())
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT u.id, u.name, u.email
  FROM public.chat_messages m
  JOIN public.users u
    ON u.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id
    AND m.deleted_at IS NULL
    AND (p_user_ids IS NULL OR cardinality(p_user_ids) = 0 OR m.sender_id = ANY(p_user_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.chat_list_visible_user_briefs(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_list_visible_user_briefs(uuid, uuid[]) TO authenticated;
