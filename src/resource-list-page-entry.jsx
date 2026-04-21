import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../JS/supabase-auth.js';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Sort: Name (A-Z)' },
  { value: 'name-desc', label: 'Sort: Name (Z-A)' },
  { value: 'available-first', label: 'Sort: Available First' },
  { value: 'capacity-desc', label: 'Sort: Capacity (High-Low)' },
];

function mapType(resourceType) {
  if (!resourceType) return 'other';
  const normalized = String(resourceType).toLowerCase();
  if (normalized.includes('parking')) return 'parking';
  if (normalized.includes('seat')) return 'seat';
  if (normalized.includes('room') || normalized.includes('meeting')) return 'room';
  return normalized;
}

function deriveStatus(resource) {
  if (!resource) return 'inactive';
  if (resource.is_active === false) return 'inactive';

  const capacity = Number(resource.capacity || 0);
  const occupancy = Number(resource.current_occupancy || 0);
  if (capacity > 0 && occupancy >= capacity) return 'occupied';

  const fallback = String(
    resource.current_status || resource.reservation_status || resource.occupancy_status || ''
  ).toLowerCase();

  if (fallback === 'inactive') return 'inactive';
  if (fallback === 'occupied' || fallback === 'full') return 'occupied';
  return 'free';
}

function titleCase(value) {
  const text = String(value || '');
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function statusClass(status) {
  if (status === 'free') return 's-free';
  if (status === 'occupied') return 's-occupied';
  if (status === 'inactive') return 's-inactive';
  return 's-pending';
}

function sortResources(items, mode) {
  const list = (items || []).slice();
  list.sort((a, b) => {
    if (mode === 'name-desc') {
      return String(b.name || '').localeCompare(String(a.name || ''), undefined, { sensitivity: 'base' });
    }

    if (mode === 'capacity-desc') {
      return Number(b.capacity || 0) - Number(a.capacity || 0);
    }

    if (mode === 'available-first') {
      const rankA = a.status === 'free' ? 0 : a.status === 'occupied' ? 1 : 2;
      const rankB = b.status === 'free' ? 0 : b.status === 'occupied' ? 1 : 2;
      if (rankA !== rankB) return rankA - rankB;
    }

    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
  });

  return list;
}

function unique(values) {
  return Array.from(new Set(values));
}

function ResourceListPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Loading resources...');
  const [statusError, setStatusError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  const typeOptions = useMemo(() => ['all', ...unique(resources.map((resource) => resource.type || 'other'))], [resources]);
  const statusOptions = useMemo(() => ['all', ...unique(resources.map((resource) => resource.status || 'free'))], [resources]);
  const locationOptions = useMemo(() => ['all', ...unique(resources.map((resource) => resource.location || 'Unknown'))], [resources]);

  const filteredResources = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();

    const filtered = resources.filter((resource) => {
      if (typeFilter !== 'all' && resource.type !== typeFilter) return false;
      if (statusFilter !== 'all' && resource.status !== statusFilter) return false;
      if (locationFilter !== 'all' && resource.location !== locationFilter) return false;

      if (q) {
        const haystack = [resource.name, resource.type, resource.location, resource.status]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return sortResources(filtered, sortBy);
  }, [locationFilter, resources, search, sortBy, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const total = filteredResources.length;
    const available = filteredResources.filter((resource) => resource.status === 'free').length;
    const occupied = filteredResources.filter((resource) => resource.status === 'occupied').length;
    return { total, available, occupied };
  }, [filteredResources]);

  async function loadResources() {
    setLoading(true);
    setStatusError(false);
    setStatusMessage('Loading resources...');

    try {
      const { data, error } = await supabase.from('resources').select('*').eq('is_active', true);
      if (error) {
        setResources([]);
        setStatusError(true);
        setStatusMessage(`Failed to load resources: ${error.message || 'Unknown error'}`);
        return;
      }

      const mapped = (data || []).map((resource) => ({
        id: resource.id,
        name: resource.name || resource.resource_name || '',
        type: mapType(resource.resource_type || resource.type),
        location: resource.location || 'Unknown',
        capacity: resource.capacity || 1,
        current_occupancy: resource.current_occupancy || 0,
        is_active: resource.is_active,
        status: deriveStatus(resource),
      }));

      setResources(mapped);
      setStatusMessage('');
      setStatusError(false);
      setLastUpdated(`Updated: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setResources([]);
      setStatusError(true);
      setStatusMessage(`Error loading resources: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setSortBy('name-asc');
  }

  function viewDetails(resource) {
    try {
      window.open('FrameMap.html', '_blank');
    } catch {
      // ignore
    }

    window.setTimeout(() => {
      alert(`${resource.name}\n${resource.type} • ${resource.location}\nStatus: ${resource.status}`);
    }, 300);
  }

  return (
    <>
      <div className="resource-list-page">
        <header className="rl-header">
          <h1>Resources</h1>
          <p className="small-muted">Browse and search available resources.</p>
        </header>

        <div className={`status-bar ${statusError ? 'error' : ''}`} aria-live="polite">{statusMessage}</div>

        <section className="rl-controls">
          <input
            type="search"
            placeholder="Search by name or keyword"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type === 'all' ? 'All types' : titleCase(type)}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status === 'all' ? 'All status' : titleCase(status)}</option>
            ))}
          </select>

          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            {locationOptions.map((location) => (
              <option key={location} value={location}>{location === 'all' ? 'All locations' : location}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button type="button" className="btn" onClick={clearFilters}>Clear</button>
        </section>

        <section className="rl-summary" aria-label="Resource summary">
          <div className="summary-card">
            <div className="summary-label">Total</div>
            <div className="summary-value">{summary.total}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Available</div>
            <div className="summary-value">{summary.available}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Occupied</div>
            <div className="summary-value">{summary.occupied}</div>
          </div>
        </section>

        <section className="rl-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6}>No resources found.</td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr key={resource.id}>
                    <td>{resource.name}</td>
                    <td>{resource.type}</td>
                    <td>{resource.location}</td>
                    <td>{resource.capacity || '—'}</td>
                    <td>
                      <span className={`status-badge ${statusClass(resource.status)}`}>
                        {titleCase(resource.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="action-btn action-view"
                        onClick={() => viewDetails(resource)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <div className="rl-footbar">
          <button type="button" className="btn" onClick={loadResources}>Retry</button>
          <div className="small-muted rl-last-updated">{lastUpdated}</div>
        </div>
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

function mountResourceListPage() {
  const host = document.getElementById('resourceListReactRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<ResourceListPage />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountResourceListPage);
} else {
  mountResourceListPage();
}
