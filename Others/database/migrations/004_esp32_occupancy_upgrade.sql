-- =====================================================
-- ESP32 Occupancy Upgrade (non-destructive)
-- Adds: resources.current_occupancy, sensors direction+secret, occupancy_events payload,
--       trigger to maintain current occupancy, and RPC ingest_occupancy_change.
--
-- Run in Supabase SQL editor.
-- =====================================================

-- Needed for crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------
-- RESOURCES: add current occupancy
-- -----------------------------
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

-- Ensure capacity behaves well for clamping
ALTER TABLE public.resources
  ALTER COLUMN capacity SET DEFAULT 1;

UPDATE public.resources
SET capacity = 1
WHERE capacity IS NULL;

ALTER TABLE public.resources
  ALTER COLUMN capacity SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resources_capacity_check'
  ) THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_capacity_check CHECK (capacity >= 0);
  END IF;
END $$;

-- -----------------------------
-- SENSORS: add direction + ingest secret
-- -----------------------------
ALTER TABLE IF EXISTS public.sensors
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS ingest_secret_hash text;

UPDATE public.sensors
SET direction = COALESCE(direction, 'other')
WHERE direction IS NULL;

ALTER TABLE public.sensors
  ALTER COLUMN direction SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sensors_direction_check'
  ) THEN
    ALTER TABLE public.sensors
      ADD CONSTRAINT sensors_direction_check CHECK (direction IN ('entry','exit','presence','other'));
  END IF;
END $$;

-- NOTE: ingest_secret_hash must be populated for each sensor before ESP32 ingest works.
-- Example:
--   UPDATE public.sensors
--   SET ingest_secret_hash = extensions.crypt('MY_SENSOR_SECRET', extensions.gen_salt('bf'))
--   WHERE sensor_identifier = 'doorA_entry';

-- Keep sensor_identifier unique + not null
ALTER TABLE public.sensors
  ALTER COLUMN sensor_identifier SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sensors_sensor_identifier_key'
  ) THEN
    ALTER TABLE public.sensors
      ADD CONSTRAINT sensors_sensor_identifier_key UNIQUE (sensor_identifier);
  END IF;
END $$;

-- -----------------------------
-- OCCUPANCY EVENTS: defaults + payload
-- -----------------------------
ALTER TABLE IF EXISTS public.occupancy_events
  ADD COLUMN IF NOT EXISTS payload jsonb;

UPDATE public.occupancy_events
SET payload = COALESCE(payload, '{}'::jsonb)
WHERE payload IS NULL;

ALTER TABLE public.occupancy_events
  ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

ALTER TABLE public.occupancy_events
  ALTER COLUMN payload SET NOT NULL;

ALTER TABLE public.occupancy_events
  ALTER COLUMN recorded_at SET DEFAULT now();

-- -----------------------------
-- TRIGGER: maintain current_occupancy
-- -----------------------------
CREATE OR REPLACE FUNCTION public.apply_occupancy_event_to_resource()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap int;
BEGIN
  SELECT capacity INTO cap FROM public.resources WHERE id = NEW.resource_id;

  UPDATE public.resources
  SET current_occupancy =
    LEAST(
      cap,
      GREATEST(0, current_occupancy + NEW.occupancy_change)
    )
  WHERE id = NEW.resource_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_occupancy_event_to_resource ON public.occupancy_events;
CREATE TRIGGER trg_apply_occupancy_event_to_resource
AFTER INSERT ON public.occupancy_events
FOR EACH ROW
EXECUTE FUNCTION public.apply_occupancy_event_to_resource();

-- -----------------------------
-- RPC: secure sensor ingestion
-- -----------------------------
CREATE OR REPLACE FUNCTION public.ingest_occupancy_change(
  p_sensor_identifier text,
  p_secret text,
  p_change smallint,
  p_recorded_at timestamptz DEFAULT now(),
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sensor_id uuid;
  v_resource_id uuid;
  v_hash text;
BEGIN
  IF p_change NOT IN (1, -1) THEN
    RAISE EXCEPTION 'occupancy_change must be 1 or -1';
  END IF;

  SELECT id, resource_id, ingest_secret_hash
    INTO v_sensor_id, v_resource_id, v_hash
  FROM public.sensors
  WHERE sensor_identifier = p_sensor_identifier
    AND status = 'active';

  IF v_sensor_id IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive sensor_identifier';
  END IF;

  IF v_hash IS NULL OR v_hash = '' THEN
    RAISE EXCEPTION 'Sensor secret not set (ingest_secret_hash is null/empty)';
  END IF;

  IF extensions.crypt(p_secret, v_hash) <> v_hash THEN
    RAISE EXCEPTION 'Invalid sensor secret';
  END IF;

  INSERT INTO public.occupancy_events(resource_id, sensor_id, occupancy_change, recorded_at, payload)
  VALUES (v_resource_id, v_sensor_id, p_change, p_recorded_at, COALESCE(p_payload, '{}'::jsonb));

  -- Optional telemetry row
  IF to_regclass('public.sensor_readings') IS NOT NULL THEN
    INSERT INTO public.sensor_readings(sensor_id, reading_time, value, payload)
    VALUES (
      v_sensor_id,
      p_recorded_at,
      NULL,
      jsonb_build_object('occupancy_change', p_change) || COALESCE(p_payload, '{}'::jsonb)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_occupancy_change(text, text, smallint, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_occupancy_change(text, text, smallint, timestamptz, jsonb)
TO anon, authenticated;
