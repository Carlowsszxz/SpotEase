-- =====================================================
-- Phase B: BLE presence ingestion + active sessions
--
-- Goals:
-- - Ingest BLE sightings from trusted gateways/sensors
-- - Resolve sighting -> user identity (best effort)
-- - Maintain active presence sessions per user
-- - Provide timeout/close function for signal loss handling
--
-- Notes:
-- - This migration is additive and safe for RFID-only deployments.
-- - Frontend can read active sessions if policies permit.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------
-- 1) BLE user device registry
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ble_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_identifier text NOT NULL,
  device_identifier_norm text GENERATED ALWAYS AS (
    upper(regexp_replace(device_identifier, '\\s+', '', 'g'))
  ) STORED,
  label text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_ble_devices_identifier_not_blank_chk'
  ) THEN
    ALTER TABLE public.user_ble_devices
      ADD CONSTRAINT user_ble_devices_identifier_not_blank_chk
      CHECK (length(device_identifier_norm) > 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_ble_devices_identifier_norm_uniq
  ON public.user_ble_devices(device_identifier_norm);

CREATE INDEX IF NOT EXISTS user_ble_devices_user_id_idx
  ON public.user_ble_devices(user_id);

ALTER TABLE public.user_ble_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ble_devices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BLE devices self read" ON public.user_ble_devices;
DROP POLICY IF EXISTS "BLE devices admin insert" ON public.user_ble_devices;
DROP POLICY IF EXISTS "BLE devices admin update" ON public.user_ble_devices;
DROP POLICY IF EXISTS "BLE devices admin delete" ON public.user_ble_devices;

CREATE POLICY "BLE devices self read"
ON public.user_ble_devices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "BLE devices admin insert"
ON public.user_ble_devices
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "BLE devices admin update"
ON public.user_ble_devices
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "BLE devices admin delete"
ON public.user_ble_devices
FOR DELETE
TO authenticated
USING (public.is_admin());

-- -----------------------------------------------------
-- 2) Raw BLE sightings log
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ble_presence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NULL REFERENCES public.resources(id) ON DELETE SET NULL,
  sensor_id uuid NULL REFERENCES public.sensors(id) ON DELETE SET NULL,
  user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  device_hash text NOT NULL,
  rssi int NULL,
  confidence numeric(5,2) NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ble_presence_events_user_detected_idx
  ON public.ble_presence_events(user_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS ble_presence_events_resource_detected_idx
  ON public.ble_presence_events(resource_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS ble_presence_events_sensor_detected_idx
  ON public.ble_presence_events(sensor_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS ble_presence_events_device_detected_idx
  ON public.ble_presence_events(device_hash, detected_at DESC);

ALTER TABLE public.ble_presence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ble_presence_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BLE events admin read" ON public.ble_presence_events;
DROP POLICY IF EXISTS "BLE events self read" ON public.ble_presence_events;
DROP POLICY IF EXISTS "BLE events admin write" ON public.ble_presence_events;

CREATE POLICY "BLE events admin read"
ON public.ble_presence_events
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "BLE events self read"
ON public.ble_presence_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "BLE events admin write"
ON public.ble_presence_events
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 3) Active BLE presence sessions (one per user)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ble_presence_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_id uuid NULL REFERENCES public.resources(id) ON DELETE SET NULL,
  sensor_id uuid NULL REFERENCES public.sensors(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  ended_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'ble',
  close_reason text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ble_presence_sessions_status_chk'
  ) THEN
    ALTER TABLE public.ble_presence_sessions
      ADD CONSTRAINT ble_presence_sessions_status_chk
      CHECK (status IN ('active','inactive'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ble_presence_sessions_active_user_uniq
  ON public.ble_presence_sessions(user_id)
  WHERE status = 'active' AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS ble_presence_sessions_active_last_seen_idx
  ON public.ble_presence_sessions(status, last_seen_at DESC);

ALTER TABLE public.ble_presence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ble_presence_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BLE sessions admin read" ON public.ble_presence_sessions;
DROP POLICY IF EXISTS "BLE sessions self read" ON public.ble_presence_sessions;
DROP POLICY IF EXISTS "BLE sessions admin write" ON public.ble_presence_sessions;

CREATE POLICY "BLE sessions admin read"
ON public.ble_presence_sessions
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "BLE sessions self read"
ON public.ble_presence_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "BLE sessions admin write"
ON public.ble_presence_sessions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 4) Helper: upsert active BLE session
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_ble_presence_session(
  p_user_id uuid,
  p_resource_id uuid,
  p_sensor_id uuid,
  p_detected_at timestamptz,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id
    INTO v_existing_id
  FROM public.ble_presence_sessions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND ended_at IS NULL
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    INSERT INTO public.ble_presence_sessions(
      user_id, resource_id, sensor_id, started_at, last_seen_at, status, source, payload, updated_at
    ) VALUES (
      p_user_id,
      p_resource_id,
      p_sensor_id,
      COALESCE(p_detected_at, now()),
      COALESCE(p_detected_at, now()),
      'active',
      'ble',
      COALESCE(p_payload, '{}'::jsonb),
      now()
    );
  ELSE
    UPDATE public.ble_presence_sessions
    SET
      resource_id = COALESCE(p_resource_id, resource_id),
      sensor_id = COALESCE(p_sensor_id, sensor_id),
      last_seen_at = GREATEST(last_seen_at, COALESCE(p_detected_at, now())),
      updated_at = now(),
      payload = COALESCE(payload, '{}'::jsonb) || COALESCE(p_payload, '{}'::jsonb)
    WHERE id = v_existing_id;
  END IF;
END;
$$;

-- -----------------------------------------------------
-- 5) Ingest BLE sighting from trusted sensor
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.ingest_ble_presence_event(
  p_sensor_identifier text,
  p_secret text,
  p_device_identifier text,
  p_rssi int DEFAULT NULL,
  p_detected_at timestamptz DEFAULT now(),
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
  v_dev_norm text;
  v_dev_hash text;
  v_user_id uuid;
  v_confidence numeric(5,2);
BEGIN
  IF p_device_identifier IS NULL OR btrim(p_device_identifier) = '' THEN
    RAISE EXCEPTION 'device identifier is required';
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

  v_dev_norm := upper(regexp_replace(p_device_identifier, '\\s+', '', 'g'));
  v_dev_hash := encode(digest(v_dev_norm, 'sha256'), 'hex');

  SELECT user_id
    INTO v_user_id
  FROM public.user_ble_devices
  WHERE device_identifier_norm = v_dev_norm
    AND is_active = true
  LIMIT 1;

  v_confidence := CASE
    WHEN p_rssi IS NULL THEN NULL
    WHEN p_rssi >= -65 THEN 0.95
    WHEN p_rssi >= -75 THEN 0.80
    WHEN p_rssi >= -85 THEN 0.60
    ELSE 0.40
  END;

  INSERT INTO public.ble_presence_events(
    resource_id, sensor_id, user_id, device_hash, rssi, confidence, detected_at, payload
  ) VALUES (
    v_resource_id,
    v_sensor_id,
    v_user_id,
    v_dev_hash,
    p_rssi,
    v_confidence,
    COALESCE(p_detected_at, now()),
    COALESCE(p_payload, '{}'::jsonb)
  );

  IF v_user_id IS NOT NULL THEN
    UPDATE public.user_ble_devices
    SET last_seen_at = COALESCE(p_detected_at, now()),
        updated_at = now()
    WHERE device_identifier_norm = v_dev_norm;

    PERFORM public.upsert_ble_presence_session(
      v_user_id,
      v_resource_id,
      v_sensor_id,
      COALESCE(p_detected_at, now()),
      jsonb_build_object('rssi', p_rssi, 'confidence', v_confidence)
        || COALESCE(p_payload, '{}'::jsonb)
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_ble_presence_session(uuid, uuid, uuid, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_ble_presence_session(uuid, uuid, uuid, timestamptz, jsonb)
TO authenticated;

REVOKE ALL ON FUNCTION public.ingest_ble_presence_event(text, text, text, int, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_ble_presence_event(text, text, text, int, timestamptz, jsonb)
TO anon, authenticated;

-- -----------------------------------------------------
-- 6) Timeout/close stale BLE sessions
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_stale_ble_presence_sessions(
  p_timeout_minutes int DEFAULT 5,
  p_now timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.ble_presence_sessions
  SET
    status = 'inactive',
    ended_at = COALESCE(p_now, now()),
    close_reason = COALESCE(close_reason, 'ble_timeout'),
    updated_at = now()
  WHERE status = 'active'
    AND ended_at IS NULL
    AND last_seen_at < (COALESCE(p_now, now()) - make_interval(mins => GREATEST(1, p_timeout_minutes)));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.close_stale_ble_presence_sessions(int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_stale_ble_presence_sessions(int, timestamptz)
TO authenticated;
