-- =====================================================
-- Fix after-hours helper signature mismatch
--
-- Problem:
-- - occupancy_events.recorded_at is timestamptz
-- - 005_after_hours_security.sql created public.is_after_hours(ts timestamp)
-- - Trigger calls public.is_after_hours(NEW.recorded_at) and fails with:
--     function public.is_after_hours(timestamp with time zone) does not exist
--
-- Fix:
-- - Provide an overload for timestamptz.
-- - Interpret the timestamptz in the database session timezone.
--   (If you want a specific local timezone, set the DB timezone accordingly.)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_after_hours(ts timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.is_after_hours((ts AT TIME ZONE current_setting('TimeZone'))::timestamp);
$$;

REVOKE ALL ON FUNCTION public.is_after_hours(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_after_hours(timestamptz) TO authenticated;
