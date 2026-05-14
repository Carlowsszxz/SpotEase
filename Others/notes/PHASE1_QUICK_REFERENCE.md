# Phase 1 Implementation - Quick Reference

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `phase1-data-validation.js` | Main module with all validation logic | ~460 lines |
| `phase1-integration-guide.js` | 12 working examples + docs | ~400 lines |
| `PHASE1_IMPROVEMENTS_SUMMARY.md` | Complete documentation | Reference |

---

## Core Improvements

### 1️⃣ Data Validation Layer
```javascript
import { validateRecord, validateBatch } from './phase1-data-validation.js'

// Validate single record
const result = validateRecord(record, 'occupancy_readings')
// Returns: { valid: true/false, errors: [string] }

// Validate batch
const batch = validateBatch(records, 'occupancy_readings')
// Returns: { valid: N, invalid: N, validityPercentage: XX%, errors: [...] }
```

### 2️⃣ Data Quality Checks
```javascript
import { 
  detectOutliers, 
  detectDataGaps, 
  calculateDataCompleteness 
} from './phase1-data-validation.js'

// Find statistical anomalies
const outliers = detectOutliers(values, 3)  // 3-sigma threshold
// Returns: { outliers: [...], outlierCount: N, mean: X, stdDev: X }

// Detect missing timestamps
const gaps = detectDataGaps(records, 'created_at', 120)  // 120-min threshold
// Returns: { gapCount: N, gaps: [{startIndex, endIndex, gapMinutes, severity}] }

// Measure data coverage
const completeness = calculateDataCompleteness(records)
// Returns: { completenessPercentage: XX%, severity: 'Acceptable|Warning|Critical' }
```

### 3️⃣ Comprehensive Quality Report
```javascript
import { generateDataQualityReport } from './phase1-data-validation.js'

const report = generateDataQualityReport({
  ultrasonic: [...],
  rfid: [...],
  ble: [...]
})

// report.summary.dataQualityScore  → 0-100
// report.summary.issues            → [critical issues]
// report.summary.warnings          → [warnings]
// report.summary.recommendations   → [action items]
// report.byDataType                → {ultrasonic: {...}, rfid: {...}, ble: {...}}
```

### 4️⃣ Cache Management
```javascript
import { 
  getCachedData, 
  setCachedData, 
  clearCache 
} from './phase1-data-validation.js'

// Store with TTL
setCachedData('pbp_data_analysis_v1', data, 24)  // 24 hours

// Retrieve
const cached = getCachedData('pbp_data_analysis_v1')

// Clear all
clearCache()
```

### 5️⃣ Configuration
```javascript
import { DATA_SOURCE_CONFIG } from './phase1-data-validation.js'

// Tables
DATA_SOURCE_CONFIG.tables  
// → {ultrasonic: 'occupancy_readings', rfid: 'rfid_scans', ble: 'ble_presence_sessions'}

// Time windows
DATA_SOURCE_CONFIG.timeWindows.historical.days       // 180 days
DATA_SOURCE_CONFIG.timeWindows.recentThreshold.days  // 14 days

// Sensor priority
DATA_SOURCE_CONFIG.sensorPriority  // ['ultrasonic', 'rfid', 'ble']

// Thresholds
DATA_SOURCE_CONFIG.completenessThresholds
// → {acceptable: 0.70, warning: 0.50, critical: 0.30}
```

---

## Common Workflows

### Workflow 1: Check Data Quality on Startup
```javascript
import { 
  initializePhase1, 
  getCachedData, 
  generateDataQualityReport,
  CACHE_KEYS 
} from './phase1-data-validation.js'

// Initialize
initializePhase1()

// Check cache first
let report = getCachedData(CACHE_KEYS.dataQuality, null)

if (!report) {
  // Generate fresh report
  report = generateDataQualityReport({
    ultrasonic: await fetchUltrasonic(),
    rfid: await fetchRfid(),
    ble: await fetchBle()
  })
}

// Use report
if (report.summary.dataQualityScore >= 60) {
  proceedToPhase2()
} else {
  showQualityWarning(report.summary.issues)
}
```

### Workflow 2: Validate Incoming Data
```javascript
import { validateBatch } from './phase1-data-validation.js'

// After fetching from Supabase
const validation = validateBatch(records, 'occupancy_readings')

if (validation.invalid > 0) {
  console.warn(`${validation.invalid} invalid records:`, validation.errors)
}

// Use only valid records
processData(validation.validRecords)
```

### Workflow 3: Find & Fix Data Issues
```javascript
import { 
  detectOutliers, 
  detectDataGaps, 
  generateDataQualityReport 
} from './phase1-data-validation.js'

// Generate full report
const report = generateDataQualityReport(data)

// Check specific issues
if (report.byDataType.ultrasonic.outliers > 5) {
  console.warn('🔍 Many outliers detected - check sensor calibration')
}

if (report.byDataType.rfid.gaps > 10) {
  console.warn('🔍 Many data gaps - check RFID reader')
}

// Show recommendations
report.summary.recommendations.forEach(rec => {
  console.log('💡 ' + rec)
})
```

### Workflow 4: Handle Low Quality Data
```javascript
const report = generateDataQualityReport(data)

if (report.summary.dataQualityScore < 60) {
  switch (report.summary.dataQualityScore) {
    case report.summary.dataQualityScore < 30:
      // Critical - stop processing
      showCriticalError(report.summary.issues)
      break
    case report.summary.dataQualityScore < 60:
      // Warning - show message but continue
      showWarning(report.summary.warnings)
      proceedWithCaution()
      break
  }
}
```

---

## Configuration Template

Customize before initialization:
```javascript
import { DATA_SOURCE_CONFIG } from './phase1-data-validation.js'

// Modify time windows if needed
DATA_SOURCE_CONFIG.timeWindows.historical.days = 365  // 1 year instead of 6 months

// Adjust thresholds for your facility
DATA_SOURCE_CONFIG.completenessThresholds.acceptable = 0.80  // 80% instead of 70%

// Change sensor priority if needed
DATA_SOURCE_CONFIG.sensorPriority = ['rfid', 'ultrasonic', 'ble']

// Modify table names if using custom schema
DATA_SOURCE_CONFIG.tables.ultrasonic = 'occupancy_data'
```

---

## Validation Schemas

### occupancy_readings
```javascript
{
  required: ['reading_time', 'occupancy_reading'],
  ranges: {
    occupancy_reading: { min: 0, max: 100 }
  }
}
```

### rfid_scans
```javascript
{
  required: ['scanned_at', 'user_id', 'resource_id'],
  ranges: {
    user_id: { min: 1, max: 999999 },
    resource_id: { min: 1, max: 999999 }
  }
}
```

### ble_presence_sessions
```javascript
{
  required: ['user_id', 'resource_id'],
  optional: ['last_signal_time', 'last_seen_at']
}
```

---

## Error Messages Guide

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required field: X" | Record incomplete | Add missing field |
| "Field 'X' must be numeric" | Wrong data type | Convert to number |
| "X out of range: Y" | Value outside bounds | Validate before insert |
| "Invalid timestamp format: X" | Bad date format | Use ISO format: 2024-05-14T10:30:00Z |
| "Timestamp is in future: X" | Clock skew > 5min | Check system time |
| "Timestamp too old: X" | older than window | Use recent data |
| "No data available" | Empty array | Check query/data source |
| "Insufficient data (<10 records)" | Too little to analyze | Accumulate more data |

---

## Data Quality Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | ✅ Excellent | Proceed confidently to Phase 2 |
| 70-89 | ✅ Good | Proceed to Phase 2 |
| 60-69 | ⚠️ Acceptable | Proceed but monitor carefully |
| <60 | ❌ Poor | Investigate before proceeding |

---

## Performance Tips

1. **Cache frequently-generated reports** (24h TTL default)
   ```javascript
   const report = getCachedData(CACHE_KEYS.dataQuality) 
                  || generateDataQualityReport(data)
   ```

2. **Validate in batches** rather than individually
   ```javascript
   // Good: ~5-15ms for 1000 records
   validateBatch(records, 'occupancy_readings')
   
   // Slow: ~1000ms for 1000 records
   records.forEach(r => validateRecord(r, 'occupancy_readings'))
   ```

3. **Limit outlier detection** to recent data if dataset is large
   ```javascript
   // Only check last 1000 values
   detectOutliers(values.slice(-1000))
   ```

4. **Cache data source config** if querying frequently
   ```javascript
   const tables = DATA_SOURCE_CONFIG.tables  // Store in variable
   ```

---

## Integration Checklist

- [ ] Import modules: `import { ... } from './phase1-data-validation.js'`
- [ ] Call `initializePhase1()` on app startup
- [ ] Generate quality report after fetching data
- [ ] Check `dataQualityScore >= 60` before Phase 2
- [ ] Display warnings if quality is low
- [ ] Cache reports to avoid re-computation
- [ ] Handle validation errors gracefully
- [ ] Monitor quality metrics over time

---

## Need Help?

See examples in `phase1-integration-guide.js`:
1. Initialization
2. Incoming data validation
3. Single record validation
4. Timestamp validation
5. Batch validation
6. Outlier detection
7. Gap detection
8. Completeness calculation
9. Full quality report
10. Cache management
11. Configuration inspection
12. Full pipeline integration

---

## What's Next?

After Phase 1 improvements are integrated:

1. **Phase 2:** Core prediction algorithm (uses validated data from Phase 1)
2. **Phase 3:** UI components for predictions
3. **Phase 4:** Integration with analytics dashboard
4. **Phases 5-7:** Features, optimization, testing
5. **Phase 8:** Documentation & deployment

All downstream phases benefit from improved data quality! ✨
