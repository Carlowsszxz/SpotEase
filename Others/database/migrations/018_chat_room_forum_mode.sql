-- =====================================================
-- Phase: Room forum mode for FrameChat
--
-- Goal:
-- - Allow open room-based discussion channels (not private-only DM threads)
-- - Keep existing private chat behavior intact
-- =====================================================

-- Optional helper index for room-forum lookup by metadata keys.
CREATE INDEX IF NOT EXISTS chat_conversations_metadata_gin_idx
  ON public.chat_conversations
  USING gin (metadata);

CREATE OR REPLACE FUNCTION public.chat_is_room_forum(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = p_conversation_id
      AND c.archived_at IS NULL
      AND COALESCE(c.metadata->>'chat_mode', '') = 'room_forum'
  );
$$;

DROP POLICY IF EXISTS "Chat conversations self read" ON public.chat_conversations;
CREATE POLICY "Chat conversations self read"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR public.chat_is_room_forum(id)
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants cp
    WHERE cp.conversation_id = id
      AND cp.user_id = auth.uid()
      AND cp.blocked_at IS NULL
  )
);

DROP POLICY IF EXISTS "Chat messages participant read" ON public.chat_messages;
CREATE POLICY "Chat messages participant read"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.chat_is_participant(conversation_id, auth.uid())
  OR public.chat_is_room_forum(conversation_id)
);

CREATE OR REPLACE FUNCTION public.chat_can_send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_body text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count int := 0;
  v_last_message_at timestamptz;
  v_is_participant boolean := false;
  v_is_room_forum boolean := false;
  v_is_blocked boolean := false;
BEGIN
  IF p_sender_id IS NULL OR p_conversation_id IS NULL THEN
    RETURN false;
  END IF;

  IF length(trim(COALESCE(p_body, ''))) < 1 OR length(trim(COALESCE(p_body, ''))) > 2000 THEN
    RETURN false;
  END IF;

  SELECT public.chat_is_room_forum(p_conversation_id)
    INTO v_is_room_forum;

  IF NOT v_is_room_forum THEN
    SELECT public.chat_is_participant(p_conversation_id, p_sender_id)
      INTO v_is_participant;

    IF NOT v_is_participant THEN
      RETURN false;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants cp
    JOIN public.chat_user_blocks b
      ON b.blocker_id = cp.user_id
     AND b.blocked_user_id = p_sender_id
    WHERE cp.conversation_id = p_conversation_id
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)
    INTO v_recent_count
  FROM public.chat_messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id = p_sender_id
    AND m.created_at > now() - interval '30 seconds';

  SELECT MAX(created_at)
    INTO v_last_message_at
  FROM public.chat_messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id = p_sender_id;

  IF v_recent_count >= 6 THEN
    RETURN false;
  END IF;

  IF v_last_message_at IS NOT NULL AND now() - v_last_message_at < interval '3 seconds' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
