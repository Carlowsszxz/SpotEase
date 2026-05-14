/**
 * PHASE 1 DATA VALIDATION - INTEGRATION & USAGE EXAMPLES
 * 
 * This file demonstrates how to integrate the new Phase 1 data validation module
 * into your existing analytics pipeline.
 * 
 * @file phase1-integration-guide.js
 */

import {
  // Cache management
  getCachedData,
  setCachedData,
  clearCache,
  migrateCache,
  CACHE_KEYS,
  CACHE_VERSION,

  // Configuration
  DATA_SOURCE_CONFIG,

  // Validation functions
  validateRecord,
  validateTimestamp,
  validateBatch,

  // Data quality checks
  detectOutliers,
  detectDataGaps,
  calculateDataCompleteness,
  generateDataQualityReport,

  // Initialization
  initializePhase1
} from './phase1-data-validation.js'

// ============================================================================
// EXAMPLE 1: Initialize Phase 1 on Application Startup
// ============================================================================

export function example_initializePhase1() {
  console.log('=== PHASE 1: INITIALIZING DATA VALIDATION ===')
  
  // Initialize the validation system
  initializePhase1()

  // Check if we have cached data
  const cachedReport = getCachedData(CACHE_KEYS.dataQuality, null)
  if (cachedReport) {
    console.log('✓ Loaded cached data quality report from', cachedReport.timestamp)
    console.log('✓ Data quality score:', cachedReport.summary.dataQualityScore)
    return cachedReport
  }

  console.log('No cached data quality report found - will generate fresh report')
  return null
}

// ============================================================================
// EXAMPLE 2: Validate Incoming Data from Supabase
// ============================================================================

export async function example_validateIncomingData(supabase) {
  console.log('=== PHASE 1: VALIDATING INCOMING DATA ===')

  // Step 1: Fetch data from each source
  const { data: ultrasonicData } = await supabase
    .from('occupancy_readings')
    .select('*')
    .gte('reading_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: rfidData } = await supabase
    .from('rfid_scans')
    .select('*')
    .gte('scanned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: bleData } = await supabase
    .from('ble_presence_sessions')
    .select('*')
    .neq('user_id', null)

  console.log(`Fetched: ${ultrasonicData?.length || 0} ultrasonic, ${rfidData?.length || 0} RFID, ${bleData?.length || 0} BLE records`)

  // Step 2: Generate comprehensive quality report
  const qualityReport = generateDataQualityReport({
    ultrasonic: ultrasonicData || [],
    rfid: rfidData || [],
    ble: bleData || []
  })

  console.log('Data Quality Report:', qualityReport)
  console.log('Overall Quality Score:', qualityReport.summary.dataQualityScore + '/100')
  console.log('Issues:', qualityReport.summary.issues)
  console.log('Warnings:', qualityReport.summary.warnings)

  return {
    qualityReport,
    data: {
      ultrasonic: ultrasonicData || [],
      rfid: rfidData || [],
      ble: bleData || []
    }
  }
}

// ============================================================================
// EXAMPLE 3: Validate Individual Records Before Processing
// ============================================================================

export function example_validateSingleRecord() {
  console.log('=== PHASE 1: VALIDATING INDIVIDUAL RECORDS ===')

  // Test valid record
  const validRecord = {
    reading_time: '2024-05-14T10:30:00Z',
    occupancy_reading: 45,
    sensor_id: 'US-001'
  }

  const validationResult = validateRecord(validRecord, 'occupancy_readings')
  console.log('Valid Record Test:', validationResult)
  // Output: { valid: true, errors: [], ... }

  // Test invalid record (out of range)
  const invalidRecord = {
    reading_time: '2024-05-14T10:30:00Z',
    occupancy_reading: 150  // Invalid: >100%
  }

  const invalidResult = validateRecord(invalidRecord, 'occupancy_readings')
  console.log('Invalid Record Test:', invalidResult)
  // Output: { valid: false, errors: ['occupancy_reading out of range...'], ... }
}

// ============================================================================
// EXAMPLE 4: Validate Timestamps
// ============================================================================

export function example_validateTimestamps() {
  console.log('=== PHASE 1: VALIDATING TIMESTAMPS ===')

  const timestamps = [
    '2024-05-14T10:30:00Z',        // Valid
    '2024-05-14 10:30:00',         // Valid (alternate format)
    'invalid-timestamp',           // Invalid format
    null,                          // Empty
    new Date().toISOString()       // Valid (current time)
  ]

  timestamps.forEach(ts => {
    const result = validateTimestamp(ts, 30 * 24)  // 30-day history
    console.log(`Timestamp "${ts}":`, result.valid ? '✓ Valid' : `✗ ${result.error}`)
  })
}

// ============================================================================
// EXAMPLE 5: Batch Validate Records
// ============================================================================

export function example_batchValidate() {
  console.log('=== PHASE 1: BATCH VALIDATION ===')

  const records = [
    { reading_time: '2024-05-14T10:30:00Z', occupancy_reading: 45 },
    { reading_time: '2024-05-14T10:31:00Z', occupancy_reading: 48 },
    { reading_time: '2024-05-14T10:32:00Z', occupancy_reading: 150 },  // Invalid
    { reading_time: null, occupancy_reading: 50 }  // Invalid
  ]

  const batchResult = validateBatch(records, 'occupancy_readings')
  console.log('Batch Validation Results:')
  console.log(`✓ Valid: ${batchResult.valid}`)
  console.log(`✗ Invalid: ${batchResult.invalid}`)
  console.log(`Validity: ${batchResult.validityPercentage}%`)
  console.log('Errors:', batchResult.errors)

  return batchResult
}

// ============================================================================
// EXAMPLE 6: Detect Outliers
// ============================================================================

export function example_detectOutliers() {
  console.log('=== PHASE 1: OUTLIER DETECTION ===')

  // Simulated occupancy readings
  const occupancyValues = [
    50, 52, 51, 53, 54, 52, 51, 50,  // Normal
    49, 51, 52, 48,                  // Normal
    200,                             // Outlier (sensor error)
    51, 50, 52, 51, 49              // Normal
  ]

  const outlierResult = detectOutliers(occupancyValues, 3)  // 3 SD threshold
  console.log('Outlier Detection Results:')
  console.log('Mean:', outlierResult.mean)
  console.log('Std Dev:', outlierResult.stdDev)
  console.log('Outliers Found:', outlierResult.outlierCount)
  console.log('Outlier Details:', outlierResult.outliers)

  // Recommendation: Handle outlier at index
  outlierResult.outliers.forEach(outlier => {
    console.log(`⚠️  Index ${outlier.index}: value ${outlier.value} (z-score: ${outlier.zScore})`)
  })
}

// ============================================================================
// EXAMPLE 7: Detect Data Gaps
// ============================================================================

export function example_detectDataGaps() {
  console.log('=== PHASE 1: DATA GAP DETECTION ===')

  const readings = [
    { created_at: '2024-05-14T10:00:00Z', value: 100 },
    { created_at: '2024-05-14T10:05:00Z', value: 101 },
    { created_at: '2024-05-14T10:10:00Z', value: 102 },
    // 2-hour gap here
    { created_at: '2024-05-14T12:10:00Z', value: 105 },
    { created_at: '2024-05-14T12:15:00Z', value: 104 }
  ]

  const gapResult = detectDataGaps(readings, 'created_at', 120)  // 120 min threshold
  console.log('Data Gap Detection Results:')
  console.log('Gaps Found:', gapResult.gapCount)
  console.log('Gap Details:', gapResult.gaps)

  gapResult.gaps.forEach(gap => {
    console.log(`⚠️  Gap of ${gap.gapMinutes}min between records ${gap.startIndex}-${gap.endIndex} (${gap.severity})`)
  })
}

// ============================================================================
// EXAMPLE 8: Calculate Data Completeness
// ============================================================================

export function example_calculateCompleteness() {
  console.log('=== PHASE 1: DATA COMPLETENESS METRICS ===')

  // Simulate data collection window
  const recordCount = 1000
  const expectedPerHour = 60
  const windowHours = 24

  const completeness = calculateDataCompleteness(
    new Array(recordCount),
    expectedPerHour,
    windowHours
  )

  console.log('Data Completeness:')
  console.log('Records Collected:', completeness.recordCount)
  console.log('Records Expected:', completeness.expectedRecords)
  console.log('Completeness:', completeness.completenessPercentage + '%')
  console.log('Severity:', completeness.severity)
  console.log('Recommendation:', completeness.recommendation)
}

// ============================================================================
// EXAMPLE 9: Generate Full Quality Report
// ============================================================================

export function example_generateQualityReport() {
  console.log('=== PHASE 1: GENERATING COMPREHENSIVE QUALITY REPORT ===')

  // Simulated data from different sources
  const mockData = {
    ultrasonic: Array(1200).fill(0).map((_, i) => ({
      reading_time: new Date(Date.now() - (1200 - i) * 5 * 60 * 1000).toISOString(),
      occupancy_reading: 40 + Math.sin(i / 50) * 20 + Math.random() * 5
    })),
    rfid: Array(350).fill(0).map((_, i) => ({
      scanned_at: new Date(Date.now() - (350 - i) * 20 * 60 * 1000).toISOString(),
      user_id: Math.floor(Math.random() * 50) + 1,
      resource_id: Math.floor(Math.random() * 10) + 1
    })),
    ble: Array(500).fill(0).map((_, i) => ({
      user_id: Math.floor(Math.random() * 50) + 1,
      resource_id: Math.floor(Math.random() * 10) + 1,
      last_signal_time: new Date(Date.now() - i * 10 * 60 * 1000).toISOString()
    }))
  }

  const report = generateDataQualityReport(mockData)

  console.log('='COMPLETE QUALITY REPORT'='
  console.log('Timestamp:', report.timestamp)
  console.log('Overall Quality Score:', report.summary.dataQualityScore + '/100')
  console.log('Total Records:', report.summary.totalRecords)
  console.log('Issues:', report.summary.issues.length > 0 ? report.summary.issues : 'None')
  console.log('Warnings:', report.summary.warnings.length > 0 ? report.summary.warnings : 'None')
  console.log('Recommendations:', report.summary.recommendations)
  console.log('')
  console.log('By Data Type:')
  Object.entries(report.byDataType).forEach(([type, typeReport]) => {
    console.log(`  ${type}:`)
    console.log(`    - Records: ${typeReport.recordCount}`)
    console.log(`    - Validity: ${typeReport.validation.validityPercentage}%`)
    console.log(`    - Completeness: ${typeReport.completeness.completenessPercentage}%`)
    console.log(`    - Outliers: ${typeReport.outliers}`)
    console.log(`    - Gaps: ${typeReport.gaps}`)
  })

  return report
}

// ============================================================================
// EXAMPLE 10: Cache Management
// ============================================================================

export function example_cacheManagement() {
  console.log('=== PHASE 1: CACHE MANAGEMENT ===')

  // Store data in cache
  const myData = {
    timestamp: new Date(),
    metrics: [1, 2, 3, 4, 5]
  }

  setCachedData(CACHE_KEYS.dataAnalysis, myData, 24)
  console.log('✓ Data stored in cache', CACHE_KEYS.dataAnalysis)

  // Retrieve from cache
  const retrieved = getCachedData(CACHE_KEYS.dataAnalysis)
  console.log('✓ Data retrieved from cache:', retrieved)

  // Check cache version
  console.log('✓ Cache version:', CACHE_VERSION)

  // Migration example
  migrateCache()
  console.log('✓ Cache migration complete')

  // Clear all cache
  clearCache()
  console.log('✓ All cache cleared')
}

// ============================================================================
// EXAMPLE 11: Configuration Inspection
// ============================================================================

export function example_inspectConfiguration() {
  console.log('=== PHASE 1: DATA SOURCE CONFIGURATION ===')

  console.log('Tables to Query:')
  Object.entries(DATA_SOURCE_CONFIG.tables).forEach(([key, table]) => {
    console.log(`  ${key}: ${table}`)
  })

  console.log('')
  console.log('Data Collection Windows:')
  Object.entries(DATA_SOURCE_CONFIG.timeWindows).forEach(([key, window]) => {
    console.log(`  ${key}: ${window.days} days - ${window.description}`)
  })

  console.log('')
  console.log('Sensor Priority:')
  DATA_SOURCE_CONFIG.sensorPriority.forEach((sensor, index) => {
    console.log(`  ${index + 1}. ${sensor}`)
  })

  console.log('')
  console.log('Completeness Thresholds:')
  Object.entries(DATA_SOURCE_CONFIG.completenessThresholds).forEach(([level, value]) => {
    console.log(`  ${level}: ${(value * 100).toFixed(0)}%`)
  })
}

// ============================================================================
// EXAMPLE 12: Integration with Analytics Pipeline
// ============================================================================

export async function example_fullPipeline(supabase) {
  console.log('=== PHASE 1: FULL INTEGRATION PIPELINE ===')

  try {
    // Step 1: Initialize
    console.log('Step 1: Initializing...')
    initializePhase1()

    // Step 2: Check cache
    console.log('Step 2: Checking cache...')
    let qualityReport = getCachedData(CACHE_KEYS.dataQuality, null)

    if (!qualityReport) {
      // Step 3: Fetch fresh data
      console.log('Step 3: Fetching fresh data...')
      const dataResult = await example_validateIncomingData(supabase)
      qualityReport = dataResult.qualityReport

      // Step 4: Check quality score
      if (qualityReport.summary.dataQualityScore < 60) {
        console.warn('⚠️  LOW DATA QUALITY - Investigate before proceeding')
        console.warn('Issues:', qualityReport.summary.issues)
        return { success: false, report: qualityReport }
      }

      console.log('✓ Data quality acceptable, proceeding to Phase 2...')
    }

    // Step 5: Return results
    return {
      success: true,
      report: qualityReport,
      readyForPredictions: true
    }
  } catch (error) {
    console.error('Pipeline error:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EXPORT QUICK REFERENCE
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         PHASE 1 DATA VALIDATION - INTEGRATION GUIDE            ║
╚════════════════════════════════════════════════════════════════╝

🔧 CORE FUNCTIONS:
  • initializePhase1()               - Initialize validation system
  • validateRecord(record, type)     - Validate single record
  • validateBatch(records, type)     - Validate multiple records
  • validateTimestamp(ts)            - Validate timestamp format

📊 DATA QUALITY ANALYSIS:
  • detectOutliers(values)           - Find statistical outliers
  • detectDataGaps(records)          - Find missing timestamps
  • calculateDataCompleteness()      - Measure data coverage
  • generateDataQualityReport()      - Full comprehensive report

💾 CACHE MANAGEMENT:
  • getCachedData(key)               - Retrieve from cache
  • setCachedData(key, data)         - Store to cache
  • clearCache()                     - Clear all cache
  • migrateCache()                   - Migrate old formats

⚙️  CONFIGURATION:
  • DATA_SOURCE_CONFIG              - Data source settings
  • CACHE_VERSION                    - Current cache version
  • CACHE_KEYS                       - All cache key constants

🚀 QUICK START:
  1. import { initializePhase1, generateDataQualityReport } from './phase1-data-validation.js'
  2. initializePhase1()
  3. const report = generateDataQualityReport(yourData)
  4. if (report.summary.dataQualityScore >= 60) { proceedToPhase2() }
`)
