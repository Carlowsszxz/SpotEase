export async function getDashboardUserName(supabase, getCurrentUser) {
  var name = 'User';

  try {
    const user = await getCurrentUser();
    if (!user) return name;

    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (!profileErr && profile && profile.name) {
        name = String(profile.name || '').trim() || 'User';
      } else {
        name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'User';
      }
    } catch (e) {
      name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'User';
    }
  } catch (e) {
    // ignore
  }

  return name;
}

export async function fetchOccupancyResources(supabase) {
  const { data, error } = await supabase
    .from('resources')
    .select('id,name,location,capacity,current_occupancy,is_active')
    .or('is_active.is.null,is_active.eq.true')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchSensorsCoverage(supabase) {
  const { data, error } = await supabase
    .from('sensors')
    .select('id,resource_id');

  if (error) throw error;

  var installed = (data || []).length;
  var coveredSet = new Set();
  (data || []).forEach(function(s) {
    if (s && s.resource_id) coveredSet.add(s.resource_id);
  });

  return { installed: installed, covered: coveredSet.size };
}

export async function fetchRecentOccupancyEvents(supabase, limit) {
  const { data, error } = await supabase
    .from('occupancy_events')
    .select('id,resource_id,occupancy_change,recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(typeof limit === 'number' && limit > 0 ? limit : 25);

  if (error) throw error;
  return data || [];
}

export async function fetchResourcesByIds(supabase, ids) {
  if (!ids || !ids.length) return [];

  const { data, error } = await supabase
    .from('resources')
    .select('id,name,location')
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

export async function fetchActiveAnnouncements(supabase, limit) {
  const query = supabase
    .from('announcements')
    .select('id,title,message,start_at,end_at,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (typeof limit === 'number' && limit > 0) {
    query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const nowMs = Date.now();
  return (data || []).filter(function(a) {
    var startsOk = !a.start_at || !isNaN(new Date(a.start_at).getTime()) && new Date(a.start_at).getTime() <= nowMs;
    var endsOk = !a.end_at || !isNaN(new Date(a.end_at).getTime()) && new Date(a.end_at).getTime() >= nowMs;
    return startsOk && endsOk;
  });
}
