-- =====================================================
-- RFID Log + Secure Ingest RPC
--
-- Ensures an RFID scan log table exists and adds an RPC that ESP32
-- can call safely (similar to ingest_occupancy_change).
--
-- Prereqs:
-- - sensors.ingest_secret_hash exists (created by 004_esp32_occupancy_upgrade.sql)
-- - pgcrypto extension available (for digest)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure table exists (if 005 already ran, this is a no-op)
CREATE TABLE IF NOT EXISTS public.rfid_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id),
  tag_hash text NOT NULL,
  scanned_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Optional extra metadata (safe to add later)
ALTER TABLE public.rfid_scans
  ADD COLUMN IF NOT EXISTS sensor_id uuid REFERENCES public.sensors(id);

ALTER TABLE public.rfid_scans
  ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE public.rfid_scans
  ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

UPDATE public.rfid_scans
SET payload = COALESCE(payload, '{}'::jsonb)
WHERE payload IS NULL;

CREATE INDEX IF NOT EXISTS rfid_scans_resource_id_scanned_at_idx
  ON public.rfid_scans(resource_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS rfid_scans_sensor_id_scanned_at_idx
  ON public.rfid_scans(sensor_id, scanned_at DESC);

ALTER TABLE public.rfid_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_scans FORCE ROW LEVEL SECURITY;

-- Admin-only access (consistent with other admin-only tables)
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

-- RPC: secure RFID ingestion (ESP32 should call this)
-- Creates a stable pseudonymous tag hash (sha256(uid)) rather than storing raw UID.
CREATE OR REPLACE FUNCTION public.ingest_rfid_scan(
  p_sensor_identifier text,
  p_secret text,
  p_tag_uid text,
  p_scanned_at timestamptz DEFAULT now(),
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_sensor_id uuid;
  v_resource_id uuid;
  v_hash text;
  v_tag_hash text;
BEGIN
  IF p_tag_uid IS NULL OR btrim(p_tag_uid) = '' THEN
    RAISE EXCEPTION 'tag uid is required';
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

  -- Stable pseudonymous token (no raw UID stored)
  v_tag_hash := encode(digest(p_tag_uid, 'sha256'), 'hex');

  INSERT INTO public.rfid_scans(resource_id, sensor_id, tag_hash, scanned_at, payload)
  VALUES (v_resource_id, v_sensor_id, v_tag_hash, p_scanned_at, COALESCE(p_payload, '{}'::jsonb));

  -- Optional: also add to sensor_readings for unified telemetry
  IF to_regclass('public.sensor_readings') IS NOT NULL THEN
    INSERT INTO public.sensor_readings(sensor_id, reading_time, value, payload)
    VALUES (
      v_sensor_id,
      p_scanned_at,
      NULL,
      jsonb_build_object('rfid_scan', true, 'tag_hash', v_tag_hash) || COALESCE(p_payload, '{}'::jsonb)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_rfid_scan(text, text, text, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_rfid_scan(text, text, text, timestamptz, jsonb)
TO anon, authenticated;
