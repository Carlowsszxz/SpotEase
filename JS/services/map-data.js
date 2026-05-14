export async function fetchResourceTypes(supabase) {
  const { data, error } = await supabase
    .from('resources')
    .select('resource_type')
    .not('resource_type', 'is', null);

  if (error) throw error;
  return [...new Set((data || []).map(function(r) { return r.resource_type; }))]
    .filter(Boolean)
    .sort();
}

export async function fetchLocations(supabase) {
  const { data, error } = await supabase
    .from('resources')
    .select('location')
    .not('location', 'is', null);

  if (error) throw error;
  return [...new Set((data || []).map(function(r) { return r.location; }))]
    .filter(Boolean)
    .sort();
}

export async function fetchLocationsForType(supabase, resourceType) {
  const { data, error } = await supabase
    .from('resources')
    .select('location')
    .eq('resource_type', resourceType)
    .not('location', 'is', null);

  if (error) throw error;
  return [...new Set((data || []).map(function(r) { return r.location; }))]
    .filter(Boolean)
    .sort();
}

export async function fetchResourcesSnapshotForFilters(supabase, selectedType, selectedLocation, includeUpdatedAtInSelect) {
  const baseFields = 'id,name,location,resource_type,capacity,current_occupancy,is_active,created_at';
  const fieldsWithUpdated = baseFields + ',updated_at';
  const fieldAttempts = includeUpdatedAtInSelect ? [fieldsWithUpdated, baseFields] : [baseFields];
  const activeFilterAttempts = [true, false];
  let lastError = null;

  const buildQuery = (fields, includeActiveFilter) => {
    let query = supabase
      .from('resources')
      .select(fields)
      .eq('resource_type', selectedType)
      .eq('location', selectedLocation);

    if (includeActiveFilter) {
      query = query.or('is_active.is.null,is_active.eq.true');
    }

    return query.order('name', { ascending: true });
  };

  for (const fields of fieldAttempts) {
    for (const includeActiveFilter of activeFilterAttempts) {
      try {
        const { data, error } = await buildQuery(fields, includeActiveFilter);
        if (error) throw error;
        return data || [];
      } catch (error) {
        lastError = error;
        const message = String(error?.message || error?.details || '');
        const status = Number(error?.status || 0);
        const isRetriable =
          status === 400 ||
          error?.code === '42703' ||
          /(schema cache|column|updated_at|is_active)/i.test(message);

        if (!isRetriable) throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return [];
}

export async function fetchActiveReservationsNow(supabase, resourceIds, nowIso) {
  const { data, error } = await supabase
    .from('reservations')
    .select('resource_id,status,reserved_from,reserved_until')
    .in('resource_id', resourceIds)
    .in('status', ['pending', 'confirmed'])
    .lte('reserved_from', nowIso)
    .gte('reserved_until', nowIso);

  if (error) throw error;
  return data || [];
}