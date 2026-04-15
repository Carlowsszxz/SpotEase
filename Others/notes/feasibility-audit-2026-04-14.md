# SpotEase Product-Feasibility Audit (Codebase Evidence)

Date: 2026-04-14  
Audit mode: **Repo-only, evidence-first, baseline challenged**

## Executive summary
The website is **partially compliant** with the SpotEase feasibility claims.

What is solid:
- Real-time occupancy data flow exists from DB tables to dashboard/emergency/map UIs.
- RFID assignment, RFID scan history, and unified admin observability (audit/security/occupancy/RFID timeline) are implemented.
- DB migrations include ingest paths for occupancy and RFID events.

What is not fully met:
- Person-centric identity movement tracking (“who is where and moving”) is not implemented as a first-class UI/logic flow.
- BLE/Bluetooth dual-layer tracking is not evidenced in frontend JS or SQL migrations.
- “Last seen” is present for RFID tag activity (`last_seen_at`), but not BLE signal-loss last-seen-location logic.

## Phase-by-phase findings

### Phase 1 — Claim decomposition (what was checked)
**Reasoning:** Turn feasibility narrative into testable claims and proof types.

#### 1) Claim matrix (audit targets)
1. Real-time occupancy
2. Identity tracking (person-level)
3. Last seen semantics
4. Emergency/accountability workflows
5. Admin support and observability
6. BLE/RFID/sensor tracking depth

#### 2) Pass criteria per claim
- **Real-time occupancy (pass):** UI renders occupancy values from database-backed sources, with realtime update handlers or polling tied to occupancy/resource state changes.
- **Identity tracking (pass):** system can associate presence events with user identity and expose a usable person-level view (not only room/resource aggregates).
- **Last seen (pass):** system stores and surfaces last-seen timestamp plus location/context aligned to product claim semantics.
- **Emergency/accountability (pass):** emergency UI supports response actions and accountability data from live backend sources, not static content.
- **Admin support (pass):** admins can operate core controls (assignment, event review, status actions) with persisted data paths.
- **BLE/RFID/sensor depth (pass):** repository shows concrete ingestion + processing + presentation logic for each claimed modality.

#### 3) Evidence standards used
- **Confirmed by code:** directly evidenced in repository files (UI markup, JS queries/subscriptions, SQL migrations/functions).
- **Implied:** behavior likely if runtime prerequisites exist (deployed schema, RLS, credentials, data feed), but not fully provable from static repo alone.
- **Mock/placeholder:** explicit demo text, fallback-only behavior, TODO/placeholder comments, or degraded paths indicating feature incompleteness.

#### 4) Ambiguity handling rules
- If wording is broad (example: “tracks people”), require both data association and user-facing person-level output to mark as fully met.
- If claim references BLE resilience, require BLE-specific entities/functions/events in code or migrations.
- If evidence is only migration-level (no consuming UI/service), mark as partial unless end-to-end path is present.

#### 5) Out-of-scope for this phase
- No assumptions from external systems not present in this repo (separate backend services, undisclosed edge functions, firmware runtime logs).
- No production-readiness certification; this phase defines audit criteria only.

### Phase 2 — Occupancy + sensor telemetry validation
**Reasoning:** Confirm whether occupancy is truly live and fed from sensor/event data, not static mock.

**Confirmed by code**
- Dashboard includes live occupancy containers and metrics.
- Dashboard pulls `resources`, `sensors`, and `occupancy_events` and subscribes to realtime changes.
- Emergency page uses sensor-derived occupancy totals and realtime resource updates.
- Map view computes availability from `current_occupancy` and active reservations, with realtime updates.
- Sensor Readings page is wired to `occupancy_events` and sensor/resource lookups.

**Implied (depends on runtime data/policies)**
- True “live” behavior requires populated tables, valid Supabase credentials, and RLS allowing reads.

**Mock/demo/placeholder indicators**
- Dashboard contains explicit sample/demo occupancy fallback text.

Verdict for occupancy: **MET (with runtime dependency caveat)**

### Phase 3 — Identity tracking + last seen
**Reasoning:** Validate whether system tracks people (not just room counts), and whether “last seen” matches product claim semantics.

**Confirmed by code**
- Admin can assign RFID tags to users via RPC.
- Users can view own RFID tap history and latest tap.
- Profile uses `user_rfid_tags.last_seen_at` as best-effort last tap/seen indicator.
- Migrations link `rfid_scans.user_id` and update `user_rfid_tags.last_seen_at` during ingest.

**Not confirmed / missing**
- No person-presence map/dashboard showing current individual location or movement path.
- No BLE identity stream, BLE proximity zones, or BLE-to-user session logic.
- No BLE signal-loss detector writing “last seen location + time” for Bluetooth dropouts.

Verdict:
- Identity tracking: **PARTIAL** (RFID events yes; person-location/movement view no)
- Last seen: **PARTIAL** (RFID last seen timestamp yes; BLE-loss last-seen-location no)

### Phase 4 — Emergency/accountability flows
**Reasoning:** Check if emergency mode supports accountability actions with data-backed logic.

**Confirmed by code**
- Emergency page supports room selection, sensor-based estimated inside count, updates feed, safe-point guidance, and user check-in.
- Emergency updates are sourced from `announcements` (time-window filtered).

**Explicit placeholder/de-scope**
- Emergency script explicitly states RFID identification is placeholder until hardware + DB exist.

Verdict for emergency/accountability: **PARTIAL**

### Phase 5 — Admin support + observability
**Reasoning:** Validate operator-facing feasibility (assignment, events, timeline, controls).

**Confirmed by code**
- Admin panel includes resource management, sensor status, reservations, RFID assignment.
- Security events load and support acknowledge/resolve actions.
- Audit Logs page merges audit, security, occupancy, and RFID entries into one timeline.
- Sensor Readings page provides stale/no-data health indicators and exports.

**Ambiguous/runtime-dependent**
- Some admin flows gracefully degrade if security tables/policies are absent.

Verdict for admin support: **MET (with environment caveat)**

### Phase 6 — BLE/RFID/sensor feasibility depth
**Reasoning:** Separate implemented RFID/sensor logic from claimed BLE dual-layer tracking.

**Confirmed by code**
- Strong RFID and occupancy-event ingestion support in migrations and UI consumers.

**Missing evidence**
- No BLE/Bluetooth implementation signals in repo JS/SQL for tracking pipeline.

Verdict:
- RFID/sensor tracking: **MET/PARTIAL** (event-level present; person movement abstraction partial)
- BLE tracking: **MISSING**

## Met / Partial / Missing checklist

### MET
- Real-time occupancy pipeline (dashboard/emergency/map + realtime subscriptions)
- RFID assignment and RFID activity history
- Admin observability (audit/security/occupancy/RFID timeline)
- Sensor telemetry/health operational view

### PARTIAL
- Identity tracking (event-level RFID exists; person-level live location/movement UX missing)
- Last seen (RFID timestamp exists; BLE-loss location/time behavior missing)
- Emergency/accountability (strong occupancy + updates + check-in, but identity-specific emergency proof is incomplete)

### MISSING
- BLE/Bluetooth dual-layer tracking implementation
- BLE signal-loss-triggered “last seen location + time” pipeline
- Central person-centric “who is currently inside where” view tied to identity

## Evidence from files/pages/scripts

### Occupancy, realtime, map
- `FrameDashboard.html` live occupancy UI and sample fallback text
- `JS/dashboard.js` realtime on `resources` + `occupancy_events`
- `JS/services/dashboard-data.js` reads `resources`, `sensors`, `occupancy_events`, `announcements`
- `FrameEmergency.html` estimated inside + live safety updates
- `JS/emergency.js` occupancy cache/realtime + announcements polling
- `JS/map-floorplan.js` availability from occupancy/reservations + realtime subscriptions
- `JS/services/map-data.js` filtered resource snapshot + active reservations queries

### Identity, RFID, last seen
- `FrameAdminPanel.html` RFID Assignment controls
- `JS/services/adminpanel-data.js` RPC `admin_assign_rfid_tag`
- `JS/accesshistory.js` self RFID scan history (`rfid_scans`)
- `JS/profile.js` reads `user_rfid_tags.last_seen_at` and latest `rfid_scans`
- `Others/database/migrations/009_user_rfid_tags.sql` table with `last_seen_at`
- `Others/database/migrations/012_profile_rfid_activity.sql` ingest updates `last_seen_at`

### Emergency/accountability
- `FrameEmergency.html` action controls + check-in + occupancy + updates
- `JS/emergency.js` explicit placeholder note for RFID identification

### Admin and observability
- `FrameAuditLogs.html` unified incident timeline page
- `JS/auditlogs.js` merges sources `audit`, `security`, `occupancy`, `rfid`
- `FrameSensorReadings.html` stale/missing sensor health table
- `JS/sensorreadings.js` occupancy-events-backed operational telemetry
- `JS/adminpanel.js` security event fallback note when DB/policies are missing

### Ingest and backend support
- `Others/database/migrations/004_esp32_occupancy_upgrade.sql` occupancy ingest + trigger-maintained `current_occupancy`
- `Others/database/migrations/006_rfid_log_ingest.sql` base RFID ingest
- `Others/database/migrations/012_profile_rfid_activity.sql` user-linked RFID ingest and last-seen updates

## Risks and gaps
- **Feasibility overstatement risk:** Product narrative claims BLE dual-layer resilience; repo evidence currently supports RFID + occupancy more strongly than BLE.
- **Operational ambiguity risk:** Multiple flows depend on applied migrations + RLS + data feed; frontend alone cannot prove production readiness.
- **Accountability gap:** No clear person-centric “present now by identity and zone” screen for responders.
- **Last-seen semantics gap:** Current last-seen is RFID-focused; does not satisfy Bluetooth-off/lost-signal claim.

## Recommended next steps
1. Implement BLE event ingestion schema/function (e.g., `ble_beacons`, `ble_presence_events`) with user-resolution logic.
2. Add signal-loss detector job/function to persist `last_seen_location`, `last_seen_at`, and reason (`ble_timeout`, `rfid_tap`, etc.).
3. Build a person-centric emergency roster view (current location, confidence source, last seen fallback).
4. Add explicit UI states distinguishing live, delayed, and demo data.
5. Add an end-to-end validation script/checklist (seed data + expected realtime behaviors) for feasibility demos.
6. Update feasibility document language to “implemented / pilot / planned” tiers to avoid over-claiming.

## Ambiguities and proof required
- **Ambiguity:** Whether some missing behavior exists outside this repo (edge functions, firmware backend, separate services).
- **Proof needed:**
  - Supabase production schema snapshot and deployed functions list
  - Runtime logs from BLE ingest path (if external)
  - Demo capture showing person-level movement + BLE-loss fallback in UI
  - RLS policy verification for all required read/write paths
