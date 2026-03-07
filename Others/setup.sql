-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role VARCHAR, -- 'student', 'faculty', 'admin'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  resource_type VARCHAR, -- e.g. 'parking_spot', 'library_seat', 'meeting_room'
  name TEXT,
  location TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP
);

-- Sensors table
CREATE TABLE sensors (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(id),
  sensor_identifier TEXT, -- hardware ID or MAC address
  sensor_type VARCHAR, -- 'motion', 'weight', 'infrared'
  installed_at TIMESTAMP,
  status VARCHAR -- 'active', 'faulty', 'maintenance'
);

-- Occupancy Events table
CREATE TABLE occupancy_events (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(id),
  sensor_id UUID REFERENCES sensors(id),
  status VARCHAR, -- 'occupied', 'free'
  recorded_at TIMESTAMP
);

CREATE INDEX occupancy_events_resource_id_recorded_at_idx ON occupancy_events(resource_id, recorded_at);
CREATE INDEX occupancy_events_sensor_id_recorded_at_idx ON occupancy_events(sensor_id, recorded_at);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  resource_id UUID REFERENCES resources(id),
  reserved_from TIMESTAMP,
  reserved_until TIMESTAMP,
  status VARCHAR, -- 'pending', 'confirmed', 'cancelled', 'expired'
  created_at TIMESTAMP
);

CREATE INDEX reservations_user_id_idx ON reservations(user_id);
CREATE INDEX reservations_resource_id_idx ON reservations(resource_id);
CREATE INDEX reservations_reserved_from_until_idx ON reservations(reserved_from, reserved_until);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR, -- 'login', 'reserve', 'cancel', 'admin_edit'
  resource_id UUID REFERENCES resources(id),
  timestamp TIMESTAMP,
  details JSONB -- Store context, metadata
);

CREATE INDEX audit_logs_user_id_timestamp_idx ON audit_logs(user_id, timestamp);
CREATE INDEX audit_logs_resource_id_timestamp_idx ON audit_logs(resource_id, timestamp);
CREATE INDEX audit_logs_action_timestamp_idx ON audit_logs(action, timestamp);

-- Resource Usage Stats table
CREATE TABLE resource_usage_stats (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(id),
  date DATE,
  total_reservations INT,
  avg_occupancy_duration FLOAT,
  peak_usage_time TIMESTAMP
);

CREATE INDEX resource_usage_stats_resource_id_date_idx ON resource_usage_stats(resource_id, date);

-- Sensor Readings table
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY,
  sensor_id UUID REFERENCES sensors(id),
  reading_time TIMESTAMP,
  value NUMERIC,
  payload JSONB
);

CREATE INDEX sensor_readings_sensor_id_idx ON sensor_readings(sensor_id);
CREATE INDEX sensor_readings_reading_time_idx ON sensor_readings(reading_time);