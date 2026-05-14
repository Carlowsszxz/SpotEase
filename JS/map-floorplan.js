// Map page: non-SVG live resource list
import { supabase } from './supabase-auth.js';
import { checkAuth } from './auth.js';
import {
	fetchResourceTypes,
	fetchLocations,
	fetchLocationsForType,
	fetchResourcesSnapshotForFilters,
	fetchActiveReservationsNow
} from './services/map-data.js';

let resourcesCache = new Map();
let reservedNowSet = new Set();

let resourcesChannel = null;
let reservationsChannel = null;

let selectedType = 'all';
let selectedLocation = 'all';

let includeUpdatedAtInSelect = true;

let reservedRefreshTimer = null;
let reservedRefreshInFlight = false;
let reservedRefreshQueued = false;

/**
 * Format text from snake_case to Title Case
 * Example: "library_seat" → "Library Seat"
 */
function formatTextToTitleCase(text) {
	return text
		.replace(/_/g, ' ')  // Replace underscores with spaces
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

function getNowIso() {
	return new Date().toISOString();
}

function isActiveResource(resource) {
	// Match dashboard behavior: treat NULL as active.
	return resource && (resource.is_active === true || resource.is_active == null);
}

function hasValidFilters() {
	return selectedType !== 'all' && selectedLocation !== 'all';
}

function getAvailabilityRank(resource) {
	const availability = computeAvailability(resource);
	if (availability.tone === 'available') return 0;
	if (availability.tone === 'reserved') return 1;
	if (availability.tone === 'occupied') return 2;
	return 3;
}

function setEmptyState(message) {
	const emptyState = document.getElementById('emptyStateMessage');
	const resourcesSection = document.getElementById('resourcesSection');
	if (resourcesSection) resourcesSection.style.display = 'none';
	if (!emptyState) return;
	emptyState.style.display = 'flex';
	const p = emptyState.querySelector('p');
	if (p) p.textContent = message;
}

function showList() {
	const emptyState = document.getElementById('emptyStateMessage');
	const resourcesSection = document.getElementById('resourcesSection');
	if (emptyState) emptyState.style.display = 'none';
	if (resourcesSection) resourcesSection.style.display = '';
}

/**
 * Fetch unique resource types from Supabase
 */
async function fetchResourceTypesFromSupabase() {
	try {
		return await fetchResourceTypes(supabase);
	} catch (err) {
		return [];
	}
}

/**
 * Populate resource type dropdown from database
 */
async function populateTypeDropdown() {
	const filterType = document.getElementById('filterType');
	if (!filterType) return;

	const types = await fetchResourceTypesFromSupabase();
	
	// Add each type as an option
	types.forEach(type => {
		const option = document.createElement('option');
		option.value = type;
		option.textContent = formatTextToTitleCase(type);
		filterType.appendChild(option);
	});
}

/**
 * Fetch locations for a specific resource type
 */
async function fetchLocationsByType(resourceType) {
	try {
		return await fetchLocationsForType(supabase, resourceType);
	} catch (err) {
		return [];
	}
}

/**
 * Update location dropdown based on selected resource type
 */
async function updateLocationDropdownByType(resourceType) {
	const filterLocation = document.getElementById('filterLocation');
	if (!filterLocation) return;

	// Clear current options except "Select a location"
	filterLocation.innerHTML = '<option value="all">Select a location</option>';

	if (resourceType === 'all') {
		// Show all locations
		const allLocations = await fetchLocationsFromSupabase();
		allLocations.forEach(location => {
			const option = document.createElement('option');
			option.value = location;
			option.textContent = location;
			filterLocation.appendChild(option);
		});
	} else {
		// Show locations for selected type
		const locations = await fetchLocationsByType(resourceType);
		locations.forEach(location => {
			const option = document.createElement('option');
			option.value = location;
			option.textContent = location;
			filterLocation.appendChild(option);
		});

		// Auto-select if only one location
		if (locations.length === 1) {
			filterLocation.value = locations[0];
		}
	}
}

/**
 * Fetch unique locations from Supabase
 */
async function fetchLocationsFromSupabase() {
	try {
		return await fetchLocations(supabase);
	} catch (err) {
		return [];
	}
}

/**
 * Populate location dropdown from database
 */
async function populateLocationDropdown() {
	const filterLocation = document.getElementById('filterLocation');
	if (!filterLocation) return;

	const locations = await fetchLocationsFromSupabase();
	
	// Add each location as an option
	locations.forEach(location => {
		const option = document.createElement('option');
		option.value = location;
		option.textContent = location;
		filterLocation.appendChild(option);
	});
}

/**
 * Show status message to user
 */
function showStatusMessage(message, type = 'info') {
	const statusBar = document.getElementById('statusBar');
	if (!statusBar) return;

	statusBar.innerHTML = `<div class="status-${type}">${message}</div>`;
	statusBar.style.display = 'block';

	// Auto-hide after 4 seconds
	setTimeout(() => {
		statusBar.style.display = 'none';
	}, 4000);
}

/**
 * Show loading overlay
 */

function showLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) {
		overlay.setAttribute('aria-hidden', 'false');
	}
}

/**
 * Hide loading overlay
 */

function hideLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) {
		overlay.setAttribute('aria-hidden', 'true');
	}
}

	function computeAvailability(resource) {
		if (!resource) return { label: 'Available', tone: 'available' };
		if (reservedNowSet.has(resource.id)) return { label: 'Reserved', tone: 'reserved' };

		const cap = Number(resource.capacity || 0);
		const current = Number(resource.current_occupancy || 0);
		if (cap > 0 && current >= cap) return { label: 'Occupied', tone: 'occupied' };
		return { label: 'Available', tone: 'available' };
	}

	function formatUpdatedText(resource) {
		const ts = resource && (resource.__lastChangeAt || resource.updated_at || resource.created_at);
		if (!ts) return 'Updated: —';
		const date = new Date(ts);
		if (isNaN(date.getTime())) return 'Updated: —';
		const formatted = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
		return `Updated: ${formatted}`;
	}

	function renderResourcesList() {
		const listEl = document.getElementById('resourcesList');
		if (!listEl) return;

		if (!hasValidFilters()) {
			listEl.innerHTML = '';
			setEmptyState('Please select a resource type and location to browse resources');
			return;
		}

		const resources = Array.from(resourcesCache.values())
			.filter(r => r && r.resource_type === selectedType && r.location === selectedLocation && isActiveResource(r))
			.sort((a, b) => {
				const rankDiff = getAvailabilityRank(a) - getAvailabilityRank(b);
				if (rankDiff !== 0) return rankDiff;
				return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
			});

		if (!resources.length) {
			listEl.innerHTML = '';
			setEmptyState('No resources found for this selection.');
			return;
		}

		showList();
		listEl.innerHTML = '';
		resources.forEach((r) => {
			const row = document.createElement('div');
			row.className = 'resource-row';
			row.dataset.resourceId = r.id;
			row.setAttribute('role', 'listitem');

			const left = document.createElement('div');
			left.className = 'resource-main';

			const name = document.createElement('div');
			name.className = 'resource-name';
			name.textContent = r.name || r.id;
			left.appendChild(name);

			const meta = document.createElement('div');
			meta.className = 'resource-meta';
			meta.textContent = r.location || '';
			left.appendChild(meta);

			const right = document.createElement('div');
			right.className = 'resource-right';

			const availability = computeAvailability(r);
			const badge = document.createElement('span');
			badge.className = `availability-badge ${availability.tone}`;
			badge.textContent = availability.label;
			right.appendChild(badge);

			const updated = document.createElement('div');
			updated.className = 'resource-updated';
			updated.textContent = formatUpdatedText(r);
			right.appendChild(updated);

			row.appendChild(left);
			row.appendChild(right);
			listEl.appendChild(row);
		});
	}

	async function queryResourcesSnapshot() {
		try {
			return await fetchResourcesSnapshotForFilters(supabase, selectedType, selectedLocation, includeUpdatedAtInSelect);
		} catch (error) {
			if (includeUpdatedAtInSelect) {
				const msg = String(error.message || error.details || '');
				if (/updated_at/i.test(msg) && /does not exist/i.test(msg)) {
					includeUpdatedAtInSelect = false;
					return queryResourcesSnapshot();
				}
			}
			throw error;
		}
	}

	async function loadResourcesForFilters() {
		if (!hasValidFilters()) {
			resourcesCache.clear();
			reservedNowSet.clear();
			renderResourcesList();
			stopReservedPolling();
			return;
		}

		showLoading();
		try {
			resourcesCache.clear();
			reservedNowSet.clear();

			const data = await queryResourcesSnapshot();
			(data || []).forEach((r) => {
				const last = r.updated_at || r.created_at || getNowIso();
				resourcesCache.set(r.id, { ...r, __lastChangeAt: last });
			});

			await refreshReservedNow();
			renderResourcesList();
			startReservedPolling();
		} catch (err) {
			console.error('Map load resources error', err);
			showStatusMessage('Failed to load resources.', 'error');
			setEmptyState('Failed to load resources for this selection.');
			stopReservedPolling();
		} finally {
			hideLoading();
		}
	}

	async function refreshReservedNow() {
		if (!hasValidFilters()) return;
		const ids = Array.from(resourcesCache.keys());
		if (!ids.length) {
			reservedNowSet = new Set();
			return;
		}

		if (reservedRefreshInFlight) {
			reservedRefreshQueued = true;
			return;
		}

		reservedRefreshInFlight = true;
		reservedRefreshQueued = false;

		try {
			const nowIso = getNowIso();
			const data = await fetchActiveReservationsNow(supabase, ids, nowIso);
			reservedNowSet = new Set((data || []).map(r => r.resource_id).filter(Boolean));
		} catch (err) {
			// If reservations cannot be loaded (RLS or table missing), gracefully fall back
			reservedNowSet = new Set();
		} finally {
			reservedRefreshInFlight = false;
			if (reservedRefreshQueued) {
				reservedRefreshQueued = false;
				refreshReservedNow();
			}
		}
	}

	function startReservedPolling() {
		if (reservedRefreshTimer) return;
		// Reserved status is time-bound; refresh occasionally so it can expire without requiring a DB update.
		reservedRefreshTimer = setInterval(async () => {
			if (!hasValidFilters()) return;
			await refreshReservedNow();
			renderResourcesList();
		}, 30000);
	}

	function stopReservedPolling() {
		if (!reservedRefreshTimer) return;
		clearInterval(reservedRefreshTimer);
		reservedRefreshTimer = null;
	}

	function handleResourcesRealtime(payload) {
		if (!payload || !payload.eventType) return;
		if (!hasValidFilters()) return;

		if (payload.eventType === 'DELETE') {
			const oldRow = payload.old;
			if (oldRow && oldRow.id && resourcesCache.has(oldRow.id)) {
				resourcesCache.delete(oldRow.id);
				refreshReservedNow().finally(renderResourcesList);
			} else {
				renderResourcesList();
			}
			return;
		}

		const row = payload.new;
		if (!row || !row.id) return;

		const matchesFilters =
			row.resource_type === selectedType &&
			row.location === selectedLocation &&
			isActiveResource(row);

		if (matchesFilters) {
			resourcesCache.set(row.id, { ...row, __lastChangeAt: getNowIso() });
			refreshReservedNow().finally(renderResourcesList);
			return;
		}

		// If it no longer matches, remove it if present.
		if (resourcesCache.has(row.id)) {
			resourcesCache.delete(row.id);
			refreshReservedNow().finally(renderResourcesList);
			return;
		}
	}

	function handleReservationsRealtime(payload) {
		if (!payload || !payload.eventType) return;
		if (!hasValidFilters()) return;
		const resourceId = (payload.new && payload.new.resource_id) || (payload.old && payload.old.resource_id);
		if (!resourceId) return;
		if (!resourcesCache.has(resourceId)) return;
		refreshReservedNow().finally(renderResourcesList);
	}

	function ensureRealtimeSubscriptions() {
		if (!resourcesChannel) {
			resourcesChannel = supabase
				.channel('map-resources-live')
				.on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, handleResourcesRealtime);
			try {
				resourcesChannel.subscribe(() => { /* ignore status */ });
			} catch (e) {
				resourcesChannel.subscribe();
			}
		}

		if (!reservationsChannel) {
			reservationsChannel = supabase
				.channel('map-reservations-live')
				.on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, handleReservationsRealtime);
			try {
				reservationsChannel.subscribe(() => { /* ignore status */ });
			} catch (e) {
				reservationsChannel.subscribe();
			}
		}
	}
/**
 * Update seat statistics
 */
function updateStats() {
	const totalFree = document.querySelectorAll('.seat.status-free').length;
	const totalOccupied = document.querySelectorAll('.seat.status-occupied').length;
	const totalReserved = document.querySelectorAll('.seat.status-pending').length;

	const freeCount = document.getElementById('count-free');
	const occupiedCount = document.getElementById('count-occupied');
	const reservedCount = document.getElementById('count-reserved');

	if (freeCount) freeCount.textContent = totalFree;
	if (occupiedCount) occupiedCount.textContent = totalOccupied;
	if (reservedCount) reservedCount.textContent = totalReserved;
}

function setupQuickFilterChips() {
	const chips = document.querySelectorAll('.quick-filter-chip[data-resource-type]');
	const filterTypeEl = document.getElementById('filterType');
	if (!chips.length || !filterTypeEl) return;

	const syncActiveChip = () => {
		chips.forEach((chip) => {
			const matches = chip.dataset.resourceType === selectedType;
			chip.classList.toggle('is-active', matches);
		});
	};

	chips.forEach((chip) => {
		chip.addEventListener('click', async () => {
			const targetType = chip.dataset.resourceType;
			if (!targetType) return;

			const optionExists = Array.from(filterTypeEl.options).some((opt) => opt.value === targetType);
			if (!optionExists) {
				showStatusMessage('That quick pick is not available right now.', 'info');
				return;
			}

			filterTypeEl.value = targetType;
			selectedType = targetType;
			await updateLocationDropdownByType(selectedType);

			const filterLocationEl = document.getElementById('filterLocation');
			if (filterLocationEl) {
				selectedLocation = filterLocationEl.value;
			}

			syncActiveChip();
			await loadResourcesForFilters();
		});
	});

	syncActiveChip();
}

/**
 * Initialize the page on load
 */
async function initializePage() {
	const isAuthenticated = await checkAuth('FrameLogin.html');
	if (!isAuthenticated) return;

	const filterTypeEl = document.getElementById('filterType');
	const filterLocationEl = document.getElementById('filterLocation');

	setEmptyState('Choose a type and location to see available spaces.');

	if (filterTypeEl) {
		filterTypeEl.addEventListener('change', async function () {
			selectedType = this.value;
			await updateLocationDropdownByType(selectedType);
			if (filterLocationEl) selectedLocation = filterLocationEl.value;
			const chips = document.querySelectorAll('.quick-filter-chip[data-resource-type]');
			chips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.resourceType === selectedType));
			await loadResourcesForFilters();
		});
	}

	if (filterLocationEl) {
		filterLocationEl.addEventListener('change', async function () {
			selectedLocation = this.value;
			await loadResourcesForFilters();
		});
	}

	await Promise.all([
		populateTypeDropdown(),
		populateLocationDropdown()
	]);

	setupQuickFilterChips();

	ensureRealtimeSubscriptions();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
