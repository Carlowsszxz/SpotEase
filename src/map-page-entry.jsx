import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../JS/supabase-auth.js';
import {
  fetchActiveReservationsNow,
  fetchLocations,
  fetchLocationsForType,
  fetchResourceTypes,
  fetchResourcesSnapshotForFilters,
} from '../JS/services/map-data.js';

function titleCase(text) {
  return String(text || '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function nowIso() {
  return new Date().toISOString();
}

function isActiveResource(resource) {
  return resource && (resource.is_active === true || resource.is_active == null);
}

function formatUpdated(resource) {
  const ts = resource?.__lastChangeAt || resource?.updated_at || resource?.created_at;
  if (!ts) return 'Updated: —';

  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Updated: —';

  return `Updated: ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function availabilityFor(resource, reservedSet) {
  if (!resource) return { label: 'Available', tone: 'available' };
  if (reservedSet.has(resource.id)) return { label: 'Reserved', tone: 'reserved' };

  const capacity = Number(resource.capacity || 0);
  const current = Number(resource.current_occupancy || 0);
  if (capacity > 0 && current >= capacity) {
    return { label: 'Occupied', tone: 'occupied' };
  }

  return { label: 'Available', tone: 'available' };
}

function SmoothSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const selectOption = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <label className={`smooth-select-label ${disabled ? 'is-disabled' : ''}`}>
      {label}
      <div className={`smooth-select ${open ? 'is-open' : ''}`} ref={rootRef}>
        <button
          type="button"
          className="smooth-select-trigger"
          onClick={() => setOpen((previous) => !previous)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <span className="smooth-select-caret" aria-hidden="true">▾</span>
        </button>

        <ul className="smooth-select-menu" role="listbox" aria-hidden={open ? 'false' : 'true'}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`smooth-select-option ${option.value === value ? 'is-selected' : ''}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => selectOption(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </label>
  );
}

function MapPage() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [typeOptions, setTypeOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [resourcesMap, setResourcesMap] = useState(new Map());
  const [reservedSet, setReservedSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const includeUpdatedAtRef = useRef(true);
  const selectedTypeRef = useRef(selectedType);
  const selectedLocationRef = useRef(selectedLocation);
  const resourcesRef = useRef(resourcesMap);
  const reservedPollRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef(false);
  const statusTimerRef = useRef(null);

  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    resourcesRef.current = resourcesMap;
  }, [resourcesMap]);

  const hasValidFilters = useMemo(() => selectedType !== 'all' && selectedLocation !== 'all', [selectedType, selectedLocation]);

  const setStatusMessage = useCallback((message, type = 'info') => {
    setStatus({ message, type });

    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatus(null);
      statusTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (reservedPollRef.current) clearInterval(reservedPollRef.current);
    };
  }, []);

  const queryResourcesSnapshot = useCallback(async (type, location) => {
    try {
      return await fetchResourcesSnapshotForFilters(
        supabase,
        type,
        location,
        includeUpdatedAtRef.current
      );
    } catch (error) {
      if (includeUpdatedAtRef.current) {
        const message = String(error?.message || error?.details || '');
        if (/updated_at/i.test(message) && /does not exist/i.test(message)) {
          includeUpdatedAtRef.current = false;
          return queryResourcesSnapshot(type, location);
        }
      }
      throw error;
    }
  }, []);

  const refreshReservedNow = useCallback(async (resourceIdsParam) => {
    const type = selectedTypeRef.current;
    const location = selectedLocationRef.current;

    if (type === 'all' || location === 'all') {
      setReservedSet(new Set());
      return;
    }

    const resourceIds = resourceIdsParam || Array.from(resourcesRef.current.keys());

    if (!resourceIds.length) {
      setReservedSet(new Set());
      return;
    }

    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true;
      return;
    }

    refreshInFlightRef.current = true;
    refreshQueuedRef.current = false;

    try {
      const data = await fetchActiveReservationsNow(supabase, resourceIds, nowIso());
      setReservedSet(new Set((data || []).map((row) => row.resource_id).filter(Boolean)));
    } catch {
      setReservedSet(new Set());
    } finally {
      refreshInFlightRef.current = false;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        refreshReservedNow(resourceIds);
      }
    }
  }, []);

  const stopReservedPolling = useCallback(() => {
    if (!reservedPollRef.current) return;
    clearInterval(reservedPollRef.current);
    reservedPollRef.current = null;
  }, []);

  const startReservedPolling = useCallback(() => {
    if (reservedPollRef.current) return;
    reservedPollRef.current = setInterval(async () => {
      if (selectedTypeRef.current === 'all' || selectedLocationRef.current === 'all') return;
      await refreshReservedNow();
    }, 30000);
  }, [refreshReservedNow]);

  const loadResourcesForFilters = useCallback(async (type, location) => {
    if (type === 'all' || location === 'all') {
      setResourcesMap(new Map());
      setReservedSet(new Set());
      stopReservedPolling();
      return;
    }

    setLoading(true);

    try {
      const data = await queryResourcesSnapshot(type, location);
      const nextMap = new Map();

      (data || []).forEach((resource) => {
        const last = resource.updated_at || resource.created_at || nowIso();
        nextMap.set(resource.id, { ...resource, __lastChangeAt: last });
      });

      setResourcesMap(nextMap);
      await refreshReservedNow(Array.from(nextMap.keys()));
      startReservedPolling();
    } catch (error) {
      console.error('Map load resources error', error);
      setStatusMessage('Failed to load resources.', 'error');
      setResourcesMap(new Map());
      setReservedSet(new Set());
      stopReservedPolling();
    } finally {
      setLoading(false);
    }
  }, [queryResourcesSnapshot, refreshReservedNow, setStatusMessage, startReservedPolling, stopReservedPolling]);

  const refreshLocationOptionsByType = useCallback(async (type, preserveSelection = false) => {
    const nextLocations = type === 'all'
      ? await fetchLocations(supabase)
      : await fetchLocationsForType(supabase, type);

    setLocationOptions(nextLocations);

    if (preserveSelection && nextLocations.includes(selectedLocationRef.current)) {
      return selectedLocationRef.current;
    }

    if (nextLocations.length === 1) {
      setSelectedLocation(nextLocations[0]);
      return nextLocations[0];
    }

    setSelectedLocation('all');
    return 'all';
  }, []);

  const initialize = useCallback(async () => {
    setBootstrapping(true);
    try {
      const [types, locations] = await Promise.all([
        fetchResourceTypes(supabase),
        fetchLocations(supabase),
      ]);
      setTypeOptions(types);
      setLocationOptions(locations);
    } catch (error) {
      console.error('Map initialize error', error);
      setStatusMessage('Unable to load filters right now.', 'error');
    } finally {
      setBootstrapping(false);
    }
  }, [setStatusMessage]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    loadResourcesForFilters(selectedType, selectedLocation);
  }, [selectedType, selectedLocation, loadResourcesForFilters]);

  useEffect(() => {
    let resourcesChannel = null;
    let reservationsChannel = null;

    const handleResourcesRealtime = (payload) => {
      if (!payload?.eventType) return;

      const activeType = selectedTypeRef.current;
      const activeLocation = selectedLocationRef.current;
      if (activeType === 'all' || activeLocation === 'all') return;

      if (payload.eventType === 'DELETE') {
        const oldRow = payload.old;
        if (!oldRow?.id) return;

        setResourcesMap((previous) => {
          if (!previous.has(oldRow.id)) return previous;
          const next = new Map(previous);
          next.delete(oldRow.id);
          return next;
        });
        refreshReservedNow();
        return;
      }

      const row = payload.new;
      if (!row?.id) return;

      const matchesFilters =
        row.resource_type === activeType &&
        row.location === activeLocation &&
        isActiveResource(row);

      if (matchesFilters) {
        setResourcesMap((previous) => {
          const next = new Map(previous);
          next.set(row.id, { ...row, __lastChangeAt: nowIso() });
          return next;
        });
        refreshReservedNow();
        return;
      }

      setResourcesMap((previous) => {
        if (!previous.has(row.id)) return previous;
        const next = new Map(previous);
        next.delete(row.id);
        return next;
      });
      refreshReservedNow();
    };

    const handleReservationsRealtime = (payload) => {
      if (!payload?.eventType) return;

      const activeType = selectedTypeRef.current;
      const activeLocation = selectedLocationRef.current;
      if (activeType === 'all' || activeLocation === 'all') return;

      const resourceId = payload.new?.resource_id || payload.old?.resource_id;
      if (!resourceId) return;
      if (!resourcesRef.current.has(resourceId)) return;

      refreshReservedNow();
    };

    resourcesChannel = supabase
      .channel('map-resources-live-react')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, handleResourcesRealtime);

    reservationsChannel = supabase
      .channel('map-reservations-live-react')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, handleReservationsRealtime);

    try {
      resourcesChannel.subscribe(() => {});
    } catch {
      resourcesChannel.subscribe();
    }

    try {
      reservationsChannel.subscribe(() => {});
    } catch {
      reservationsChannel.subscribe();
    }

    return () => {
      stopReservedPolling();
      if (resourcesChannel) supabase.removeChannel(resourcesChannel);
      if (reservationsChannel) supabase.removeChannel(reservationsChannel);
    };
  }, [refreshReservedNow, stopReservedPolling]);

  const resources = useMemo(() => {
    const values = Array.from(resourcesMap.values()).filter(
      (resource) => resource.resource_type === selectedType &&
      resource.location === selectedLocation &&
      isActiveResource(resource)
    );

    return values.sort((a, b) => {
      const toneRank = {
        available: 0,
        reserved: 1,
        occupied: 2,
      };

      const rankDiff =
        toneRank[availabilityFor(a, reservedSet).tone] -
        toneRank[availabilityFor(b, reservedSet).tone];

      if (rankDiff !== 0) return rankDiff;
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
    });
  }, [resourcesMap, reservedSet, selectedLocation, selectedType]);

  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let occupied = 0;

    resources.forEach((resource) => {
      const availability = availabilityFor(resource, reservedSet);
      if (availability.tone === 'available') available += 1;
      if (availability.tone === 'reserved') reserved += 1;
      if (availability.tone === 'occupied') occupied += 1;
    });

    return { total: resources.length, available, reserved, occupied };
  }, [resources, reservedSet]);

  const emptyMessage = useMemo(() => {
    if (!hasValidFilters) return 'Choose a type and location to see available spaces.';
    if (loading) return 'Loading spaces for your selection…';
    return 'No resources found for this selection.';
  }, [hasValidFilters, loading]);

  const handleTypeChange = async (nextType) => {
    setSelectedType(nextType);
    await refreshLocationOptionsByType(nextType);
  };

  const quickPick = async (resourceType) => {
    if (!typeOptions.includes(resourceType)) {
      setStatusMessage('That quick pick is not available right now.', 'info');
      return;
    }

    setSelectedType(resourceType);
    await refreshLocationOptionsByType(resourceType, true);
  };

  return (
    <div className="map-page map-page-react">
      <div className="map-surface">
        <div className="status-bar" aria-live="polite" style={{ display: status ? 'block' : 'none' }}>
          {status ? <div className={`status-${status.type}`}>{status.message}</div> : null}
        </div>

        <header className="map-header">
          <div className="map-title-wrap">
            <h1>Find a Space</h1>
            <p>Filter by resource and location to instantly see what is available right now.</p>
          </div>

          <div className="map-controls">
            <SmoothSelect
              label="What are you looking for?"
              value={selectedType}
              onChange={handleTypeChange}
              disabled={bootstrapping}
              placeholder="Select resource type"
              options={[
                { value: 'all', label: 'Select resource type' },
                ...typeOptions.map((type) => ({
                  value: type,
                  label: titleCase(type),
                })),
              ]}
            />

            <SmoothSelect
              label="Where do you want to stay?"
              value={selectedLocation}
              onChange={setSelectedLocation}
              disabled={bootstrapping || selectedType === 'all'}
              placeholder="Select location"
              options={[
                { value: 'all', label: 'Select location' },
                ...locationOptions.map((location) => ({
                  value: location,
                  label: location,
                })),
              ]}
            />
          </div>
        </header>

        <section className="quick-filters" aria-label="Quick picks">
          <p className="quick-filters-title">Quick picks</p>
          <div className="quick-filter-list" role="group" aria-label="Popular resource types">
            {[
              { value: 'study_area', label: 'Study Area' },
              { value: 'computer_lab', label: 'Computer Lab' },
              { value: 'meeting_room', label: 'Meeting Room' },
            ].map((chip) => (
              <button
                type="button"
                key={chip.value}
                className={`quick-filter-chip ${selectedType === chip.value ? 'is-active' : ''}`}
                onClick={() => quickPick(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {hasValidFilters && resources.length > 0 ? (
          <section className="map-stats" aria-label="Map quick stats">
            <div className="stat-box">
              <div>Total</div>
              <div>{stats.total}</div>
            </div>
            <div className="stat-box free">
              <div>Available</div>
              <div>{stats.available}</div>
            </div>
            <div className="stat-box reserved">
              <div>Reserved</div>
              <div>{stats.reserved}</div>
            </div>
            <div className="stat-box occupied">
              <div>Occupied</div>
              <div>{stats.occupied}</div>
            </div>
          </section>
        ) : null}

        {resources.length > 0 && hasValidFilters ? (
          <section className="resources-section">
            <div className="resources-list" role="list">
              {resources.map((resource) => {
                const availability = availabilityFor(resource, reservedSet);

                return (
                  <article className="resource-row" role="listitem" key={resource.id}>
                    <div className="resource-main">
                      <h3 className="resource-name">{resource.name || resource.id}</h3>
                      <p className="resource-meta">{resource.location || 'No location'}</p>
                    </div>

                    <div className="resource-right">
                      <span className={`availability-badge ${availability.tone}`}>{availability.label}</span>
                      <p className="resource-updated">{formatUpdated(resource)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <p>{emptyMessage}</p>
            </div>
          </div>
        )}
      </div>

      <div id="loadingOverlay" className="loading-overlay" aria-hidden={loading ? 'false' : 'true'}>
        <div className="spinner" role="status" aria-live="polite">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="loading-text">Loading…</div>
        </div>
      </div>
    </div>
  );
}

function mountMapPage() {
  const host = document.getElementById('mapReactRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<MapPage />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountMapPage);
} else {
  mountMapPage();
}
