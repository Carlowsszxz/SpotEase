-- =====================================================
-- Phase C: BLE signal-loss tracking and accountability
--
-- Goals:
-- - Record last-seen location when BLE session times out
-- - Provide a table-returning timeout closure function for schedulers
-- - Emit audit log entries for emergency/accountability views
-- - Keep compatibility with Phase B schema (last_seen_at / ended_at)
-- =====================================================

-- -----------------------------------------------------
-- 1) Extend ble_presence_sessions metadata (idempotent)
-- -----------------------------------------------------
ALTER TABLE public.ble_presence_sessions
ADD COLUMN IF NOT EXISTS close_reason text,
ADD COLUMN IF NOT EXISTS last_seen_location text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ble_presence_sessions_close_reason_chk'
  ) THEN
    ALTER TABLE public.ble_presence_sessions
      ADD CONSTRAINT ble_presence_sessions_close_reason_chk
      CHECK (close_reason IS NULL OR close_reason IN ('ble_timeout', 'rfid_tap', 'manual'));
  END IF;
END;
$$;

-- -----------------------------------------------------
-- 2) Timeout closure function (table-returning)
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS public.close_stale_ble_presence_sessions(int, timestamptz);

CREATE FUNCTION public.close_stale_ble_presence_sessions(
  timeout_minutes int,
  now_time timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  user_id uuid,
  session_id uuid,
  last_signal_time timestamptz,
  last_seen_location text,
  close_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_timeout_minutes int := GREATEST(COALESCE(timeout_minutes, 5), 1);
  v_now timestamptz := COALESCE(now_time, now());
BEGIN
  RETURN QUERY
  WITH stale AS (
    SELECT
      bps.id,
      bps.user_id,
      bps.last_seen_at,
      bps.resource_id,
      COALESCE(NULLIF(trim(r.name), ''), 'Unknown Location') AS resolved_location
    FROM public.ble_presence_sessions bps
    LEFT JOIN public.resources r ON r.id = bps.resource_id
    WHERE bps.status = 'active'
      AND bps.ended_at IS NULL
      AND bps.last_seen_at < (v_now - make_interval(mins => v_timeout_minutes))
    FOR UPDATE
  ), closed AS (
    UPDATE public.ble_presence_sessions bps
    SET
      status = 'inactive',
      ended_at = v_now,
      close_reason = 'ble_timeout',
      last_seen_location = stale.resolved_location,
      updated_at = now()
    FROM stale
    WHERE bps.id = stale.id
    RETURNING
      bps.user_id,
      bps.id AS session_id,
      bps.last_seen_at AS last_signal_time,
      bps.last_seen_location,
      bps.close_reason
  )
  SELECT
    closed.user_id,
    closed.session_id,
    closed.last_signal_time,
    closed.last_seen_location,
    closed.close_reason
  FROM closed;
END;
$$;

REVOKE ALL ON FUNCTION public.close_stale_ble_presence_sessions(int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_stale_ble_presence_sessions(int, timestamptz)
TO authenticated;

-- -----------------------------------------------------
-- 3) Manual/RFID close helper
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_ble_presence_session(
  p_user_id uuid,
  p_reason text,
  p_location text DEFAULT NULL,
  p_now timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_rowcount int := 0;
  v_reason text := lower(COALESCE(trim(p_reason), 'manual'));
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_reason NOT IN ('ble_timeout', 'rfid_tap', 'manual') THEN
    v_reason := 'manual';
  END IF;

  UPDATE public.ble_presence_sessions
  SET
    status = 'inactive',
    ended_at = COALESCE(p_now, now()),
    close_reason = v_reason,
    last_seen_location = COALESCE(NULLIF(trim(p_location), ''), last_seen_location),
    updated_at = now()
  WHERE user_id = p_user_id
    AND status = 'active'
    AND ended_at IS NULL;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  RETURN v_rowcount > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.close_ble_presence_session(uuid, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_ble_presence_session(uuid, text, text, timestamptz)
TO authenticated;

-- -----------------------------------------------------
-- 4) Audit timeout close transitions
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_ble_timeout_on_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
BEGIN
  IF NEW.status = 'inactive'
     AND OLD.status = 'active'
     AND COALESCE(NEW.close_reason, '') = 'ble_timeout' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      description,
      resource_id,
      details,
      created_at
    )
    VALUES (
      NEW.user_id,
      'occupancy_updated',
      'BLE signal lost',
      NEW.resource_id,
      jsonb_build_object(
        'reason', 'ble_timeout',
        'signal_ended', NEW.last_seen_at,
        'closed_at', NEW.ended_at,
        'location', COALESCE(NEW.last_seen_location, 'Unknown')
      ),
      COALESCE(NEW.ended_at, now())
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_audit_ble_timeout ON public.ble_presence_sessions;
CREATE TRIGGER trig_audit_ble_timeout
AFTER UPDATE ON public.ble_presence_sessions
FOR EACH ROW
EXECUTE FUNCTION public.audit_ble_timeout_on_close();

-- -----------------------------------------------------
-- 5) Policies and indexes for accountability querying
-- -----------------------------------------------------
ALTER TABLE public.ble_presence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ble_presence_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view closed ble sessions with close_reason" ON public.ble_presence_sessions;
CREATE POLICY "Admins can view closed ble sessions with close_reason"
  ON public.ble_presence_sessions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
  );

CREATE INDEX IF NOT EXISTS idx_ble_sessions_ended_at
  ON public.ble_presence_sessions(ended_at DESC)
  WHERE status = 'inactive';

CREATE INDEX IF NOT EXISTS idx_ble_sessions_close_reason_updated_at
  ON public.ble_presence_sessions(close_reason, updated_at DESC)
  WHERE close_reason = 'ble_timeout';
