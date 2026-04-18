import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase, getCurrentUser, ensureValidAuth } from '../JS/supabase-auth.js';
import {
  getDashboardUserName,
  fetchOccupancyResources,
  fetchRecentOccupancyEvents,
  fetchResourcesByIds,
  fetchActiveAnnouncements,
} from '../JS/services/dashboard-data.js';

const ACTIVITY_LIMIT = 6;

function occupancyStatus(current, capacity) {
  const c = Number(current || 0);
  const cap = Number(capacity || 0);
  if (!cap || cap <= 0) return 'Unknown';
  if (c >= cap) return 'Full';
  if (c / cap >= 0.8) return 'Near full';
  return 'Available';
}

function occupancySeverityRank(resource) {
  if (!resource) return 99;
  const status = occupancyStatus(resource.current_occupancy, resource.capacity);
  if (status === 'Full') return 0;
  if (status === 'Near full') return 1;
  if (status === 'Available') return 2;
  return 3;
}

function formatWhen(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function formatAnnouncementRange(startAt, endAt) {
  const from = formatWhen(startAt);
  const until = formatWhen(endAt);
  if (from && until) return `${from} to ${until}`;
  if (from) return `starts ${from}`;
  if (until) return `until ${until}`;
  return '';
}

function sampleCards() {
  return [
    { id: 'sample-1', name: 'Library', location: '2nd Floor · Admin Bldg.', status: 'Available', current: 0, cap: 20 },
    { id: 'sample-2', name: 'Study Area', location: '1st Floor · Main Hall', status: 'Near full', current: 16, cap: 20 },
    { id: 'sample-3', name: 'Computer Lab', location: '3rd Floor · Tech Wing', status: 'Full', current: 30, cap: 30 },
    { id: 'sample-4', name: 'Conference Room', location: 'Ground Floor · East Wing', status: 'Available', current: 5, cap: 12 },
    { id: 'sample-5', name: 'Cafeteria', location: '1st Floor · South Hall', status: 'Near full', current: 42, cap: 50 },
  ];
}

function RollingDigit({ digit }) {
  const [displayIndex, setDisplayIndex] = useState(() => Math.max(0, Math.min(9, Number(digit) || 0)));
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const currentDigitRef = useRef(Math.max(0, Math.min(9, Number(digit) || 0)));

  useEffect(() => {
    const desired = Math.max(0, Math.min(9, Number(digit) || 0));
    const current = currentDigitRef.current;

    let rafA = null;
    let rafB = null;
    let snapTimer = null;

    if (current === desired) {
      setTransitionEnabled(false);
      setDisplayIndex(desired);
      rafA = window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
      return () => {
        if (rafA) window.cancelAnimationFrame(rafA);
      };
    }

    setTransitionEnabled(false);
    setDisplayIndex(current);

    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        const targetIndex = desired < current ? desired + 10 : desired;
        setTransitionEnabled(true);
        setDisplayIndex(targetIndex);
        currentDigitRef.current = desired;

        if (targetIndex >= 10) {
          snapTimer = window.setTimeout(() => {
            setTransitionEnabled(false);
            setDisplayIndex(desired);
            window.requestAnimationFrame(() => {
              setTransitionEnabled(true);
            });
          }, 540);
        }
      });
    });

    return () => {
      if (rafA) window.cancelAnimationFrame(rafA);
      if (rafB) window.cancelAnimationFrame(rafB);
      if (snapTimer) window.clearTimeout(snapTimer);
    };
  }, [digit]);

  return (
    <span className="roll-col" data-digit={digit}>
      <span
        className="roll-stack"
        style={{
          transform: `translateY(-${displayIndex}em)`,
          transition: transitionEnabled ? 'transform 520ms cubic-bezier(.22, 1, .36, 1)' : 'none',
        }}
      >
        {Array.from({ length: 20 }, (_, index) => (
          <span key={index} className="roll-digit">{index % 10}</span>
        ))}
      </span>
    </span>
  );
}

function RollingNumber({ value }) {
  let normalized = Number(value || 0);
  if (!Number.isFinite(normalized)) normalized = 0;
  normalized = Math.max(0, Math.floor(normalized));

  const digits = String(normalized).split('').map((d) => Number(d));
  const [slotCount, setSlotCount] = useState(() => Math.max(2, digits.length));

  useEffect(() => {
    setSlotCount((previous) => Math.max(previous, 2, digits.length));
  }, [digits.length]);

  const paddedDigits = useMemo(() => {
    const lead = Math.max(0, slotCount - digits.length);
    return [
      ...Array.from({ length: lead }, () => null),
      ...digits,
    ];
  }, [digits, slotCount]);

  return (
    <div className="roll-number" aria-label={String(normalized)}>
      {paddedDigits.map((digit, index) => (
        <span key={`slot-${index}`} className={`roll-digit-slot ${digit == null ? 'is-leading-empty' : ''}`}>
          <RollingDigit digit={digit == null ? 0 : digit} />
        </span>
      ))}
    </div>
  );
}

function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [status, setStatus] = useState({ text: '', error: false });
  const [lastUpdated, setLastUpdated] = useState('');

  const [occupancyMap, setOccupancyMap] = useState(new Map());
  const [occupancyError, setOccupancyError] = useState('');

  const [announcementAlerts, setAnnouncementAlerts] = useState([]);
  const [activityItems, setActivityItems] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [activityPanelExpanded, setActivityPanelExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const occupancyChannelRef = useRef(null);
  const activityChannelRef = useRef(null);
  const occupancyPollRef = useRef(null);
  const activityPollRef = useRef(null);
  const announcementPollRef = useRef(null);
  const lastActivityIdRef = useRef(null);
  const occupancyLoadInFlightRef = useRef(false);

  const occupancyList = useMemo(() => {
    return Array.from(occupancyMap.values())
      .filter((resource) => resource && (resource.is_active === true || resource.is_active == null))
      .sort((a, b) => {
        const rankDiff = occupancySeverityRank(a) - occupancySeverityRank(b);
        if (rankDiff !== 0) return rankDiff;
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
      });
  }, [occupancyMap]);

  const stats = useMemo(() => {
    let peopleInside = 0;
    let activeSpaces = 0;
    let nearFull = 0;
    let full = 0;

    occupancyList.forEach((resource) => {
      let current = Number(resource.current_occupancy || 0);
      let capacity = Number(resource.capacity || 0);

      if (!Number.isFinite(current)) current = 0;
      if (!Number.isFinite(capacity)) capacity = 0;

      peopleInside += Math.max(0, current);
      activeSpaces += 1;

      if (capacity > 0) {
        if (current >= capacity) full += 1;
        else if (current / capacity >= 0.8) nearFull += 1;
      }
    });

    return {
      peopleInside: Math.max(0, Math.floor(peopleInside)),
      activeSpaces,
      nearFull,
      full,
    };
  }, [occupancyList]);

  const systemAlerts = useMemo(() => {
    const alerts = [];
    if (stats.full > 0) alerts.push({ id: 'full', type: 'system', message: `${stats.full} space(s) are full right now` });
    if (stats.nearFull > 0) alerts.push({ id: 'near-full', type: 'system', message: `${stats.nearFull} space(s) are near full` });
    if (stats.activeSpaces === 0) alerts.push({ id: 'none-active', type: 'system', message: 'No active spaces found in resources' });
    return alerts;
  }, [stats]);

  const allAlerts = useMemo(() => [...announcementAlerts, ...systemAlerts], [announcementAlerts, systemAlerts]);

  const visibleActivity = useMemo(() => {
    return activityExpanded ? activityItems : activityItems.slice(0, ACTIVITY_LIMIT);
  }, [activityExpanded, activityItems]);

  const loadOccupancy = useCallback(async () => {
    if (occupancyLoadInFlightRef.current) return;
    occupancyLoadInFlightRef.current = true;

    try {
      const rows = await fetchOccupancyResources(supabase);
      const nextMap = new Map();
      (rows || []).forEach((resource) => {
        if (resource?.id) nextMap.set(resource.id, resource);
      });
      setOccupancyMap(nextMap);
      setOccupancyError('');
    } catch (error) {
      console.error('loadOccupancy error', error);
      setOccupancyError('Failed to load live occupancy. Showing sample data below.');
      setStatus({ text: `Failed to load resources: ${error?.message || error}`, error: true });
    } finally {
      occupancyLoadInFlightRef.current = false;
    }
  }, []);

  const loadAnnouncementAlerts = useCallback(async () => {
    try {
      const rows = await fetchActiveAnnouncements(supabase, 8);
      const mapped = (rows || []).map((item) => ({
        id: item.id,
        type: 'announcement',
        title: String(item.title || 'Notice'),
        message: String(item.message || ''),
        when: formatAnnouncementRange(item.start_at, item.end_at),
      }));
      setAnnouncementAlerts(mapped);
    } catch (error) {
      console.warn('loadAnnouncementAlerts error', error);
      setAnnouncementAlerts([]);
    }
  }, []);

  const loadRecentActivity = useCallback(async () => {
    try {
      const events = await fetchRecentOccupancyEvents(supabase, 25);
      if (events?.length) lastActivityIdRef.current = events[0].id;

      const resourceIds = Array.from(new Set((events || []).map((event) => event.resource_id).filter(Boolean)));
      const resourcesById = new Map();

      if (resourceIds.length > 0) {
        try {
          const rows = await fetchResourcesByIds(supabase, resourceIds);
          (rows || []).forEach((resource) => {
            resourcesById.set(resource.id, resource);
          });
        } catch {
          // ignore hydration failure
        }
      }

      const hydrated = (events || []).map((event) => ({
        id: event.id,
        resource_id: event.resource_id,
        occupancy_change: event.occupancy_change,
        recorded_at: event.recorded_at,
        resource: event.resource_id ? resourcesById.get(event.resource_id) : null,
      }));

      setActivityItems(hydrated);
      setActivityError('');
    } catch (error) {
      console.warn('loadRecentActivity error', error);
      setActivityItems([]);
      setActivityError('Recent activity is unavailable.');
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setStatus({ text: 'Loading...', error: false });

    try {
      await Promise.all([
        loadOccupancy(),
        loadAnnouncementAlerts(),
        loadRecentActivity(),
      ]);

      setStatus({ text: '', error: false });
      setLastUpdated(`Updated: ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('loadAll error', error);
      setStatus({ text: `Failed to load dashboard: ${error?.message || error}`, error: true });
    } finally {
      setLoading(false);
    }
  }, [loadAnnouncementAlerts, loadOccupancy, loadRecentActivity]);

  const startOccupancyPolling = useCallback((intervalMs = 1000) => {
    if (occupancyPollRef.current) return;

    const tick = async () => {
      await loadOccupancy();
      occupancyPollRef.current = window.setTimeout(tick, Math.max(250, intervalMs));
    };

    tick();
  }, [loadOccupancy]);

  const stopOccupancyPolling = useCallback(() => {
    if (!occupancyPollRef.current) return;
    clearTimeout(occupancyPollRef.current);
    occupancyPollRef.current = null;
  }, []);

  const startActivityPolling = useCallback((intervalMs = 15000) => {
    if (activityPollRef.current) return;

    const tick = async () => {
      await loadRecentActivity();
      activityPollRef.current = window.setTimeout(tick, Math.max(2000, intervalMs));
    };

    tick();
  }, [loadRecentActivity]);

  const stopActivityPolling = useCallback(() => {
    if (!activityPollRef.current) return;
    clearTimeout(activityPollRef.current);
    activityPollRef.current = null;
  }, []);

  const subscribeOccupancyRealtime = useCallback(() => {
    if (occupancyChannelRef.current) return;

    const channel = supabase
      .channel('dashboard-resources-live-react')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, (payload) => {
        try {
          if (payload?.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (!oldId) return;

            setOccupancyMap((previous) => {
              if (!previous.has(oldId)) return previous;
              const next = new Map(previous);
              next.delete(oldId);
              return next;
            });
            return;
          }

          const nextRow = payload?.new;
          if (!nextRow?.id) return;

          setOccupancyMap((previous) => {
            const next = new Map(previous);
            next.set(nextRow.id, nextRow);
            return next;
          });
        } catch (error) {
          console.warn('occupancy realtime handler error', error);
        }
      });

    occupancyChannelRef.current = channel;

    try {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          startOccupancyPolling(1000);
          loadOccupancy();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          startOccupancyPolling(1000);
        }
      });
    } catch {
      startOccupancyPolling(1000);
    }
  }, [loadOccupancy, startOccupancyPolling]);

  const subscribeActivityRealtime = useCallback(() => {
    if (activityChannelRef.current) return;

    try {
      const channel = supabase
        .channel('dashboard-occupancy-events-react')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'occupancy_events' }, (payload) => {
          try {
            const insertedId = payload?.new?.id;
            if (!insertedId) return;
            if (lastActivityIdRef.current && insertedId === lastActivityIdRef.current) return;
            loadRecentActivity();
          } catch {
            // ignore
          }
        });

      activityChannelRef.current = channel;

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          startActivityPolling(15000);
        }
      });
    } catch {
      startActivityPolling(15000);
    }
  }, [loadRecentActivity, startActivityPolling]);

  useEffect(() => {
    let disposed = false;

    const initialize = async () => {
      const ok = await ensureValidAuth();
      if (!ok || disposed) return;

      try {
        const name = await getDashboardUserName(supabase, getCurrentUser);
        if (!disposed) setUserName(name);
      } catch {
        // ignore
      }

      if (!disposed) {
        setReady(true);
        loadAll();
        subscribeOccupancyRealtime();
        startOccupancyPolling(1000);
        subscribeActivityRealtime();
        startActivityPolling(15000);
        announcementPollRef.current = window.setInterval(() => {
          loadAnnouncementAlerts();
        }, 30000);
      }
    };

    initialize();

    return () => {
      disposed = true;
      stopOccupancyPolling();
      stopActivityPolling();
      if (announcementPollRef.current) clearInterval(announcementPollRef.current);
      if (occupancyChannelRef.current) supabase.removeChannel(occupancyChannelRef.current);
      if (activityChannelRef.current) supabase.removeChannel(activityChannelRef.current);
    };
  }, [
    loadAll,
    loadAnnouncementAlerts,
    startActivityPolling,
    startOccupancyPolling,
    stopActivityPolling,
    stopOccupancyPolling,
    subscribeActivityRealtime,
    subscribeOccupancyRealtime,
  ]);

  useEffect(() => {
    const logoutButton = document.getElementById('logout');
    if (!logoutButton) return undefined;

    const onLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem('pm_username');
      } catch {
        // ignore
      }

      window.location.href = 'FrameHome.html';
    };

    logoutButton.addEventListener('click', onLogout);
    return () => logoutButton.removeEventListener('click', onLogout);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <div className="dashboard">
        <header>
          <div>
            <h2 className="greeting">Welcome, <span className="greeting-name">{userName}</span>!</h2>
            <p className="small-muted">This is your project dashboard.</p>
          </div>
        </header>

        <div
          id="statusBar"
          className={`status-bar ${status.error ? 'error' : ''}`}
          aria-live="polite"
          style={{ display: status.text ? '' : 'none' }}
        >
          {status.text}
        </div>

        <section className="quick-stats">
          <div className="stat">
            <div className="stat-value">{stats.peopleInside}</div>
            <div className="stat-label">People Inside Now</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.activeSpaces}</div>
            <div className="stat-label">Active Spaces</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.nearFull}</div>
            <div className="stat-label">Near Full</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.full}</div>
            <div className="stat-label">Full</div>
          </div>
        </section>

        <section className="main-grid main-grid-single" style={{ marginTop: 0 }}>
          <div className="panel occupancy">
            <h3>Live Occupancy</h3>

            {occupancyList.length > 0 ? (
              <div className="occupancy-cards" aria-live="polite">
                {occupancyList.map((resource) => {
                  const current = Number(resource.current_occupancy || 0);
                  const cap = Number(resource.capacity || 0);
                  return (
                    <div key={resource.id} className="occupancy-card">
                      <div className="occupancy-top">
                        <div>
                          <div className="occupancy-name">{resource.name || resource.id}</div>
                          {resource.location ? <div className="meta">{resource.location}</div> : null}
                        </div>
                        <div className="occupancy-status">{occupancyStatus(current, cap)}</div>
                      </div>

                      <div className="occupancy-value-row">
                        <RollingNumber value={Math.max(0, current)} />
                        <div className="capacity-suffix">/ {Math.max(0, cap)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="occupancy-sample" aria-hidden={occupancyList.length > 0 ? 'true' : 'false'} style={{ display: occupancyList.length > 0 ? 'none' : '' }}>
              <p className="small-muted" style={{ marginTop: '12px' }}>
                {occupancyError || 'No active resources. Showing sample data below.'}
              </p>
              <div className="occupancy-cards" aria-hidden="true">
                {sampleCards().map((sample) => (
                  <div key={sample.id} className="occupancy-card">
                    <div className="occupancy-top">
                      <div>
                        <div className="occupancy-name">{sample.name}</div>
                        <div className="meta">{sample.location}</div>
                      </div>
                      <div className="occupancy-status">{sample.status}</div>
                    </div>
                    <div className="occupancy-value-row">
                      <RollingNumber value={sample.current} />
                      <div className="capacity-suffix">/ {sample.cap}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="main-grid">
          <div className="panel actions">
            <h3>Quick Actions</h3>
            <div className="action-row">
              <button type="button" className="btn btn-secondary" onClick={() => { window.location.href = 'FrameMap.html'; }}>
                View Map / Resource List
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { window.location.href = 'FrameEmergency.html'; }}>
                Emergency
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                aria-expanded="false"
                aria-controls="ai-chat-panel"
                data-ai-chatbot-trigger="true"
              >
                Ask SpotEase AI
              </button>
            </div>

            <h3 style={{ marginTop: '18px' }}>Alerts / Notifications</h3>
            <ul className="alerts">
              {allAlerts.length === 0 ? (
                <li className="small-muted">No alerts</li>
              ) : (
                allAlerts.map((alert) => (
                  <li key={alert.id || `${alert.type}-${alert.message}`} className={alert.type === 'announcement' ? 'alert-item alert-announcement' : 'alert-item alert-system'}>
                    {alert.type === 'announcement' ? (
                      <>
                        <span className="alert-badge">Notice</span>
                        <div className="alert-title">{alert.title || 'Notice'}</div>
                        {alert.message ? <div className="alert-text">{alert.message}</div> : null}
                        {alert.when ? <div className="alert-meta">{alert.when}</div> : null}
                      </>
                    ) : (
                      <div className="alert-text">{alert.message || alert.text || alert.title}</div>
                    )}
                  </li>
                ))
              )}
            </ul>

            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn"
                style={{ display: status.error ? 'inline-block' : 'none' }}
                onClick={loadAll}
              >
                Retry
              </button>
              <div className="small-muted" style={{ fontSize: '12px' }}>{lastUpdated}</div>
            </div>
          </div>

          <div className="panel activity">
            <div className="activity-header-row">
              <h3>Recent Activity</h3>
              <button
                type="button"
                className="activity-toggle"
                onClick={() => setActivityPanelExpanded((value) => !value)}
              >
                {activityPanelExpanded ? 'Hide activity' : 'Show activity'}
              </button>
            </div>

            {activityPanelExpanded ? (
              <>
                <ul className="activity">
                  {visibleActivity.map((item) => {
                    const verb = Number(item.occupancy_change) === 1 ? 'Entered' : 'Exited';
                    const resourceName = item.resource?.name || item.resource_id || 'Space';
                    const location = item.resource?.location || '';

                    return (
                      <li key={item.id}>
                        <div>
                          <strong>{verb}</strong> · {resourceName}
                          {location ? <div className="meta">{location}</div> : null}
                        </div>
                        <div>
                          <span className="meta">{formatWhen(item.recorded_at)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="activity-footer">
                  {activityItems.length > ACTIVITY_LIMIT ? (
                    <button
                      type="button"
                      className="activity-toggle"
                      onClick={() => setActivityExpanded((value) => !value)}
                    >
                      {activityExpanded ? 'Show less' : 'View all'}
                    </button>
                  ) : null}
                </div>

                {activityItems.length === 0 ? (
                  <p className="small-muted">{activityError || 'No recent activity.'}</p>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </div>

      <div id="loadingOverlay" className="loading-overlay" aria-hidden={loading ? 'false' : 'true'}>
        <div className="spinner" role="status" aria-live="polite">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="loading-text">Loading…</div>
        </div>
      </div>
    </>
  );
}

function mountDashboardPage() {
  const host = document.getElementById('dashboardReactRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<DashboardPage />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountDashboardPage);
} else {
  mountDashboardPage();
}
