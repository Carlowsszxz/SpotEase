export async function fetchAuditLogs(supabase, limit) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id,user_id,action,resource_id,timestamp,details')
    .order('timestamp', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 1000);

  if (error) throw error;
  return data || [];
}

export async function fetchUsersForAdminUi(supabase) {
  try {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (!error && data) return data;
  } catch (e) {
    // Ignore and fall back.
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id,email,name')
    .order('name', { ascending: true });

  if (usersError) throw usersError;
  return users || [];
}

export async function fetchResourcesLookup(supabase) {
  const { data, error } = await supabase
    .from('resources')
    .select('id,name,location')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchOccupancyEvents(supabase, limit) {
  const { data, error } = await supabase
    .from('occupancy_events')
    .select('id,resource_id,sensor_id,occupancy_change,recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 2000);

  if (error) throw error;
  return data || [];
}

export async function fetchSensorsLookup(supabase) {
  const { data, error } = await supabase
    .from('sensors')
    .select('id,resource_id,direction')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchBleScans(supabase, limit) {
  const { data, error } = await supabase
    .from('ble_scans')
    .select('id,created_at,gateway_id,scan_batch,device_address,device_name,rssi')
    .order('created_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 2000);

  if (error) throw error;
  return data || [];
}

export async function fetchSecurityEvents(supabase, limit) {
  const { data, error } = await supabase
    .from('security_events')
    .select('id,resource_id,triggered_at,event_type,severity,status,details')
    .order('triggered_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 1000);

  if (error) throw error;
  return data || [];
}

export async function fetchRfidScans(supabase, limit) {
  const { data, error } = await supabase
    .from('rfid_scans')
    .select('id,user_id,resource_id,scanned_at')
    .order('scanned_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 1000);

  if (error) throw error;
  return data || [];
}

export async function fetchActiveBlePresenceSessions(supabase, limit) {
  const maxRows = typeof limit === 'number' && limit > 0 ? limit : 2000;

  // Query Phase-B-compatible schema first to avoid noisy 400s on older deployments.
  const v1 = await supabase
    .from('ble_presence_sessions')
    .select('id,user_id,resource_id,sensor_id,started_at,last_seen_at,status,close_reason,payload')
    .eq('status', 'active')
    .order('last_seen_at', { ascending: false })
    .limit(maxRows);

  if (!v1.error) {
    return (v1.data || []).map(function (row) {
      return {
        id: row.id,
        user_id: row.user_id,
        resource_id: row.resource_id,
        sensor_id: row.sensor_id,
        started_at: row.started_at,
        last_signal_time: row.last_seen_at || null,
        status: row.status,
        close_reason: row.close_reason || null,
        last_seen_location: null
      };
    });
  }

  // Fallback for Phase-C+ schemas.
  const v2 = await supabase
    .from('ble_presence_sessions')
    .select('id,user_id,resource_id,sensor_id,started_at,last_signal_time,status,close_reason,last_seen_location')
    .eq('status', 'active')
    .order('last_signal_time', { ascending: false })
    .limit(maxRows);

  if (v2.error) throw v2.error;
  return v2.data || [];
}

export async function fetchRecentlyClosedBleSessions(supabase, limit, minutesBack = 60) {
  const cutoffTime = new Date(Date.now() - minutesBack * 60000).toISOString();
  const maxRows = typeof limit === 'number' && limit > 0 ? limit : 500;

  const v2 = await supabase
    .from('ble_presence_sessions')
    .select('id,user_id,resource_id,started_at,last_signal_time,closed_at,close_reason,last_seen_location,status')
    .eq('status', 'inactive')
    .eq('close_reason', 'ble_timeout')
    .gte('closed_at', cutoffTime)
    .order('closed_at', { ascending: false })
    .limit(maxRows);

  if (!v2.error) return v2.data || [];

  // Backward compatibility for pre-Phase-C schemas.
  const v1 = await supabase
    .from('ble_presence_sessions')
    .select('id,user_id,resource_id,started_at,last_seen_at,ended_at,close_reason,status')
    .eq('status', 'inactive')
    .eq('close_reason', 'ble_timeout')
    .gte('ended_at', cutoffTime)
    .order('ended_at', { ascending: false })
    .limit(maxRows);

  if (v1.error) throw v1.error;

  return (v1.data || []).map(function (row) {
    return {
      id: row.id,
      user_id: row.user_id,
      resource_id: row.resource_id,
      started_at: row.started_at,
      last_signal_time: row.last_seen_at || null,
      closed_at: row.ended_at || null,
      close_reason: row.close_reason || null,
      last_seen_location: null,
      status: row.status
    };
  });
}

export async function fetchBleSignalLossAccountability(supabase, minutesBack = 240) {
  // Fetch BLE timeouts for accountability report (last 4 hours by default)
  const cutoffTime = new Date(Date.now() - minutesBack * 60000).toISOString();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id,user_id,action_type,resource_id,details,created_at')
    .eq('action_type', 'occupancy_updated')
    .ilike('details', '%ble_timeout%')
    .gte('created_at', cutoffTime)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}