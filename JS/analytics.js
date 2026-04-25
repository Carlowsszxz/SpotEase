/* Analytics: telemetry-focused dashboard (ultrasonic + RFID) */
import { supabase } from './supabase-auth.js'

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
