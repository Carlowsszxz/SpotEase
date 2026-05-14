/* Analytics: telemetry-focused dashboard (ultrasonic + RFID) */
import { supabase } from './supabase-auth.js'
import { 
  analyzeAndCacheData, 
  getAnalysisReport,
  testPhase2Predictions,
  predictPeakHours,
  identifyCleaningWindows,
  generate7DayPredictions,
  renderAllPredictions,
  // Phase 5 - Learning System
  trackPredictionAccuracy,
  calculateAccuracyMetrics,
  adjustConfidenceWeights,
  // Phase 5 - Alerts System
  generateAlerts,
  getActiveAlerts,
  dismissAlert,
  // Phase 5 - Export Feature
  exportScheduleAsCSV,
  exportScheduleAsPDF,
  // Phase 5 - Simulation
  simulateScenario,
  getScenarioImpact,
  // Phase 6 - Efficiency Metrics
  calculateCleaningEfficiency,
  calculateTimeSaved,
  generateWeeklyReport,
  trackCleaningWindowCompliance,
  // Phase 6 - Data Persistence
  savePredictionsToSupabase,
  getHistoricalPredictions,
  getHistoricalAccuracyTrends,
  // Phase 7 - Testing & QA
  runUnitTests,
  measurePredictionPerformance,
  detectEdgeCases,
  checkBrowserCompatibility,
  trackUserFeedback,
  getUserFeedback,
  generateQAReport
} from './analytics-predictions.js'

(async function analytics(){
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    var ultrasonicPeakCanvas = document.getElementById('ultrasonicPeakChart');
    var rfidPeakCanvas = document.getElementById('rfidPeakChart');
    var ultrasonicPeakSummary = document.getElementById('ultrasonicPeakSummary');
    var rfidPeakSummary = document.getElementById('rfidPeakSummary');
    var insightsList = document.getElementById('insightsList');
    var maintenanceSuggestions = document.getElementById('maintenanceSuggestions');
    var kpiUltrasonicRecords = document.getElementById('kpiUltrasonicRecords');
    var kpiRfidRecords = document.getElementById('kpiRfidRecords');
    var kpiUltrasonicPeak = document.getElementById('kpiUltrasonicPeak');
    var kpiRfidPeak = document.getElementById('kpiRfidPeak');

    // Phase 1 UI Elements
    var analysisTotalUltrasonic = document.getElementById('analysisTotalUltrasonic');
    var analysisPeakHourUltrasonic = document.getElementById('analysisPeakHourUltrasonic');
    var analysisQuietestHourUltrasonic = document.getElementById('analysisQuietestHourUltrasonic');
    var analysisTotalRfid = document.getElementById('analysisTotalRfid');
    var analysisPeakHourRfid = document.getElementById('analysisPeakHourRfid');
    var analysisQuietestHourRfid = document.getElementById('analysisQuietestHourRfid');

    function formatHourLabel(hour){
      var h = Number(hour);
      if (isNaN(h) || h < 0 || h > 23) return String(hour);
      var suffix = h >= 12 ? 'PM' : 'AM';
      var twelveHour = h % 12;
      if (twelveHour === 0) twelveHour = 12;
      return twelveHour + suffix;
    }

    function getPeakInfo(values){
      if (!values || values.length === 0) {
        return { peakHour: null, peakValue: 0, total: 0 };
      }
      var peakValue = Math.max.apply(null, values.concat([0]));
      if (peakValue <= 0) {
        return { peakHour: null, peakValue: 0, total: values.reduce(function(sum, value){ return sum + value; }, 0) };
      }
      var peakHour = values.indexOf(peakValue);
      var total = values.reduce(function(sum, value){ return sum + value; }, 0);
      return { peakHour: peakHour, peakValue: peakValue, total: total };
    }

    function setSummary(el, text){
      if (!el) return;
      el.textContent = text;
    }

    function setKpi(el, text){
      if (!el) return;
      el.textContent = text;
    }

    function getPayloadObject(row){
      if(!row || row.payload == null) return null;
      if(typeof row.payload === 'object') return row.payload;
      try {
        return JSON.parse(String(row.payload));
      } catch {
        return null;
      }
    }

    function getUltrasonicDistanceCm(row){
      if(!row || typeof row !== 'object') return null;
      if(typeof row.value === 'number' && !isNaN(row.value)) return row.value;

      var payload = getPayloadObject(row);
      if(payload && typeof payload.distance_cm === 'number' && !isNaN(payload.distance_cm)) {
        return payload.distance_cm;
      }
      return null;
    }

    // Load sensor readings (ultrasonic)
    async function loadUltrasonicReadings(){
      try {
        var data = [];
        var error = null;

        const typedResult = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('sensor_type', 'ultrasonic')
          .limit(500);

        data = typedResult.data || [];
        error = typedResult.error || null;

        if (error) {
          console.warn('sensor_type filter not available, loading generic sensor_readings:', error);
        }

        if (error || data.length === 0) {
          const fallbackResult = await supabase
            .from('sensor_readings')
            .select('*')
            .limit(500);

          if (fallbackResult.error) throw fallbackResult.error;
          data = fallbackResult.data || [];
          error = null;
        }

        var rows = (data || []).filter(function(row){
          if (!row || typeof row !== 'object') return false;
          var sensorType = String(row.sensor_type || '').toLowerCase();
          if (sensorType.indexOf('ultra') > -1) return true;
          return getUltrasonicDistanceCm(row) != null;
        });

        rows.sort(function(a, b){
          var ad = getRecordDate(a);
          var bd = getRecordDate(b);
          return (bd ? bd.getTime() : 0) - (ad ? ad.getTime() : 0);
        });

        return rows;
      } catch (err) {
        console.error('Error loading ultrasonic readings:', err);
        return [];
      }
    }

    function parseDateValue(value){
      if(!value) return null;
      if(value instanceof Date) return isNaN(value.getTime()) ? null : value;

      var direct = new Date(value);
      if(!isNaN(direct.getTime())) return direct;

      var text = String(value).trim();
      var match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/);
      if(!match) return null;

      var datePart = match[1];
      var timePart = match[2];
      var fractional = match[3] || '';
      var ms = '';
      if(fractional){
        ms = '.' + fractional.slice(1, 4).padEnd(3, '0');
      }

      var normalized = datePart + 'T' + timePart + ms;
      var parsed = new Date(normalized);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    function getRecordDate(raw){
      if(!raw || typeof raw !== 'object') return null;
      var value =
        raw.timestamp ||
        raw.reading_time ||
        raw.scanned_at ||
        raw.created_at ||
        raw.tapped_at ||
        raw.tap_time ||
        raw.time ||
        null;

      return parseDateValue(value);
    }

    // Load RFID taps
    async function loadRfidTaps(){
      try {
        const tapsResult = await supabase
          .from('rfid_taps')
          .select('*')
          .limit(500);

        var data = tapsResult.data || [];
        var error = tapsResult.error || null;

        if (error) {
          console.warn('rfid_taps query failed, trying rfid_scans:', error);
        }

        if (error || data.length === 0) {
          const scansResult = await supabase
            .from('rfid_scans')
            .select('*')
            .limit(500);

          if (!scansResult.error && Array.isArray(scansResult.data) && scansResult.data.length > 0) {
            data = scansResult.data;
            error = null;
            console.log('Using rfid_scans for RFID analytics.');
          } else if (error) {
            throw error;
          }
        }

        if (error) throw error;

        var rows = data || [];
        rows.sort(function(a, b){
          var ad = getRecordDate(a);
          var bd = getRecordDate(b);
          return (bd ? bd.getTime() : 0) - (ad ? ad.getTime() : 0);
        });

        return rows;
      } catch (err) {
        console.error('Error loading RFID taps:', err);
        return [];
      }
    }

    // Calculate peak hours from sensor data
    function calculatePeakHours(readings, timestampField = 'timestamp'){
      var peakHours = new Array(24).fill(0);
      if(!readings || readings.length === 0) return peakHours;
      
      readings.forEach(function(r){
        var dt = null;
        if (r[timestampField]) {
          dt = new Date(r[timestampField]);
          if (isNaN(dt.getTime())) dt = null;
        }
        if (!dt) {
          dt = getRecordDate(r);
        }
        if (dt){
          var h = dt.getHours();
          if (!isNaN(h) && h >= 0 && h < 24) {
            peakHours[h]++;
          }
        }
      });
      return peakHours;
    }

    // Generate telemetry maintenance suggestions
    function generateMaintenanceSuggestions(ultrasonicReadings, rfidTaps){
      var suggestions = [];
      
      // Analyze ultrasonic sensor health
      if (ultrasonicReadings && ultrasonicReadings.length > 0){
        var ultrasonicValues = ultrasonicReadings
          .map(getUltrasonicDistanceCm)
          .filter(function(v){ return typeof v === 'number' && !isNaN(v); });

        if (ultrasonicValues.length > 0) {
          var avgUltrasonic = ultrasonicValues.reduce(function(sum, v){
            return sum + v;
          }, 0) / ultrasonicValues.length;
        
          if (avgUltrasonic > 80){
            suggestions.push({
              type: 'sensor-health',
              title: 'Ultrasonic Sensor Attention',
              description: 'Average sensor reading is high (' + avgUltrasonic.toFixed(1) + 'cm). Consider cleaning or calibrating sensors.',
              priority: 'medium'
            });
          }else{
            suggestions.push({
              type: 'sensor-health',
              title: 'Ultrasonic Sensors Normal',
              description: 'Average reading: ' + avgUltrasonic.toFixed(1) + 'cm. Sensors operating normally.',
              priority: 'low'
            });
          }
        }
      }
      
      // Analyze RFID activity pattern
      if (rfidTaps && rfidTaps.length > 0){
        var rfidByHour = new Array(24).fill(0);
        rfidTaps.forEach(function(tap){
          var tapDate = getRecordDate(tap);
          if (tapDate){
            var h = tapDate.getHours();
            if (!isNaN(h)) rfidByHour[h]++;
          }
        });
        
        var maxRfidHour = rfidByHour.indexOf(Math.max.apply(null, rfidByHour));
        suggestions.push({
          type: 'rfid-pattern',
          title: 'RFID Peak Activity',
          description: 'Peak RFID activity at ' + formatHourLabel(maxRfidHour) + ' (' + rfidByHour[maxRfidHour] + ' taps). Coordinate checks outside this window.',
          priority: 'medium'
        });
      }

      // General recommendations
      suggestions.push({
        type: 'general',
        title: 'General Telemetry Checks',
        description: 'Verify sensor calibration, inspect RFID reader connections, and monitor unusual drops in telemetry volume.',
        priority: 'low'
      });
      
      return suggestions;
    }

    // Render maintenance suggestions
    function renderMaintenanceSuggestions(suggestions){
      if(!maintenanceSuggestions) return;
      maintenanceSuggestions.innerHTML = '';
      
      if(!suggestions || suggestions.length === 0){
        var noMsg = document.createElement('div');
        noMsg.className = 'suggestion-item';
        noMsg.textContent = 'No maintenance suggestions available.';
        maintenanceSuggestions.appendChild(noMsg);
        return;
      }
      
      suggestions.forEach(function(sug){
        var div = document.createElement('div');
        div.className = 'suggestion-item priority-' + (sug.priority || 'low');
        div.innerHTML = '<div class="suggestion-title">' + sug.title + '</div>' +
          '<div class="suggestion-desc">' + sug.description + '</div>';
        maintenanceSuggestions.appendChild(div);
      });
    }
    // Draw bar chart
    function drawBarChart(canvas, labels, values, options){
      options = options || {};
      if(!canvas) {
        console.error('Canvas not found for bar chart');
        return;
      }
      var ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for bar chart');
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var w = canvas.width, h = canvas.height;
      var max = Math.max.apply(null, values.concat([1]));
      var left = 46;
      var right = 14;
      var top = 14;
      var bottom = 34;
      var chartW = w - left - right;
      var chartH = h - top - bottom;
      var barW = chartW / labels.length;
      var peak = getPeakInfo(values);

      var styles = getComputedStyle(document.documentElement);
      var axisColor = (styles.getPropertyValue('--bt-border') || '#e6e9ef').trim();
      var textColor = (styles.getPropertyValue('--bt-muted-foreground') || '#334155').trim();
      var accentColor = (styles.getPropertyValue('--bt-accent') || '#2563eb').trim();

      // y grid + ticks
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = textColor;
      ctx.font = '11px sans-serif';
      [0, 0.5, 1].forEach(function(ratio){
        var yTick = top + chartH - chartH * ratio;
        ctx.beginPath();
        ctx.moveTo(left, yTick);
        ctx.lineTo(left + chartW, yTick);
        ctx.stroke();
        ctx.fillText(String(Math.round(max * ratio)), 8, yTick + 4);
      });

      // axes
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, top + chartH);
      ctx.lineTo(left + chartW, top + chartH);
      ctx.stroke();
      
      values.forEach(function(v, i){
        var x = left + i * barW;
        var bw = barW * 0.8;
        var y = top + chartH - (v / max) * chartH;
        if (i === peak.peakHour && peak.peakValue > 0) {
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.95;
        } else {
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.55;
        }
        ctx.fillRect(x, y, bw, (top + chartH) - y);
        ctx.globalAlpha = 1;
        var showLabel = options.isHourly ? (i % 3 === 0) : (i % 2 === 0);
        if (showLabel){
          ctx.fillStyle = textColor;
          ctx.font = '11px sans-serif';
          ctx.fillText(labels[i], x, h - 10);
        }
      });

      // peak callout
      if (peak.peakHour !== null && peak.peakValue > 0) {
        var peakLabel = labels[peak.peakHour] || String(peak.peakHour);
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.fillText('Peak: ' + peakLabel + ' (' + peak.peakValue + ')', left + chartW - 120, top + 14);
      }
    }

    // Generate telemetry insights
    function generateInsights(ultrasonicReadings, rfidTaps){
      var insights = [];

      if ((!ultrasonicReadings || ultrasonicReadings.length === 0) && (!rfidTaps || rfidTaps.length === 0)){
        insights.push('No ultrasonic or RFID activity data is currently available.');
        return insights;
      }

      var ultrasonicCount = ultrasonicReadings ? ultrasonicReadings.length : 0;
      var rfidCount = rfidTaps ? rfidTaps.length : 0;
      insights.push('Ultrasonic records loaded: ' + ultrasonicCount + '.');
      insights.push('RFID records loaded: ' + rfidCount + '.');

      if (ultrasonicCount > 0){
        var ultrasonicValues = ultrasonicReadings
          .map(getUltrasonicDistanceCm)
          .filter(function(v){ return typeof v === 'number' && !isNaN(v); });
        if (ultrasonicValues.length > 0){
          var avgUltrasonic = ultrasonicValues.reduce(function(a, b){ return a + b; }, 0) / ultrasonicValues.length;
          insights.push('Average ultrasonic distance: ' + avgUltrasonic.toFixed(1) + ' cm.');
        }
      }

      if (rfidCount > 0){
        var latestRfid = rfidTaps[0] ? getRecordDate(rfidTaps[0]) : null;
        if (latestRfid) insights.push('Latest RFID activity: ' + latestRfid.toLocaleString() + '.');
      }

      return insights;
    }

    // Load and display telemetry data
    var ultrasonicReadings = await loadUltrasonicReadings();
    var rfidTaps = await loadRfidTaps();
    
    // PHASE 1: Analyze and cache data for predictions
    var dataAnalysisReport = analyzeAndCacheData(ultrasonicReadings, rfidTaps);
    
    // Render Phase 1 analysis summary to UI
    if (dataAnalysisReport) {
      if (analysisTotalUltrasonic) analysisTotalUltrasonic.textContent = String(dataAnalysisReport.ultrasonic.analysis.totalRecords);
      if (analysisPeakHourUltrasonic && dataAnalysisReport.ultrasonic.windows.peakHours.length > 0) {
        analysisPeakHourUltrasonic.textContent = dataAnalysisReport.ultrasonic.windows.peakHours[0].label + ' (' + dataAnalysisReport.ultrasonic.windows.peakHours[0].value + ')';
      }
      if (analysisQuietestHourUltrasonic && dataAnalysisReport.ultrasonic.windows.lowActivityHours.length > 0) {
        analysisQuietestHourUltrasonic.textContent = dataAnalysisReport.ultrasonic.windows.lowActivityHours[0].label + ' (' + dataAnalysisReport.ultrasonic.windows.lowActivityHours[0].value + ')';
      }
      
      if (analysisTotalRfid) analysisTotalRfid.textContent = String(dataAnalysisReport.rfid.analysis.totalRecords);
      if (analysisPeakHourRfid && dataAnalysisReport.rfid.windows.peakHours.length > 0) {
        analysisPeakHourRfid.textContent = dataAnalysisReport.rfid.windows.peakHours[0].label + ' (' + dataAnalysisReport.rfid.windows.peakHours[0].value + ')';
      }
      if (analysisQuietestHourRfid && dataAnalysisReport.rfid.windows.lowActivityHours.length > 0) {
        analysisQuietestHourRfid.textContent = dataAnalysisReport.rfid.windows.lowActivityHours[0].label + ' (' + dataAnalysisReport.rfid.windows.lowActivityHours[0].value + ')';
      }
    }

    // PHASE 2: Generate and test predictions (Phase 2 functions now available for testing)
    if (dataAnalysisReport) {
      // Expose Phase 2 functions globally for console testing
      window.pbp_predictPeakHours = function(dayOfWeek, sensorType) {
        return predictPeakHours(dayOfWeek, dataAnalysisReport, sensorType || 'ultrasonic');
      };
      window.pbp_identifyCleaningWindows = function(dayOfWeek, sensorType, windowSize) {
        return identifyCleaningWindows(dayOfWeek, dataAnalysisReport, sensorType || 'ultrasonic', windowSize || 2);
      };
      window.pbp_generate7DayPredictions = function(sensorType) {
        return generate7DayPredictions(dataAnalysisReport, sensorType || 'ultrasonic');
      };
      window.pbp_testPhase2 = function() {
        return testPhase2Predictions(dataAnalysisReport);
      };

      // Auto-run Phase 2 testing (optional - will be verbose in console)
      // Uncomment next line to enable automatic Phase 2 testing
      // testPhase2Predictions(dataAnalysisReport);

      console.log('✓ Phase 2 prediction functions available in browser console:');
      console.log('  window.pbp_predictPeakHours(dayOfWeek, sensorType)');
      console.log('  window.pbp_identifyCleaningWindows(dayOfWeek, sensorType, windowSize)');
      console.log('  window.pbp_generate7DayPredictions(sensorType)');
      console.log('  window.pbp_testPhase2()');
    }
    
    // PHASE 4: Render all predictions to UI
    renderAllPredictions(dataAnalysisReport);
    
    /* ================================================
       PHASE 5: Enhanced Features Integration
       ================================================ */
    
    // Phase 5 - Learning System: Display accuracy metrics
    function renderLearningMetrics() {
      try {
        const metrics = calculateAccuracyMetrics();
        const overallAccuracyEl = document.getElementById('overallAccuracy');
        const totalTrackedEl = document.getElementById('totalTracked');
        const accuracyTrendEl = document.getElementById('accuracyTrend');
        const bestDayNameEl = document.getElementById('bestDayName');
        const bestDayAccuracyEl = document.getElementById('bestDayAccuracy');
        
        if (overallAccuracyEl) overallAccuracyEl.textContent = metrics.overallAccuracy || '0';
        if (totalTrackedEl) totalTrackedEl.textContent = metrics.totalPredictions || '0';
        if (accuracyTrendEl) accuracyTrendEl.textContent = (metrics.trend || 'stable').charAt(0).toUpperCase() + (metrics.trend || 'stable').slice(1);
        
        if (metrics.bestDay) {
          if (bestDayNameEl) bestDayNameEl.textContent = metrics.bestDay.dayName;
          if (bestDayAccuracyEl) bestDayAccuracyEl.textContent = metrics.bestDay.accuracy + '% accuracy';
        }
      } catch (err) {
        console.error('Error rendering learning metrics:', err);
      }
    }
    
    // Phase 5 - Alerts System: Render active alerts
    function renderAlerts() {
      try {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;
        
        const alerts = getActiveAlerts();
        
        if (alerts.length === 0) {
          alertsContainer.innerHTML = `
            <div class="empty-state">
              <span class="empty-icon">✓</span>
              <p>No active alerts. Facility occupancy matches predictions.</p>
            </div>
          `;
          return;
        }
        
        alertsContainer.innerHTML = '';
        alerts.forEach(alert => {
          const alertDiv = document.createElement('div');
          alertDiv.className = `alert-card severity-${alert.severity}`;
          alertDiv.innerHTML = `
            <div class="alert-content">
              <div class="alert-title">${alert.title}</div>
              <div class="alert-message">${alert.message}</div>
              <div class="alert-action">${alert.action}</div>
            </div>
            <button class="alert-dismiss-btn" data-alert-id="${alert.id}">Dismiss</button>
          `;
          
          alertDiv.querySelector('.alert-dismiss-btn').addEventListener('click', function() {
            dismissAlert(alert.id);
            renderAlerts(); // Re-render after dismissing
          });
          
          alertsContainer.appendChild(alertDiv);
        });
      } catch (err) {
        console.error('Error rendering alerts:', err);
      }
    }
    
    // Phase 5 - Export Feature: Setup export buttons
    function setupExportFeature() {
      try {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        
        if (exportCsvBtn) {
          exportCsvBtn.addEventListener('click', function() {
            const csv = exportScheduleAsCSV(dataAnalysisReport);
            downloadFile(csv, 'cleaning-schedule.csv', 'text/csv');
          });
        }
        
        if (exportPdfBtn) {
          exportPdfBtn.addEventListener('click', function() {
            exportScheduleAsPDF(dataAnalysisReport);
          });
        }
      } catch (err) {
        console.error('Error setting up export feature:', err);
      }
    }
    
    // Helper: Download file as attachment
    function downloadFile(content, filename, mimeType) {
      try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading file:', err);
      }
    }
    
    // Phase 5 - Simulation: Setup scenario simulation
    function setupScenarioSimulation() {
      try {
        const scenarioTypeSelect = document.getElementById('scenarioType');
        const scenarioDaySelect = document.getElementById('scenarioDay');
        const runSimulationBtn = document.getElementById('runSimulationBtn');
        const simulationResults = document.getElementById('simulationResults');
        const simulationComparison = document.getElementById('simulationComparison');
        
        if (!runSimulationBtn) return;
        
        runSimulationBtn.addEventListener('click', function() {
          try {
            const scenarioType = scenarioTypeSelect.value;
            const dayOfWeek = parseInt(scenarioDaySelect.value);
            
            if (!scenarioType) {
              alert('Please select a scenario first');
              return;
            }
            
            // Simulate based on scenario type
            const parameters = {
              dayOfWeek,
              occupancyMultiplier: 1.5,
              cleaningDuration: 2
            };
            
            const result = simulateScenario(dataAnalysisReport, scenarioType, parameters);
            
            if (!result) {
              alert('Error running simulation');
              return;
            }
            
            // Display results
            simulationResults.classList.remove('hidden');
            simulationComparison.innerHTML = '';
            
            const baselineHours = result.comparisonMetrics.baselineCleaningHours;
            const simulatedHours = result.comparisonMetrics.simulatedCleaningHours;
            const difference = simulatedHours - baselineHours;
            
            simulationComparison.innerHTML = `
              <div class="comparison-item">
                <div class="comparison-label">Baseline Cleaning Hours (Weekly)</div>
                <div class="comparison-value">${baselineHours}h</div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">Simulated Cleaning Hours</div>
                <div class="comparison-value">${simulatedHours}h</div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">Difference</div>
                <div class="comparison-value" style="color: ${difference > 0 ? '#ef4444' : '#22c55e'}">
                  ${difference > 0 ? '+' : ''}${difference}h
                </div>
              </div>
              <div class="comparison-item">
                <div class="comparison-label">Impact</div>
                <div class="comparison-value">${Math.round((Math.abs(difference) / baselineHours) * 100)}% change</div>
              </div>
            `;
            
            // Add detailed message
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
            const impactDiv = document.createElement('div');
            impactDiv.className = 'scenario-impact-message';
            impactDiv.innerHTML = `
              <strong>Scenario Impact on ${dayName}:</strong><br>
              ${getScenarioMessage(scenarioType, parameters.occupancyMultiplier)}
            `;
            simulationComparison.parentElement.appendChild(impactDiv);
            
          } catch (err) {
            console.error('Error in simulation:', err);
            alert('Error running simulation: ' + err.message);
          }
        });
      } catch (err) {
        console.error('Error setting up scenario simulation:', err);
      }
    }
    
    // Helper: Get scenario-specific message
    function getScenarioMessage(scenarioType, multiplier) {
      const messages = {
        special_event: `High occupancy event expected (${Math.round(multiplier * 100)}% above normal). Recommend additional cleaning staff and increased cleaning frequency.`,
        maintenance_block: 'Certain hours unavailable for cleaning. Cleaning must be compressed into remaining available windows.',
        reduced_hours: 'Facility operating reduced hours. Optimize cleaning to occur during closing hours.',
        holiday: 'Holiday detected with reduced occupancy. Single cleaning window typically sufficient.'
      };
      return messages[scenarioType] || 'Scenario analysis complete.';
    }
    
    // Expose Phase 5 functions to window for console testing
    window.pbp_calculateAccuracyMetrics = calculateAccuracyMetrics;
    window.pbp_getActiveAlerts = getActiveAlerts;
    window.pbp_simulateScenario = simulateScenario;
    window.pbp_exportScheduleAsCSV = exportScheduleAsCSV;
    
    // Initialize Phase 5 components
    renderLearningMetrics();
    renderAlerts();
    setupExportFeature();
    setupScenarioSimulation();
    
    // Generate alerts from current data
    generateAlerts(dataAnalysisReport, 30);
    
    console.log('✓ Phase 5 (Enhanced Features) initialized:');
    console.log('  Learning System: Accuracy metrics displayed');
    console.log('  Alerts System: Active alerts rendered');
    console.log('  Export Feature: CSV/PDF download ready');
    console.log('  Simulation: Scenario testing available');
    console.log('✓ Phase 5 functions available in window:');
    console.log('  window.pbp_calculateAccuracyMetrics()');
    console.log('  window.pbp_getActiveAlerts()');
    console.log('  window.pbp_simulateScenario(report, type, params)');
    console.log('  window.pbp_exportScheduleAsCSV(report)');
    
    /* ================================================
       PHASE 6: Optimization & Analytics Integration
       ================================================ */
    
    // Phase 6 - Efficiency Dashboard: Display cleaning efficiency metrics
    function renderEfficiencyDashboard() {
      try {
        const timeSaved = calculateTimeSaved(dataAnalysisReport);
        const predictionsResult = generate7DayPredictions(dataAnalysisReport, 'ultrasonic');
        const predictions = Array.isArray(predictionsResult)
          ? predictionsResult
          : (predictionsResult && Array.isArray(predictionsResult.predictions) ? predictionsResult.predictions : []);
        
        // Simulated efficiency (assume 85% window completion rate)
        let totalWindows = 0;
        predictions.forEach(pred => {
          if (pred.cleaningWindows) {
            totalWindows += pred.cleaningWindows.length;
          }
        });
        
        const windowsCompleted = Math.round(totalWindows * 0.85);
        const efficiency = calculateCleaningEfficiency(windowsCompleted, totalWindows);
        
        const efficiencyRateEl = document.getElementById('efficiencyRate');
        const weeklyCleaningHoursEl = document.getElementById('weeklyCleaningHours');
        const timeSavedPerWeekEl = document.getElementById('timeSavedPerWeek');
        const costSavingsPerWeekEl = document.getElementById('costSavingsPerWeek');
        
        if (efficiencyRateEl) efficiencyRateEl.textContent = efficiency.efficiencyRate;
        if (weeklyCleaningHoursEl && timeSaved) weeklyCleaningHoursEl.textContent = timeSaved.optimalCleaningHours;
        if (timeSavedPerWeekEl && timeSaved) timeSavedPerWeekEl.textContent = timeSaved.hoursSaved;
        if (costSavingsPerWeekEl && timeSaved) costSavingsPerWeekEl.textContent = timeSaved.costSavingsEstimate;
      } catch (err) {
        console.error('Error rendering efficiency dashboard:', err);
      }
    }
    
    // Phase 6 - Weekly Report: Display performance summary and recommendations
    function renderWeeklyReport() {
      try {
        const report = generateWeeklyReport(dataAnalysisReport);
        if (!report) return;
        
        // Update report header
        const weekRangeEl = document.getElementById('reportWeekRange');
        if (weekRangeEl) {
          weekRangeEl.textContent = `${report.weekRange.start} - ${report.weekRange.end}`;
        }
        
        // Update accuracy summary
        const reportAccuracyEl = document.getElementById('reportAccuracy');
        const reportTrendEl = document.getElementById('reportTrend');
        const reportPredictionsTrackedEl = document.getElementById('reportPredictionsTracked');
        
        if (reportAccuracyEl) reportAccuracyEl.textContent = report.accuracy.overall;
        if (reportTrendEl) reportTrendEl.textContent = report.accuracy.trend.charAt(0).toUpperCase() + report.accuracy.trend.slice(1);
        if (reportPredictionsTrackedEl) reportPredictionsTrackedEl.textContent = report.accuracy.totalPredictions;
        
        // Render top 3 insights
        const insightsContainer = document.getElementById('topInsightsContainer');
        if (insightsContainer && report.topInsights) {
          insightsContainer.innerHTML = '';
          report.topInsights.forEach(insight => {
            const insightDiv = document.createElement('div');
            insightDiv.className = `insight-item ${insight.type}`;
            insightDiv.innerHTML = `
              <strong>${insight.icon} ${insight.title}</strong><br>
              ${insight.message}
            `;
            insightsContainer.appendChild(insightDiv);
          });
        }
        
        // Render next week recommendations
        const recommendationsEl = document.getElementById('nextWeekRecommendations');
        if (recommendationsEl && report.nextWeekRecommendations) {
          recommendationsEl.innerHTML = '';
          report.nextWeekRecommendations.forEach(rec => {
            const liEl = document.createElement('li');
            liEl.textContent = rec;
            recommendationsEl.appendChild(liEl);
          });
        }
      } catch (err) {
        console.error('Error rendering weekly report:', err);
      }
    }
    
    // Phase 6 - Compliance Tracking: Setup logging and display
    function setupComplianceTracking() {
      try {
        const logComplianceBtn = document.getElementById('logComplianceBtn');
        const complianceDaySelect = document.getElementById('complianceDay');
        const complianceWindowSelect = document.getElementById('complianceWindow');
        const complianceCompletedCheckbox = document.getElementById('complianceCompleted');
        
        if (!logComplianceBtn) return;
        
        logComplianceBtn.addEventListener('click', function() {
          const day = complianceDaySelect.value;
          const window = complianceWindowSelect.value;
          const completed = complianceCompletedCheckbox.checked;
          
          if (!day || window === '') {
            alert('Please select day and window');
            return;
          }
          
          // Log compliance record
          trackCleaningWindowCompliance(day, parseInt(window), completed);
          
          // Show confirmation
          alert(`✓ Logged: ${day} Window ${parseInt(window) + 1} - ${completed ? 'Completed' : 'Missed'}`);
          
          // Reset form
          complianceDaySelect.value = '';
          complianceWindowSelect.value = '';
          complianceCompletedCheckbox.checked = false;
          
          // Refresh display
          displayComplianceRecords();
        });
      } catch (err) {
        console.error('Error setting up compliance tracking:', err);
      }
    }
    
    // Phase 6 - Display recent compliance records
    function displayComplianceRecords() {
      try {
        const complianceLog = document.getElementById('complianceLog');
        if (!complianceLog) return;
        
        // For now, show placeholder. In production, would fetch from localStorage
        const stored = JSON.parse(localStorage.getItem('pbp_cleaning_compliance') || '{"records":[]}');
        const records = (stored.records || []).slice(-5); // Show last 5
        
        if (records.length === 0) {
          complianceLog.innerHTML = '<p class="empty-state">No compliance records yet. Start logging window completions.</p>';
          return;
        }
        
        complianceLog.innerHTML = '';
        records.forEach(record => {
          const div = document.createElement('div');
          div.className = `compliance-record ${record.completed ? 'completed' : 'missed'}`;
          const date = new Date(record.timestamp).toLocaleDateString();
          div.innerHTML = `
            <div class="compliance-record-info">
              <span class="compliance-record-day">${record.dayOfWeek}</span>
              <span class="compliance-record-status">Window ${record.windowIndex + 1}: ${record.completed ? '✓ Completed' : '✗ Missed'}</span>
            </div>
            <span class="compliance-record-date">${date}</span>
          `;
          complianceLog.appendChild(div);
        });
      } catch (err) {
        console.error('Error displaying compliance records:', err);
      }
    }
    
    // Phase 6 - Weekly Report Download
    function setupReportDownload() {
      try {
        const downloadReportBtn = document.getElementById('downloadReportBtn');
        if (!downloadReportBtn) return;
        
        downloadReportBtn.addEventListener('click', function() {
          const report = generateWeeklyReport(dataAnalysisReport);
          if (!report) {
            alert('Could not generate report');
            return;
          }
          
          // Create downloadable JSON report
          const reportJson = JSON.stringify(report, null, 2);
          const blob = new Blob([reportJson], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        });
      } catch (err) {
        console.error('Error setting up report download:', err);
      }
    }
    
    // Expose Phase 6 functions to window for testing
    window.pbp_calculateCleaningEfficiency = calculateCleaningEfficiency;
    window.pbp_calculateTimeSaved = calculateTimeSaved;
    window.pbp_generateWeeklyReport = generateWeeklyReport;
    window.pbp_savePredictionsToSupabase = savePredictionsToSupabase;
    
    // Initialize Phase 6 components
    renderEfficiencyDashboard();
    renderWeeklyReport();
    setupComplianceTracking();
    displayComplianceRecords();
    setupReportDownload();
    
    // Attempt to save predictions to Supabase (async, non-blocking)
    savePredictionsToSupabase(dataAnalysisReport, generate7DayPredictions(dataAnalysisReport, 'ultrasonic')).catch(err => {
      console.log('Skipping Supabase persistence (optional):', err);
    });
    
    console.log('✓ Phase 6 (Optimization & Analytics) initialized:');
    console.log('  Efficiency Dashboard: Metrics displayed');
    console.log('  Weekly Report: Performance summary rendered');
    console.log('  Compliance Tracking: Ready for logging');
    console.log('  Data Persistence: Supabase sync attempted');
    console.log('✓ Phase 6 functions available in window:');
    console.log('  window.pbp_calculateCleaningEfficiency(completed, total)');
    console.log('  window.pbp_calculateTimeSaved(report)');
    console.log('  window.pbp_generateWeeklyReport(report)');
    console.log('  window.pbp_savePredictionsToSupabase(report, predictions)');
    
    /* ================================================
       PHASE 7: Testing, Refinement & QA
       ================================================ */
    
    // Phase 7 - QA Dashboard Setup
    function setupQADashboard() {
      try {
        const runAllTestsBtn = document.getElementById('runAllTestsBtn');
        const runUnitTestsBtn = document.getElementById('runUnitTestsBtn');
        const checkPerformanceBtn = document.getElementById('checkPerformanceBtn');
        const detectEdgeCasesBtn = document.getElementById('detectEdgeCasesBtn');
        const checkBrowserBtn = document.getElementById('checkBrowserBtn');
        const downloadQAReportBtn = document.getElementById('downloadQAReportBtn');
        const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
        
        if (!runAllTestsBtn) return;
        
        // Run all tests
        runAllTestsBtn.addEventListener('click', function() {
          console.log('⏱️ Running complete QA suite...');
          const qaReport = generateQAReport(dataAnalysisReport);
          displayQAReport(qaReport);
        });
        
        // Run unit tests
        runUnitTestsBtn.addEventListener('click', function() {
          const results = runUnitTests();
          displayTestResults(results);
        });
        
        // Check performance
        checkPerformanceBtn.addEventListener('click', function() {
          const metrics = measurePredictionPerformance(dataAnalysisReport);
          displayPerformanceMetrics(metrics);
        });
        
        // Detect edge cases
        detectEdgeCasesBtn.addEventListener('click', function() {
          const issues = detectEdgeCases(dataAnalysisReport);
          displayEdgeCases(issues);
        });
        
        // Check browser
        checkBrowserBtn.addEventListener('click', function() {
          const compatibility = checkBrowserCompatibility();
          displayBrowserCompatibility(compatibility);
        });
        
        // Download QA Report
        downloadQAReportBtn.addEventListener('click', function() {
          const qaReport = generateQAReport(dataAnalysisReport);
          downloadJSON(qaReport, `qa-report-${new Date().toISOString().split('T')[0]}.json`);
        });
        
        // Submit feedback
        submitFeedbackBtn.addEventListener('click', function() {
          const type = document.getElementById('feedbackType').value;
          const severity = document.getElementById('feedbackSeverity').value;
          const description = document.getElementById('feedbackDescription').value;
          
          if (!description.trim()) {
            alert('Please enter your feedback');
            return;
          }
          
          const records = trackUserFeedback(type, description, severity);
          alert('✓ Thank you! Feedback recorded and will be reviewed.');
          
          // Reset form
          document.getElementById('feedbackDescription').value = '';
          document.getElementById('feedbackType').value = 'observation';
          document.getElementById('feedbackSeverity').value = 'medium';
        });
      } catch (err) {
        console.error('Error setting up QA dashboard:', err);
      }
    }
    
    // Display unit test results
    function displayTestResults(results) {
      const container = document.getElementById('unitTestsResults');
      if (!container) return;
      
      container.innerHTML = '';
      
      results.tests.forEach(test => {
        const div = document.createElement('div');
        div.className = `test-result ${test.passed ? 'passed' : 'failed'}`;
        div.innerHTML = `
          <span class="test-name">${test.name}</span>
          <span class="test-status">${test.message}</span>
        `;
        container.appendChild(div);
      });
      
      // Summary
      const summary = document.createElement('div');
      summary.className = 'test-result info';
      summary.innerHTML = `
        <span class="test-name">Test Summary</span>
        <span class="test-status">Passed: ${results.passed}/${results.totalTests}</span>
      `;
      container.appendChild(summary);
    }
    
    // Display performance metrics
    function displayPerformanceMetrics(metrics) {
      const container = document.getElementById('performanceResults');
      if (!container) return;
      
      container.innerHTML = '';
      
      if (metrics.error) {
        container.innerHTML = `<p class="placeholder">Error: ${metrics.error}</p>`;
        return;
      }
      
      metrics.functions.forEach(fn => {
        const div = document.createElement('div');
        div.className = `metric-item`;
        div.innerHTML = `
          <span class="metric-label">${fn.name}</span>
          <span class="metric-value">${fn.timeMs}ms 
            <span class="metric-status">${fn.status || 'normal'}</span>
            ${fn.result ? ` ${fn.result}` : ''}
          </span>
        `;
        container.appendChild(div);
      });
      
      // Summary
      const summary = document.createElement('div');
      summary.className = 'metric-item';
      summary.innerHTML = `
        <span class="metric-label">Performance Grade</span>
        <span class="metric-value">${metrics.summary.performanceGrade}</span>
      `;
      container.appendChild(summary);
    }
    
    // Display edge cases
    function displayEdgeCases(issues) {
      const container = document.getElementById('edgeCasesResults');
      if (!container) return;
      
      container.innerHTML = '';
      
      if (!issues.edgeCases || issues.edgeCases.length === 0) {
        container.innerHTML = '<p class="placeholder">✓ No edge cases detected. System operating normally.</p>';
        return;
      }
      
      issues.edgeCases.forEach(issue => {
        const div = document.createElement('div');
        div.className = `test-result ${issue.severity}`;
        div.innerHTML = `
          <div class="test-name">
            <strong>${issue.type}</strong><br>
            ${issue.message}
          </div>
          <span class="test-status">${issue.severity.toUpperCase()}</span>
        `;
        container.appendChild(div);
      });
      
      // Recommendation
      const rec = document.createElement('div');
      rec.className = 'test-result info';
      rec.innerHTML = `
        <span class="test-name">Status: ${issues.summary.overallStatus}</span>
        <span class="test-status">${issues.summary.criticalCount} critical, ${issues.summary.warningCount} warnings</span>
      `;
      container.appendChild(rec);
    }
    
    // Display browser compatibility
    function displayBrowserCompatibility(compatibility) {
      const container = document.getElementById('browserResults');
      if (!container) return;
      
      container.innerHTML = '';
      
      // Browser info
      const browserDiv = document.createElement('div');
      browserDiv.className = 'metric-item';
      browserDiv.innerHTML = `
        <span class="metric-label">Browser</span>
        <span class="metric-value">${compatibility.browser || 'Unknown'}</span>
      `;
      container.appendChild(browserDiv);
      
      // Features
      const features = compatibility.features;
      Object.keys(features).forEach(feature => {
        const div = document.createElement('div');
        const status = features[feature];
        div.className = `metric-item`;
        div.innerHTML = `
          <span class="metric-label">${feature}</span>
          <span class="metric-value">
            ${status ? '✓' : '✗'} 
            <span class="metric-status">${status ? 'supported' : 'missing'}</span>
          </span>
        `;
        container.appendChild(div);
      });
      
      // Overall
      const overall = document.createElement('div');
      overall.className = 'metric-item';
      overall.innerHTML = `
        <span class="metric-label">Compatibility</span>
        <span class="metric-value">${compatibility.compatibility}</span>
      `;
      container.appendChild(overall);
    }
    
    // Display full QA report
    function displayQAReport(report) {
      // Display unit tests
      if (report.sections.unitTests) {
        displayTestResults(report.sections.unitTests);
      }
      
      // Display performance
      if (report.sections.performance) {
        displayPerformanceMetrics(report.sections.performance);
      }
      
      // Display edge cases
      if (report.sections.edgeCases) {
        displayEdgeCases(report.sections.edgeCases);
      }
      
      // Display browser
      if (report.sections.browserCompatibility) {
        displayBrowserCompatibility(report.sections.browserCompatibility);
      }
      
      // Display overall status
      const statusContainer = document.getElementById('qaStatusContainer');
      if (statusContainer) {
        const badge = statusContainer.querySelector('.status-badge');
        const recommendations = statusContainer.querySelector('.qa-recommendations');
        
        if (badge) {
          const indicator = badge.querySelector('.status-indicator');
          const text = badge.querySelector('.status-text');
          
          if (report.overallStatus === 'ready_for_production') {
            indicator.style.background = '#22c55e';
            text.textContent = '✓ Ready for Production';
          } else if (report.overallStatus === 'critical_issues') {
            indicator.style.background = '#ef4444';
            text.textContent = '✗ Critical Issues Found';
          } else {
            indicator.style.background = '#f59e0b';
            text.textContent = '⚠ Review Necessary';
          }
        }
        
        if (recommendations) {
          recommendations.innerHTML = '';
          report.recommendations.forEach(rec => {
            const p = document.createElement('p');
            p.textContent = rec;
            recommendations.appendChild(p);
          });
        }
      }
    }
    
    // Helper: Download JSON file
    function downloadJSON(data, filename) {
      try {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading JSON:', err);
      }
    }
    
    // Expose Phase 7 functions to window
    window.pbp_runUnitTests = runUnitTests;
    window.pbp_measurePredictionPerformance = measurePredictionPerformance;
    window.pbp_detectEdgeCases = detectEdgeCases;
    window.pbp_checkBrowserCompatibility = checkBrowserCompatibility;
    window.pbp_trackUserFeedback = trackUserFeedback;
    window.pbp_generateQAReport = generateQAReport;
    
    // Initialize Phase 7
    setupQADashboard();
    
    console.log('✓ Phase 7 (Testing & Refinement) initialized:');
    console.log('  Unit Tests: Available via runUnitTests()');
    console.log('  Performance Testing: Available via measurePredictionPerformance()');
    console.log('  Edge Case Detection: Available via detectEdgeCases()');
    console.log('  Browser Compatibility: Available via checkBrowserCompatibility()');
    console.log('  User Feedback: Tracking available via trackUserFeedback()');
    console.log('✓ Phase 7 functions available in window:');
    console.log('  window.pbp_runUnitTests()');
    console.log('  window.pbp_measurePredictionPerformance(report)');
    console.log('  window.pbp_detectEdgeCases(report)');
    console.log('  window.pbp_checkBrowserCompatibility()');
    console.log('  window.pbp_trackUserFeedback(type, description, severity)');
    console.log('  window.pbp_generateQAReport(report)');
    
    // Resize canvas to fit containers
    function resizeCanvas(canvas) {
      if (!canvas || !canvas.parentElement) return;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 32; // Account for padding
      canvas.height = 240;
    }
    
    // Resize both canvases
    resizeCanvas(ultrasonicPeakCanvas);
    resizeCanvas(rfidPeakCanvas);

    var hourLabels = new Array(24).fill(0).map(function(_, i){ return formatHourLabel(i); });

    // Ultrasonic peak hours chart
    var ultrasonicPeakHours = calculatePeakHours(ultrasonicReadings, 'timestamp');
    drawBarChart(ultrasonicPeakCanvas, hourLabels, ultrasonicPeakHours, { isHourly: true });

    // RFID peak hours chart
    var rfidPeakHours = calculatePeakHours(rfidTaps, 'timestamp');
    drawBarChart(rfidPeakCanvas, hourLabels, rfidPeakHours, { isHourly: true });

    var ultrasonicPeaks = getPeakInfo(ultrasonicPeakHours);
    var rfidPeaks = getPeakInfo(rfidPeakHours);
    setKpi(kpiUltrasonicRecords, String(ultrasonicReadings ? ultrasonicReadings.length : 0));
    setKpi(kpiRfidRecords, String(rfidTaps ? rfidTaps.length : 0));
    setKpi(kpiUltrasonicPeak, ultrasonicPeaks.peakHour !== null ? formatHourLabel(ultrasonicPeaks.peakHour) : '—');
    setKpi(kpiRfidPeak, rfidPeaks.peakHour !== null ? formatHourLabel(rfidPeaks.peakHour) : '—');

    setSummary(
      ultrasonicPeakSummary,
      ultrasonicPeaks.peakHour !== null && ultrasonicPeaks.peakValue > 0
        ? 'Ultrasonic busiest hour: ' + formatHourLabel(ultrasonicPeaks.peakHour) + ' (' + ultrasonicPeaks.peakValue + ' readings).'
        : 'No ultrasonic activity grouped by hour yet.'
    );
    setSummary(
      rfidPeakSummary,
      rfidPeaks.peakHour !== null && rfidPeaks.peakValue > 0
        ? 'RFID busiest hour: ' + formatHourLabel(rfidPeaks.peakHour) + ' (' + rfidPeaks.peakValue + ' taps).'
        : 'No RFID activity grouped by hour yet.'
    );

    // Redraw on resize
    function redrawCharts() {
      resizeCanvas(ultrasonicPeakCanvas);
      resizeCanvas(rfidPeakCanvas);
      drawBarChart(ultrasonicPeakCanvas, hourLabels, ultrasonicPeakHours, { isHourly: true });
      drawBarChart(rfidPeakCanvas, hourLabels, rfidPeakHours, { isHourly: true });
    }

    // Insights
    var insights = generateInsights(ultrasonicReadings, rfidTaps);
    if (insightsList){
      insightsList.innerHTML = '';
      insights.forEach(function(s){
        var div = document.createElement('div');
        div.className = 'insight';
        div.textContent = s;
        insightsList.appendChild(div);
      });
    }

    // Telemetry suggestions
    var maintenanceSugs = generateMaintenanceSuggestions(ultrasonicReadings, rfidTaps);
    renderMaintenanceSuggestions(maintenanceSugs);

    // Handle window resize
    window.addEventListener('resize', redrawCharts);

  } catch (err) {
    console.error('Analytics error:', err);
  }
})();
