-- =====================================================
-- Chat RLS hotfix: break circular policy dependency
--
-- Context:
-- - chat_conversation_participants SELECT policy referenced chat_conversations
-- - chat_conversations SELECT policy referenced chat_conversation_participants
-- - This can trigger recursive policy evaluation and 500 errors on REST reads
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.chat_conversation_participants') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "Chat participants self read" ON public.chat_conversation_participants';

  EXECUTE '
    CREATE POLICY "Chat participants self read"
    ON public.chat_conversation_participants
    FOR SELECT
    TO authenticated
    USING (
      public.is_admin()
      OR user_id = auth.uid()
    )
  ';
END;
$$;
