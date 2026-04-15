-- =====================================================
-- After-hours Security Events (MVP)
--
-- Creates:
-- - public.security_events: persistent after-hours alerts for admins
-- - public.rfid_scans: optional table for RFID scans (for correlation)
-- - public.is_after_hours(ts): helper for simple after-hours windows
-- - trigger on public.occupancy_events to auto-create security events
--
-- Notes:
-- - Uses timestamp without time zone, matching existing schema.
-- - After-hours window is fixed: >= 17:00 OR < 06:00 (based on recorded_at time).
-- - Trigger runs with row_security = off to avoid RLS blocking the insert.
-- =====================================================

-- Optional RFID scans table (future-proofing)
CREATE TABLE IF NOT EXISTS public.rfid_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id),
  tag_hash text NOT NULL,
  scanned_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfid_scans_resource_id_scanned_at_idx
  ON public.rfid_scans(resource_id, scanned_at DESC);

ALTER TABLE public.rfid_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_scans FORCE ROW LEVEL SECURITY;

-- Security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id),
  sensor_id uuid REFERENCES public.sensors(id),
  triggered_at timestamp NOT NULL DEFAULT now(),
  event_type varchar NOT NULL,
  severity varchar NOT NULL DEFAULT 'medium',
  status varchar NOT NULL DEFAULT 'open' CHECK (status IN ('open','ack','resolved')),
  details jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  acknowledged_at timestamp,
  resolved_at timestamp
);

CREATE INDEX IF NOT EXISTS security_events_status_triggered_at_idx
  ON public.security_events(status, triggered_at DESC);

CREATE INDEX IF NOT EXISTS security_events_resource_id_triggered_at_idx
  ON public.security_events(resource_id, triggered_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;

-- After-hours helper
CREATE OR REPLACE FUNCTION public.is_after_hours(ts timestamp)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (ts::time >= time '17:00') OR (ts::time < time '06:00');
$$;

REVOKE ALL ON FUNCTION public.is_after_hours(timestamp) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_after_hours(timestamp) TO authenticated;

-- RLS policies: admin only (same pattern as other admin-only tables)
DROP POLICY IF EXISTS "RFID scans admin read access" ON public.rfid_scans;
DROP POLICY IF EXISTS "RFID scans admin insert access" ON public.rfid_scans;
DROP POLICY IF EXISTS "RFID scans admin update access" ON public.rfid_scans;
DROP POLICY IF EXISTS "RFID scans admin delete access" ON public.rfid_scans;

CREATE POLICY "RFID scans admin read access"
ON public.rfid_scans
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "RFID scans admin insert access"
ON public.rfid_scans
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "RFID scans admin update access"
ON public.rfid_scans
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "RFID scans admin delete access"
ON public.rfid_scans
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Security events admin read access" ON public.security_events;
DROP POLICY IF EXISTS "Security events admin insert access" ON public.security_events;
DROP POLICY IF EXISTS "Security events admin update access" ON public.security_events;
DROP POLICY IF EXISTS "Security events admin delete access" ON public.security_events;

CREATE POLICY "Security events admin read access"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Security events admin insert access"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Security events admin update access"
ON public.security_events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Security events admin delete access"
ON public.security_events
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Trigger: create a security event when someone enters after-hours.
-- Uses a short dedupe window to avoid spam.
CREATE OR REPLACE FUNCTION public.handle_after_hours_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  recent_event_exists boolean;
  recent_scan_exists boolean;
BEGIN
  -- Only on "enter" events
  IF NEW.occupancy_change IS DISTINCT FROM 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.recorded_at IS NULL OR NEW.resource_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_after_hours(NEW.recorded_at) THEN
    RETURN NEW;
  END IF;

  -- Dedupe: if there is already an open/ack event for this resource recently, skip.
  SELECT EXISTS (
    SELECT 1
    FROM public.security_events se
    WHERE se.resource_id = NEW.resource_id
      AND se.status IN ('open','ack')
      AND se.triggered_at >= NEW.recorded_at - interval '10 minutes'
  ) INTO recent_event_exists;

  IF recent_event_exists THEN
    RETURN NEW;
  END IF;

  -- Correlate RFID (optional): any scan near the event time.
  SELECT EXISTS (
    SELECT 1
    FROM public.rfid_scans rs
    WHERE rs.resource_id = NEW.resource_id
      AND rs.scanned_at >= NEW.recorded_at - interval '2 minutes'
      AND rs.scanned_at <= NEW.recorded_at + interval '30 seconds'
  ) INTO recent_scan_exists;

  INSERT INTO public.security_events (
    resource_id,
    sensor_id,
    triggered_at,
    event_type,
    severity,
    status,
    details
  ) VALUES (
    NEW.resource_id,
    NEW.sensor_id,
    NEW.recorded_at,
    'after_hours_entry',
    'high',
    'open',
    jsonb_build_object(
      'source', 'occupancy_events',
      'occupancy_change', NEW.occupancy_change,
      'recent_rfid_scan', recent_scan_exists
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_occupancy_after_hours_security_event ON public.occupancy_events;
CREATE TRIGGER on_occupancy_after_hours_security_event
AFTER INSERT ON public.occupancy_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_after_hours_security_event();
