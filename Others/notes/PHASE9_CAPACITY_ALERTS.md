# Phase 9: Real-Time Capacity Alerts & Status Display

**Status:** 🆕 PROPOSED  
**Timeline:** Week 8-9 (builds on Phases 1-7)  
**Priority:** HIGH (library operations critical feature)  
**Dependencies:** Phase 1 (data), Phase 4 (rendering), Phase 7 (testing)

---

## ✨ Feature Overview

**Goal:** Alert administrators when spaces approach or reach full capacity + display status on website

### Key Components:
1. **Real-time capacity monitoring** - Track current occupancy vs. resource capacity
2. **Intelligent thresholds** - Configurable alerts (e.g., 80%, 95%, 100%)
3. **Admin notifications** - Email, dashboard alerts, SMS (optional)
4. **Public status display** - Show "Full Capacity" on student-facing website
5. **Historical tracking** - Log capacity breach events
6. **Multi-resource alerts** - Handle multiple spaces simultaneously
7. **Emergency evacuation support** - RFID timestamps for individual identification and ultrasonic movement logs

---

## 🎯 Objectives

- [ ] Set configurable capacity thresholds per resource
- [ ] Calculate real-time occupancy percentage vs. max capacity
- [ ] Generate alerts at 80%, 95%, and 100% thresholds
- [ ] Send admin notifications (email, push, in-dashboard)
- [ ] Display "Full Capacity" status on website/dashboard
- [ ] Provide capacity breach history and analytics
- [ ] Implement Supabase real-time subscription for live updates
- [ ] Add evacuation-mode telemetry: RFID timestamps + ultrasonic movement logs

---

## 📊 Phase Breakdown

### **Phase 9.1: Data Schema & Configuration** (Week 8, Day 1-2)

**Goal:** Extended data model for capacity management

#### Supabase Tables to Create/Modify:

```sql
-- 1. Resource capacity configuration
CREATE TABLE resource_capacity (
  id BIGSERIAL PRIMARY KEY,
  resource_id BIGINT NOT NULL REFERENCES resources(id),
  max_capacity INT NOT NULL,               -- How many people max
  alert_threshold_80 BOOLEAN DEFAULT true, -- Alert at 80%
  alert_threshold_95 BOOLEAN DEFAULT true, -- Alert at 95%
  alert_at_full BOOLEAN DEFAULT true,      -- Alert at 100%
  full_capacity_label TEXT DEFAULT 'Full', -- Custom label
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource_id)
);

-- 2. Real-time occupancy snapshots (for comparison)
CREATE TABLE occupancy_snapshots (
  id BIGSERIAL PRIMARY KEY,
  resource_id BIGINT NOT NULL REFERENCES resources(id),
  occupancy_count INT NOT NULL,            -- Current count
  max_capacity INT NOT NULL,
  occupancy_percentage INT NOT NULL,       -- Calculated %
  source TEXT NOT NULL,                    -- 'ultrasonic'|'rfid'|'ble'
  confidence INT DEFAULT 100,              -- 0-100% confidence
  is_full_capacity BOOLEAN DEFAULT false,  -- Binary flag
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(resource_id) REFERENCES resources(id)
);

-- 3. Capacity alerts log
CREATE TABLE capacity_alerts (
  id BIGSERIAL PRIMARY KEY,
  resource_id BIGINT NOT NULL REFERENCES resources(id),
  alert_type TEXT NOT NULL,               -- 'threshold_80'|'threshold_95'|'full_capacity'
  occupancy_count INT NOT NULL,
  occupancy_percentage INT NOT NULL,
  severity TEXT NOT NULL,                 -- 'HIGH'|'CRITICAL'
  status TEXT DEFAULT 'active',           -- 'active'|'resolved'|'dismissed'
  triggered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,                  -- When capacity dropped below threshold
  dismissed_at TIMESTAMP,                 -- When admin dismissed
  dismissed_by BIGINT REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Admin notification preferences
CREATE TABLE admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES auth.users(id),
  resource_id BIGINT REFERENCES resources(id),  -- NULL = all resources
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
  snooze_minutes INT DEFAULT 0,           -- Snooze duplicate alerts for N min
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Implementation Tasks:
- [x] Create above tables in Supabase
- [x] Add Row-Level Security (RLS) policies for capacity data
- [x] Create triggers for `capacity_alerts` status updates
- [x] Seed `resource_capacity` with existing resources
- [x] Document schema in migration file

#### Configuration Constants:
```javascript
const CAPACITY_CONFIG = {
  thresholds: {
    warning: 0.80,      // 80% - Yellow alert
    critical: 0.95,     // 95% - Red alert
    full: 1.00          // 100% - Full capacity
  },
  
  alertSeverity: {
    80: 'HIGH',
    95: 'CRITICAL',
    100: 'CRITICAL'
  },

  snoozeDefaults: {
    80: 15,    // minutes - avoid alert spam
    95: 5,
    100: 2
  },

  occupancySources: ['ultrasonic', 'rfid', 'ble'],
  
  notificationChannels: {
    dashboard: true,  // In-app notifications
    email: true,
    sms: false        // Optional
  }
}
```

**🔍 Output:** ✅ Supabase schema ready, capacity tracking infrastructure in place

---

### **Phase 9.2: Core Capacity Monitoring Engine** (Week 8, Day 3-5)

**Goal:** Real-time capacity calculations and threshold detection

#### New Module: `capacity-monitoring.js`

**Key Functions:**

```javascript
/**
 * Calculate current occupancy percentage for a resource
 */
calculateOccupancyPercentage(occupancyCount, maxCapacity)
// Returns: {percentage: 0-100, category: 'low'|'medium'|'high'|'full'}

/**
 * Determine which threshold(s) are crossed
 */
detectThresholdBreaches(percentage, previousPercentage)
// Returns: {breached: [80, 95, 100], newly: [95]}  (newly = first time)

/**
 * Generate alerts for threshold breach
 */
generateCapacityAlert(resource, occupancy, threshold, severity)
// Returns: AlertObject with type, severity, occupancy%, timestamp

/**
 * Check if alert already exists + not snoozed
 */
shouldGenerateAlert(resourceId, threshold)
// Returns: {shouldAlert: boolean, reason: string}

/**
 * Calculate occupancy from multiple sensor sources
 */
aggregateOccupancyData(ultrasonicData, rfidData, bleData)
// Returns: {count: N, source: 'primary'|'fallback', confidence: 0-100}

/**
 * Track occupancy snapshot over time
 */
recordOccupancySnapshot(resource, occupancy, maxCapacity)
// Stores snapshot in occupancy_snapshots table

/**
 * Retrieve active capacity alerts for dashboard
 */
getActiveCapacityAlerts(filters)
// Returns: [{resourceId, type, severity, occupancy%, triggeredAt}]

/**
 * Dismiss/resolve capacity alert
 */
resolveCapacityAlert(alertId, status, dismissedBy)
// Updates alert status in database
```

#### Implementation Details:

```javascript
// Example: Real-time capacity calculation flow
async function monitorResourceCapacity(supabase, resourceId) {
  // 1. Get resource config (max capacity)
  const {data: config} = await supabase
    .from('resource_capacity')
    .select('*')
    .eq('resource_id', resourceId)

  // 2. Get current occupancy from best available source
  const occupancy = await getLatestOccupancy(resourceId)
  
  // 3. Calculate percentage
  const percentage = (occupancy.count / config.max_capacity) * 100
  
  // 4. Detect threshold breaches
  const breaches = detectThresholdBreaches(percentage)
  
  // 5. Generate alerts for new breaches
  for (const threshold of breaches.newly) {
    const alert = await generateCapacityAlert(
      resourceId, 
      occupancy.count, 
      threshold
    )
    await notifyAdmins(alert)
  }
  
  // 6. Snapshot occupancy state
  await recordOccupancySnapshot(occupancy, config)
  
  // 7. Update resource status on website
  await updatePublicResourceStatus(resourceId, {
    isFullCapacity: percentage >= 100,
    occupancyPercentage: Math.min(100, percentage),
    lastUpdated: new Date()
  })
}
```

#### Supabase Real-time Subscription:

```javascript
// Listen for occupancy changes
const occupancyChannel = supabase
  .channel('resource-occupancy-changes')
  .on('postgres_changes', 
    {
      event: '*',
      schema: 'public',
      table: 'occupancy_snapshots'
    },
    payload => {
      monitorResourceCapacity(supabase, payload.new.resource_id)
    }
  )
  .subscribe()
```

#### Alert Generation Logic:

```javascript
// Threshold breach detection state machine
const ALERT_STATES = {
  LOW:      { range: [0, 80),    severity: 'INFO' },
  MEDIUM:   { range: [80, 95),   severity: 'HIGH' },
  HIGH:     { range: [95, 100),  severity: 'CRITICAL' },
  FULL:     { range: [100, 100], severity: 'CRITICAL' }
}

// Only alert on TRANSITIONS, not sustain
if (previousState < ALERT_STATES.MEDIUM && currentState >= ALERT_STATES.MEDIUM) {
  // NEW breach at 80% → generate alert
  generateAlert('threshold_80')
}
```

**🔍 Output:** ✅ Real-time capacity engine with threshold detection

---

### **Phase 9.3: Admin Notification System** (Week 8, Day 5 - Week 9, Day 1)

**Goal:** Multi-channel alert delivery (email, dashboard, SMS)

#### Notification Module: `capacity-notifications.js`

**Key Functions:**

```javascript
/**
 * Send alert to admin(s) - multi-channel
 */
notifyAdminsOfCapacityAlert(alert, adminPreferences)
// Sends via configured channels: email, dashboard, SMS

/**
 * Send email alert
 */
sendCapacityAlertEmail(recipients, alert, resourceInfo)
// Email template: "ALERT: Library Main Study Room at 95% capacity (38/40 users)"

/**
 * Send SMS alert (optional)
 */
sendCapacityAlertSMS(phoneNumbers, alert, resourceInfo)
// Text: "[CAPACITY] Main Study Room: 95% (38/40) - Visit dashboard"

/**
 * Push dashboard notification
 */
pushDashboardNotification(adminId, alert)
// Stores in-app notification for admin to see

/**
 * Get admin notification preferences
 */
getAdminPreferences(userId, resourceId)
// Returns: which channels (email, SMS, dashboard) enabled, snooze rules

/**
 * Snooze duplicate alerts (prevent spam)
 */
shouldSnoozeAlert(resourceId, threshold, lastAlertTime)
// Returns: {shouldSnooze: boolean, minutesRemaining: N}

/**
 * Log notification delivery
 */
logNotificationDelivery(alertId, channel, status, deliveredAt)
// Audit trail for notification system
```

#### Email Template Example:

```html
Subject: ⚠️ CAPACITY ALERT - {{resource.name}} at {{occupancy}}%

Dear {{admin.name}},

{{resource.name}} is approaching full capacity:

📊 OCCUPANCY: {{occupancyCount}}/{{maxCapacity}} users ({{occupancy}}%)
📍 LOCATION: {{resource.location}}
⏰ ALERT TIME: {{formattedTime}}
🔴 SEVERITY: {{severity}}

ACTION NEEDED:
- Consider closing the resource if at 100%
- Update website status if full
- Notify front desk staff
- Monitor for capacity overflow

→ View Dashboard: {{dashboardLink}}

---
Alert configured at {{threshold}}%  
Configure preferences: {{preferencesLink}}
```

#### Dashboard Notification UI Component:

```javascript
// In-app notification card
<div class="capacity-alert-card severity-{{severity}}">
  <div class="alert-icon">📊</div>
  <div class="alert-content">
    <h4>{{resource.name}} - {{occupancy}}% Full</h4>
    <p>{{occupancyCount}}/{{maxCapacity}} users</p>
    <span class="alert-time">{{timeAgo}}</span>
  </div>
  <div class="alert-actions">
    <button class="btn-dismiss">Dismiss</button>
    <a class="btn-view">View Resource</a>
  </div>
</div>
```

#### Notification Channels Implementation:

```javascript
// Email via Supabase functions
supabase.functions.invoke('send-capacity-alert-email', {
  body: {
    to: admin.email,
    alertType: 'capacity_breach',
    resourceId: resourceId,
    occupancy: occupancyPercentage
  }
})

// Dashboard notification (stored in DB)
await supabase
  .from('notifications')
  .insert({
    user_id: adminId,
    type: 'capacity_alert',
    resource_id: resourceId,
    content: `Alert: ${resource.name} at ${occupancy}%`,
    read: false,
    created_at: new Date()
  })

// Optional: SMS via Twilio integration
const twilio = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN)
await twilio.messages.create({
  body: `[CAPACITY] ${resource.name}: ${occupancy}% (${count}/${max})`,
  from: TWILIO_PHONE,
  to: admin.phone
})
```

**🔍 Output:** ✅ Multi-channel notifications working

---

### **Phase 9.4: Public Website Status Display** (Week 9, Day 2-3)

**Goal:** Show "Full Capacity" status on student-facing website

#### New Components:

**1. Capacity Status Badge:**

```html
<!-- On FrameDashboard.html or resource pages -->
<div class="resource-card">
  <h3>Study Room A</h3>
  <div class="occupancy-display">
    <div class="occupancy-bar">
      <div class="occupancy-fill" style="width: 95%"></div>
    </div>
    <span class="occupancy-text">38 of 40 (95%)</span>
  </div>
  
  <!-- Status badge -->
  <div class="capacity-badge status-critical">
    🔴 NEAR CAPACITY - May close soon
  </div>
  
  <!-- OR when full -->
  <div class="capacity-badge status-full">
    ⛔ FULL CAPACITY - Closed temporarily
  </div>
</div>
```

**2. Capacity Display Widget:**

```javascript
// Embed on homepage/dashboard
<capacity-status-widget 
  resourceId="study-room-a"
  displayMode="badge|full|minimal"
  refreshInterval="30000"
/>

// Widget shows:
// - Live occupancy % with color coding
// - "Full Capacity" vs "Available" status
// - Estimated when it might free up (ML prediction)
// - Last updated timestamp
```

**3. All-Resources Capacity Dashboard:**

```html
<section class="facility-capacity-overview">
  <h2>Facility Capacity Status</h2>
  <div class="capacity-grid">
    <!-- For each resource -->
    <div class="resource-capacity-card">
      <h4>Study Room A</h4>
      <div class="capacity-indicator">
        <div class="indicator-bar" style="background: hsl(0, 100%, 50%)"></div>
      </div>
      <p class="capacity-text">95% (38/40)</p>
      <span class="capacity-status">🔴 NEAR CAPACITY</span>
    </div>
    
    <div class="resource-capacity-card">
      <h4>Quiet Zone B</h4>
      <div class="capacity-indicator">
        <div class="indicator-bar" style="background: hsl(120, 100%, 50%)"></div>
      </div>
      <p class="capacity-text">45% (18/40)</p>
      <span class="capacity-status">✅ AVAILABLE</span>
    </div>
  </div>
</section>
```

**4. CSS for Status Indicators:**

```css
.capacity-badge {
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.capacity-badge.status-low {
  background-color: #e8f5e9;      /* Green */
  color: #2e7d32;
  border: 1px solid #66bb6a;
}

.capacity-badge.status-medium {
  background-color: #fff3e0;      /* Orange */
  color: #f57c00;
  border: 1px solid #ffb74d;
}

.capacity-badge.status-critical {
  background-color: #ffebee;      /* Light red */
  color: #c62828;
  border: 1px solid #ef5350;
}

.capacity-badge.status-full {
  background-color: #fce4ec;      /* Pink */
  color: #880e4f;
  border: 2px solid #ec407a;
}

.occupancy-bar {
  width: 100%;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.occupancy-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #ffc107 50%, #f44336 100%);
  transition: width 0.3s ease;
}
```

**5. Real-time Status Updates:**

```javascript
// Refresh capacity status every 30 seconds
setInterval(async () => {
  const resources = await fetchResourceCapacity()
  resources.forEach(resource => {
    const occupancy = (resource.occupancy_count / resource.max_capacity) * 100
    updateStatusBadge(resource.id, {
      occupancy: occupancy,
      isFull: occupancy >= 100,
      isNearFull: occupancy >= 95,
      status: getStatusLabel(occupancy)
    })
  })
}, 30000)

function getStatusLabel(occupancy) {
  if (occupancy >= 100) return '⛔ FULL CAPACITY'
  if (occupancy >= 95) return '🔴 NEAR CAPACITY'
  if (occupancy >= 80) return '🟡 GETTING BUSY'
  return '✅ AVAILABLE'
}
```

**🔍 Output:** ✅ Public website shows real-time capacity status

---

### **Phase 9.5: Admin Dashboard & Controls** (Week 9, Day 3-4)

**Goal:** Admin panel to manage capacity alerts

#### New Admin Panel Section: "Capacity Management"

```html
<section class="capacity-management-panel">
  <header>
    <h3>Capacity Management & Alerts</h3>
    <button class="btn btn-primary" data-action="configure">Configure Thresholds</button>
  </header>

  <!-- Active Alerts Summary -->
  <div class="alerts-summary">
    <div class="alert-card high">
      <span>🔴 CRITICAL (95%+)</span>
      <strong id="criticalCount">2</strong>
    </div>
    <div class="alert-card warning">
      <span>🟡 HIGH (80-95%)</span>
      <strong id="warningCount">5</strong>
    </div>
    <div class="alert-card info">
      <span>✅ FULL (100%)</span>
      <strong id="fullCount">1</strong>
    </div>
  </div>

  <!-- Active Alerts List -->
  <table class="capacity-alerts-table">
    <thead>
      <tr>
        <th>Resource</th>
        <th>Occupancy</th>
        <th>Severity</th>
        <th>Triggered</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="activeAlertsList"></tbody>
  </table>

  <!-- Resource Threshold Configuration -->
  <div class="threshold-config">
    <h4>Configure Resource Thresholds</h4>
    <div class="config-grid">
      <div class="config-item">
        <label for="resourceSelect">Resource:</label>
        <select id="resourceSelect">
          <option value="">All Resources</option>
          <!-- Resources list -->
        </select>
      </div>
      <div class="config-item">
        <label for="maxCapacity">Max Capacity:</label>
        <input id="maxCapacity" type="number" min="1" placeholder="Enter max capacity">
      </div>
      <div class="config-item">
        <label>Alert at Thresholds:</label>
        <label><input type="checkbox" name="alert-80"> 80%</label>
        <label><input type="checkbox" name="alert-95"> 95%</label>
        <label><input type="checkbox" name="alert-100"> 100%</label>
      </div>
    </div>
    <button class="btn btn-primary" id="saveThresholds">Save Configuration</button>
  </div>

  <!-- Admin Notification Preferences -->
  <div class="notification-prefs">
    <h4>Your Notification Preferences</h4>
    <table class="prefs-table">
      <thead>
        <tr>
          <th>Alert Level</th>
          <th>Email</th>
          <th>Dashboard</th>
          <th>SMS</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>80% Threshold</td>
          <td><input type="checkbox" name="email-80" checked></td>
          <td><input type="checkbox" name="dashboard-80" checked></td>
          <td><input type="checkbox" name="sms-80"></td>
        </tr>
        <tr>
          <td>95% Threshold</td>
          <td><input type="checkbox" name="email-95" checked></td>
          <td><input type="checkbox" name="dashboard-95" checked></td>
          <td><input type="checkbox" name="sms-95"></td>
        </tr>
        <tr>
          <td>Full Capacity</td>
          <td><input type="checkbox" name="email-100" checked></td>
          <td><input type="checkbox" name="dashboard-100" checked></td>
          <td><input type="checkbox" name="sms-100"></td>
        </tr>
      </tbody>
    </table>
    <button class="btn btn-primary" id="savePrefs">Save Preferences</button>
  </div>

  <!-- Capacity Alert History -->
  <div class="alert-history">
    <h4>Alert History (Last 7 Days)</h4>
    <table class="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Resource</th>
          <th>Occupancy</th>
          <th>Alert Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="alertHistoryList"></tbody>
    </table>
  </div>
</section>
```

#### Admin Functions:

```javascript
// Load all active capacity alerts
async function loadActiveCapacityAlerts() {
  const {data} = await supabase
    .from('capacity_alerts')
    .select(`
      *,
      resources(name, location, max_capacity)
    `)
    .eq('status', 'active')
    .order('created_at', {ascending: false})
  
  renderActiveAlerts(data)
}

// Dismiss alert
async function dismissCapacityAlert(alertId, adminId) {
  const {error} = await supabase
    .from('capacity_alerts')
    .update({
      status: 'dismissed',
      dismissed_at: new Date(),
      dismissed_by: adminId
    })
    .eq('id', alertId)
  
  if (!error) {
    console.log('✓ Alert dismissed')
    loadActiveCapacityAlerts()
  }
}

// Save threshold configuration
async function saveThresholdConfig(resourceId, maxCapacity, thresholds) {
  const {error} = await supabase
    .from('resource_capacity')
    .upsert({
      resource_id: resourceId,
      max_capacity: maxCapacity,
      alert_threshold_80: thresholds.at80,
      alert_threshold_95: thresholds.at95,
      alert_at_full: thresholds.atFull
    })
  
  if (!error) {
    console.log('✓ Configuration saved')
  }
}

// Save admin notification preferences
async function saveNotificationPreferences(userId, preferences) {
  const {error} = await supabase
    .from('admin_notifications')
    .upsert({
      user_id: userId,
      alert_80_email: preferences.email80,
      alert_95_email: preferences.email95,
      alert_full_email: preferences.emailFull,
      alert_80_dashboard: preferences.dashboard80,
      alert_95_dashboard: preferences.dashboard95,
      alert_full_dashboard: preferences.dashboardFull,
      alert_80_sms: preferences.sms80,
      alert_95_sms: preferences.sms95,
      alert_full_sms: preferences.smsFull,
      sms_number: preferences.phoneNumber
    })
  
  if (!error) {
    console.log('✓ Preferences saved')
  }
}
```

**🔍 Output:** ✅ Admin dashboard with full capacity management controls

---

### **Phase 9.6: Historical Analytics & Reporting** (Week 9, Day 5)

**Goal:** Track capacity trends over time

#### New Features:

```javascript
/**
 * Get capacity breach timeline for a resource
 */
getCapacityTimeline(resourceId, days = 30)
// Returns: [{date, breachCount, maxOccupancy, avgOccupancy}]

/**
 * Calculate "full capacity" frequency
 */
getFullCapacityFrequency(resourceId, timeframe = '7days')
// Returns: "Full 15 times in last week (avg 2.5/day)"

/**
 * Generate capacity report
 */
generateCapacityReport(resourceId, dateRange)
// Returns: PDF/CSV with:
// - Peak occupancy hours
// - Days at capacity
// - Alert frequency
// - Recommendations
```

#### Capacity Analytics Dashboard Section:

```html
<section class="capacity-analytics">
  <h3>Capacity Analytics</h3>
  
  <!-- Chart: Occupancy over 7 days -->
  <div class="chart-container">
    <canvas id="occupancyChart"></canvas>
  </div>
  
  <!-- Stats Cards -->
  <div class="analytics-stats">
    <div class="stat-card">
      <h4>Days at Full Capacity</h4>
      <strong>12 days</strong>
      <small>In last 30 days</small>
    </div>
    <div class="stat-card">
      <h4>Peak Hours</h4>
      <strong>2-4 PM</strong>
      <small>Most consistently full</small>
    </div>
    <div class="stat-card">
      <h4>Alerts Triggered</h4>
      <strong>47</strong>
      <small>Last 7 days</small>
    </div>
    <div class="stat-card">
      <h4>Recommendation</h4>
      <strong>Needs Expansion</strong>
      <small>Consider 50% capacity increase</small>
    </div>
  </div>
</section>
```

**🔍 Output:** ✅ Historical capacity analytics and trends

---

### **Phase 9.7: Integration & Real-Time Updates** (Week 9, Day 5 - Following Week)

**Goal:** Connect all components in real-time workflow

#### Integration Flow:

```
Occupancy Data (Ultrasonic/RFID/BLE)
         ↓
Phase 1: Data Validation ✅
         ↓
Phase 9.2: Capacity Calculation
         ↓
Is Threshold Crossed?
    ├─ YES → Phase 9.3: Notify Admins
    │         Phase 9.4: Update Website Status
    │         Phase 9.5: Log Alert
    └─ NO → Continue monitoring
         ↓
Supabase Real-time Subscription (updates every 30s)
         ↓
Dashboard/Website Refresh
```

#### Supabase Trigger Implementation:

```sql
-- Auto-update occupancy_snapshots
CREATE TRIGGER update_occupancy_snapshot
AFTER INSERT ON occupancy_readings
FOR EACH ROW
EXECUTE FUNCTION update_occupancy_snapshot_trigger();

-- Auto-resolve alerts when occupancy drops
CREATE TRIGGER resolve_capacity_alerts
AFTER INSERT ON occupancy_snapshots
FOR EACH ROW WHEN (NEW.occupancy_percentage < related_trigger_threshold)
EXECUTE FUNCTION resolve_capacity_alert_trigger();
```

#### Real-time Connection in App:

```javascript
// Connect to real-time occupancy updates
const subscription = supabase
  .channel('capacity-monitoring')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'occupancy_snapshots'
    },
    (payload) => {
      const {resource_id, occupancy_percentage, is_full_capacity} = payload.new
      
      // Update website badge in real-time
      updateCapacityBadge(resource_id, {
        percentage: occupancy_percentage,
        isFull: is_full_capacity
      })
      
      // Refresh admin dashboard
      if (isAdminDashboardOpen) {
        loadActiveCapacityAlerts()
      }
    }
  )
  .subscribe()
```

**🔍 Output:** ✅ All components connected with real-time updates

---

### **Phase 9.7A: Emergency Evacuation Support** (Optional, Week 9)

**Goal:** Improve emergency response with per-person RFID timestamps and ultrasonic movement logs for evacuation verification.

#### Data Model Additions:

```sql
-- 1) Active evacuation incidents
CREATE TABLE evacuation_incidents (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active', -- 'active'|'resolved'
  severity TEXT NOT NULL DEFAULT 'high', -- 'high'|'critical'
  initiated_by BIGINT REFERENCES auth.users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  notes TEXT
);

-- 2) RFID timestamp log for individual identification
CREATE TABLE evacuation_rfid_logs (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES evacuation_incidents(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES auth.users(id), -- optional if privacy requires
  rfid_tag TEXT,
  resource_id BIGINT REFERENCES resources(id),
  reader_id TEXT,
  direction TEXT, -- 'enter'|'exit'|'unknown'
  detected_at TIMESTAMP DEFAULT NOW()
);

-- 3) Ultrasonic movement logs (aggregate by zone)
CREATE TABLE evacuation_movement_logs (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES evacuation_incidents(id) ON DELETE CASCADE,
  resource_id BIGINT REFERENCES resources(id),
  sensor_id TEXT,
  occupancy_count INT NOT NULL,
  movement_delta INT NOT NULL, -- positive = entering, negative = exiting
  confidence INT DEFAULT 100,
  detected_at TIMESTAMP DEFAULT NOW()
);
```

#### Emergency Workflow Enhancements:
- Start an evacuation incident to scope logs and dashboards to a single event.
- Track last-seen timestamps per RFID tag and per resource (entry/exit confirmation).
- Surface a "last seen" roster and a "missing" list (no exit event after alert).
- Reconcile ultrasonic movement totals vs RFID exits to detect sensor gaps.

#### UI Updates (Emergency Dashboard):
- Evacuation timeline with RFID and ultrasonic event counts per minute.
- "Last seen" table (masked IDs if privacy requires) and manual check-in toggles.
- Exportable incident report with timestamps for compliance.

#### Security + Privacy Controls:
- Role-based access to RFID identities (admins only).
- Data retention policy (e.g., 30-90 days for logs, 1 year for incident summaries).
- Optional anonymization: store hashed RFID or user_id when needed.

#### Implementation Notes:
- Use Supabase real-time channels scoped to `evacuation_incidents`.
- Allow manual overrides when sensors are offline.
- Provide a "test incident" mode for drills.

---

### **Phase 9.8: Testing & QA** (Following Week, Days 1-3)

**Goal:** Comprehensive testing before production

#### Test Coverage:

```javascript
// Unit tests
✅ calculateOccupancyPercentage() accuracy
✅ detectThresholdBreaches() correctly identifies 80/95/100%
✅ shouldGenerateAlert() prevents spam
✅ aggregateOccupancyData() handles multiple sources
✅ Notification template rendering

// Integration tests
✅ E2E: Occupancy → Alert → Email sent → Dashboard updated
✅ Real-time updates reflect across website within 2 seconds
✅ Admin dismissal prevents duplicate alerts for 15 minutes
✅ Threshold config changes apply immediately

// Load testing
✅ 1000+ resources at different capacities
✅ 100+ simultaneous occupancy updates
✅ Email/SMS delivery under load

// Edge cases
✅ Resource at exactly 80%, 95%, 100%
✅ Rapid occupancy changes (80% → 100% → 50%)
✅ Network disconnection → reconnect → catch up on missed alerts
✅ Multiple admins dismissing same alert simultaneously
```

**🔍 Output:** ✅ Production-ready capacity system

---

### **Phase 9.9: Documentation & Deployment** (Week 10, Days 1-2)

**Goal:** Deploy to production with monitoring

#### Deliverables:

1. **Admin User Guide:**
   - How to configure resource capacities
   - Understanding capacity alerts (80%, 95%, 100%)
   - Managing notification preferences
   - Viewing capacity analytics

2. **IT/DevOps Documentation:**
   - Supabase schema setup
   - Email/SMS integrations
   - Real-time subscription configuration
   - Monitoring queries (alert counts, latency)

3. **Student-Facing Documentation:**
   - What "Full Capacity" means
   - How to check resource availability
   - Expected behavior when full

4. **Deployment Checklist:**
   ```
   - [ ] Create Supabase tables (Phase 9.1)
   - [ ] Seed resource_capacity with max_capacity data
   - [ ] Configure email provider (SendGrid/Mailgun)
   - [ ] (Optional) Setup Twilio for SMS
   - [ ] Run full test suite (Phase 9.8)
   - [ ] Train admin team on new features
   - [ ] Enable capacity monitoring in analytics.js
   - [ ] Deploy capacity-monitoring.js module
   - [ ] Update FrameAdminPanel.html with new section
   - [ ] Update dashboard/homepage with status badges
   - [ ] Monitor for 7 days: alert accuracy, delivery, performance
   - [ ] Collect admin feedback
   - [ ] Document any issues for Phase 10
   ```

**🔍 Output:** ✅ Phase 9 production-ready deployment

---

## 📊 Summary Table

| Phase | Component | Timeline | Status |
|-------|-----------|----------|--------|
| 9.1 | Supabase schema | Day 1-2 | 🆕 |
| 9.2 | Capacity engine | Day 3-5 | 🆕 |
| 9.3 | Notifications | Day 5-6 | 🆕 |
| 9.4 | Website status | Day 7-8 | 🆕 |
| 9.5 | Admin dashboard | Day 8-9 | 🆕 |
| 9.6 | Analytics | Day 10 | 🆕 |
| 9.7 | Real-time integration | Day 10-11 | 🆕 |
| 9.8 | Testing | Day 12-14 | 🆕 |
| 9.9 | Deploy & docs | Day 15-16 | 🆕 |

---

## 🎯 Key Metrics

**Success Criteria:**
- [ ] Alerts triggered within <2 seconds of occupancy breach
- [ ] Email delivery within <5 minutes
- [ ] Website status updates within <30 seconds
- [ ] 99.9% uptime of monitoring system
- [ ] Admin dashboard loads in <500ms
- [ ] <1% false positive alerts (spam prevention working)

---

## Dependencies

✅ **Depends on:** Phases 1, 4, 7 (data validation, integration, testing)  
📦 **Required APIs:** Supabase, Email provider (SendGrid, Mailgun, Resend)  
📦 **Optional:** SMS provider (Twilio)  
🔌 **Integration Points:** `analytics.js`, Admin Panel, Dashboard, Resource pages

---

## Next Phase (10): Future Enhancements

- [ ] ML-based capacity prediction (when will it fill?)
- [ ] Dynamic pricing adjustments based on occupancy
- [ ] Capacity-based reservation blocking
- [ ] Cross-facility balancing recommendations
- [ ] Mobile app push notifications
- [ ] Slack/Teams integration for alerts
- [ ] Capacity dashboard for public displays/screens
