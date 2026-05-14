-- Create a backup table to store schema and policies
CREATE TABLE IF NOT EXISTS public.schema_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  backup_date timestamp DEFAULT CURRENT_TIMESTAMP,
  table_name text NOT NULL,
  schema_definition text NOT NULL,
  policies jsonb,
  indexes jsonb,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Insert schema definitions
INSERT INTO public.schema_backup (backup_name, table_name, schema_definition, policies, indexes)
VALUES 
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'audit_logs',
    'create table public.audit_logs (
  id uuid not null,
  user_id uuid null,
  action character varying null,
  resource_id uuid null,
  timestamp timestamp without time zone null,
  details jsonb null,
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_resource_id_fkey foreign KEY (resource_id) references resources (id),
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'audit_logs' AND schemaname = 'public'
    ),
    jsonb_build_array(
      'audit_logs_user_id_timestamp_idx',
      'audit_logs_resource_id_timestamp_idx',
      'audit_logs_action_timestamp_idx'
    )
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'occupancy_events',
    'create table public.occupancy_events (
  id uuid not null,
  resource_id uuid null,
  sensor_id uuid null,
  occupancy_change smallint not null check (occupancy_change in (1, -1)),
  recorded_at timestamp without time zone null,
  constraint occupancy_events_pkey primary key (id),
  constraint occupancy_events_resource_id_fkey foreign KEY (resource_id) references resources (id),
  constraint occupancy_events_sensor_id_fkey foreign KEY (sensor_id) references sensors (id)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'occupancy_events' AND schemaname = 'public'
    ),
    jsonb_build_array(
      'occupancy_events_resource_id_recorded_at_idx',
      'occupancy_events_sensor_id_recorded_at_idx'
    )
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'reservations',
    'create table public.reservations (
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
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'reservations' AND schemaname = 'public'
    ),
    jsonb_build_array(
      'reservations_user_id_idx',
      'reservations_resource_id_idx',
      'reservations_reserved_from_until_idx',
      'idx_reservations_user_id',
      'idx_reservations_resource_id',
      'idx_reservations_reserved_from_until',
      'idx_reservations_status'
    )
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'resource_usage_stats',
    'create table public.resource_usage_stats (
  id uuid not null,
  resource_id uuid null,
  date date null,
  total_reservations integer null,
  avg_occupancy_duration double precision null,
  peak_usage_time timestamp without time zone null,
  constraint resource_usage_stats_pkey primary key (id),
  constraint resource_usage_stats_resource_id_fkey foreign KEY (resource_id) references resources (id)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'resource_usage_stats' AND schemaname = 'public'
    ),
    jsonb_build_array('resource_usage_stats_resource_id_date_idx')
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'sensor_readings',
    'create table public.sensor_readings (
  id uuid not null,
  sensor_id uuid null,
  reading_time timestamp without time zone null,
  value numeric null,
  payload jsonb null,
  constraint sensor_readings_pkey primary key (id),
  constraint sensor_readings_sensor_id_fkey foreign KEY (sensor_id) references sensors (id)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'sensor_readings' AND schemaname = 'public'
    ),
    jsonb_build_array(
      'sensor_readings_sensor_id_idx',
      'sensor_readings_reading_time_idx'
    )
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'sensors',
    'create table public.sensors (
  id uuid not null,
  resource_id uuid null,
  sensor_identifier text null,
  sensor_type character varying null,
  installed_at timestamp without time zone null,
  status character varying null,
  constraint sensors_pkey primary key (id),
  constraint sensors_resource_id_fkey foreign KEY (resource_id) references resources (id)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'sensors' AND schemaname = 'public'
    ),
    'null'::jsonb
  ),
  (
    'backup_' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS'),
    'users',
    'create table public.users (
  id uuid not null,
  name text null,
  email text null,
  role character varying null,
  created_at timestamp without time zone null,
  updated_at timestamp without time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'policy_name', policyname,
          'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
          'roles', roles,
          'using_clause', qual,
          'with_check_clause', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = 'users' AND schemaname = 'public'
    ),
    jsonb_build_array(
      'idx_users_id',
      'idx_users_role'
    )
  );

-- View all backups
SELECT * FROM public.schema_backup ORDER BY backup_date DESC;

-- View a specific backup
SELECT 
  backup_name,
  table_name,
  schema_definition,
  policies,
  backup_date
FROM public.schema_backup
WHERE backup_name = 'backup_2026_03_06_14_30_00'
ORDER BY table_name;