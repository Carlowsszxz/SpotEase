-- =====================================================
-- BACKUP CREATED: 2026-03-06
-- =====================================================

-- DROP TABLES IF THEY EXIST
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.occupancy_events CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.resource_usage_stats CASCADE;
DROP TABLE IF EXISTS public.sensor_readings CASCADE;
DROP TABLE IF EXISTS public.sensors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- CREATE TABLES
create table public.audit_logs (
  id uuid not null,
  user_id uuid null,
  action character varying null,
  resource_id uuid null,
  timestamp timestamp without time zone null,
  details jsonb null,
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_resource_id_fkey foreign KEY (resource_id) references resources (id),
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists audit_logs_user_id_timestamp_idx on public.audit_logs using btree (user_id, "timestamp") TABLESPACE pg_default;
create index IF not exists audit_logs_resource_id_timestamp_idx on public.audit_logs using btree (resource_id, "timestamp") TABLESPACE pg_default;
create index IF not exists audit_logs_action_timestamp_idx on public.audit_logs using btree (action, "timestamp") TABLESPACE pg_default;

create table public.occupancy_events (
  id uuid not null,
  resource_id uuid null,
  sensor_id uuid null,
  status character varying null,
  recorded_at timestamp without time zone null,
  constraint occupancy_events_pkey primary key (id),
  constraint occupancy_events_resource_id_fkey foreign KEY (resource_id) references resources (id),
  constraint occupancy_events_sensor_id_fkey foreign KEY (sensor_id) references sensors (id)
) TABLESPACE pg_default;

create index IF not exists occupancy_events_resource_id_recorded_at_idx on public.occupancy_events using btree (resource_id, recorded_at) TABLESPACE pg_default;
create index IF not exists occupancy_events_sensor_id_recorded_at_idx on public.occupancy_events using btree (sensor_id, recorded_at) TABLESPACE pg_default;

create table public.reservations (
  id uuid not null,
  user_id uuid null,
  resource_id uuid null,
  reserved_from timestamp without time zone null,
  reserved_until timestamp without time zone null,
  status character varying null,
  created_at timestamp without time zone null,
  constraint reservations_pkey primary key (id),
  constraint reservations_resource_id_fkey foreign KEY (resource_id) references resources (id),
  constraint reservations_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create index IF not exists reservations_user_id_idx on public.reservations using btree (user_id) TABLESPACE pg_default;
create index IF not exists reservations_resource_id_idx on public.reservations using btree (resource_id) TABLESPACE pg_default;
create index IF not exists reservations_reserved_from_until_idx on public.reservations using btree (reserved_from, reserved_until) TABLESPACE pg_default;
create index IF not exists idx_reservations_user_id on public.reservations using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_reservations_resource_id on public.reservations using btree (resource_id) TABLESPACE pg_default;
create index IF not exists idx_reservations_reserved_from_until on public.reservations using btree (reserved_from, reserved_until) TABLESPACE pg_default;
create index IF not exists idx_reservations_status on public.reservations using btree (status) TABLESPACE pg_default;

create table public.resource_usage_stats (
  id uuid not null,
  resource_id uuid null,
  date date null,
  total_reservations integer null,
  avg_occupancy_duration double precision null,
  peak_usage_time timestamp without time zone null,
  constraint resource_usage_stats_pkey primary key (id),
  constraint resource_usage_stats_resource_id_fkey foreign KEY (resource_id) references resources (id)
) TABLESPACE pg_default;

create index IF not exists resource_usage_stats_resource_id_date_idx on public.resource_usage_stats using btree (resource_id, date) TABLESPACE pg_default;

create table public.sensor_readings (
  id uuid not null,
  sensor_id uuid null,
  reading_time timestamp without time zone null,
  value numeric null,
  payload jsonb null,
  constraint sensor_readings_pkey primary key (id),
  constraint sensor_readings_sensor_id_fkey foreign KEY (sensor_id) references sensors (id)
) TABLESPACE pg_default;

create index IF not exists sensor_readings_sensor_id_idx on public.sensor_readings using btree (sensor_id) TABLESPACE pg_default;
create index IF not exists sensor_readings_reading_time_idx on public.sensor_readings using btree (reading_time) TABLESPACE pg_default;

create table public.sensors (
  id uuid not null,
  resource_id uuid null,
  sensor_identifier text null,
  sensor_type character varying null,
  installed_at timestamp without time zone null,
  status character varying null,
  constraint sensors_pkey primary key (id),
  constraint sensors_resource_id_fkey foreign KEY (resource_id) references resources (id)
) TABLESPACE pg_default;

create table public.users (
  id uuid not null,
  name text null,
  email text null,
  role character varying null,
  created_at timestamp without time zone null,
  updated_at timestamp without time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_users_id on public.users using btree (id) TABLESPACE pg_default;
create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

-- =====================================================
-- POLICIES
-- =====================================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can read their own row" ON public.users FOR SELECT TO public USING (auth.uid() = id);

CREATE POLICY "Users can insert their own row" ON public.users FOR INSERT TO public WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO public USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.users FOR DELETE TO public USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT TO public USING (auth.uid() IS NOT NULL);

-- RESERVATIONS TABLE POLICIES
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT TO public USING ((auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM users WHERE (users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))));

CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

CREATE POLICY "Users can update own reservations" ON public.reservations FOR UPDATE TO public USING ((auth.uid() = user_id) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'approved'::character varying])::text[]))) WITH CHECK ((auth.uid() = user_id) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'approved'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])));

CREATE POLICY "Users can delete own reservations" ON public.reservations FOR DELETE TO public USING (((auth.uid() = user_id) AND ((status)::text = 'pending'::text)) OR (EXISTS (SELECT 1 FROM users WHERE (users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))));

CREATE POLICY "Admins can manage all reservations" ON public.reservations FOR ALL TO public USING (EXISTS (SELECT 1 FROM users WHERE (users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE (users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)));