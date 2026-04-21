import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { checkAuth } from '../JS/auth.js';
import { supabase } from '../JS/supabase-auth.js';

const RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'today', label: 'Today' },
];

const MANILA_TIMEZONE = 'Asia/Manila';

const MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const MANILA_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function manilaDateKey(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return MANILA_DATE_KEY_FORMATTER.format(date);
}

function formatWhen(ts) {
  if (!ts) return '—';

  let value = typeof ts === 'string' ? ts.trim() : ts;
  if (typeof value === 'string') {
    if (value.indexOf('T') === -1 && value.indexOf(' ') !== -1) value = value.replace(' ', 'T');
    const hasTz = value.endsWith('Z') || value.indexOf('+') !== -1 || /-\d\d:?\d\d$/.test(value);
    if (!hasTz) value = `${value}Z`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return typeof ts === 'string' ? ts : '—';
  return MANILA_DATE_TIME_FORMATTER.format(date);
}

function isInsideRange(range, scannedAt, nowMs) {
  if (range === 'all') return true;

  const date = new Date(scannedAt);
  if (Number.isNaN(date.getTime())) return false;

  if (range === 'today') {
    return manilaDateKey(date) === manilaDateKey(Date.now());
  }

  if (range === '7d') return nowMs - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  if (range === '30d') return nowMs - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

function SmoothDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) || options[0],
    [options, value]
  );

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

  return (
    <div className={`ah-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="ah-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label || 'Select range'}</span>
        <span className="ah-select-caret" aria-hidden="true">▾</span>
      </button>

      <ul className="ah-select-menu" role="listbox" aria-hidden={open ? 'false' : 'true'}>
        {options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={`ah-select-option ${option.value === value ? 'is-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccessHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [allRows, setAllRows] = useState([]);
  const [resourceMap, setResourceMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [range, setRange] = useState('all');

  const filteredRows = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    const now = Date.now();

    return (allRows || []).filter((row) => {
      const resource = row?.resource_id ? resourceMap[row.resource_id] : null;
      const whereText = resource?.name
        ? resource.location
          ? `${resource.name} ${resource.location}`
          : resource.name
        : 'tap recorded';

      if (q && !whereText.toLowerCase().includes(q)) return false;
      return isInsideRange(range, row?.scanned_at, now);
    });
  }, [allRows, resourceMap, range, searchQuery]);

  const lastTap = useMemo(() => {
    if (!filteredRows.length) return '—';
    return formatWhen(filteredRows[0]?.scanned_at);
  }, [filteredRows]);

  const helpText = useMemo(() => {
    if (loading) return 'Loading…';
    if (error) return '';
    if (!allRows.length) return 'No activity yet for your assigned RFID tag.';
    if (!filteredRows.length) return 'No taps match your filters.';
    return `Showing your latest ${filteredRows.length} RFID taps.`;
  }, [allRows.length, error, filteredRows.length, loading]);

  async function loadData(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    setError('');

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setAllRows([]);
        setResourceMap({});
        return;
      }

      const { data: scans, error: scansErr } = await supabase
        .from('rfid_scans')
        .select('scanned_at, resource_id')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(200);

      if (scansErr) {
        setAllRows([]);
        setResourceMap({});
        setError('RFID activity is not available yet (missing database migration/policies).');
        return;
      }

      const rows = scans || [];
      const uniqueIds = [];
      const seen = {};
      rows.forEach((row) => {
        const id = row?.resource_id;
        if (id && !seen[id]) {
          seen[id] = true;
          uniqueIds.push(id);
        }
      });

      const nextResourceMap = {};
      if (uniqueIds.length) {
        const { data: resources, error: resourcesErr } = await supabase
          .from('resources')
          .select('id,name,location')
          .in('id', uniqueIds);

        if (!resourcesErr && resources) {
          resources.forEach((resource) => {
            nextResourceMap[resource.id] = resource;
          });
        }
      }

      setAllRows(rows);
      setResourceMap(nextResourceMap);
    } catch (loadError) {
      setAllRows([]);
      setResourceMap({});
      setError('RFID activity is not available yet.');
      console.error('access history load failed', loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const ok = await checkAuth('FrameLogin.html');
      if (!ok || !active) return;
      await loadData(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="access-history-page">
      <header>
        <h1>Access History</h1>
        <p className="small-muted">Your recent RFID tap records.</p>
      </header>

      <section className="history-controls" aria-label="Access history controls">
        <input
          type="search"
          placeholder="Search by resource or location"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search access history"
        />

        <SmoothDropdown options={RANGE_OPTIONS} value={range} onChange={setRange} />

        <button
          type="button"
          className={`btn ${refreshing ? 'is-loading' : ''}`}
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </section>

      <section className="history-summary" aria-label="Access history summary">
        <div className="summary-card">
          <div className="summary-label">Visible taps</div>
          <div className="summary-value">{filteredRows.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Last tap</div>
          <div className="summary-value summary-value-small">{lastTap}</div>
        </div>
      </section>

      <section className="panel access-list-panel" aria-labelledby="accessHistoryTitle">
        <h3 id="accessHistoryTitle">Recent RFID Taps</h3>
        <p className="small-muted">{helpText}</p>

        {error ? <p className="small-muted history-error">{error}</p> : null}

        <ul className="access-list" aria-live="polite">
          {filteredRows.map((row, index) => {
            const resource = row?.resource_id ? resourceMap[row.resource_id] : null;
            const label = resource?.name
              ? resource.location
                ? `${resource.name} • ${resource.location}`
                : resource.name
              : 'Tap recorded';

            return (
              <li key={`${row?.scanned_at || 'tap'}-${index}`}>
                <div className="access-where">{label}</div>
                <div className="access-when">{formatWhen(row?.scanned_at)}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function mountAccessHistoryPage() {
  const host = document.getElementById('accessHistoryReactRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<AccessHistoryPage />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAccessHistoryPage);
} else {
  mountAccessHistoryPage();
}
