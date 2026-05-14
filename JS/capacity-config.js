/**
 * PHASE 9.1: CAPACITY MONITORING - CONFIGURATION & SETUP
 * 
 * Configuration constants, initialization functions, and helper utilities
 * for the Phase 9 capacity alerts system.
 * 
 * @module capacity-config.js
 * @version 1.0.0
 */

// ============================================================================
// CAPACITY CONFIGURATION
// ============================================================================

/**
 * Global configuration for capacity monitoring system
 */
export const CAPACITY_CONFIG = {
  // Alert thresholds (as decimal: 0.80 = 80%)
  thresholds: {
    warning: 0.80,      // Yellow alert - "Getting Busy"
    critical: 0.95,     // Red alert - "Near Full"
    full: 1.00          // Pink alert - "Full Capacity"
  },

  // Severity levels for each threshold
  alertSeverity: {
    80: 'HIGH',         // Alert at 80%
    95: 'CRITICAL',     // Alert at 95%
    100: 'CRITICAL'     // Alert at 100%
  },

  // Snooze duration (minutes) to prevent alert spam
  snoozeDefaults: {
    80: 15,    // Snooze 80% alerts for 15 minutes
    95: 5,     // Snooze 95% alerts for 5 minutes
    100: 2     // Snooze 100% alerts for 2 minutes
  },

  // Occupancy data sources (priority order)
  occupancySources: {
    primary: 'ultrasonic',    // Most accurate
    secondary: 'rfid',        // Secondary
    tertiary: 'ble',          // Tertiary fallback
    manual: 'manual'          // Manual entry
  },

  // Notification channels
  notificationChannels: {
    dashboard: true,  // In-app notifications (always enabled)
    email: true,      // Email alerts
    sms: false        // SMS alerts (optional, requires Twilio)
  },

  // Real-time update interval
  refreshInterval: 30000,  // 30 seconds

  // Status labels
  statusLabels: {
    available: '✅ Available',
    busy: '🟡 Getting Busy',
    nearFull: '🔴 Near Capacity',
    full: '⛔ Full Capacity',
    error: '❌ Data Unavailable'
  },

  // Color coding for UI
  statusColors: {
    available: '#4CAF50',     // Green
    busy: '#FFC107',          // Yellow/Amber
    nearFull: '#FF9800',      // Orange
    full: '#F44336',          // Red
    error: '#9E9E9E'          // Gray
  },

  // CSS classes for styling
  statusClasses: {
    available: 'status-available',
    busy: 'status-busy',
    nearFull: 'status-critical',
    full: 'status-full',
    error: 'status-error'
  },

  // Legacy names for backward compatibility
  categories: {
    low: 'available',
    medium: 'busy',
    high: 'nearFull',
    full: 'full'
  },

  // Database table names
  tables: {
    capacity: 'resource_capacity',
    snapshots: 'occupancy_snapshots',
    alerts: 'capacity_alerts',
    notifications: 'admin_notifications'
  },

  // Data retention policies
  retention: {
    snapshots_days: 90,     // Keep occupancy snapshots for 90 days
    alerts_days: 180,       // Keep alert logs for 6 months
    max_snapshots_per_resource: 10000  // Archive old data
  },

  // Performance & monitoring
  performance: {
    maxConcurrentRequests: 10,
    requestTimeoutMs: 5000,
    cacheDurationMs: 60000,           // Cache capacity data for 1 minute
    realTimeUpdateLatency: 2000       // Target real-time update latency
  }
}

// ============================================================================
// ALERT TYPE DEFINITIONS
// ============================================================================

export const ALERT_TYPES = {
  THRESHOLD_80: 'threshold_80',
  THRESHOLD_95: 'threshold_95',
  FULL_CAPACITY: 'full_capacity'
}

export const ALERT_STATUSES = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
}

// ============================================================================
// CAPACITY CALCULATIONS
// ============================================================================

/**
 * Calculate occupancy percentage from count and max capacity
 * @param {number} occupancyCount - Current number of people
 * @param {number} maxCapacity - Maximum capacity
 * @returns {number} Percentage (0-200, >100 = over capacity)
 */
export function calculateOccupancyPercentage(occupancyCount, maxCapacity) {
  if (maxCapacity <= 0) return 0
  const percentage = (occupancyCount / maxCapacity) * 100
  return Math.round(percentage * 100) / 100  // Round to 2 decimals
}

/**
 * Get status category from occupancy percentage
 * @param {number} percentage - Occupancy percentage (0-200)
 * @returns {string} Status key: 'available'|'busy'|'nearFull'|'full'
 */
export function getStatusCategory(percentage) {
  if (percentage < CAPACITY_CONFIG.thresholds.warning * 100) {
    return 'available'
  }
  if (percentage < CAPACITY_CONFIG.thresholds.critical * 100) {
    return 'busy'
  }
  if (percentage < CAPACITY_CONFIG.thresholds.full * 100) {
    return 'nearFull'
  }
  return 'full'
}

/**
 * Get status label from percentage
 * @param {number} percentage - Occupancy percentage
 * @returns {string} Display label with emoji
 */
export function getStatusLabel(percentage) {
  const category = getStatusCategory(percentage)
  return CAPACITY_CONFIG.statusLabels[category]
}

/**
 * Get color for status
 * @param {number} percentage - Occupancy percentage
 * @returns {string} Hex color code
 */
export function getStatusColor(percentage) {
  const category = getStatusCategory(percentage)
  return CAPACITY_CONFIG.statusColors[category]
}

/**
 * Get CSS class for status
 * @param {number} percentage - Occupancy percentage
 * @returns {string} CSS class name
 */
export function getStatusClass(percentage) {
  const category = getStatusCategory(percentage)
  return CAPACITY_CONFIG.statusClasses[category]
}

// ============================================================================
// ALERT DETECTION
// ============================================================================

/**
 * Determine which thresholds have been crossed
 * @param {number} currentPercentage - Current occupancy %
 * @param {number} previousPercentage - Previous occupancy % (or 0 if new)
 * @returns {Object} {breached: [80, 95, 100], newly: [80, 95, 100]}
 */
export function detectThresholdBreaches(currentPercentage, previousPercentage = 0) {
  const thresholds = [80, 95, 100]
  const breached = []
  const newly = []

  thresholds.forEach(threshold => {
    const thresholdPercentage = threshold / 100
    const isCurrentlyBreached = currentPercentage >= threshold
    const wasPreviouslyBreached = previousPercentage >= threshold

    if (isCurrentlyBreached) {
      breached.push(threshold)
      if (!wasPreviouslyBreached) {
        newly.push(threshold)  // NEW breach
      }
    }
  })

  return { breached, newly }
}

/**
 * Get alert type for a threshold
 * @param {number} threshold - Threshold percentage (80, 95, 100)
 * @returns {string} Alert type: 'threshold_80'|'threshold_95'|'full_capacity'
 */
export function getAlertType(threshold) {
  switch (threshold) {
    case 80:
      return ALERT_TYPES.THRESHOLD_80
    case 95:
      return ALERT_TYPES.THRESHOLD_95
    case 100:
      return ALERT_TYPES.FULL_CAPACITY
    default:
      return null
  }
}

/**
 * Get severity for alert type
 * @param {string} alertType - Alert type
 * @returns {string} 'HIGH'|'CRITICAL'
 */
export function getAlertSeverity(alertType) {
  if (alertType === ALERT_TYPES.THRESHOLD_80) return 'HIGH'
  if (alertType === ALERT_TYPES.THRESHOLD_95) return 'CRITICAL'
  if (alertType === ALERT_TYPES.FULL_CAPACITY) return 'CRITICAL'
  return 'INFO'
}

// ============================================================================
// SNOOZE & RATE LIMITING
// ============================================================================

/**
 * Check if alert should be snoozed (prevent spam)
 * @param {number} lastAlertTime - Timestamp of last alert (ms since epoch)
 * @param {number} threshold - Threshold percentage (80, 95, 100)
 * @returns {Object} {shouldSnooze: boolean, minutesRemaining: number}
 */
export function shouldSnoozeAlert(lastAlertTime, threshold) {
  if (!lastAlertTime) {
    return { shouldSnooze: false, minutesRemaining: 0 }
  }

  const snoozeMinutes = CAPACITY_CONFIG.snoozeDefaults[threshold] || 5
  const snoozeMs = snoozeMinutes * 60 * 1000
  const timeSinceLastAlert = Date.now() - lastAlertTime
  const remainingMs = snoozeMs - timeSinceLastAlert

  if (remainingMs > 0) {
    const minutesRemaining = Math.ceil(remainingMs / 60000)
    return {
      shouldSnooze: true,
      minutesRemaining: minutesRemaining
    }
  }

  return { shouldSnooze: false, minutesRemaining: 0 }
}

// ============================================================================
// SUPABASE INTEGRATION HELPERS
// ============================================================================

/**
 * Get resource capacity configuration from Supabase
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @param {number} resourceId - Resource ID to fetch
 * @returns {Promise<Object>} Capacity config or null
 */
export async function getResourceCapacityConfig(supabase, resourceId) {
  try {
    const { data, error } = await supabase
      .from(CAPACITY_CONFIG.tables.capacity)
      .select('*')
      .eq('resource_id', resourceId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Failed to fetch capacity config for resource ${resourceId}:`, error)
    return null
  }
}

/**
 * Get current occupancy snapshot for a resource
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @param {number} resourceId - Resource ID to fetch
 * @returns {Promise<Object>} Latest snapshot or null
 */
export async function getCurrentOccupancySnapshot(supabase, resourceId) {
  try {
    const { data, error } = await supabase
      .from(CAPACITY_CONFIG.tables.snapshots)
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no rows
    return data || null
  } catch (error) {
    console.error(`Failed to fetch occupancy for resource ${resourceId}:`, error)
    return null
  }
}

/**
 * Get all active capacity alerts
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @returns {Promise<Array>} Array of active alerts
 */
export async function getActiveCapacityAlerts(supabase) {
  try {
    const { data, error } = await supabase
      .from(CAPACITY_CONFIG.tables.alerts)
      .select(`
        *,
        resources:resource_id(name, location)
      `)
      .eq('status', ALERT_STATUSES.ACTIVE)
      .order('triggered_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to fetch active alerts:', error)
    return []
  }
}

/**
 * Record occupancy snapshot in Supabase
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @param {Object} snapshot - Snapshot data
 * @returns {Promise<boolean>} Success status
 */
export async function recordOccupancySnapshot(supabase, snapshot) {
  try {
    const { error } = await supabase
      .from(CAPACITY_CONFIG.tables.snapshots)
      .insert({
        resource_id: snapshot.resource_id,
        occupancy_count: snapshot.occupancy_count,
        max_capacity: snapshot.max_capacity,
        occupancy_percentage: Math.round((snapshot.occupancy_count / snapshot.max_capacity) * 100),
        source: snapshot.source || 'ultrasonic',
        confidence: snapshot.confidence || 100,
        is_full_capacity: snapshot.occupancy_count >= snapshot.max_capacity,
        is_near_capacity: (snapshot.occupancy_count / snapshot.max_capacity) >= 0.95
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to record occupancy snapshot:', error)
    return false
  }
}

/**
 * Create capacity alert in Supabase
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @param {Object} alert - Alert data
 * @returns {Promise<Object>} Created alert or null
 */
export async function createCapacityAlert(supabase, alert) {
  try {
    const { data, error } = await supabase
      .from(CAPACITY_CONFIG.tables.alerts)
      .insert({
        resource_id: alert.resource_id,
        alert_type: alert.alert_type,
        occupancy_count: alert.occupancy_count,
        occupancy_percentage: alert.occupancy_percentage,
        severity: alert.severity,
        status: ALERT_STATUSES.ACTIVE
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to create capacity alert:', error)
    return null
  }
}

/**
 * Update capacity alert status
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @param {number} alertId - Alert ID to update
 * @param {string} status - New status ('resolved'|'dismissed')
 * @param {number} adminId - Admin user ID (if dismissed)
 * @returns {Promise<boolean>} Success status
 */
export async function updateAlertStatus(supabase, alertId, status, adminId = null) {
  try {
    const updates = {
      status: status,
      resolved_at: status === ALERT_STATUSES.RESOLVED ? new Date().toISOString() : null,
      dismissed_at: status === ALERT_STATUSES.DISMISSED ? new Date().toISOString() : null,
      dismissed_by: status === ALERT_STATUSES.DISMISSED ? adminId : null
    }

    // Remove null values
    Object.keys(updates).forEach(key => updates[key] === null && delete updates[key])

    const { error } = await supabase
      .from(CAPACITY_CONFIG.tables.alerts)
      .update(updates)
      .eq('id', alertId)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Failed to update alert ${alertId}:`, error)
    return false
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize capacity monitoring system
 * @param {SupabaseClient} supabase - Initialized Supabase client
 * @returns {Promise<Object>} Initialization result
 */
export async function initializeCapacityMonitoring(supabase) {
  try {
    console.log('🚀 Initializing Capacity Monitoring System (Phase 9.1)...')

    // Verify tables exist by querying them
    const { count: capacityCount, error: error1 } = await supabase
      .from(CAPACITY_CONFIG.tables.capacity)
      .select('*', { count: 'exact', head: true })

    if (error1) throw new Error(`Capacity table check failed: ${error1.message}`)

    const { count: snapshotCount, error: error2 } = await supabase
      .from(CAPACITY_CONFIG.tables.snapshots)
      .select('*', { count: 'exact', head: true })

    if (error2) throw new Error(`Snapshots table check failed: ${error2.message}`)

    console.log(`✅ Capacity Monitoring initialized`)
    console.log(`   - Resource Capacity configs: ${capacityCount}`)
    console.log(`   - Occupancy snapshots stored: ${snapshotCount}`)

    return {
      success: true,
      tables: {
        capacity: true,
        snapshots: true,
        alerts: true,
        notifications: true
      }
    }
  } catch (error) {
    console.error('❌ Capacity Monitoring initialization failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  CAPACITY_CONFIG,
  ALERT_TYPES,
  ALERT_STATUSES,
  calculateOccupancyPercentage,
  getStatusCategory,
  getStatusLabel,
  getStatusColor,
  getStatusClass,
  detectThresholdBreaches,
  getAlertType,
  getAlertSeverity,
  shouldSnoozeAlert,
  getResourceCapacityConfig,
  getCurrentOccupancySnapshot,
  getActiveCapacityAlerts,
  recordOccupancySnapshot,
  createCapacityAlert,
  updateAlertStatus,
  initializeCapacityMonitoring
}
