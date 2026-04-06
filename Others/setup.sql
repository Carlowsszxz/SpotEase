-- =====================================================
-- FULL RESET SCHEMA + POLICIES
-- Safe to re-run: drops existing tables first, then recreates everything.
-- =====================================================

DROP TABLE IF EXISTS public.sensor_readings CASCADE;
DROP TABLE IF EXISTS public.resource_usage_stats CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.occupancy_events CASCADE;
DROP TABLE IF EXISTS public.sensors CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  name text,
  email text UNIQUE,
  role varchar,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE public.resources (
  id uuid PRIMARY KEY,
  resource_type varchar,
  name text,
  location text,
  capacity int DEFAULT 1,
  is_active boolean,
  created_at timestamp
);

CREATE TABLE public.sensors (
  id uuid PRIMARY KEY,
  resource_id uuid REFERENCES public.resources(id),
  sensor_identifier text,
  sensor_type varchar,
  installed_at timestamp,
  status varchar
);

CREATE TABLE public.occupancy_events (
  id uuid PRIMARY KEY,
  resource_id uuid REFERENCES public.resources(id),
  sensor_id uuid REFERENCES public.sensors(id),
  occupancy_change smallint NOT NULL CHECK (occupancy_change IN (1, -1)),
  recorded_at timestamp
);

CREATE INDEX occupancy_events_resource_id_recorded_at_idx ON public.occupancy_events(resource_id, recorded_at);
CREATE INDEX occupancy_events_sensor_id_recorded_at_idx ON public.occupancy_events(sensor_id, recorded_at);

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  resource_id uuid REFERENCES public.resources(id),
  reserved_from timestamp,
  reserved_until timestamp,
  status varchar,
  created_at timestamp
);

CREATE INDEX reservations_user_id_idx ON public.reservations(user_id);
CREATE INDEX reservations_resource_id_idx ON public.reservations(resource_id);
CREATE INDEX reservations_reserved_from_until_idx ON public.reservations(reserved_from, reserved_until);
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX idx_reservations_resource_id ON public.reservations(resource_id);
CREATE INDEX idx_reservations_reserved_from_until ON public.reservations(reserved_from, reserved_until);
CREATE INDEX idx_reservations_status ON public.reservations(status);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  action varchar,
  resource_id uuid REFERENCES public.resources(id),
  timestamp timestamp,
  details jsonb
);

CREATE INDEX audit_logs_user_id_timestamp_idx ON public.audit_logs(user_id, timestamp);
CREATE INDEX audit_logs_resource_id_timestamp_idx ON public.audit_logs(resource_id, timestamp);
CREATE INDEX audit_logs_action_timestamp_idx ON public.audit_logs(action, timestamp);

CREATE TABLE public.resource_usage_stats (
  id uuid PRIMARY KEY,
  resource_id uuid REFERENCES public.resources(id),
  date date,
  total_reservations int,
  avg_occupancy_duration float,
  peak_usage_time timestamp
);

CREATE INDEX resource_usage_stats_resource_id_date_idx ON public.resource_usage_stats(resource_id, date);

CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY,
  sensor_id uuid REFERENCES public.sensors(id),
  reading_time timestamp,
  value numeric,
  payload jsonb
);

CREATE INDEX sensor_readings_sensor_id_idx ON public.sensor_readings(sensor_id);
CREATE INDEX sensor_readings_reading_time_idx ON public.sensor_readings(reading_time);
CREATE INDEX idx_users_id ON public.users(id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_resources_is_active ON public.resources(is_active);
CREATE INDEX idx_resources_type_location ON public.resources(resource_type, location);

-- =====================================================
-- AUTH -> PUBLIC USERS SYNC
-- Ensures RLS policies that depend on public.users work immediately after signup.
-- Creates/updates a public.users row whenever a new auth.users row is created.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'user', now(), now())
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage_stats FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings FORCE ROW LEVEL SECURITY;

-- USERS: users manage their own profile; admins can manage all users.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own row"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- RESOURCES: authenticated users can read; admins can write.
DROP POLICY IF EXISTS "Resource read access" ON public.resources;
DROP POLICY IF EXISTS "Resource admin write access" ON public.resources;
DROP POLICY IF EXISTS "Resource admin delete access" ON public.resources;
DROP POLICY IF EXISTS "Resource admin insert access" ON public.resources;

CREATE POLICY "Resource read access"
ON public.resources
FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Resource admin write access"
ON public.resources
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Resource admin delete access"
ON public.resources
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Resource admin insert access"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Resource dashboard read access" ON public.resources;

CREATE POLICY "Resource dashboard read access"
ON public.resources
FOR SELECT
TO anon
USING (true);

-- SENSORS: admin only.
DROP POLICY IF EXISTS "Sensors admin read access" ON public.sensors;
DROP POLICY IF EXISTS "Sensors admin write access" ON public.sensors;
DROP POLICY IF EXISTS "Sensors admin delete access" ON public.sensors;

CREATE POLICY "Sensors admin read access"
ON public.sensors
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Sensors admin write access"
ON public.sensors
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Sensors admin update access"
ON public.sensors
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Sensors admin delete access"
ON public.sensors
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Sensors dashboard read access" ON public.sensors;

CREATE POLICY "Sensors dashboard read access"
ON public.sensors
FOR SELECT
TO anon
USING (true);

-- OCCUPANCY EVENTS: admin only.
DROP POLICY IF EXISTS "Occupancy admin read access" ON public.occupancy_events;
DROP POLICY IF EXISTS "Occupancy admin write access" ON public.occupancy_events;
DROP POLICY IF EXISTS "Occupancy admin delete access" ON public.occupancy_events;

CREATE POLICY "Occupancy admin read access"
ON public.occupancy_events
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Occupancy admin write access"
ON public.occupancy_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Occupancy admin update access"
ON public.occupancy_events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Occupancy admin delete access"
ON public.occupancy_events
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Occupancy dashboard read access" ON public.occupancy_events;

CREATE POLICY "Occupancy dashboard read access"
ON public.occupancy_events
FOR SELECT
TO anon
USING (true);

-- RESERVATIONS: users can manage own reservations; admins can manage all.
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;

CREATE POLICY "Users can view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update own reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'confirmed')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'confirmed', 'cancelled')
);

CREATE POLICY "Users can delete own reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR public.is_admin()
);

CREATE POLICY "Admins can manage all reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Reservations dashboard read access" ON public.reservations;

CREATE POLICY "Reservations dashboard read access"
ON public.reservations
FOR SELECT
TO anon
USING (true);

-- AUDIT LOGS: admin only.
DROP POLICY IF EXISTS "Audit admin read access" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit admin write access" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit admin update access" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit admin delete access" ON public.audit_logs;

CREATE POLICY "Audit admin read access"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Audit admin write access"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Audit admin update access"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Audit admin delete access"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.is_admin());

-- RESOURCE USAGE STATS: admin only.
DROP POLICY IF EXISTS "Stats admin read access" ON public.resource_usage_stats;
DROP POLICY IF EXISTS "Stats admin write access" ON public.resource_usage_stats;
DROP POLICY IF EXISTS "Stats admin update access" ON public.resource_usage_stats;
DROP POLICY IF EXISTS "Stats admin delete access" ON public.resource_usage_stats;

CREATE POLICY "Stats admin read access"
ON public.resource_usage_stats
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Stats admin write access"
ON public.resource_usage_stats
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Stats admin update access"
ON public.resource_usage_stats
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Stats admin delete access"
ON public.resource_usage_stats
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Stats dashboard read access" ON public.resource_usage_stats;

CREATE POLICY "Stats dashboard read access"
ON public.resource_usage_stats
FOR SELECT
TO anon
USING (true);

-- SENSOR READINGS: admin only.
DROP POLICY IF EXISTS "Sensor readings admin read access" ON public.sensor_readings;
DROP POLICY IF EXISTS "Sensor readings admin write access" ON public.sensor_readings;
DROP POLICY IF EXISTS "Sensor readings admin update access" ON public.sensor_readings;
DROP POLICY IF EXISTS "Sensor readings admin delete access" ON public.sensor_readings;

CREATE POLICY "Sensor readings admin read access"
ON public.sensor_readings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Sensor readings admin write access"
ON public.sensor_readings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Sensor readings admin update access"
ON public.sensor_readings
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Sensor readings admin delete access"
ON public.sensor_readings
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- GRANTS (PostgREST roles)
-- Policies (RLS) control *row access*, but roles also need table privileges.
-- The mobile app uses the anon key, so it runs as the `anon` role.
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Dashboard read-only access for the app.
GRANT SELECT ON TABLE
  public.resources,
  public.sensors,
  public.occupancy_events,
  public.reservations,
  public.resource_usage_stats
TO anon;

-- Typical authenticated app access (RLS still applies).
GRANT SELECT ON TABLE
  public.resources,
  public.sensors,
  public.occupancy_events,
  public.reservations,
  public.resource_usage_stats,
  public.users
TO authenticated;





