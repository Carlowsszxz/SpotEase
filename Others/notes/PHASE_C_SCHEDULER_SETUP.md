# Phase C: BLE Signal-Loss Scheduler Setup

**Objective**: Automatically close stale BLE presence sessions and capture last-seen location for accountability/emergency response.

**Migration**: `015_ble_presence_phase_c.sql`  
**Status**: Ready for deployment  
**Timeline**: April 14, 2026

---

## 1. Prerequisite: Deploy the Migration

Apply the Phase C migration to add:
- `close_reason` column (VARCHAR, enum: 'ble_timeout', 'rfid_tap', 'manual')
- `last_seen_location` column (TEXT, records resource name where signal was last detected)
- Updated `close_stale_ble_presence_sessions(...)` function with location capture
- Audit trigger: BLE timeouts logged as `occupancy_updated` events
- RLS policies + indexes for accountability queries

```bash
# Via Supabase CLI:
supabase db push  # Applies pending migrations including 015

# Or manually via SQL Editor:
# Copy entire contents of 015_ble_presence_phase_c.sql 
# Paste into Supabase SQL Editor
# Click "Run" 
```

---

## 2. Timeout Scheduler Setup

The `close_stale_ble_presence_sessions(timeout_minutes, now)` function is ready. Two implementation approaches:

### Option A: Supabase Edge Function (Recommended)

**Why**: Runs in Supabase cloud, no external infrastructure needed.

**Setup**:

1. Create an edge function in your `.supabase/functions` directory:

```bash
supabase functions new ble-timeout-scheduler
```

2. Implement `supabase/functions/ble-timeout-scheduler/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

export const handler = async (_req: Request): Promise<Response> => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase.rpc(
      "close_stale_ble_presence_sessions",
      {
        timeout_minutes: 5,
        now_time: new Date().toISOString(),
      }
    );

    if (error) {
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        closed_sessions: (data || []).length,
        details: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

3. Deploy the function:

```bash
supabase functions deploy ble-timeout-scheduler
```

4. Set up a cron trigger using an external service (e.g., EasyCron, Google Cloud Scheduler, AWS EventBridge):

- **Endpoint**: `https://<your-project>.functions.supabase.co/ble-timeout-scheduler`
- **Method**: POST
- **Frequency**: Every 1 minute (`* * * * *`)
- **Headers**: None required (function is public)
- **Timeout**: 30 seconds

### Option B: External Cron + Your Backend

**Why**: More control over retry logic and monitoring.

**Setup**:

1. Expose an HTTP endpoint in your backend that calls the RPC:

```javascript
// Example Node.js/Express backend
app.post('/api/admin/ble-timeout-job', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  
  // Validate secret token
  if (authHeader !== `Bearer ${process.env.BLE_TIMEOUT_SECRET}`) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY  // Use service key for admin calls
    );

    const { data, error } = await supabase.rpc(
      'close_stale_ble_presence_sessions',
      {
        timeout_minutes: 5,
        now_time: new Date().toISOString()
      }
    );

    if (error) throw error;

    return res.json({
      success: true,
      closed_sessions: (data || []).length,
      details: data
    });
  } catch (err) {
    console.error('BLE timeout job error:', err);
    return res.status(500).json({ error: String(err) });
  }
});
```

2. **Configure external cron** (e.g., EasyCron):
   - **Endpoint**: `https://your-backend.com/api/admin/ble-timeout-job`
   - **Method**: POST
   - **Frequency**: Every 1 minute
   - **Authorization header**: `Bearer <your_secret_token>`

---

## 3. RPC Function Signature

```sql
close_stale_ble_presence_sessions(
  timeout_minutes INT,
  now_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  user_id UUID,
  session_id UUID,
  last_signal_time TIMESTAMPTZ,
  last_seen_location TEXT,
  close_reason TEXT
)
```

**Parameters**:
- `timeout_minutes`: Minutes of inactivity before marking session inactive (e.g., 5 = 5 minutes of no BLE signal)
- `now_time`: Current server time (defaults to DB `CURRENT_TIMESTAMP`)

**Returns**: Table of closed sessions with accountability metadata.

**Example Call** (via SQL Editor):
```sql
SELECT * FROM close_stale_ble_presence_sessions(5);
```

---

## 4. Timeout Configuration

### Recommended Values

| Duration | Use Case |
|----------|----------|
| 2 minutes | Real-time, aggressive (high false-positive risk) |
| **5 minutes** | **Default: balanced presence confidence** |
| 10 minutes | Conservative (tolerates Wi-Fi handoffs) |
| 15 minutes | Very conservative (BLE coverage gaps tolerated) |

**Why 5 minutes?**  
- Bridges typical Wi-Fi roaming delays (1-3 sec)
- Handles BLE advertisement scan intervals (usually 1-10 sec)
- Reduces false "left building" events from brief signal loss
- Still responsive for emergency accountability (e.g., "Where was person X at 2:15 PM?")

---

## 5. Monitoring & Debugging

### View Recent Timeouts

```sql
-- Get all sessions closed by BLE timeout in last hour
SELECT 
  user_id,
  session_id,
  started_at,
  last_signal_time,
  closed_at,
  last_seen_location,
  close_reason
FROM ble_presence_sessions
WHERE close_reason = 'ble_timeout'
  AND closed_at > NOW() - INTERVAL '1 hour'
ORDER BY closed_at DESC;
```

### Verify Audit Trail

```sql
-- See BLE timeout events in accountability log
SELECT 
  action_type,
  details -> 'location' AS last_location,
  details -> 'reason' AS close_reason,
  created_at
FROM audit_logs
WHERE action_type = 'occupancy_updated'
  AND details ->> 'reason' = 'ble_timeout'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Function Performance

```sql
-- Query BLE session statistics
SELECT 
  COUNT(*) AS total_sessions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_now,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS closed_total,
  COUNT(CASE WHEN close_reason = 'ble_timeout' THEN 1 END) AS timeout_closes,
  MAX(closed_at) AS last_close_time
FROM ble_presence_sessions;
```

---

## 6. Emergency Dashboard Integration

The [FrameEmergency.html](../FrameEmergency.html) page now displays **Recent Signal Loss Events** section:

- **Fetches**: Last 4 hours of BLE timeout events from audit logs
- **Displays**: 10 most recent timeouts with:
  - "Signal Lost" badge
  - Last-seen location
  - Exact time of signal loss
- **Updates**: Every 60 seconds (polled by `emergency.js`)
- **Purpose**: Helps responders understand where tracked individuals were last detected

**Example UI**:
```
Recent Signal Loss Events
─────────────────────────
Signal Lost               Signal Lost               Signal Lost
Lost at: Library Study Rm Lost at: East Lab Wing   Lost at: Cafeteria
Apr 14, 2:15 PM          Apr 14, 2:08 PM          Apr 14, 1:55 PM
```

---

## 7. Phase C Deployment Checklist

- [ ] Deploy migration `015_ble_presence_phase_c.sql` via `supabase db push` or SQL Editor
- [ ] Verify columns exist: `ALTER TABLE ble_presence_sessions DESCRIBE;`
- [ ] Test RPC function: `SELECT * FROM close_stale_ble_presence_sessions(5) LIMIT 1;`
- [ ] Deploy Edge Function OR setup external cron endpoint
- [ ] Configure cron scheduler (frequency: 1 minute, timeout 5 minutes)
- [ ] Verify first run produces output (check RPC test above)
- [ ] Monitor audit logs for `occupancy_updated` with `ble_timeout` reason
- [ ] Test emergency dashboard: navigate to `FrameEmergency.html`, wait 60 sec for signal-loss panel update
- [ ] Document timeout value in team runbook (default: 5 minutes)

---

## 8. Next Steps (Phase D, Future)

- Extend presence roster to show BLE session close_reason (why someone went from "present" to "left")
- Add last-seen-location badge in emergency view (e.g., "BLE Lost at Library Study Rm, 2:15 PM — Unknown now")
- Create accountability report: "During incident [time], these people were lost from tracking at [location]"
- Integrate with email alerts: "Alert: 5+ people lost from tracking in East Wing at [time]"

---

## Questions or Issues?

- **RPC not callable**: Verify `SECURITY DEFINER` in migration and that calling user/service key has proper permissions
- **Audit logs empty**: Ensure at least one BLE session has been opened and timed out (takes ~5 min after ingest)
- **Scheduler not running**: Check edge function/cron logs for HTTP errors; verify bearer token if using Option B
- **CI/CD conflict**: If using Supabase migrations in version control, merge phase C migration file first before deploying

---

**Created**: April 14, 2026  
**Phase**: Phase C: Signal-Loss Tracking & Last-Seen Location  
**Status**: Ready for Production Deployment
