# Phase 9 Capacity Alerts - Quick Implementation Guide

**Status:** 🆕 PROPOSED (Add-on to Phases 1-8)  
**Timeline:** 2 weeks  
**Priority:** HIGH (Critical library feature)

---

## Overview

**What:** Real-time capacity monitoring with alerts + public status display  
**Why:** Librarians need to know when spaces are full + students need to see availability  
**How:** Supabase tables + occupancy calculations + multi-channel notifications

---

## 📋 Implementation Checklist

### Phase 9.1: Setup Database (Day 1-2)
```sql
-- 1. Resource capacity config
CREATE TABLE resource_capacity (...)
-- 2. Real-time occupancy snapshots
CREATE TABLE occupancy_snapshots (...)
-- 3. Capacity alerts log
CREATE TABLE capacity_alerts (...)
-- 4. Admin notification preferences
CREATE TABLE admin_notifications (...)
```
- [ ] Create 4 new Supabase tables
- [ ] Add Row-Level Security (RLS) policies
- [ ] Seed resource_capacity with max capacity data
- [ ] Create auto-update triggers

### Phase 9.2: Core Monitoring (Day 3-5)
```javascript
// New module: capacity-monitoring.js
calculateOccupancyPercentage(count, max)
detectThresholdBreaches(percentage)
generateCapacityAlert(resource, occupancy, threshold)
aggregateOccupancyData(ultrasonic, rfid, ble)
recordOccupancySnapshot(resource, occupancy, max)
getActiveCapacityAlerts()
```
- [ ] Create capacity-monitoring.js module
- [ ] Wire up Supabase subscriptions
- [ ] Test threshold detection (80%, 95%, 100%)

### Phase 9.3: Send Notifications (Day 5-6)
```javascript
// New module: capacity-notifications.js
notifyAdminsOfCapacityAlert(alert, preferences)
sendCapacityAlertEmail(recipients, alert)
sendCapacityAlertSMS(phones, alert)          // optional
pushDashboardNotification(adminId, alert)
shouldSnoozeAlert(resourceId, threshold)
```
- [ ] Setup email provider (SendGrid/Mailgun)
- [ ] Create email templates
- [ ] Implement in-app notifications
- [ ] Add SMS (optional via Twilio)

### Phase 9.4: Website Status Display (Day 7-8)
```html
<!-- Add capacity badges to: -->
- FrameDashboard.html (resource cards)
- FrameResourceList.html (in table)
- Homepage/Landing page
- Mobile view

<!-- Status shows: -->
- Occupancy percentage (0-100%)
- Color coded (green/yellow/red/full)
- "Full Capacity" label when at 100%
- Real-time updates every 30 seconds
```
- [ ] Add .occupancy-badge CSS
- [ ] Add status display component
- [ ] Wire up real-time refresh (30s intervals)
- [ ] Test mobile responsiveness

### Phase 9.5: Admin Controls (Day 8-9)
```html
<!-- New section in FrameAdminPanel.html: -->
- Active Capacity Alerts (summary cards)
- Alerts table with actions (dismiss, view)
- Resource threshold configuration
- Notification preferences (email/SMS/dashboard)
- Alert history (7-day view)
```
- [ ] Add "Capacity Management" panel to admin
- [ ] Implement configuration UI
- [ ] Implement preference UI
- [ ] Add alert history table

### Phase 9.6: Analytics (Day 10)
```javascript
getCapacityTimeline(resourceId, days)
getFullCapacityFrequency(resourceId)
generateCapacityReport(resourceId, range)

Display:
- 7-day occupancy chart
- Stats: days at full, peak hours, alert count
- Capacity recommendation (need expansion?)
```
- [ ] Add analytics section to admin
- [ ] Generate capacity reports
- [ ] Create occupancy charts

### Phase 9.7: Real-time Integration (Day 10-11)
```
Occupancy Data → Validation → Calculation → Alert Check
    → Notify Admins → Update Website → Log
    → Repeat every 30 seconds via Supabase
```
- [ ] Connect all 6 phases together
- [ ] Verify end-to-end flow
- [ ] Test real-time updates

### Phase 9.8: Testing (Day 12-14)
- [ ] Unit tests (threshold detection, calculations)
- [ ] Integration tests (E2E occupancy → alert → website update)
- [ ] Load tests (1000+ resources)
- [ ] Edge cases (exactly 80/95/100%, rapid changes)
- [ ] Browser/device testing

### Phase 9.9: Deploy (Day 15-16)
- [ ] Train admin team
- [ ] Create user documentation
- [ ] Deploy to production
- [ ] Monitor 7 days for issues
- [ ] Collect feedback

---

## 🎯 Key Configuration

```javascript
const CAPACITY_CONFIG = {
  thresholds: {
    warning: 0.80,      // Alert at 80%
    critical: 0.95,     // Alert at 95%
    full: 1.00          // Alert at 100%
  },

  snooze: {
    80: 15,   // minutes - avoid spam
    95: 5,
    100: 2
  },

  notificationChannels: {
    dashboard: true,    // In-app
    email: true,        // Email alerts
    sms: false          // Optional
  },

  refreshInterval: 30000  // Update every 30 seconds
}
```

---

## 📢 Alert Levels

| Level | Threshold | Severity | Color | Action |
|-------|-----------|----------|-------|--------|
| Available | 0-80% | INFO | 🟢 Green | Monitor only |
| Busy | 80-95% | HIGH | 🟡 Yellow | Notify admin |
| Near Full | 95-100% | CRITICAL | 🔴 Red | Urgent notification |
| Full | ≥100% | CRITICAL | ⛔ Pink | Block entry, notify |

---

## 📊 Database Schema Summary

### resource_capacity
```
- resource_id (FK)
- max_capacity (150)
- alert_threshold_80 (true/false)
- alert_threshold_95 (true/false)
- alert_at_full (true/false)
```

### occupancy_snapshots
```
- resource_id (FK)
- occupancy_count (38)
- max_capacity (40)
- occupancy_percentage (95)
- source ('ultrasonic'|'rfid'|'ble')
- is_full_capacity (true/false)
```

### capacity_alerts
```
- resource_id (FK)
- alert_type ('threshold_80'|'95'|'full')
- severity ('HIGH'|'CRITICAL')
- status ('active'|'resolved'|'dismissed')
- triggered_at
- dismissed_at
- dismissed_by (FK to admin)
```

### admin_notifications
```
- user_id (FK)
- resource_id (FK or NULL = all)
- alert_80_email (true/false)
- alert_95_email (true/false)
- alert_full_email (true/false)
- alert_80_dashboard, etc.
- alert_80_sms, etc. (if SMS enabled)
```

---

## 🔌 Integration Points

### In analytics.js:
```javascript
import { monitorResourceCapacity } from './capacity-monitoring.js'
import { notifyAdminsOfCapacityAlert } from './capacity-notifications.js'

// After occupancy calculation:
const occupancy = calculateOccupancy(ultrasonicData, rfidData, bleData)
await monitorResourceCapacity(supabase, resourceId, occupancy)  // NEW
```

### In FrameAdminPanel.html:
```html
<!-- Add new section -->
<div class="panel capacity-management">
  <h3>Capacity Management & Alerts</h3>
  <!-- Active alerts, configuration, preferences -->
</div>

<script type="module" src="JS/capacity-admin.js"></script>
```

### In FrameDashboard.html / Resource Cards:
```html
<!-- Add capacity badge -->
<div class="occupancy-display">
  <div class="occupancy-bar" style="width: 95%"></div>
  <span class="capacity-badge status-critical">95% Full</span>
</div>

<script type="module" src="JS/capacity-status-widget.js"></script>
```

---

## 📧 Email Alert Template

**Subject:** ⚠️ CAPACITY ALERT - Study Room A at 95%

```
Study Room A: 38 of 40 users (95%)
📍 Location: Building C, Floor 2

ACTION ITEMS:
- Monitor for overflow
- Prepare to close if reaching 100%
- Notify front desk

Updated: May 14, 2026 @ 2:45 PM
View Dashboard: [link]
```

---

## 🌐 Website Status Display

### Locations to Show Capacity:
1. Dashboard (main resource cards)
2. Resource listing page
3. Individual resource detail page
4. Homepage (summary widget)
5. Mobile app (if exists)

### Information Shown:
- Occupancy percentage (X/Y users)
- Visual bar (green→yellow→red progression)
- Status badge: "Available" / "Busy" / "Near Full" / "Full"
- Last updated time
- Estimated when capacity will drop (optional ML prediction)

---

## ⏱️ Real-Time Update Flow

```
30 seconds → Occupancy data arrives
   ↓
Phase 1: Validate data
   ↓
Phase 9.2: Calculate occupancy %
   ↓
Check: Did % cross 80/95/100?
   ├─ YES → Phase 9.3: Send alerts
   │          Phase 9.4: Update website
   │          Phase 9.5: Log in dashboard
   └─ NO → Continue monitoring
   ↓
Supabase real-time push updates UI
   ↓
30 seconds → repeat
```

---

## 🧪 Test Scenarios

### Scenario 1: Normal Operation
```
1. Occupancy at 45% → Website shows "Available" ✅
2. Occupancy at 82% → Alert triggered, email sent ✅
3. Admin notified on dashboard ✅
4. Website shows "Near Full" badge ✅
```

### Scenario 2: Full Capacity
```
1. Occupancy at 100% → CRITICAL alert ✅
2. Email + SMS + dashboard notification ✅
3. Website shows "Full Capacity" in red/pink ✅
4. Access can be blocked (future enhancement) ✅
```

### Scenario 3: Rapid Changes
```
1. 50% → 75% → 85% → 92% → 98%
2. Alerts at 80% and 95% only (not continuous) ✅
3. No spam due to 15-min snooze ✅
```

### Scenario 4: Recovery
```
1. Was at 98%, now drops to 70%
2. Alert status → "resolved" automatically ✅
3. Website updates to "Available" ✅
4. No spam on recovery ✅
```

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Alert latency | <2 sec | Time from occupancy update to alert sent |
| Email delivery | <5 min | Check email timestamp vs. alert time |
| Website update | <30 sec | Manual test via live occupancy test |
| System uptime | 99.9% | Monitor Supabase API + functions |
| False positives | <1% | Review alert logs weekly |
| Admin satisfaction | 4/5 stars | Post-deployment survey |

---

## 🚀 Deployment Checklist

- [ ] All 4 Supabase tables created + populated
- [ ] RLS policies configured (admins only)
- [ ] Mobile testing (capacity badges responsive)
- [ ] Email provider tested (1 email -> inbox check)
- [ ] Admin dashboard tested (alerts appear/disappear)
- [ ] Real-time updates verified (<2s latency)
- [ ] Snooze prevents duplicate alerts ✅
- [ ] Alert history populated correctly ✅
- [ ] All unit tests pass (95%+ pass rate)
- [ ] Load test with 1000+ resources passes
- [ ] Admin team trained on new features
- [ ] Documentation complete + published
- [ ] Monitoring alerts configured (alert failures)
- [ ] Rollback plan ready (disable Phase 9 section)
- [ ] Go-live: Monitor first 24 hours closely

---

## 🔮 Future Enhancements (Phase 10)

- [ ] **ML Capacity Prediction:** "Room will be full in 23 minutes"
- [ ] **Dynamic Pricing:** Lower reservation price when capacity high
- [ ] **Reservation Blocking:** Can't reserve when at capacity
- [ ] **Cross-Facility Balancing:** "Try Study Room B - 40% full"
- [ ] **Public Displays:** Show capacity on lobby screens
- [ ] **Slack Integration:** Alerts in Slack channel
- [ ] **Mobile App Push:** Native iOS/Android notifications
- [ ] **Historical Reports:** Monthly capacity utilization reports

---

## Support & Troubleshooting

### Alert not triggering?
- Check: resource_capacity table has max_capacity set
- Check: Admin notification preferences enabled
- Check: Supabase real-time subscription active

### Email not delivering?
- Verify email provider credentials
- Check spam folder
- Test: Send manual email via Supabase functions

### Website status not updating?
- Refresh page (should update within 30s)
- Check: occupancy_snapshots table being updated
- Check: Browser console for JS errors

### False positive alerts?
- Increase snooze duration (15→30 mins)
- Add data validation (Phase 1 outlier detection)
- Review sensor calibration (ultrasonic/RFID)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| capacity-monitoring.js | CREATE | Core monitoring engine |
| capacity-notifications.js | CREATE | Email/SMS/dashboard alerts |
| capacity-admin.js | CREATE | Admin panel controls |
| capacity-status-widget.js | CREATE | Website status display |
| capacity-analytics.js | CREATE | Reports & charts |
| PHASE9_CAPACITY_ALERTS.md | CREATE | Full documentation |
| FrameAdminPanel.html | MODIFY | Add capacity section |
| FrameDashboard.html | MODIFY | Add capacity badges |
| analytics.js | MODIFY | Integrate monitoring |
| CSS/adminpanel.css | MODIFY | Add capacity styles |
| CSS/dashboard.css | MODIFY | Add badge styles |

---

## Estimated Effort

- **Development:** 10-12 days
- **Testing:** 3-4 days
- **Documentation:** 1-2 days
- **Total:** ~2 weeks
- **Team:** 1-2 developers

---

## Success Story

After Phase 9 deployment:
- ✅ Admins get real-time capacity alerts
- ✅ Students see live availability on website
- ✅ "Full Capacity" automatically displays when needed
- ✅ No more overcrowding incidents
- ✅ Data-driven insights on busiest times
- ✅ Ability to close spaces temporarily when full
