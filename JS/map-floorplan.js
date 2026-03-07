// Import centralized Supabase client and auth check from supabase-auth.js
import { supabase } from './supabase-auth.js';
import { checkAuth } from './auth.js';

// Store resource ID to seat mapping
let resourceSeatMap = {};

// Subscription reference
let resourcesSubscription = null;

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

/**
 * Fetch unique resource types from Supabase
 */
async function fetchResourceTypesFromSupabase() {
	try {
		const { data, error } = await supabase
			.from('resources')
			.select('resource_type')
			.not('resource_type', 'is', null);

		if (error) {
			return [];
		}

		// Get unique resource types
		const uniqueTypes = [...new Set(data.map(r => r.resource_type))].filter(Boolean).sort();
		return uniqueTypes;
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
		const { data, error } = await supabase
			.from('resources')
			.select('location')
			.eq('resource_type', resourceType)
			.not('location', 'is', null);

		if (error) {
			return [];
		}

		// Get unique locations
		const uniqueLocations = [...new Set(data.map(r => r.location))].filter(Boolean).sort();
		return uniqueLocations;
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
		const { data, error } = await supabase
			.from('resources')
			.select('location')
			.not('location', 'is', null);

		if (error) {
			return [];
		}

		// Get unique locations
		const uniqueLocations = [...new Set(data.map(r => r.location))].filter(Boolean).sort();
		return uniqueLocations;
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

/**
 * Fetch resources from Supabase
 */
async function fetchResourcesFromSupabase() {
	try {
		const { data, error } = await supabase
			.from('resources')
			.select('id, name, location, is_active, resource_type')
			.eq('resource_type', 'library_seat');

		if (error) {
			return null;
		}

		return data || [];
	} catch (err) {

		return null;
	}
}

/**
 * Extract seat number from resource name
 * Example: "Table 1 - Seat 3" -> 3
 */
function extractSeatNumber(name) {
	const match = name.match(/Seat\s+(\d+)/i);
	return match ? parseInt(match[1]) : null;
}

/**
 * Initialize seats from Supabase resources
 */
async function initializeFromSupabase() {
	const resources = await fetchResourcesFromSupabase();
	
	if (!resources || resources.length === 0) {
		return;
	}

	// Map resources to seats based on extracted seat number
	resources.forEach(resource => {
		const seatNumber = extractSeatNumber(resource.name);
		
		if (seatNumber === null) {
			return;
		}
		
		const seatId = `seat-${String(seatNumber).padStart(3, '0')}`;
		const seat = document.getElementById(seatId);
		
		if (seat && seat.classList.contains('seat')) {
			// Store mapping for updates (includes current status for optimistic locking)
			resourceSeatMap[resource.id] = { 
				seatId, 
				seatNumber: seatNumber,
				name: resource.name,
				location: resource.location,
				currentValue: resource.is_active  // Store for optimistic locking
			};
			
			// Set seat title/tooltip to show the resource name and location
			seat.setAttribute('title', `${resource.name}\n${resource.location}`);
			
			// Set initial status based on is_active
			const status = resource.is_active ? 'free' : 'occupied';
			updateSeat(seatId, status);
		} else {
		}
	});
}

/**
 * Update resource status in Supabase with optimistic locking
 */
async function updateResourceInSupabase(resourceId, isActive, oldValue) {
	try {
		// Use optimistic locking: only update if the old value matches
		const { data, error } = await supabase
			.from('resources')
			.update({ 
				is_active: isActive,
				updated_at: new Date().toISOString()
			})
			.eq('id', resourceId)
			.eq('is_active', oldValue)  // Only update if unchanged
			.select();

		if (error) {
			return { success: false, conflict: false };
		}

		// Check if the update was successful (if data is empty, there was a conflict)
		if (!data || data.length === 0) {
			return { success: false, conflict: true };
		}

		return { success: true, conflict: false };
	} catch (err) {

		return { success: false, conflict: false };
	}
}

/**
 * Find resource ID by seat ID
 */
function getResourceIdFromSeat(seatId) {
	for (const [resourceId, mapping] of Object.entries(resourceSeatMap)) {
		if (mapping.seatId === seatId) {
			return resourceId;
		}
	}
	return null;
}

/**
 * Subscribe to real-time updates for resources
 */
function subscribeToResourceUpdates() {
	// Unsubscribe from previous subscription if exists
	if (resourcesSubscription) {
		supabase.removeChannel(resourcesSubscription);
	}

	// Subscribe to all changes on the resources table
	resourcesSubscription = supabase
		.channel('public:resources', {
			config: { 
				broadcast: { self: false }  // Don't receive our own changes
			}
		});

	resourcesSubscription
		.on(
			'postgres_changes',
			{
				event: '*',  // Listen to INSERT, UPDATE, DELETE
				schema: 'public',
				table: 'resources',
				filter: 'resource_type=eq.library_seat'  // Only library seats
			},
			(payload) => {
				handleResourceUpdate(payload);
			}
		)
		.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
			} else if (status === 'CHANNEL_ERROR') {
			} else if (status === 'CLOSED') {
			}
		});
}

/**
 * Handle real-time resource updates from other users
 */
function handleResourceUpdate(payload) {
	const { eventType, new: newData, old: oldData } = payload;

	if (eventType === 'UPDATE') {
		const resourceId = newData.id;
		const isActive = newData.is_active;

		// Find the seat mapped to this resource
		const mapping = resourceSeatMap[resourceId];
		if (mapping) {
			const seatId = mapping.seatId;
			const status = isActive ? 'free' : 'occupied';
			
			// Update the seat visually
			const seat = document.getElementById(seatId);
			if (seat) {
				seat.classList.remove('status-free', 'status-occupied', 'status-pending');
				seat.classList.add(`status-${status}`);
				
				// Update stats
				updateStats();
				
				// Flash effect to indicate real-time update
				seat.style.opacity = '0.7';
				setTimeout(() => {
					seat.style.opacity = '1';
				}, 200);
			}
		}
	} else if (eventType === 'INSERT') {
		// Handle insert event
	} else if (eventType === 'DELETE') {
		// Handle delete event
	}
}

/**
 * Updates a seat's status
 */
function updateSeat(seatId, status) {
	const seat = document.getElementById(seatId);
	if (!seat) {

		return;
	}

	// Remove all status classes
	seat.classList.remove('status-free', 'status-occupied', 'status-pending');

	// Add the new status class
	seat.classList.add(`status-${status}`);

	// Update statistics
	updateStats();
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

/**
 * Initialize the page on load
 */
async function initializePage() {

	// Check authentication before initializing page
	const isAuthenticated = await checkAuth('FrameLogin.html');
	if (!isAuthenticated) return;

	// Set up dropdown event listener
	const filterType = document.getElementById('filterType');
	const floorplanLegend = document.getElementById('floorplanLegend');
	const floorplanStats = document.getElementById('floorplanStats');
	const floorplanContainer = document.getElementById('floorplanContainer');

	if (filterType) {
		filterType.addEventListener('change', async function () {
			const selectedType = this.value;
			const isLibrary = selectedType !== 'all' && (selectedType.includes('seat') || selectedType.includes('library'));
			
			// Update location dropdown based on selected type
			await updateLocationDropdownByType(selectedType);
			
			// Hide empty state if showing library seat type
			const emptyState = document.getElementById('emptyStateMessage');
			
			if (isLibrary) {
				// Show floorplan elements
				if (floorplanLegend) floorplanLegend.style.display = '';
				if (floorplanStats) floorplanStats.style.display = '';
				if (floorplanContainer) floorplanContainer.style.display = '';
				if (emptyState) emptyState.style.display = 'none';
				
				// Initialize floorplan if not already done
				if (!resourceSeatMap || Object.keys(resourceSeatMap).length === 0) {

					initializeFloorplan();
				}
			} else {
				// Hide floorplan elements and show empty state
				if (floorplanLegend) floorplanLegend.style.display = 'none';
				if (floorplanStats) floorplanStats.style.display = 'none';
				if (floorplanContainer) floorplanContainer.style.display = 'none';
				if (emptyState) emptyState.style.display = 'flex';
			}
		});
	}

	// Populate dropdowns from database
	await Promise.all([
		populateTypeDropdown(),
		populateLocationDropdown()
	]);
}

/**
 * Initialize the floorplan with Supabase data
 */
async function initializeFloorplan() {
	showLoading();

	try {
		// Fetch and initialize from Supabase
		await initializeFromSupabase();

		// Seats are not clickable to prevent students from playing with them
		// Seats are read-only and only update from real-time Supabase changes

		// Update stats on load
		updateStats();

		// Subscribe to real-time updates
		subscribeToResourceUpdates();
	} catch (err) {
	} finally {
		hideLoading();
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
