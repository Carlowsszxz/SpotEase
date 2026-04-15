export async function fetchUsersForAdminUi(supabase) {
  try {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (!error && data) return data;
  } catch (e) {
    // Ignore and fall back.
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name')
    .order('name', { ascending: true });

  if (usersError) throw usersError;
  return users || [];
}

export async function assignRfidTagToUser(supabase, userId, uid, tagName) {
  const { error } = await supabase.rpc('admin_assign_rfid_tag', {
    p_user_id: userId,
    p_tag_uid: uid,
    p_tag_name: tagName || null
  });
  if (error) throw error;
}

export async function fetchSecurityEvents(supabase, limit) {
  const { data, error } = await supabase
    .from('security_events')
    .select('id,resource_id,triggered_at,event_type,severity,status,details')
    .order('triggered_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 15);

  if (error) throw error;
  return data || [];
}

export async function updateSecurityEventStatus(supabase, id, status) {
  var payload = { status: status };
  if (status === 'ack') payload.acknowledged_at = new Date().toISOString();
  if (status === 'resolved') payload.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from('security_events')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function fetchResources(supabase) {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function deleteResourceById(supabase, id) {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateResourceById(supabase, id, payload) {
  const { error } = await supabase
    .from('resources')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function createResource(supabase, payload) {
  const { error } = await supabase
    .from('resources')
    .insert([payload]);

  if (error) throw error;
}

export async function fetchReservations(supabase) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReservationStatus(supabase, resId, newStatus) {
  const { error } = await supabase
    .from('reservations')
    .update({ status: newStatus })
    .eq('id', resId);

  if (error) throw error;
}

export async function fetchAnnouncements(supabase, limit) {
  const query = supabase
    .from('announcements')
    .select('id,title,message,start_at,end_at,is_active,created_at')
    .order('created_at', { ascending: false });

  if (typeof limit === 'number' && limit > 0) {
    query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAnnouncement(supabase, payload) {
  const { error } = await supabase
    .from('announcements')
    .insert([payload]);

  if (error) throw error;
}

export async function deleteAnnouncementById(supabase, id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}