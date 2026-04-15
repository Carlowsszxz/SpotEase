-- =====================================================
-- Fix/ensure resources.current_occupancy auto-updates
--
-- Symptom:
-- - ESP32 RPC returns 204 (insert succeeds)
-- - Dashboard does not reflect occupancy changes
--
-- Likely causes:
-- - Trigger trg_apply_occupancy_event_to_resource missing/outdated
-- - UPDATE on public.resources blocked by FORCE RLS during trigger execution
--
-- Fix:
-- - Recreate the trigger function with SECURITY DEFINER and row_security = off
-- - Drop + recreate the trigger on public.occupancy_events
-- =====================================================

-- Ensure column exists and is usable (safe/no-op if already correct)
ALTER TABLE IF EXISTS public.resources
  ADD COLUMN IF NOT EXISTS current_occupancy int;

UPDATE public.resources
SET current_occupancy = COALESCE(current_occupancy, 0)
WHERE current_occupancy IS NULL;

ALTER TABLE public.resources
  ALTER COLUMN current_occupancy SET DEFAULT 0;

ALTER TABLE public.resources
  ALTER COLUMN current_occupancy SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resources_current_occupancy_check'
  ) THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_current_occupancy_check CHECK (current_occupancy >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.apply_occupancy_event_to_resource()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  cap int;
BEGIN
  -- Clamp to [0, capacity]. If capacity is NULL for some reason, treat as "no clamp".
  SELECT capacity INTO cap FROM public.resources WHERE id = NEW.resource_id;

  UPDATE public.resources
  SET current_occupancy =
    CASE
      WHEN cap IS NULL THEN GREATEST(0, current_occupancy + NEW.occupancy_change)
      ELSE LEAST(cap, GREATEST(0, current_occupancy + NEW.occupancy_change))
    END
  WHERE id = NEW.resource_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_occupancy_event_to_resource ON public.occupancy_events;
CREATE TRIGGER trg_apply_occupancy_event_to_resource
AFTER INSERT ON public.occupancy_events
FOR EACH ROW
EXECUTE FUNCTION public.apply_occupancy_event_to_resource();
