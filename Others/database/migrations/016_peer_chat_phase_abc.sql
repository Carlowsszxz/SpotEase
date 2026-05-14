-- =====================================================
-- Phase 3-5: Peer chat data model, realtime support, and safety controls
--
-- Goals:
-- - Conversation + participant model
-- - Message storage + read receipts
-- - Block/report moderation support
-- - Server-side send throttling and access-control helpers
-- - Safe to apply on top of the existing SpotEase schema
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------
-- 1) Conversations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NULL,
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS chat_conversations_created_by_idx
  ON public.chat_conversations(created_by, updated_at DESC);

CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx
  ON public.chat_conversations(updated_at DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations FORCE ROW LEVEL SECURITY;

-- Note: conversation policies are declared after the participants table is created
-- to avoid referencing `chat_conversation_participants` before it exists.

-- -----------------------------------------------------
-- 2) Participants + membership state
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NULL,
  muted_until timestamptz NULL,
  blocked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversation_participants_role_chk'
  ) THEN
    ALTER TABLE public.chat_conversation_participants
      ADD CONSTRAINT chat_conversation_participants_role_chk
      CHECK (role IN ('member','moderator','owner'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversation_participants_no_self_block_chk'
  ) THEN
    ALTER TABLE public.chat_conversation_participants
      ADD CONSTRAINT chat_conversation_participants_no_self_block_chk
      CHECK (user_id IS NOT NULL);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS chat_conversation_participants_unique_idx
  ON public.chat_conversation_participants(conversation_id, user_id);

CREATE INDEX IF NOT EXISTS chat_conversation_participants_user_idx
  ON public.chat_conversation_participants(user_id, conversation_id);

ALTER TABLE public.chat_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversation_participants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat participants self read" ON public.chat_conversation_participants;
DROP POLICY IF EXISTS "Chat participants creator insert" ON public.chat_conversation_participants;
DROP POLICY IF EXISTS "Chat participants creator update" ON public.chat_conversation_participants;
DROP POLICY IF EXISTS "Chat participants creator delete" ON public.chat_conversation_participants;

CREATE POLICY "Chat participants self read"
ON public.chat_conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
);

CREATE POLICY "Chat participants creator insert"
ON public.chat_conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Chat participants creator update"
ON public.chat_conversation_participants
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Chat participants creator delete"
ON public.chat_conversation_participants
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
);

-- Conversation policies (moved here so the participants table exists)
DROP POLICY IF EXISTS "Chat conversations self read" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat conversations self insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat conversations self update" ON public.chat_conversations;
DROP POLICY IF EXISTS "Chat conversations self delete" ON public.chat_conversations;

CREATE POLICY "Chat conversations self read"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants cp
    WHERE cp.conversation_id = id
      AND cp.user_id = auth.uid()
      AND cp.blocked_at IS NULL
  )
);

CREATE POLICY "Chat conversations self insert"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Chat conversations self update"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Chat conversations self delete"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin());

-- -----------------------------------------------------
-- 3) Messages + read receipts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  body_plain text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz NULL,
  deleted_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_body_length_chk'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_body_length_chk
      CHECK (char_length(trim(body)) BETWEEN 1 AND 2000);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_sender_created_idx
  ON public.chat_messages(sender_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat messages participant read" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages sender insert" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages sender update" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages sender delete" ON public.chat_messages;

CREATE OR REPLACE FUNCTION public.chat_is_participant(p_conversation_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
      AND cp.blocked_at IS NULL
  );
$$;

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
  v_is_blocked boolean := false;
BEGIN
  IF p_sender_id IS NULL OR p_conversation_id IS NULL THEN
    RETURN false;
  END IF;

  IF length(trim(COALESCE(p_body, ''))) < 1 OR length(trim(COALESCE(p_body, ''))) > 2000 THEN
    RETURN false;
  END IF;

  SELECT public.chat_is_participant(p_conversation_id, p_sender_id)
    INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN false;
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

CREATE POLICY "Chat messages participant read"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.chat_is_participant(conversation_id, auth.uid())
);

CREATE POLICY "Chat messages sender insert"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.chat_can_send_message(conversation_id, sender_id, body)
);

CREATE POLICY "Chat messages sender update"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR sender_id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR sender_id = auth.uid()
);

CREATE POLICY "Chat messages sender delete"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR sender_id = auth.uid()
);

CREATE TABLE IF NOT EXISTS public.chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_message_reads_unique_idx
  ON public.chat_message_reads(message_id, user_id);

CREATE INDEX IF NOT EXISTS chat_message_reads_user_idx
  ON public.chat_message_reads(user_id, read_at DESC);

ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat reads self read" ON public.chat_message_reads;
DROP POLICY IF EXISTS "Chat reads self write" ON public.chat_message_reads;
DROP POLICY IF EXISTS "Chat reads self update" ON public.chat_message_reads;

CREATE POLICY "Chat reads self read"
ON public.chat_message_reads
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.chat_messages m
    WHERE m.id = message_id
      AND public.chat_is_participant(m.conversation_id, auth.uid())
  )
);

CREATE POLICY "Chat reads self write"
ON public.chat_message_reads
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Chat reads self update"
ON public.chat_message_reads
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------
-- 4) Block / report moderation
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_user_blocks_not_self_chk'
  ) THEN
    ALTER TABLE public.chat_user_blocks
      ADD CONSTRAINT chat_user_blocks_not_self_chk
      CHECK (blocker_id <> blocked_user_id);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS chat_user_blocks_unique_idx
  ON public.chat_user_blocks(blocker_id, blocked_user_id);

ALTER TABLE public.chat_user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_user_blocks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat blocks self read" ON public.chat_user_blocks;
DROP POLICY IF EXISTS "Chat blocks self write" ON public.chat_user_blocks;

CREATE POLICY "Chat blocks self read"
ON public.chat_user_blocks
FOR SELECT
TO authenticated
USING (public.is_admin() OR blocker_id = auth.uid() OR blocked_user_id = auth.uid());

CREATE POLICY "Chat blocks self write"
ON public.chat_user_blocks
FOR ALL
TO authenticated
USING (public.is_admin() OR blocker_id = auth.uid())
WITH CHECK (public.is_admin() OR blocker_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.chat_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  resolved_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_message_reports_unique_idx
  ON public.chat_message_reports(message_id, reporter_id);

CREATE INDEX IF NOT EXISTS chat_message_reports_created_idx
  ON public.chat_message_reports(created_at DESC);

ALTER TABLE public.chat_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat reports admin read" ON public.chat_message_reports;
DROP POLICY IF EXISTS "Chat reports self insert" ON public.chat_message_reports;
DROP POLICY IF EXISTS "Chat reports admin update" ON public.chat_message_reports;

CREATE POLICY "Chat reports admin read"
ON public.chat_message_reports
FOR SELECT
TO authenticated
USING (public.is_admin() OR reporter_id = auth.uid());

CREATE POLICY "Chat reports self insert"
ON public.chat_message_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Chat reports admin update"
ON public.chat_message_reports
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 5) Convenience helpers
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.chat_mark_conversation_read(
  p_conversation_id uuid,
  p_user_id uuid DEFAULT auth.uid(),
  p_read_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_conversation_id IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.chat_is_participant(p_conversation_id, p_user_id) AND NOT public.is_admin() THEN
    RETURN;
  END IF;

  INSERT INTO public.chat_conversation_participants (
    conversation_id, user_id, last_read_at, updated_at
  ) VALUES (
    p_conversation_id,
    p_user_id,
    p_read_at,
    now()
  )
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    last_read_at = GREATEST(COALESCE(public.chat_conversation_participants.last_read_at, p_read_at), p_read_at),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_touch_conversation(
  p_conversation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_conversation_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.chat_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id
    AND (created_by = p_user_id OR public.is_admin());
END;
$$;

-- -----------------------------------------------------
-- 6) Realtime publication (best effort)
-- -----------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversation_participants;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reads;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_user_blocks;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reports;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

-- End of peer chat migration.
