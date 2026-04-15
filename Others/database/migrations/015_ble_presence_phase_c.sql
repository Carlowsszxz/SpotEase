-- Phase C: BLE Signal-Loss Tracking & Last-Seen Location
-- Adds close_reason attribution and last_seen_location capture for accountability/emergency response
-- Timeline: April 14, 2026

-- 1. Extend ble_presence_sessions with signal-loss metadata
ALTER TABLE ble_presence_sessions
ADD COLUMN IF NOT EXISTS close_reason VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_seen_location TEXT;

-- Add check constraint on close_reason (soft enum)
ALTER TABLE ble_presence_sessions
ADD CONSTRAINT check_close_reason CHECK (
  close_reason IS NULL OR close_reason IN ('ble_timeout', 'rfid_tap', 'manual')
);

-- 2. Update close_stale_ble_presence_sessions to capture last-seen details
CREATE OR REPLACE FUNCTION close_stale_ble_presence_sessions(
  timeout_minutes INT,
  now_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  user_id UUID,
  session_id UUID,
  last_signal_time TIMESTAMPTZ,
  last_seen_location TEXT,
  close_reason VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stale_session RECORD;
  v_last_event RECORD;
  v_resource_name TEXT;
BEGIN
  -- Find all active sessions that exceed timeout threshold
  FOR v_stale_session IN
    SELECT
      bps.id,
      bps.user_id,
      bps.last_signal_time,
      bps.resource_id
    FROM ble_presence_sessions bps
    WHERE bps.status = 'active'
      AND (now_time - bps.last_signal_time) > INTERVAL '1 minute' * timeout_minutes
  LOOP
    -- Look up resource name for last-seen-location
    SELECT r.name INTO v_resource_name
    FROM resources r
    WHERE r.id = v_stale_session.resource_id
    LIMIT 1;

    -- Mark session as closed with signal-loss attribution
    UPDATE ble_presence_sessions
    SET
      status = 'inactive',
      closed_at = now_time,
      close_reason = 'ble_timeout',
      last_seen_location = COALESCE(v_resource_name, 'Unknown Location'),
      updated_at = now_time
    WHERE id = v_stale_session.id;

    -- Return audit row for logging/accountability
    RETURN QUERY
    SELECT
      v_stale_session.user_id,
      v_stale_session.id,
      v_stale_session.last_signal_time,
      COALESCE(v_resource_name, 'Unknown Location'::TEXT),
      'ble_timeout'::VARCHAR(50);
  END LOOP;

  RETURN;
END;
$$;

-- 3. Helper function: mark session closed via manual intervention or RFID tap
CREATE OR REPLACE FUNCTION close_ble_presence_session(
  p_user_id UUID,
  p_reason VARCHAR(50),
  p_location TEXT DEFAULT NULL,
  p_now TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE ble_presence_sessions
  SET
    status = 'inactive',
    closed_at = p_now,
    close_reason = p_reason,
    last_seen_location = COALESCE(p_location, last_seen_location),
    updated_at = p_now
  WHERE user_id = p_user_id AND status = 'active'
  RETURNING id IS NOT NULL;
$$;

-- 4. Audit-log-compatible: capture BLE timeouts as "occupancy_updated" events
-- (This ensures accountability logs show why someone went from "present" to "left")
CREATE OR REPLACE FUNCTION audit_ble_timeout_on_close()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if transitioning from active→inactive with ble_timeout
  IF NEW.status = 'inactive' AND OLD.status = 'active' AND NEW.close_reason = 'ble_timeout' THEN
    INSERT INTO audit_logs (
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
        'signal_ended', NEW.last_signal_time,
        'closed_at', NEW.closed_at,
        'location', NEW.last_seen_location
      ),
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to ble_presence_sessions
DROP TRIGGER IF EXISTS trig_audit_ble_timeout ON ble_presence_sessions;
CREATE TRIGGER trig_audit_ble_timeout
AFTER UPDATE ON ble_presence_sessions
FOR EACH ROW
EXECUTE FUNCTION audit_ble_timeout_on_close();

-- 5. RLS Policy: allow session closing via close_reason
ALTER TABLE ble_presence_sessions
ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated admins can view all closed sessions with close_reason
CREATE POLICY "Admins can view closed ble sessions with close_reason"
  ON ble_presence_sessions
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM users WHERE role = 'admin')
    OR (auth.uid() = user_id)  -- Users can see own session history
  );

-- 6. Index for fast queries on closed sessions (supports last-seen reports)
CREATE INDEX IF NOT EXISTS idx_ble_sessions_closed_at
  ON ble_presence_sessions(closed_at DESC)
  WHERE status = 'inactive';

-- 7. Index for signal-loss accountability tracking
CREATE INDEX IF NOT EXISTS idx_ble_sessions_close_reason
  ON ble_presence_sessions(close_reason, created_at DESC)
  WHERE close_reason = 'ble_timeout';
