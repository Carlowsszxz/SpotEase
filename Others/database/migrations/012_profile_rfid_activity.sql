-- =====================================================
-- Link RFID scans to users + allow self-read
--
-- Enables Profile page to show:
-- - last tap
-- - recent taps
--
-- Approach:
-- - Add user_id to public.rfid_scans
-- - Update ingest_rfid_scan to look up assigned user via public.user_rfid_tags
-- - Add RLS policy: authenticated can SELECT their own scans
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.rfid_scans
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS rfid_scans_user_id_scanned_at_idx
  ON public.rfid_scans(user_id, scanned_at DESC);

-- Allow users to read their own scans
DROP POLICY IF EXISTS "RFID scans self read access" ON public.rfid_scans;
CREATE POLICY "RFID scans self read access"
ON public.rfid_scans
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Backfill user_id for existing scans when possible.
-- Uses hash(tag_uid_norm) to match tag_hash.
UPDATE public.rfid_scans s
SET user_id = t.user_id
FROM public.user_rfid_tags t
WHERE s.user_id IS NULL
  AND t.is_active = true
  AND s.tag_hash = encode(digest(t.tag_uid_norm, 'sha256'), 'hex');

-- Update ingest function to normalize UID, set user_id, and update last_seen_at
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
  v_uid_norm text;
  v_user_id uuid;
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

  -- Normalize UID: uppercase, remove whitespace
  v_uid_norm := upper(regexp_replace(p_tag_uid, '\\s+', '', 'g'));

  -- Stable pseudonymous token (no raw UID stored)
  v_tag_hash := encode(digest(v_uid_norm, 'sha256'), 'hex');

  -- If the UID is assigned to a user, attach user_id
  SELECT user_id
    INTO v_user_id
  FROM public.user_rfid_tags
  WHERE tag_uid_norm = v_uid_norm
    AND is_active = true
  LIMIT 1;

  INSERT INTO public.rfid_scans(resource_id, sensor_id, user_id, tag_hash, scanned_at, payload)
  VALUES (v_resource_id, v_sensor_id, v_user_id, v_tag_hash, p_scanned_at, COALESCE(p_payload, '{}'::jsonb));

  -- Track last seen for assigned tag
  UPDATE public.user_rfid_tags
  SET last_seen_at = p_scanned_at
  WHERE tag_uid_norm = v_uid_norm;

  -- Optional: also add to sensor_readings for unified telemetry
  IF to_regclass('public.sensor_readings') IS NOT NULL THEN
    INSERT INTO public.sensor_readings(sensor_id, reading_time, value, payload)
    VALUES (
      v_sensor_id,
      p_scanned_at,
      NULL,
      jsonb_build_object('rfid_scan', true, 'tag_hash', v_tag_hash, 'user_id', v_user_id) || COALESCE(p_payload, '{}'::jsonb)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_rfid_scan(text, text, text, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_rfid_scan(text, text, text, timestamptz, jsonb)
TO anon, authenticated;
