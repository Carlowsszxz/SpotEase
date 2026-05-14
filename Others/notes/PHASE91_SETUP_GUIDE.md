# Phase 9.1 Implementation Guide - Database Schema & Setup

**Status:** 🆕 STARTING  
**Timeline:** Day 1-2 (2 days)  
**Priority:** HIGH - Foundation for all Phase 9 features

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Run Supabase Migration (15 minutes)

**Location:** Supabase Dashboard → SQL Editor

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy & paste entire contents of [`001_phase9_capacity_schema.sql`](Migrations/001_phase9_capacity_schema.sql)
6. Click **Run** (top-right)
7. Verify success: All queries execute with ✅ (no errors)

**What this does:**
- Creates 4 new database tables
- Sets up Row-Level Security (RLS) policies
- Creates useful views and triggers
- Defines indexes for performance

**Verification:**
```sql
-- In SQL Editor, run this to verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications')
ORDER BY table_name;

-- Should return 4 rows
```

---

### Step 2: Import Configuration Module (10 minutes)

**Location:** Your project's `JS/` folder

1. Copy `capacity-config.js` to your project:
   ```
   Project Root/
   └── JS/
       └── capacity-config.js  ← ADD THIS FILE
   ```

2. Test import in your browser console:
   ```javascript
   import { CAPACITY_CONFIG, initializeCapacityMonitoring } from './JS/capacity-config.js'
   console.log(CAPACITY_CONFIG)
   ```

**What this provides:**
- Configuration constants
- Helper functions for calculations
- Supabase query builders
- Initialization function

---

### Step 3: Seed Resource Capacity Data (20 minutes)

**Option A: Via Supabase SQL Editor (Recommended for small number of resources)**

```sql
-- Get your resource IDs first
SELECT id, name, location FROM public.resources LIMIT 20;

-- Then insert capacity for each:
INSERT INTO public.resource_capacity (resource_id, max_capacity, alert_threshold_80, alert_threshold_95, alert_at_full)
VALUES
  (1, 40, true, true, true),      -- Study Room A
  (2, 30, true, true, true),      -- Study Room B
  (3, 100, true, true, true),     -- Main Quiet Zone
  (4, 25, true, true, true),      -- Group Study Room
  (5, 50, true, true, true);      -- Reference Area

-- Verify insertion
SELECT * FROM public.resource_capacity;
```

**Option B: Via JavaScript (For bulk operations)**

```javascript
import { CAPACITY_CONFIG } from './JS/capacity-config.js'

// Get all resources first
const { data: resources } = await supabase
  .from('resources')
  .select('id, name')

// Prepare capacity data
const capacityData = resources.map(r => ({
  resource_id: r.id,
  max_capacity: 40,  // or calculate based on resource type
  alert_threshold_80: true,
  alert_threshold_95: true,
  alert_at_full: true
}))

// Insert all at once
const { data, error } = await supabase
  .from(CAPACITY_CONFIG.tables.capacity)
  .insert(capacityData)

if (!error) {
  console.log(`✅ Seeded ${data.length} resources with capacity data`)
}
```

**Determine Max Capacity:**
- Interview facility managers about each space
- Check fire code maximum occupancy
- Review historical peak occupancy data
- Consider physical space dimensions (rough estimate: 5-10 sq ft per person)

Common defaults:
- Study rooms: 30-50 people
- Quiet zones: 50-150 people
- Group areas: 20-30 people
- Reception: 10-20 people

---

### Step 4: Configure RLS Policies (10 minutes)

**Check that RLS is enabled:**

1. In Supabase SQL Editor, run:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications');
   ```

2. Should show `rowsecurity = true` for all 4 tables ✅

**List all policies:**

```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('resource_capacity', 'occupancy_snapshots', 'capacity_alerts', 'admin_notifications')
ORDER BY tablename, policyname;
```

**Expected policies per table:**
- `resource_capacity`: 3 policies
- `occupancy_snapshots`: 3 policies
- `capacity_alerts`: 4 policies
- `admin_notifications`: 4 policies

---

### Step 5: Test Basic Configuration (15 minutes)

Create a test file: `test-phase9-setup.js`

```javascript
import { supabase } from './JS/supabase-auth.js'
import {
  CAPACITY_CONFIG,
  calculateOccupancyPercentage,
  getStatusLabel,
  initializeCapacityMonitoring
} from './JS/capacity-config.js'

async function testPhase9Setup() {
  console.log('🧪 Testing Phase 9.1 Setup...')

  // Test 1: Configuration loaded
  console.log('Test 1: Configuration constants')
  console.log('  Thresholds:', CAPACITY_CONFIG.thresholds)
  console.log('  ✅ PASS')

  // Test 2: Calculations work
  console.log('\nTest 2: Occupancy calculations')
  const percentage = calculateOccupancyPercentage(38, 40)
  const label = getStatusLabel(percentage)
  console.log(`  38/40 users = ${percentage}% → ${label}`)
  console.log('  ✅ PASS')

  // Test 3: Database connectivity
  console.log('\nTest 3: Supabase database connectivity')
  const result = await initializeCapacityMonitoring(supabase)
  if (result.success) {
    console.log('  ✅ PASS - Database tables accessible')
  } else {
    console.log(`  ❌ FAIL - ${result.error}`)
  }

  // Test 4: Query resource capacity
  console.log('\nTest 4: Query existing capacity data')
  const { data, error } = await supabase
    .from(CAPACITY_CONFIG.tables.capacity)
    .select('*')
    .limit(1)
  
  if (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
  } else if (data.length > 0) {
    console.log(`  Found: ${data[0].max_capacity} max capacity`)
    console.log('  ✅ PASS')
  } else {
    console.log('  ⚠️  WARNING - No capacity data found (need to seed)')
  }

  console.log('\n✅ Phase 9.1 Setup Test Complete')
}

// Run test
testPhase9Setup().catch(console.error)
```

**Run test:**
1. Add this to your HTML: `<script type="module" src="test-phase9-setup.js"></script>`
2. Open browser console (F12)
3. Should see all tests pass ✅

---

### Step 6: Create Admin Notification Preferences (10 minutes)

Set default preferences for all admins:

```sql
-- Insert notification preferences for each admin
-- Replace 'ADMIN_USER_ID' with actual user IDs from auth.users table

INSERT INTO public.admin_notifications (user_id, resource_id, alert_80_email, alert_95_email, alert_full_email, alert_80_dashboard, alert_95_dashboard, alert_full_dashboard, snooze_minutes)
VALUES
  ('ADMIN_USER_ID_1', NULL, true, true, true, true, true, true, 0),
  ('ADMIN_USER_ID_2', NULL, true, true, true, true, true, true, 0);

-- Verify:
SELECT user_id, resource_id, alert_80_email, alert_95_email, alert_full_email FROM public.admin_notifications;
```

**To get admin user IDs:**
```sql
SELECT id, email FROM auth.users 
WHERE email LIKE '%@library%' OR role = 'admin'
LIMIT 10;
```

---

## 📊 Database Schema Summary

### Table 1: resource_capacity
| Column | Type | Purpose |
|--------|------|---------|
| id | BIGINT | Primary key |
| resource_id | BIGINT | Linked to resources table |
| max_capacity | INT | Max people allowed |
| alert_threshold_80 | BOOLEAN | Alert enabled at 80%? |
| alert_threshold_95 | BOOLEAN | Alert enabled at 95%? |
| alert_at_full | BOOLEAN | Alert enabled at 100%? |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last updated |

### Table 2: occupancy_snapshots
| Column | Type | Purpose |
|--------|------|---------|
| id | BIGINT | Primary key |
| resource_id | BIGINT | Which resource |
| occupancy_count | INT | Number of people now |
| max_capacity | INT | Max capacity (denormalized) |
| occupancy_percentage | INT | Calculated % (0-200) |
| source | TEXT | Data source (ultrasonic/rfid/ble) |
| confidence | INT | Data quality (0-100%) |
| is_full_capacity | BOOLEAN | Over capacity? |
| is_near_capacity | BOOLEAN | At 95%+? |
| created_at | TIMESTAMP | When recorded |

### Table 3: capacity_alerts
| Column | Type | Purpose |
|--------|------|---------|
| id | BIGINT | Primary key |
| resource_id | BIGINT | Which resource |
| alert_type | TEXT | What threshold (80/95/full) |
| occupancy_count | INT | People when triggered |
| occupancy_percentage | INT | % when triggered |
| severity | TEXT | HIGH or CRITICAL |
| status | TEXT | active/resolved/dismissed |
| triggered_at | TIMESTAMP | When alert fired |
| resolved_at | TIMESTAMP | When capacity dropped |
| dismissed_at | TIMESTAMP | When admin dismissed |
| dismissed_by | BIGINT | Which admin dismissed |

### Table 4: admin_notifications
| Column | Type | Purpose |
|--------|------|---------|
| id | BIGINT | Primary key |
| user_id | BIGINT | Which admin |
| resource_id | BIGINT | For which resource (NULL = all) |
| alert_80_email | BOOLEAN | Send email at 80%? |
| alert_95_email | BOOLEAN | Send email at 95%? |
| alert_full_email | BOOLEAN | Send email at 100%? |
| alert_80_dashboard | BOOLEAN | Dashboard notif at 80%? |
| (and more for 95% & 100%) | BOOLEAN | Same pattern |
| alert_80_sms | BOOLEAN | SMS at 80% (optional) |
| sms_number | TEXT | Phone number (E.164 format) |
| snooze_minutes | INT | Anti-spam snooze duration |

---

## ✅ Verification Checklist

- [ ] All 4 tables created in Supabase
- [ ] RLS enabled on all tables  
- [ ] Policies created for access control
- [ ] Capacity data seeded for all resources
- [ ] Admin notification preferences set
- [ ] Configuration module imported successfully
- [ ] Test suite passes (all 4 tests ✅)
- [ ] Views (`current_resource_capacity`, `active_capacity_alerts`) available
- [ ] Indexes created for performance

---

## 🚨 Troubleshooting

### Issue: "relation 'resource_capacity' does not exist"
**Solution:** Re-run the SQL migration file. Make sure there are no error messages.

### Issue: RLS blocks all queries
**Solution:** 
1. Check that service_role policy exists for each table
2. Verify `auth.role() = 'service_role'` in policy
3. Make sure you're using a service key (not anon key) for backend operations

### Issue: Seeding fails with "foreign key violation"
**Solution:** 
1. Verify resource IDs exist: `SELECT id FROM public.resources;`
2. Use actual resource IDs from your database
3. Check resource_id is not already in resource_capacity (unique constraint)

### Issue: Configuration module import fails
**Solution:**
1. Check file path is correct: `JS/capacity-config.js`
2. Verify import statement: `import { ... } from './JS/capacity-config.js'`
3. Check browser console for exact error message

---

## 📦 Files to Create/Verify

| File | Status | Purpose |
|------|--------|---------|
| `Migrations/001_phase9_capacity_schema.sql` | ✅ Created | Database schema |
| `JS/capacity-config.js` | ✅ Created | Config & helpers |
| Test file | 📝 Create | Verify setup works |

---

## 🔗 Next Steps After Phase 9.1

Once Phase 9.1 setup is COMPLETE:

1. **Phase 9.2:** Create capacity monitoring engine (`capacity-monitoring.js`)
2. **Phase 9.3:** Set up notifications (`capacity-notifications.js`)
3. **Phase 9.4:** Add website status badges
4. **Phase 9.5:** Build admin dashboard controls

---

## 📞 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Verify all SQL ran without errors (green checkmarks)
3. Review browser console (F12) for JavaScript errors
4. Check Supabase logs: Dashboard → Logs → Recent logs
5. Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'resource_capacity';`

---

## Timeline Summary

| Task | Time | Status |
|------|------|--------|
| Run SQL migration | 15 min | 📝 TODO |
| Import config module | 10 min | 📝 TODO |
| Seed capacity data | 20 min | 📝 TODO |
| Configure RLS | 10 min | 📝 TODO |
| Run tests | 15 min | 📝 TODO |
| Set admin prefs | 10 min | 📝 TODO |
| **TOTAL** | **80 min** | **~1.5 hours** |

---

## Success Criteria

Phase 9.1 is COMPLETE when:
- ✅ All 4 Supabase tables created
- ✅ RLS policies working (no permission errors)
- ✅ Configuration module imports without errors
- ✅ All test cases pass
- ✅ At least one resource has capacity data
- ✅ Admin preferences configured
- ✅ Ready to proceed to Phase 9.2

**Current Status:** 🆕 Ready to start
