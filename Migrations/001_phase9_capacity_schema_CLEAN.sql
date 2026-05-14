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
  resource_id BIGINT NOT NULL UNIQUE REFERENCES public.resources(id) ON DELETE CASCADE,
  max_capacity INT NOT NULL CHECK (max_capacity > 0),
  alert_threshold_80 BOOLEAN DEFAULT true,
  alert_threshold_95 BOOLEAN DEFAULT true,
  alert_at_full BOOLEAN DEFAULT true,
  full_capacity_label TEXT DEFAULT 'Full',
  near_capacity_label TEXT DEFAULT 'Near Full',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resource_capacity_resource_id ON public.resource_capacity(resource_id);

COMMENT ON TABLE public.resource_capacity IS 'Stores capacity limits and alert thresholds for each resource';

-- ============================================================================
-- TABLE 2: occupancy_snapshots - Real-time occupancy tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.occupancy_snapshots (
  id BIGSERIAL PRIMARY KEY,
  resource_id BIGINT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  occupancy_count INT NOT NULL CHECK (occupancy_count >= 0),
  max_capacity INT NOT NULL CHECK (max_capacity > 0),
  occupancy_percentage INT NOT NULL CHECK (occupancy_percentage >= 0 AND occupancy_percentage <= 200),
  source TEXT NOT NULL CHECK (source IN ('ultrasonic', 'rfid', 'ble', 'manual')),
  confidence INT DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),
  is_full_capacity BOOLEAN DEFAULT false,
  is_near_capacity BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_resource_id ON public.occupancy_snapshots(resource_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_created_at ON public.occupancy_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_resource_created ON public.occupancy_snapshots(resource_id, created_at DESC);

COMMENT ON TABLE public.occupancy_snapshots IS 'Stores real-time and historical occupancy snapshots for capacity monitoring and analytics';

-- ============================================================================
-- TABLE 3: capacity_alerts - Capacity alert events log
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capacity_alerts (
  id BIGSERIAL PRIMARY KEY,
  resource_id BIGINT NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_80', 'threshold_95', 'full_capacity')),
  occupancy_count INT NOT NULL,
  occupancy_percentage INT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('HIGH', 'CRITICAL')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_by BIGINT REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capacity_alerts_resource_id ON public.capacity_alerts(resource_id);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_status ON public.capacity_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_created_at ON public.capacity_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_resource_status ON public.capacity_alerts(resource_id, status);

COMMENT ON TABLE public.capacity_alerts IS 'Audit log of all capacity threshold breaches and admin actions';

-- ============================================================================
-- TABLE 4: admin_notifications - Admin notification preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id BIGINT REFERENCES public.resources(id),
  alert_80_email BOOLEAN DEFAULT true,
  alert_95_email BOOLEAN DEFAULT true,
  alert_full_email BOOLEAN DEFAULT true,
  alert_80_dashboard BOOLEAN DEFAULT true,
  alert_95_dashboard BOOLEAN DEFAULT true,
  alert_full_dashboard BOOLEAN DEFAULT true,
  alert_80_sms BOOLEAN DEFAULT false,
  alert_95_sms BOOLEAN DEFAULT false,
  alert_full_sms BOOLEAN DEFAULT false,
  sms_number TEXT,
  snooze_minutes INT DEFAULT 0 CHECK (snooze_minutes >= 0),
  last_alert_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_resource_id ON public.admin_notifications(resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_resource ON public.admin_notifications(user_id, resource_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_notification_per_user_resource ON public.admin_notifications(user_id, COALESCE(resource_id, -1));

COMMENT ON TABLE public.admin_notifications IS 'Stores admin notification preferences for capacity alerts (channels, snooze settings, etc.)';

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.resource_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: resource_capacity
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access" ON public.resource_capacity;
CREATE POLICY "Service role full access" ON public.resource_capacity FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read capacity" ON public.resource_capacity;
CREATE POLICY "Authenticated users can read capacity" ON public.resource_capacity FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage capacity" ON public.resource_capacity;
CREATE POLICY "Admins can manage capacity" ON public.resource_capacity FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- POLICY: occupancy_snapshots
-- ============================================================================

DROP POLICY IF EXISTS "Service role snapshot access" ON public.occupancy_snapshots;
CREATE POLICY "Service role snapshot access" ON public.occupancy_snapshots FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read occupancy snapshots" ON public.occupancy_snapshots;
CREATE POLICY "Users can read occupancy snapshots" ON public.occupancy_snapshots FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can record snapshots" ON public.occupancy_snapshots;
CREATE POLICY "Admins can record snapshots" ON public.occupancy_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- POLICY: capacity_alerts
-- ============================================================================

DROP POLICY IF EXISTS "Service role alerts access" ON public.capacity_alerts;
CREATE POLICY "Service role alerts access" ON public.capacity_alerts FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read active alerts" ON public.capacity_alerts;
CREATE POLICY "Users can read active alerts" ON public.capacity_alerts FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

DROP POLICY IF EXISTS "Admins can read all alerts" ON public.capacity_alerts;
CREATE POLICY "Admins can read all alerts" ON public.capacity_alerts FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service can create alerts" ON public.capacity_alerts;
CREATE POLICY "Service can create alerts" ON public.capacity_alerts FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can manage alerts" ON public.capacity_alerts;
CREATE POLICY "Admins can manage alerts" ON public.capacity_alerts FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- POLICY: admin_notifications
-- ============================================================================

DROP POLICY IF EXISTS "Users can read their notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can read their notification prefs" ON public.admin_notifications FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can set notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can set notification prefs" ON public.admin_notifications FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update notification prefs" ON public.admin_notifications;
CREATE POLICY "Users can update notification prefs" ON public.admin_notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all notification prefs" ON public.admin_notifications;
CREATE POLICY "Admins can read all notification prefs" ON public.admin_notifications FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_resource_capacity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_capacity_timestamp ON public.resource_capacity;
CREATE TRIGGER trigger_resource_capacity_timestamp BEFORE UPDATE ON public.resource_capacity FOR EACH ROW EXECUTE FUNCTION public.update_resource_capacity_timestamp();

CREATE OR REPLACE FUNCTION public.update_admin_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_notifications_timestamp ON public.admin_notifications;
CREATE TRIGGER trigger_admin_notifications_timestamp BEFORE UPDATE ON public.admin_notifications FOR EACH ROW EXECUTE FUNCTION public.update_admin_notifications_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.current_resource_capacity AS
SELECT 
  r.id,
  r.name,
  r.location,
  rc.max_capacity,
  (SELECT occupancy_count FROM occupancy_snapshots WHERE resource_id = r.id ORDER BY created_at DESC LIMIT 1) as current_occupancy,
  (SELECT occupancy_percentage FROM occupancy_snapshots WHERE resource_id = r.id ORDER BY created_at DESC LIMIT 1) as current_percentage,
  (SELECT is_full_capacity FROM occupancy_snapshots WHERE resource_id = r.id ORDER BY created_at DESC LIMIT 1) as is_full,
  (SELECT COUNT(*) FROM capacity_alerts WHERE resource_id = r.id AND status = 'active') as active_alert_count,
  (SELECT MAX(triggered_at) FROM capacity_alerts WHERE resource_id = r.id AND status = 'active') as latest_alert_time
FROM public.resources r
LEFT JOIN public.resource_capacity rc ON r.id = rc.resource_id
ORDER BY r.name;

COMMENT ON VIEW public.current_resource_capacity IS 'Real-time view of all resources with current capacity status and active alert count';

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

COMMENT ON VIEW public.active_capacity_alerts IS 'All currently active capacity alerts with resource details';
