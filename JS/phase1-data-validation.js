/**
 * PHASE 1: Data Analysis & Preparation - Enhanced with Data Validation
 * 
 * Improvements implemented:
 * 1. Data Validation Layer - Schema validation, acceptable ranges, timestamp validation
 * 2. Explicit Data Quality Checks - Gap tolerance, outlier detection, completeness metrics
 * 3. Cache Versioning System - Version control for localStorage data persistence
 * 4. Data Source Configuration - Configurable table queries, time windows, sensor priorities
 * 
 * @module phase1-data-validation
 */

// ============================================================================
// PART 1: DATA SOURCE CONFIGURATION
// ============================================================================

/**
 * Configuration for data sources, time windows, and sensor priorities
 */
export const DATA_SOURCE_CONFIG = {
  // Tables to query for data collection
  tables: {
    ultrasonic: 'occupancy_readings',
    rfid: 'rfid_scans',
    ble: 'ble_presence_sessions',
    ble_scans: 'ble_scans'
  },

  // Time windows for data collection
  timeWindows: {
    historical: {
      days: 180,  // 6 months of historical data
      description: 'Rolling 6-month window for pattern analysis'
    },
    recentThreshold: {
      days: 14,   // Last 2 weeks weighted higher
      description: 'Recent data receives 1.5x weight in predictions'
    },
    cache: {
      duration_hours: 24,
      description: 'Cache invalidation period'
    }
  },

  // Sensor priority order
  sensorPriority: [
    'ultrasonic',  // Most accurate for occupancy
    'rfid',        // Secondary for resource tracking
    'ble'          // Tertiary for presence sessions
  ],

  // Data completeness thresholds
  completenessThresholds: {
    acceptable: 0.70,       // 70%+ data points = acceptable
    warning: 0.50,          // 50-70% = warning
    critical: 0.30          // <30% = critical
  }
}

// ============================================================================
// PART 2: CACHE VERSIONING SYSTEM
// ============================================================================

/**
 * Version number for cached data format
 * Increment when cache structure changes
 */
const CACHE_VERSION = 1
const CACHE_KEY_PREFIX = 'pbp_'
const CACHE_KEYS = {
  dataAnalysis: `${CACHE_KEY_PREFIX}data_analysis_v${CACHE_VERSION}`,
  dataQuality: `${CACHE_KEY_PREFIX}data_quality_v${CACHE_VERSION}`,
  completenessMetrics: `${CACHE_KEY_PREFIX}completeness_v${CACHE_VERSION}`,
  lastValidationTime: `${CACHE_KEY_PREFIX}last_validation_v${CACHE_VERSION}`,
  schemaVersion: `${CACHE_KEY_PREFIX}schema_version`
}

/**
 * Versioned cache wrapper - prevents issues from old cache formats
 */
export function getCachedData(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue

    const parsed = JSON.parse(stored)
    
    // Validate cache hasn't expired
    if (parsed.timestamp && parsed.ttl_hours) {
      const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
      if (ageHours > parsed.ttl_hours) {
        localStorage.removeItem(key)
        return defaultValue
      }
    }

    return parsed.data || defaultValue
  } catch (e) {
    console.warn(`Cache read error for ${key}:`, e.message)
    return defaultValue
  }
}

/**
 * Store data with versioning and TTL
 */
export function setCachedData(key, data, ttl_hours = 24) {
  try {
    const wrapper = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      ttl_hours: ttl_hours,
      data: data
    }
    localStorage.setItem(key, JSON.stringify(wrapper))
  } catch (e) {
    console.warn(`Cache write error for ${key}:`, e.message)
  }
}

/**
 * Clear all versioned cache entries
 */
export function clearCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * Migrate old cache format to new version
 */
export function migrateCache() {
  const oldKey = 'pbp_data_analysis'
  const stored = localStorage.getItem(oldKey)
  
  if (stored && !localStorage.getItem(CACHE_KEYS.dataAnalysis)) {
    try {
      const data = JSON.parse(stored)
      setCachedData(CACHE_KEYS.dataAnalysis, data, 24)
      localStorage.removeItem(oldKey)
      console.log('Cache migrated to v' + CACHE_VERSION)
    } catch (e) {
      console.warn('Cache migration failed:', e.message)
    }
  }
}

// ============================================================================
// PART 3: DATA VALIDATION LAYER
// ============================================================================

/**
 * Schema definition for different data types
 */
const DATA_SCHEMAS = {
  occupancy_readings: {
    required: ['reading_time', 'occupancy_reading'],
    numeric: ['occupancy_reading'],
    ranges: {
      occupancy_reading: { min: 0, max: 100, description: 'Occupancy percentage' }
    }
  },
  rfid_scans: {
    required: ['scanned_at', 'user_id', 'resource_id'],
    ranges: {
      user_id: { min: 1, max: 999999 },
      resource_id: { min: 1, max: 999999 }
    }
  },
  ble_presence_sessions: {
    required: ['user_id', 'resource_id'],
    optional: ['last_signal_time', 'last_seen_at']
  }
}

/**
 * Validate a record against its schema
 * @param {Object} record - The data record to validate
 * @param {string} tableType - The table type (key in DATA_SCHEMAS)
 * @returns {Object} {valid: boolean, errors: [string]}
 */
export function validateRecord(record, tableType) {
  const schema = DATA_SCHEMAS[tableType]
  if (!schema) {
    return { valid: false, errors: [`Unknown table type: ${tableType}`] }
  }

  const errors = []

  // Check required fields
  if (schema.required) {
    schema.required.forEach(field => {
      if (record[field] === null || record[field] === undefined || record[field] === '') {
        errors.push(`Missing required field: ${field}`)
      }
    })
  }

  // Validate numeric fields
  if (schema.numeric) {
    schema.numeric.forEach(field => {
      if (record[field] !== null && isNaN(Number(record[field]))) {
        errors.push(`Field "${field}" must be numeric, got: ${typeof record[field]}`)
      }
    })
  }

  // Validate ranges
  if (schema.ranges) {
    Object.entries(schema.ranges).forEach(([field, range]) => {
      const value = record[field]
      if (value !== null && value !== undefined) {
        const num = Number(value)
        if (num < range.min || num > range.max) {
          errors.push(
            `${field} out of range: ${num} (${range.description}). ` +
            `Expected ${range.min}-${range.max}`
          )
        }
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    record: record
  }
}

/**
 * Validate timestamp format and reasonableness
 * Acceptable timestamps:
 * - ISO format: 2024-05-14T10:30:00Z or 2024-05-14 10:30:00
 * - Not in future (max 5 min tolerance for clock skew)
 * - Not older than data collection window
 * 
 * @param {string|Date} timestamp - The timestamp to validate
 * @param {number} maxAgeHours - Maximum acceptable age in hours (default: 30*24)
 * @returns {Object} {valid: boolean, error: string|null, date: Date|null}
 */
export function validateTimestamp(timestamp, maxAgeHours = 30 * 24) {
  if (!timestamp) {
    return { valid: false, error: 'Timestamp is empty', date: null }
  }

  // Parse timestamp
  let date = null
  if (timestamp instanceof Date) {
    date = timestamp
  } else {
    const str = String(timestamp).replace(' ', 'T')
    date = new Date(str)
  }

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { valid: false, error: `Invalid timestamp format: ${timestamp}`, date: null }
  }

  // Check not in future (5 minute tolerance)
  const now = new Date()
  const maxFutureMs = 5 * 60 * 1000
  if (date.getTime() > now.getTime() + maxFutureMs) {
    return { 
      valid: false, 
      error: `Timestamp is in future: ${timestamp}`,
      date: null 
    }
  }

  // Check not too old
  const ageHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  if (ageHours > maxAgeHours) {
    return { 
      valid: false, 
      error: `Timestamp too old: ${timestamp} (${ageHours.toFixed(1)}h old, max ${maxAgeHours}h)`,
      date: null
    }
  }

  return { valid: true, error: null, date: date }
}

/**
 * Validate batch of records against schema
 * @param {Array} records - Records to validate
 * @param {string} tableType - Table type for schema lookup
 * @returns {Object} {valid: number, invalid: number, errors: [string], validRecords: []}
 */
export function validateBatch(records, tableType) {
  if (!Array.isArray(records)) {
    return { valid: 0, invalid: 1, errors: ['Input must be an array'], validRecords: [] }
  }

  let validCount = 0
  let invalidCount = 0
  const errors = []
  const validRecords = []

  records.forEach((record, index) => {
    const validation = validateRecord(record, tableType)
    if (validation.valid) {
      validCount++
      validRecords.push(record)
    } else {
      invalidCount++
      if (errors.length < 10) {  // Limit error reporting
        errors.push(`Record ${index}: ${validation.errors.join('; ')}`)
      }
    }
  })

  return {
    valid: validCount,
    invalid: invalidCount,
    errors: errors,
    validRecords: validRecords,
    validityPercentage: records.length > 0 ? (validCount / records.length * 100).toFixed(1) : 0
  }
}

// ============================================================================
// PART 4: DATA QUALITY CHECKS
// ============================================================================

/**
 * Detect outliers in numeric data using IQR (Interquartile Range) method
 * Thresholds: outliers > 3 standard deviations from mean
 * 
 * @param {number[]} values - Array of numeric values
 * @param {number} sdThreshold - Standard deviation threshold (default: 3)
 * @returns {Object} {outliers: [index], outlierCount: number, mean: number, stdDev: number}
 */
export function detectOutliers(values, sdThreshold = 3) {
  if (!Array.isArray(values) || values.length < 2) {
    return { outliers: [], outlierCount: 0, mean: 0, stdDev: 0 }
  }

  const numValues = values.filter(v => !isNaN(v) && v !== null)
  if (numValues.length < 2) {
    return { outliers: [], outlierCount: 0, mean: 0, stdDev: 0 }
  }

  // Calculate mean
  const mean = numValues.reduce((a, b) => a + b) / numValues.length

  // Calculate standard deviation
  const variance = numValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numValues.length
  const stdDev = Math.sqrt(variance)

  // Find outliers
  const outliers = []
  values.forEach((v, index) => {
    if (!isNaN(v) && v !== null) {
      const zScore = Math.abs((v - mean) / stdDev)
      if (zScore > sdThreshold) {
        outliers.push({ index, value: v, zScore: zScore.toFixed(2) })
      }
    }
  })

  return {
    outliers: outliers,
    outlierCount: outliers.length,
    mean: mean.toFixed(2),
    stdDev: stdDev.toFixed(2),
    threshold: sdThreshold
  }
}

/**
 * Detect data gaps (missing timestamps)
 * @param {Array} records - Records with timestamp field
 * @param {string} timestampField - Name of timestamp field
 * @param {number} maxGapMinutes - Maximum acceptable gap in minutes (default: 120)
 * @returns {Object} {gapCount: number, gaps: [Object], maxGapMinutes: number}
 */
export function detectDataGaps(records, timestampField = 'created_at', maxGapMinutes = 120) {
  if (!Array.isArray(records) || records.length < 2) {
    return { gapCount: 0, gaps: [], maxGapMinutes: maxGapMinutes }
  }

  const gaps = []
  const sortedRecords = records.slice().sort((a, b) => {
    const aTime = new Date(a[timestampField]).getTime()
    const bTime = new Date(b[timestampField]).getTime()
    return aTime - bTime
  })

  for (let i = 1; i < sortedRecords.length; i++) {
    const prev = new Date(sortedRecords[i - 1][timestampField])
    const curr = new Date(sortedRecords[i][timestampField])
    const gapMinutes = (curr.getTime() - prev.getTime()) / (1000 * 60)

    if (gapMinutes > maxGapMinutes) {
      gaps.push({
        startIndex: i - 1,
        endIndex: i,
        gapMinutes: gapMinutes.toFixed(1),
        severity: gapMinutes > maxGapMinutes * 2 ? 'Critical' : 'Warning'
      })
    }
  }

  return {
    gapCount: gaps.length,
    gaps: gaps,
    maxGapMinutes: maxGapMinutes,
    exceedsThreshold: gaps.length > 0
  }
}

/**
 * Calculate data completeness metrics
 * @param {Array} records - All records
 * @param {number} expectedRecordsPerHour - Baseline for complete data
 * @param {number} windowHours - Time window size in hours
 * @returns {Object} Completeness metrics and severity level
 */
export function calculateDataCompleteness(records, expectedRecordsPerHour = 60, windowHours = 24) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      recordCount: 0,
      expectedRecords: windowHours * expectedRecordsPerHour,
      completenessPercentage: 0,
      severity: 'Critical',
      recommendation: 'No data available - check data source configuration'
    }
  }

  const expectedRecords = windowHours * expectedRecordsPerHour
  const completenessPercentage = Math.min(100, (records.length / expectedRecords) * 100)

  let severity = 'Acceptable'
  let recommendation = 'Data completeness is good'

  if (completenessPercentage < DATA_SOURCE_CONFIG.completenessThresholds.critical * 100) {
    severity = 'Critical'
    recommendation = 'Critical data gaps detected - verify sensor operation'
  } else if (completenessPercentage < DATA_SOURCE_CONFIG.completenessThresholds.warning * 100) {
    severity = 'Warning'
    recommendation = 'Missing ~' + Math.round(100 - completenessPercentage) + '% of expected data'
  }

  return {
    recordCount: records.length,
    expectedRecords: expectedRecords,
    completenessPercentage: completenessPercentage.toFixed(1),
    severity: severity,
    recommendation: recommendation,
    thresholds: {
      acceptable: DATA_SOURCE_CONFIG.completenessThresholds.acceptable * 100,
      warning: DATA_SOURCE_CONFIG.completenessThresholds.warning * 100,
      critical: DATA_SOURCE_CONFIG.completenessThresholds.critical * 100
    }
  }
}

// ============================================================================
// PART 5: COMPREHENSIVE DATA QUALITY REPORT
// ============================================================================

/**
 * Generate comprehensive data quality report
 * @param {Object} dataByType - {ultrasonic: [...], rfid: [...], ble: [...]}
 * @returns {Object} Complete quality assessment
 */
export function generateDataQualityReport(dataByType) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRecords: 0,
      dataQualityScore: 0,  // 0-100
      issues: [],
      warnings: [],
      recommendations: []
    },
    byDataType: {}
  }

  // Analyze each data type
  Object.entries(dataByType).forEach(([type, records]) => {
    if (!Array.isArray(records)) return

    report.summary.totalRecords += records.length

    // Validate batch
    const validation = validateBatch(records, type)
    
    // Check completeness
    const completeness = calculateDataCompleteness(records)
    
    // Detect outliers (if numeric data available)
    let outlierAnalysis = {}
    if (type === 'ultrasonic' && records.length > 0) {
      const occupancyValues = records.map(r => r.occupancy_reading).filter(v => !isNaN(v))
      outlierAnalysis = detectOutliers(occupancyValues)
    }

    // Detect gaps
    const gaps = detectDataGaps(records)

    const typeReport = {
      recordCount: records.length,
      validation: {
        validRecords: validation.valid,
        invalidRecords: validation.invalid,
        validityPercentage: validation.validityPercentage
      },
      completeness: completeness,
      outliers: outlierAnalysis.outlierCount || 0,
      gaps: gaps.gapCount,
      issues: [
        ...validation.errors.slice(0, 3),
        ...(completeness.severity === 'Critical' ? [completeness.recommendation] : []),
        ...(gaps.gapCount > 0 ? [`${gaps.gapCount} data gaps detected (>${gaps.maxGapMinutes}min)`] : [])
      ]
    }

    report.byDataType[type] = typeReport

    // Aggregate issues
    if (validation.invalid > 0) {
      report.summary.issues.push(`${type}: ${validation.invalid} invalid records`)
    }
    if (completeness.severity === 'Critical') {
      report.summary.issues.push(`${type}: ${completeness.recommendation}`)
    }
    if (completeness.severity === 'Warning') {
      report.summary.warnings.push(`${type}: ${completeness.recommendation}`)
    }
    if (outlierAnalysis.outlierCount > 5) {
      report.summary.warnings.push(`${type}: ${outlierAnalysis.outlierCount} statistical outliers detected`)
    }
  })

  // Calculate overall data quality score (0-100)
  let scoreDeductions = 0
  if (report.summary.issues.length > 0) scoreDeductions += 40
  if (report.summary.warnings.length > 0) scoreDeductions += 20
  if (report.summary.totalRecords < 100) scoreDeductions += 15
  report.summary.dataQualityScore = Math.max(0, 100 - scoreDeductions)

  // Generate recommendations
  if (report.summary.dataQualityScore < 60) {
    report.summary.recommendations.push('⚠️ Data quality is below acceptable threshold - consider data source investigation')
    report.summary.recommendations.push('Review sensor calibration and configuration')
  }
  if (report.summary.issues.length > 0) {
    report.summary.recommendations.push('Address critical issues before proceeding with predictions')
  }
  if (report.summary.warnings.length > 0) {
    report.summary.recommendations.push('Monitor for data quality degradation')
  }

  // Cache the report
  setCachedData(CACHE_KEYS.dataQuality, report, 24)

  return report
}

// ============================================================================
// PART 6: INITIALIZATION & EXPORTS
// ============================================================================

/**
 * Initialize Phase 1 validation system
 */
export function initializePhase1() {
  try {
    migrateCache()
    console.log('✓ Phase 1 Data Validation initialized')
    console.log(`✓ Cache version: v${CACHE_VERSION}`)
    console.log(`✓ Data sources: ${Object.values(DATA_SOURCE_CONFIG.tables).join(', ')}`)
  } catch (e) {
    console.error('Phase 1 initialization error:', e)
  }
}

/**
 * Export configuration for external use
 */
export {
  CACHE_VERSION,
  CACHE_KEYS,
  DATA_SCHEMAS,
  DATA_SOURCE_CONFIG
}
