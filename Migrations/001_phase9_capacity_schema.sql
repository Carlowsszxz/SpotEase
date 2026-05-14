/**
 * PHASE 9.1: CAPACITY ALERTS - SUPABASE SCHEMA & SETUP
 * 
 * This SQL migration creates all necessary tables and RLS policies
 * for the real-time capacity monitoring system.
 * 
 * Run this in Supabase SQL Editor to set up Phase 9.1
 * Location: Supabase Dashboard → SQL Editor → Paste this file → Run
 * 
 * @file supabase_phase9_migration.sql
 * @created 2026-05-14
 */

-- ============================================================================
-- TABLE 1: resource_capacity - Resource capacity configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resource_capacity (
  id BIGSERIAL PRIMARY KEY,

    -- Foreign key to existing resources table
    resource_id BIGINT NOT NULL UNIQUE REFERENCES public.resources(id) ON DELETE CASCADE,

    -- Capacity settings
    max_capacity INT NOT NULL CHECK (max_capacity > 0),

    -- Alert configuration
    alert_threshold_80 BOOLEAN DEFAULT true,       -- Alert at 80% occupancy
    alert_threshold_95 BOOLEAN DEFAULT true,       -- Alert at 95% occupancy
    alert_at_full BOOLEAN DEFAULT true,            -- Alert when at 100%

    -- Custom labels
    full_capacity_label TEXT DEFAULT 'Full',       -- Label shown to users
    near_capacity_label TEXT DEFAULT 'Near Full',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create index on resource_id for faster lookups
  CREATE INDEX IF NOT EXISTS idx_resource_capacity_resource_id
    ON public.resource_capacity(resource_id);

  -- Add comment
  COMMENT ON TABLE public.resource_capacity IS
    'Stores capacity limits and alert thresholds for each resource';

  -- ============================================================================
  -- TABLE 2: occupancy_snapshots - Real-time occupancy tracking
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS public.occupancy_snapshots (
    id BIGSERIAL PRIMARY KEY,

    -- Foreign key to resource
    resource_id BIGINT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,

    -- Occupancy data
    occupancy_count INT NOT NULL CHECK (occupancy_count >= 0),
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    occupancy_percentage INT NOT NULL CHECK (occupancy_percentage >= 0 AND occupancy_percentage <= 200),

    -- Data source
    source TEXT NOT NULL CHECK (source IN ('ultrasonic', 'rfid', 'ble', 'manual')),
    confidence INT DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),  -- 0-100% confidence

    -- Calculated state
    is_full_capacity BOOLEAN DEFAULT false,
    is_near_capacity BOOLEAN DEFAULT false,

    -- Data retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for efficient querying
  CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_resource_id
    ON public.occupancy_snapshots(resource_id);
  CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_created_at
    ON public.occupancy_snapshots(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_resource_created
    ON public.occupancy_snapshots(resource_id, created_at DESC);

  -- Add comment
  COMMENT ON TABLE public.occupancy_snapshots IS
    'Stores real-time and historical occupancy snapshots for capacity monitoring and analytics';

  -- ============================================================================
  -- TABLE 3: capacity_alerts - Capacity alert events log
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS public.capacity_alerts (
    id BIGSERIAL PRIMARY KEY,

    -- Foreign key to resource
    resource_id BIGINT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,

    -- Alert details
    alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_80', 'threshold_95', 'full_capacity')),
    occupancy_count INT NOT NULL,
    occupancy_percentage INT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('HIGH', 'CRITICAL')),

    -- Alert state
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),

    -- Timeline
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,              -- When occupancy dropped below threshold
    dismissed_at TIMESTAMP WITH TIME ZONE,             -- When admin dismissed
    dismissed_by BIGINT REFERENCES auth.users(id),     -- Which admin dismissed

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_capacity_alerts_resource_id
    ON public.capacity_alerts(resource_id);
  CREATE INDEX IF NOT EXISTS idx_capacity_alerts_status
    ON public.capacity_alerts(status) WHERE status = 'active';
  CREATE INDEX IF NOT EXISTS idx_capacity_alerts_created_at
    ON public.capacity_alerts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_capacity_alerts_resource_status
    ON public.capacity_alerts(resource_id, status);

  -- Add comment
  COMMENT ON TABLE public.capacity_alerts IS
    'Audit log of all capacity threshold breaches and admin actions';

  -- ============================================================================
  -- TABLE 4: admin_notifications - Admin notification preferences
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id BIGSERIAL PRIMARY KEY,

    -- Foreign keys
    user_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES public.resources(id),  -- NULL = default for all resources

    -- Alert thresholds - Email notifications
    alert_80_email BOOLEAN DEFAULT true,
    alert_95_email BOOLEAN DEFAULT true,
    alert_full_email BOOLEAN DEFAULT true,

    -- Alert thresholds - Dashboard notifications
    alert_80_dashboard BOOLEAN DEFAULT true,
    alert_95_dashboard BOOLEAN DEFAULT true,
    alert_full_dashboard BOOLEAN DEFAULT true,

    -- Alert thresholds - SMS notifications (optional)
    alert_80_sms BOOLEAN DEFAULT false,
    alert_95_sms BOOLEAN DEFAULT false,
    alert_full_sms BOOLEAN DEFAULT false,

    -- SMS contact info
    sms_number TEXT,  -- E.164 format: +1234567890

    -- Alert snoozing (prevent spam)
    snooze_minutes INT DEFAULT 0 CHECK (snooze_minutes >= 0),
    last_alert_time TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id
    ON public.admin_notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_resource_id
    ON public.admin_notifications(resource_id);
  CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_resource
    ON public.admin_notifications(user_id, resource_id);

  -- Add unique constraint (one preference set per user per resource)
  CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_notification_per_user_resource
    ON public.admin_notifications(user_id, COALESCE(resource_id, -1));

  -- Add comment
  COMMENT ON TABLE public.admin_notifications IS
    'Stores admin notification preferences for capacity alerts (channels, snooze settings, etc.)';

  -- ============================================================================
  -- ROW-LEVEL SECURITY (RLS) POLICIES
  -- ============================================================================

  -- Enable RLS on all new tables
  ALTER TABLE public.resource_capacity ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.capacity_alerts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

  -- ============================================================================
  -- POLICY: resource_capacity - Admins can read/write, others read only
  -- ============================================================================

  -- Allow service role (backend) full access
  DROP POLICY IF EXISTS "Service role full access" ON public.resource_capacity;
  CREATE POLICY "Service role full access"
    ON public.resource_capacity
    FOR ALL
    USING (auth.role() = 'service_role');

  -- Allow authenticated users to read
  DROP POLICY IF EXISTS "Authenticated users can read capacity" ON public.resource_capacity;
  CREATE POLICY "Authenticated users can read capacity"
    ON public.resource_capacity
    FOR SELECT
    USING (auth.role() = 'authenticated');

  -- Allow admins to write
  DROP POLICY IF EXISTS "Admins can manage capacity" ON public.resource_capacity;
  CREATE POLICY "Admins can manage capacity"
    ON public.resource_capacity
    FOR ALL
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );

  -- ============================================================================
  -- POLICY: occupancy_snapshots - Admins write, all read
  -- ============================================================================

  -- Service role full access
  DROP POLICY IF EXISTS "Service role snapshot access" ON public.occupancy_snapshots;
  CREATE POLICY "Service role snapshot access"
    ON public.occupancy_snapshots
    FOR ALL
    USING (auth.role() = 'service_role');

  -- Authenticated users can read
  DROP POLICY IF EXISTS "Users can read occupancy snapshots" ON public.occupancy_snapshots;
  CREATE POLICY "Users can read occupancy snapshots"
    ON public.occupancy_snapshots
    FOR SELECT
    USING (auth.role() = 'authenticated');

  -- Admins can insert/update
  DROP POLICY IF EXISTS "Admins can record snapshots" ON public.occupancy_snapshots;
  CREATE POLICY "Admins can record snapshots"
    ON public.occupancy_snapshots
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );

  -- ============================================================================
  -- POLICY: capacity_alerts - Admins manage, users can read active
  -- ============================================================================

  -- Service role full access
  DROP POLICY IF EXISTS "Service role alerts access" ON public.capacity_alerts;
  CREATE POLICY "Service role alerts access"
    ON public.capacity_alerts
    FOR ALL
    USING (auth.role() = 'service_role');

  -- All authenticated users can read active alerts
  DROP POLICY IF EXISTS "Users can read active alerts" ON public.capacity_alerts;
  CREATE POLICY "Users can read active alerts"
    ON public.capacity_alerts
    FOR SELECT
    USING (auth.role() = 'authenticated' AND status = 'active');

  -- Admins can read all alerts
  DROP POLICY IF EXISTS "Admins can read all alerts" ON public.capacity_alerts;
  CREATE POLICY "Admins can read all alerts"
    ON public.capacity_alerts
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );

  -- Service role can insert alerts
  DROP POLICY IF EXISTS "Service can create alerts" ON public.capacity_alerts;
  CREATE POLICY "Service can create alerts"
    ON public.capacity_alerts
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

  -- Admins can update (dismiss/resolve)
  DROP POLICY IF EXISTS "Admins can manage alerts" ON public.capacity_alerts;
  CREATE POLICY "Admins can manage alerts"
    ON public.capacity_alerts
    FOR UPDATE
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );

  -- ============================================================================
  -- POLICY: admin_notifications - Users manage their own preferences
  -- ============================================================================

  -- Users can read their own preferences
  DROP POLICY IF EXISTS "Users can read their notification prefs" ON public.admin_notifications;
  CREATE POLICY "Users can read their notification prefs"
    ON public.admin_notifications
    FOR SELECT
    USING (user_id = auth.uid() OR auth.role() = 'service_role');

  -- Users can insert their own preferences
  DROP POLICY IF EXISTS "Users can set notification prefs" ON public.admin_notifications;
  CREATE POLICY "Users can set notification prefs"
    ON public.admin_notifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

  -- Users can update their own preferences
  DROP POLICY IF EXISTS "Users can update notification prefs" ON public.admin_notifications;
  CREATE POLICY "Users can update notification prefs"
    ON public.admin_notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  -- Admins can read all preferences
  DROP POLICY IF EXISTS "Admins can read all notification prefs" ON public.admin_notifications;
  CREATE POLICY "Admins can read all notification prefs"
    ON public.admin_notifications
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      )
    );

  -- ============================================================================
  -- TRIGGERS - Auto-update timestamps
  -- ============================================================================

  -- Trigger for resource_capacity.updated_at
  CREATE OR REPLACE FUNCTION public.update_resource_capacity_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_resource_capacity_timestamp ON public.resource_capacity;
  CREATE TRIGGER trigger_resource_capacity_timestamp
    BEFORE UPDATE ON public.resource_capacity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_resource_capacity_timestamp();

  -- Trigger for admin_notifications.updated_at
  CREATE OR REPLACE FUNCTION public.update_admin_notifications_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_admin_notifications_timestamp ON public.admin_notifications;
  CREATE TRIGGER trigger_admin_notifications_timestamp
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_notifications_timestamp();

  -- ============================================================================
  -- VIEWS - Useful data aggregations
  -- ============================================================================

  -- View: Current capacity status for all resources
  CREATE OR REPLACE VIEW public.current_resource_capacity AS
  SELECT 
    r.id,
    r.name,
    r.location,
    rc.max_capacity,
    (SELECT occupancy_count FROM occupancy_snapshots 
     WHERE resource_id = r.id 
     ORDER BY created_at DESC LIMIT 1) as current_occupancy,
    (SELECT occupancy_percentage FROM occupancy_snapshots 
     WHERE resource_id = r.id 
     ORDER BY created_at DESC LIMIT 1) as current_percentage,
    (SELECT is_full_capacity FROM occupancy_snapshots 
     WHERE resource_id = r.id 
     ORDER BY created_at DESC LIMIT 1) as is_full,
    (SELECT COUNT(*) FROM capacity_alerts 
     WHERE resource_id = r.id AND status = 'active') as active_alert_count,
    (SELECT MAX(triggered_at) FROM capacity_alerts 
     WHERE resource_id = r.id AND status = 'active') as latest_alert_time
  FROM public.resources r
  LEFT JOIN public.resource_capacity rc ON r.id = rc.resource_id
  ORDER BY r.name;

  COMMENT ON VIEW public.current_resource_capacity IS 
    'Real-time view of all resources with current capacity status and active alert count';

  -- View: Active capacity alerts
  CREATE OR REPLACE VIEW public.active_capacity_alerts AS
  SELECT 
    ca.id,
    ca.resource_id,
    r.name as resource_name,
    r.location,
    ca.alert_type,
    ca.occupancy_count,
    ca.occupancy_percentage,
    ca.severity,
    ca.status,
    ca.triggered_at,
    EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - ca.triggered_at)) as minutes_elapsed,
    ca.dismissed_by
  FROM public.capacity_alerts ca
  JOIN public.resources r ON ca.resource_id = r.id
  WHERE ca.status = 'active'
  ORDER BY ca.triggered_at DESC;

  COMMENT ON VIEW public.active_capacity_alerts IS 
    'All currently active capacity alerts with resource details';

  -- ============================================================================
  -- SEED DATA (Optional - uncomment to populate with example data)
  -- ============================================================================

  -- Uncomment and modify to seed your resources with capacity data
  /*
  -- First, check what resources exist
  -- SELECT id, name, location FROM public.resources LIMIT 10;

  -- Then insert capacity configurations for each resource
  INSERT INTO public.resource_capacity (resource_id, max_capacity, alert_threshold_80, alert_threshold_95, alert_at_full)
  VALUES
    (1, 40, true, true, true),   -- Study Room A - 40 capacity
    (2, 30, true, true, true),   -- Study Room B - 30 capacity
    (3, 100, true, true, true),  -- Main Quiet Zone - 100 capacity
    (4, 25, true, true, true);   -- Group Study Room - 25 capacity

  -- Create default notification preferences for all admins
  -- Replace 'admin_user_id' with actual admin user IDs from auth.users
  INSERT INTO public.admin_notifications (user_id, resource_id, alert_80_email, alert_95_email, alert_full_email, alert_80_dashboard, alert_95_dashboard, alert_full_dashboard)
  VALUES
    ('admin_user_id', NULL, true, true, true, true, true, true);
  */

  -- ============================================================================
  -- VERIFICATION QUERIES
  -- ============================================================================

  -- Verify tables were created
  /*
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications')
  ORDER BY table_name;

  -- Check RLS is enabled
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications');

  -- Check policies
  SELECT schemaname, tablename, policyname FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications');
  */

  alert_full_sms BOOLEAN DEFAULT false,
  
  -- SMS contact info
  sms_number TEXT,  -- E.164 format: +1234567890
  
  -- Alert snoozing (prevent spam)
  snooze_minutes INT DEFAULT 0 CHECK (snooze_minutes >= 0),
  last_alert_time TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id 
  ON public.admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_resource_id 
  ON public.admin_notifications(resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_resource 
  ON public.admin_notifications(user_id, resource_id);

-- Add unique constraint (one preference set per user per resource)
CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_notification_per_user_resource 
  ON public.admin_notifications(user_id, COALESCE(resource_id, -1));

-- Add comment
COMMENT ON TABLE public.admin_notifications IS 
  'Stores admin notification preferences for capacity alerts (channels, snooze settings, etc.)';

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.resource_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: resource_capacity - Admins can read/write, others read only
-- ============================================================================

-- Allow service role (backend) full access
DROP POLICY IF EXISTS "Service role full access" ON public.resource_capacity;
CREATE POLICY "Service role full access" 
  ON public.resource_capacity 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Authenticated users can read capacity" ON public.resource_capacity;
CREATE POLICY "Authenticated users can read capacity" 
  ON public.resource_capacity 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow admins to write
DROP POLICY IF EXISTS "Admins can manage capacity" ON public.resource_capacity;
CREATE POLICY "Admins can manage capacity" 
  ON public.resource_capacity 
  FOR ALL 
  USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: occupancy_snapshots - Admins write, all read
-- ============================================================================

-- Service role full access
DROP POLICY IF EXISTS "Service role snapshot access" ON public.occupancy_snapshots;
CREATE POLICY "Service role snapshot access" 
  ON public.occupancy_snapshots 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Authenticated users can read
DROP POLICY IF EXISTS "Users can read occupancy snapshots" ON public.occupancy_snapshots;
CREATE POLICY "Users can read occupancy snapshots" 
  ON public.occupancy_snapshots 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins can insert/update
DROP POLICY IF EXISTS "Admins can record snapshots" ON public.occupancy_snapshots;
CREATE POLICY "Admins can record snapshots" 
  ON public.occupancy_snapshots 
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: capacity_alerts - Admins manage, users can read active
-- ============================================================================

-- Service role full access
DROP POLICY IF EXISTS "Service role alerts access" ON public.capacity_alerts;
CREATE POLICY "Service role alerts access" 
  ON public.capacity_alerts 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- All authenticated users can read active alerts
DROP POLICY IF EXISTS "Users can read active alerts" ON public.capacity_alerts;
CREATE POLICY "Users can read active alerts" 
  ON public.capacity_alerts 
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND status = 'active');

-- Admins can read all alerts
DROP POLICY IF EXISTS "Admins can read all alerts" ON public.capacity_alerts;
CREATE POLICY "Admins can read all alerts" 
  ON public.capacity_alerts 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can insert alerts
DROP POLICY IF EXISTS "Service can create alerts" ON public.capacity_alerts;
CREATE POLICY "Service can create alerts" 
  ON public.capacity_alerts 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Admins can update (dismiss/resolve)
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.capacity_alerts;
CREATE POLICY "Admins can manage alerts" 
  ON public.capacity_alerts 
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY: admin_notifications - Users manage their own preferences
-- ============================================================================

-- Users can read their own preferences
DROP POLICY IF EXISTS "Users can read their notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can read their notification prefs" 
  ON public.admin_notifications 
  FOR SELECT 
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can set notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can set notification prefs" 
  ON public.admin_notifications 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can update notification prefs" 
  ON public.admin_notifications 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all preferences
DROP POLICY IF EXISTS "Admins can read all notification prefs" ON public.admin_notifications;
CREATE POLICY "Admins can read all notification prefs" 
  ON public.admin_notifications 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS - Auto-update timestamps
-- ============================================================================

-- Trigger for resource_capacity.updated_at
CREATE OR REPLACE FUNCTION public.update_resource_capacity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_capacity_timestamp ON public.resource_capacity;
CREATE TRIGGER trigger_resource_capacity_timestamp
  BEFORE UPDATE ON public.resource_capacity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_resource_capacity_timestamp();

-- Trigger for admin_notifications.updated_at
CREATE OR REPLACE FUNCTION public.update_admin_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_notifications_timestamp ON public.admin_notifications;
CREATE TRIGGER trigger_admin_notifications_timestamp
  BEFORE UPDATE ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_notifications_timestamp();

-- ============================================================================
-- VIEWS - Useful data aggregations
-- ============================================================================

-- View: Current capacity status for all resources
CREATE OR REPLACE VIEW public.current_resource_capacity AS
SELECT 
  r.id,
  r.name,
  r.location,
  rc.max_capacity,
  (SELECT occupancy_count FROM occupancy_snapshots 
   WHERE resource_id = r.id 
   ORDER BY created_at DESC LIMIT 1) as current_occupancy,
  (SELECT occupancy_percentage FROM occupancy_snapshots 
   WHERE resource_id = r.id 
   ORDER BY created_at DESC LIMIT 1) as current_percentage,
  (SELECT is_full_capacity FROM occupancy_snapshots 
   WHERE resource_id = r.id 
   ORDER BY created_at DESC LIMIT 1) as is_full,
  (SELECT COUNT(*) FROM capacity_alerts 
   WHERE resource_id = r.id AND status = 'active') as active_alert_count,
  (SELECT MAX(triggered_at) FROM capacity_alerts 
   WHERE resource_id = r.id AND status = 'active') as latest_alert_time
FROM public.resources r
LEFT JOIN public.resource_capacity rc ON r.id = rc.resource_id
ORDER BY r.name;

COMMENT ON VIEW public.current_resource_capacity IS 
  'Real-time view of all resources with current capacity status and active alert count';

-- View: Active capacity alerts
CREATE OR REPLACE VIEW public.active_capacity_alerts AS
SELECT 
  ca.id,
  ca.resource_id,
  r.name as resource_name,
  r.location,
  ca.alert_type,
  ca.occupancy_count,
  ca.occupancy_percentage,
  ca.severity,
  ca.status,
  ca.triggered_at,
  EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - ca.triggered_at)) as minutes_elapsed,
  ca.dismissed_by
FROM public.capacity_alerts ca
JOIN public.resources r ON ca.resource_id = r.id
WHERE ca.status = 'active'
ORDER BY ca.triggered_at DESC;

COMMENT ON VIEW public.active_capacity_alerts IS 
  'All currently active capacity alerts with resource details';

-- ============================================================================
-- SEED DATA (Optional - uncomment to populate with example data)
-- ============================================================================

-- Uncomment and modify to seed your resources with capacity data
/*
-- First, check what resources exist
-- SELECT id, name, location FROM public.resources LIMIT 10;

-- Then insert capacity configurations for each resource
INSERT INTO public.resource_capacity (resource_id, max_capacity, alert_threshold_80, alert_threshold_95, alert_at_full)
VALUES
  (1, 40, true, true, true),   -- Study Room A - 40 capacity
  (2, 30, true, true, true),   -- Study Room B - 30 capacity
  (3, 100, true, true, true),  -- Main Quiet Zone - 100 capacity
  (4, 25, true, true, true);   -- Group Study Room - 25 capacity

-- Create default notification preferences for all admins
-- Replace with actual admin user UUIDs from auth.users
INSERT INTO public.admin_notifications (user_id, resource_id, alert_80_email, alert_95_email, alert_full_email, alert_80_dashboard, alert_95_dashboard, alert_full_dashboard)
VALUES
  ('00000000-0000-0000-0000-000000000000', NULL, true, true, true, true, true, true);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
/*
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications');

-- Check policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications');
*/
