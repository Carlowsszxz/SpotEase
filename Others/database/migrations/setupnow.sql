-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL,
  user_id uuid,
  action character varying,
  resource_id uuid,
  timestamp timestamp without time zone,
  details jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ble_presence_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  sensor_id uuid,
  user_id uuid,
  device_hash text NOT NULL,
  rssi integer,
  confidence numeric,
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ble_presence_events_pkey PRIMARY KEY (id),
  CONSTRAINT ble_presence_events_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT ble_presence_events_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id),
  CONSTRAINT ble_presence_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ble_presence_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id uuid,
  sensor_id uuid,
  started_at timestamp with time zone NOT NULL,
  last_seen_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  source text NOT NULL DEFAULT 'ble'::text,
  close_reason text CHECK (close_reason IS NULL OR (close_reason = ANY (ARRAY['ble_timeout'::text, 'rfid_tap'::text, 'manual'::text]))),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_location text,
  CONSTRAINT ble_presence_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT ble_presence_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ble_presence_sessions_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT ble_presence_sessions_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id)
);
CREATE TABLE public.ble_scans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gateway_id text NOT NULL,
  scan_batch bigint NOT NULL,
  device_address text NOT NULL,
  device_name text,
  rssi integer NOT NULL,
  CONSTRAINT ble_scans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL CHECK (user_id IS NOT NULL),
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'moderator'::text, 'owner'::text])),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_at timestamp with time zone,
  muted_until timestamp with time zone,
  blocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chat_conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT chat_conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id)
);
CREATE TABLE public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.chat_message_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_message_reads_pkey PRIMARY KEY (id),
  CONSTRAINT chat_message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_message_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chat_message_reports_pkey PRIMARY KEY (id),
  CONSTRAINT chat_message_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_message_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  CONSTRAINT chat_message_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(TRIM(BOTH FROM body)) >= 1 AND char_length(TRIM(BOTH FROM body)) <= 2000),
  body_plain text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chat_user_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT chat_user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id),
  CONSTRAINT chat_user_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.occupancy_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL,
  sensor_id uuid NOT NULL,
  occupancy_change smallint NOT NULL CHECK (occupancy_change = ANY (ARRAY[1, '-1'::integer])),
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT occupancy_events_pkey PRIMARY KEY (id),
  CONSTRAINT occupancy_events_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT occupancy_events_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL,
  user_id uuid,
  resource_id uuid,
  reserved_from timestamp without time zone,
  reserved_until timestamp without time zone,
  status character varying,
  created_at timestamp without time zone,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.resource_usage_stats (
  id uuid NOT NULL,
  resource_id uuid,
  date date,
  total_reservations integer,
  avg_occupancy_duration double precision,
  peak_usage_time timestamp without time zone,
  CONSTRAINT resource_usage_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_type character varying,
  name text,
  location text,
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  current_occupancy integer NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT resources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rfid_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  tag_hash text NOT NULL,
  scanned_at timestamp without time zone NOT NULL DEFAULT now(),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  sensor_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  CONSTRAINT rfid_scans_pkey PRIMARY KEY (id),
  CONSTRAINT rfid_scans_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT rfid_scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT rfid_scans_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id)
);
CREATE TABLE public.schema_backup (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  backup_name text NOT NULL,
  backup_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  table_name text NOT NULL,
  schema_definition text NOT NULL,
  policies jsonb,
  indexes jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT schema_backup_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid,
  sensor_id uuid,
  triggered_at timestamp without time zone NOT NULL DEFAULT now(),
  event_type character varying NOT NULL,
  severity character varying NOT NULL DEFAULT 'medium'::character varying,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'ack'::character varying, 'resolved'::character varying]::text[])),
  details jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp without time zone,
  resolved_at timestamp without time zone,
  CONSTRAINT security_events_pkey PRIMARY KEY (id),
  CONSTRAINT security_events_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT security_events_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id)
);
CREATE TABLE public.sensor_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sensor_id uuid NOT NULL,
  reading_time timestamp with time zone NOT NULL DEFAULT now(),
  value numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT sensor_readings_pkey PRIMARY KEY (id),
  CONSTRAINT sensor_readings_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.sensors(id)
);
CREATE TABLE public.sensors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL,
  sensor_identifier text NOT NULL UNIQUE,
  sensor_type character varying,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['entry'::text, 'exit'::text, 'presence'::text, 'other'::text])),
  ingest_secret_hash text NOT NULL,
  installed_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'active'::character varying,
  CONSTRAINT sensors_pkey PRIMARY KEY (id),
  CONSTRAINT sensors_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id)
);
CREATE TABLE public.user_ble_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_identifier text NOT NULL,
  device_identifier_norm text DEFAULT upper(regexp_replace(device_identifier, '\\s+'::text, ''::text, 'g'::text)) CHECK (length(device_identifier_norm) > 0),
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone,
  CONSTRAINT user_ble_devices_pkey PRIMARY KEY (id),
  CONSTRAINT user_ble_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_rfid_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag_uid text NOT NULL,
  tag_uid_norm text DEFAULT upper(regexp_replace(tag_uid, '\\s+'::text, ''::text, 'g'::text)) CHECK (tag_uid_norm ~ '^[0-9A-F]+$'::text),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone,
  tag_name text,
  CONSTRAINT user_rfid_tags_pkey PRIMARY KEY (id),
  CONSTRAINT user_rfid_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  email text UNIQUE,
  role character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);