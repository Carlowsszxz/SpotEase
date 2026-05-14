# Phase 9 Capacity Alerts - Migration & Seed Guide

**Migration File:** [001_phase9_capacity_schema.sql](001_phase9_capacity_schema.sql)  
**Status:** Ready for Supabase SQL Editor  
**Purpose:** Create tables, RLS policies, views, and seed instructions for capacity alerts

---

## 1) What This Migration Adds

This migration creates the Phase 9 schema for:
- `resource_capacity` - per-resource max capacity and thresholds
- `occupancy_snapshots` - real-time occupancy history
- `capacity_alerts` - alert log for 80%, 95%, and full-capacity events
- `admin_notifications` - per-admin notification preferences
- RLS policies for secure access
- Views for dashboard reporting
- Timestamp triggers for automatic `updated_at` maintenance

---

## 2) Before You Run It

### Prerequisites
- Supabase project already connected to the app
- Existing `resources` table in `public` schema
- Existing `auth.users` table provided by Supabase
- Optional but recommended: `public.admin_users` table for admin role checks

### Safety Checks
- [ ] Back up the database before running migration
- [ ] Confirm `resources.id` is the correct foreign key type
- [ ] Confirm admin users are tracked in `public.admin_users`
- [ ] Confirm your app uses UUID user IDs from `auth.users`

---

## 3) Run Order

1. Open Supabase SQL Editor
2. Paste [001_phase9_capacity_schema.sql](001_phase9_capacity_schema.sql)
3. Run the full migration
4. Confirm all tables and policies were created
5. Seed capacity values for existing rooms/resources
6. Update the app to use `JS/capacity-config.js`

---

## 4) Seeding Capacity Data

### Example seed strategy
Add capacity values for each resource that already exists in `resources`.

```sql
INSERT INTO public.resource_capacity (
  resource_id,
  max_capacity,
  alert_threshold_80,
  alert_threshold_95,
  alert_at_full,
  full_capacity_label,
  near_capacity_label
)
VALUES
  (1, 40, true, true, true, 'Full Capacity', 'Near Capacity'),
  (2, 30, true, true, true, 'Full Capacity', 'Near Capacity'),
  (3, 100, true, true, true, 'Full Capacity', 'Near Capacity')
ON CONFLICT (resource_id)
DO UPDATE SET
  max_capacity = EXCLUDED.max_capacity,
  alert_threshold_80 = EXCLUDED.alert_threshold_80,
  alert_threshold_95 = EXCLUDED.alert_threshold_95,
  alert_at_full = EXCLUDED.alert_at_full,
  full_capacity_label = EXCLUDED.full_capacity_label,
  near_capacity_label = EXCLUDED.near_capacity_label,
  updated_at = CURRENT_TIMESTAMP;
```

### Seed recommendations
- Use real max capacity values from facilities staff
- Set alert thresholds globally first, then refine per room if needed
- Seed only active resources initially
- Add historical snapshots later after the monitoring job is running

---

## 5) Notification Preference Seed

You can seed default notification preferences for admin users after confirming their UUIDs.

```sql
INSERT INTO public.admin_notifications (
  user_id,
  resource_id,
  alert_80_email,
  alert_95_email,
  alert_full_email,
  alert_80_dashboard,
  alert_95_dashboard,
  alert_full_dashboard,
  snooze_minutes
)
VALUES
  ('00000000-0000-0000-0000-000000000000', NULL, true, true, true, true, true, true, 15)
ON CONFLICT DO NOTHING;
```

### Best practice
- Seed one default row per admin user
- Use `resource_id = NULL` for global defaults
- Override with resource-specific preferences only when needed

---

## 6) RLS Policy Notes

The migration includes RLS policies for:
- Reading capacity data
- Writing capacity snapshots
- Reading active alerts
- Admin-only management of alert records
- User-owned notification preferences

### Important
If your project does not have `public.admin_users`, update the admin checks before production.

---

## 7) Validation Queries

After running the migration, verify the setup:

```sql
-- Confirm tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'resource_capacity',
    'occupancy_snapshots',
    'capacity_alerts',
    'admin_notifications'
  )
ORDER BY table_name;

-- Confirm RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'resource_capacity',
    'occupancy_snapshots',
    'capacity_alerts',
    'admin_notifications'
  );

-- Confirm policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'resource_capacity',
    'occupancy_snapshots',
    'capacity_alerts',
    'admin_notifications'
  )
ORDER BY tablename, policyname;
```

---

## 8) App Integration Checklist

### Add the config module
- Import [JS/capacity-config.js](../JS/capacity-config.js)
- Use `calculateOccupancyPercentage()` for display logic
- Use `getStatusLabel()` for the website badge
- Use `detectThresholdBreaches()` for alert generation

### Update the admin panel
- Show active capacity alerts
- Add resource capacity configuration controls
- Add notification preference controls
- Show alert history and status changes

### Update the public website
- Show `Full Capacity` when occupancy reaches 100%
- Show `Near Capacity` at 95%
- Show warning state at 80%
- Refresh status in real time

---

## 9) Rollback Plan

If the migration must be reverted:
1. Remove app references to the new module
2. Drop the views first
3. Drop policies
4. Drop triggers
5. Drop tables in reverse dependency order

```sql
DROP VIEW IF EXISTS public.active_capacity_alerts;
DROP VIEW IF EXISTS public.current_resource_capacity;
DROP TABLE IF EXISTS public.admin_notifications;
DROP TABLE IF EXISTS public.capacity_alerts;
DROP TABLE IF EXISTS public.occupancy_snapshots;
DROP TABLE IF EXISTS public.resource_capacity;
```

---

## 10) Notes for Production

- Keep alert thresholds configurable per resource
- Use UUIDs for all auth user references
- Avoid seeding fake occupancy snapshots in production
- Monitor alert volume during the first week
- Tune snooze intervals to reduce duplicate alerts

---

## 11) Next Steps After Migration

1. Add the Phase 9 monitoring module
2. Connect Supabase real-time subscriptions
3. Add admin dashboard controls
4. Add public capacity badges/status display
5. Run staging tests with a few sample resources

---

## Quick Status

- [x] Schema designed
- [x] RLS policies included
- [x] Views included
- [x] Seed instructions documented
- [ ] Run in Supabase
- [ ] Add app integration
- [ ] Test capacity alerts
- [ ] Deploy to production
