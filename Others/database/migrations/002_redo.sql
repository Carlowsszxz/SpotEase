-- ...existing code...

-- =====================================================
-- Extensions (needed for crypt()/gen_salt())
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABLES (changes: defaults + occupancy state + sensor secret)
-- =====================================================

-- USERS stays as-is (but consider defaults elsewhere)

-- Replace your resources table with this (adds current_occupancy + safer defaults)
DROP TABLE IF EXISTS public.resources CASCADE;
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type varchar,
  name text,
  location text,
  capacity int NOT NULL DEFAULT 1 CHECK (capacity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  current_occupancy int NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Replace sensors table with this (adds direction + secret hash + identifier uniqueness)
DROP TABLE IF EXISTS public.sensors CASCADE;
CREATE TABLE public.sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  sensor_identifier text NOT NULL UNIQUE,          -- e.g. "doorA_entry", "doorA_exit"
  sensor_type varchar,                             -- e.g. "ultrasonic"
  direction text NOT NULL CHECK (direction IN ('entry', 'exit', 'presence', 'other')),
  ingest_secret_hash text NOT NULL,                -- crypt() hash of a shared secret
  installed_at timestamptz,
  status varchar NOT NULL DEFAULT 'active'
);

-- Replace occupancy_events with defaults + payload
DROP TABLE IF EXISTS public.occupancy_events CASCADE;
CREATE TABLE public.occupancy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  sensor_id uuid NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  occupancy_change smallint NOT NULL CHECK (occupancy_change IN (1, -1)),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX occupancy_events_resource_id_recorded_at_idx
  ON public.occupancy_events(resource_id, recorded_at);
CREATE INDEX occupancy_events_sensor_id_recorded_at_idx
  ON public.occupancy_events(sensor_id, recorded_at);

-- (Optional) keep sensor_readings, but give it defaults too
DROP TABLE IF EXISTS public.sensor_readings CASCADE;
CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id uuid NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  reading_time timestamptz NOT NULL DEFAULT now(),
  value numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX sensor_readings_sensor_id_idx ON public.sensor_readings(sensor_id);
CREATE INDEX sensor_readings_reading_time_idx ON public.sensor_readings(reading_time);

-- ...existing code...
-- (keep your other tables: reservations, audit_logs, resource_usage_stats, users)
-- ...existing code...


-- =====================================================
-- OCCUPANCY STATE: auto-maintain resources.current_occupancy
-- =====================================================
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


-- =====================================================
-- SECURE INGESTION RPC (ESP32 calls this; no direct table INSERT needed)
-- =====================================================
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

  IF extensions.crypt(p_secret, v_hash) <> v_hash THEN
    RAISE EXCEPTION 'Invalid sensor secret';
  END IF;

  INSERT INTO public.occupancy_events(resource_id, sensor_id, occupancy_change, recorded_at, payload)
  VALUES (v_resource_id, v_sensor_id, p_change, p_recorded_at, COALESCE(p_payload, '{}'::jsonb));

  -- Optional: also store a reading row for debugging/telemetry
  INSERT INTO public.sensor_readings(sensor_id, reading_time, value, payload)
  VALUES (
    v_sensor_id,
    p_recorded_at,
    NULL,
    jsonb_build_object('occupancy_change', p_change) || COALESCE(p_payload, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_occupancy_change(text, text, smallint, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_occupancy_change(text, text, smallint, timestamptz, jsonb)
TO anon, authenticated;


-- =====================================================
-- RLS: keep your admin-only table policies
-- (ESP32 writes via the RPC above, not direct INSERT)
-- =====================================================

-- ...existing code...
-- Keep your existing RLS + GRANTS sections (but do NOT grant INSERT on occupancy_events to anon)
-- ...existing code...