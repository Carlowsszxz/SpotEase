/* Analytics: fetch data from resource_usage_stats and reservations tables */
import { supabase } from './supabase-auth.js'

(async function analytics(){
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    var usageCanvas = document.getElementById('usageChart');
    var peakCanvas = document.getElementById('peakChart');
    var ultrasonicPeakCanvas = document.getElementById('ultrasonicPeakChart');
    var rfidPeakCanvas = document.getElementById('rfidPeakChart');
    var usageChartSummary = document.getElementById('usageChartSummary');
    var peakChartSummary = document.getElementById('peakChartSummary');
    var ultrasonicPeakSummary = document.getElementById('ultrasonicPeakSummary');
    var rfidPeakSummary = document.getElementById('rfidPeakSummary');
    var insightsList = document.getElementById('insightsList');
    var maintenanceSuggestions = document.getElementById('maintenanceSuggestions');
    var exportBtn = document.getElementById('exportCsv');
    
    console.log('Elements found:', {
      usageCanvas: usageCanvas,
      peakCanvas: peakCanvas, 
      insightsList: insightsList,
      exportBtn: exportBtn
    });

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
      var peakHour = values.indexOf(peakValue);
      var total = values.reduce(function(sum, value){ return sum + value; }, 0);
      return { peakHour: peakHour, peakValue: peakValue, total: total };
    }

    function setSummary(el, text){
      if (!el) return;
      el.textContent = text;
    }

    // Load resource usage stats
    async function loadUsageStats(){
      try {
        const { data, error } = await supabase
          .from('resource_usage_stats')
          .select('*')
          .order('date', { ascending: true })
          .limit(14);
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error loading usage stats:', err);
        return [];
      }
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

    // Generate AI maintenance suggestions
    function generateMaintenanceSuggestions(stats, ultrasonicReadings, rfidTaps){
      var suggestions = [];
      
      // Analyze peak hours to find quietest times
      var peakHours = new Array(24).fill(0);
      stats.forEach(function(s){
        if (s.peak_usage_time){
          var h = new Date(s.peak_usage_time).getHours();
          if (!isNaN(h)) peakHours[h]++;
        }
      });
      
      var quietestHours = [];
      var minCount = Math.min.apply(null, peakHours);
      peakHours.forEach(function(count, hour){
        if (count === minCount) quietestHours.push(hour);
      });
      
      if (quietestHours.length > 0){
        var quietestHourStr = quietestHours.slice(0, 3).map(function(h){
          return h + ':00';
        }).join(', ');
        suggestions.push({
          type: 'optimal-window',
          title: 'Optimal Maintenance Window',
          description: 'Best times for maintenance: ' + quietestHourStr + '. Usage is lowest during these hours.',
          priority: 'high'
        });
      }
      
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
              title: '⚠ Ultrasonic Sensor Alert',
              description: 'Average sensor reading is high (' + avgUltrasonic.toFixed(1) + 'cm). Consider cleaning or calibrating sensors.',
              priority: 'medium'
            });
          }else{
            suggestions.push({
              type: 'sensor-health',
              title: '✓ Ultrasonic Sensors Normal',
              description: 'Average reading: ' + avgUltrasonic.toFixed(1) + 'cm. Sensors operating normally.',
              priority: 'low'
            });
          }
        }
      }
      
      // Analyze RFID activity
      if (rfidTaps && rfidTaps.length > 0){
        // Check for unusual patterns
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
          title: '📊 RFID Peak Activity',
          description: 'Peak RFID activity at ' + maxRfidHour + ':00 (' + rfidByHour[maxRfidHour] + ' taps). Coordinate maintenance outside this window.',
          priority: 'medium'
        });
      }
      
      // Usage trend analysis
      if (stats.length >= 7){
        var recentAvg = stats.slice(-7).reduce(function(sum, s){
          return sum + (s.total_reservations || 0);
        }, 0) / 7;
        var previousAvg = stats.slice(-14, -7).reduce(function(sum, s){
          return sum + (s.total_reservations || 0);
        }, 0) / 7;
        
        if (recentAvg > previousAvg * 1.2){
          suggestions.push({
            type: 'usage-trend',
            title: 'Increased Usage',
            description: 'Usage trending up (↑ ' + Math.round((recentAvg - previousAvg) / previousAvg * 100) + '%). More frequent maintenance may be needed.',
            priority: 'medium'
          });
        }else if (recentAvg < previousAvg * 0.8){
          suggestions.push({
            type: 'usage-trend',
            title: 'Low Usage Period',
            description: 'Usage trending down. Good time for preventive maintenance.',
            priority: 'high'
          });
        }
      }
      
      // General recommendations
      suggestions.push({
        type: 'general',
        title: 'General Maintenance Tips',
        description: 'Schedule regular calibration during quiet hours. Check battery levels on wireless sensors. Verify RFID reader antenna connections.',
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
    async function loadReservations(){
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            status,
            reserved_from,
            reserved_until,
            resources:resource_id(name)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error loading reservations:', err);
        return [];
      }
    }

    // Draw line chart
    function drawLineChart(canvas, labels, values){
      console.log('drawLineChart called with canvas:', canvas, 'labels:', labels, 'values:', values);
      if(!canvas) {
        console.error('Canvas not found for line chart');
        return;
      }
      var ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for line chart');
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
      console.log('Chart dimensions: width=' + w + ', height=' + h + ', max value=' + max);

      var styles = getComputedStyle(document.documentElement);
      var axisColor = (styles.getPropertyValue('--bt-border') || '#e6e9ef').trim();
      var textColor = (styles.getPropertyValue('--bt-muted-foreground') || '#334155').trim();
      var accentColor = (styles.getPropertyValue('--bt-accent') || '#2563eb').trim();

      // draw y grid + tick labels
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.font = '11px sans-serif';
      ctx.fillStyle = textColor;
      [0, 0.5, 1].forEach(function(ratio){
        var y = top + chartH - chartH * ratio;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + chartW, y);
        ctx.stroke();
        var labelValue = Math.round(max * ratio);
        ctx.fillText(String(labelValue), 8, y + 4);
      });

      // axes
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, top + chartH);
      ctx.lineTo(left + chartW, top + chartH);
      ctx.stroke();
      
      // draw line
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach(function(v, i){
        var x = left + (i * chartW / (values.length - 1 || 1));
        var y = top + chartH - ((v / max) * chartH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // draw points and labels
      ctx.fillStyle = accentColor;
      values.forEach(function(v, i){
        var x = left + (i * chartW / (values.length - 1 || 1));
        var y = top + chartH - ((v / max) * chartH);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (i % Math.ceil(values.length / 10) === 0){
          ctx.fillStyle = textColor;
          ctx.font = '11px sans-serif';
          ctx.fillText(labels[i], x - 12, h - 10);
          ctx.fillStyle = accentColor;
        }
      });

      // latest value callout
      if (values.length > 0) {
        var latest = values[values.length - 1];
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.fillText('Latest: ' + latest, left + chartW - 78, top + 14);
      }
      console.log('Line chart drawn successfully');
    }

    // Draw bar chart
    function drawBarChart(canvas, labels, values, options){
      options = options || {};
      console.log('drawBarChart called with canvas:', canvas, 'labels:', labels, 'values:', values);
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
      console.log('Bar chart dimensions: width=' + w + ', height=' + h + ', barWidth=' + barW + ', max value=' + max);

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
      console.log('Bar chart drawn successfully');
    }

    // Generate insights from usage stats
    function generateInsights(stats){
      var insights = [];
      
      if (stats.length === 0){
        insights.push('No usage data available to analyze.');
        return insights;
      }
      
      // Total reservations
      var totalReservations = stats.reduce(function(sum, s){ return sum + (s.total_reservations || 0); }, 0);
      insights.push('Total reservations (last 14 days): ' + totalReservations);
      
      // Average per day
      var avgPerDay = Math.round(totalReservations / stats.length);
      insights.push('Average per day: ' + avgPerDay + ' reservations');
      
      // Peak usage
      var peakDay = stats.reduce(function(max, s){ 
        return (s.total_reservations || 0) > (max.total_reservations || 0) ? s : max; 
      });
      if (peakDay.date){
        insights.push('Peak usage day: ' + peakDay.date + ' with ' + peakDay.total_reservations + ' reservations');
      }
      
      // Average occupancy duration
      var durations = stats.filter(function(s){ return s.avg_occupancy_duration; }).map(function(s){ return s.avg_occupancy_duration; });
      if (durations.length > 0){
        var avgDuration = (durations.reduce(function(a, b){ return a + b; }, 0) / durations.length).toFixed(1);
        insights.push('Average occupancy duration: ' + avgDuration + ' hours');
      }
      
      return insights;
    }

    // Export CSV
    function exportCSV(reservations){
      var rows = [['ID', 'Resource', 'From', 'Until', 'Status']];
      reservations.forEach(function(r){
        var resourceName = r.resources ? r.resources.name : 'Unknown';
        var from = r.reserved_from ? new Date(r.reserved_from).toLocaleString() : '';
        var until = r.reserved_until ? new Date(r.reserved_until).toLocaleString() : '';
        rows.push([r.id, resourceName, from, until, r.status || '']);
      });
      
      var csv = rows.map(function(r){
        return r.map(function(c){
          return '"' + String(c).replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\n');
      
      var blob = new Blob([csv], {type: 'text/csv'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'reservations.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    // Load and display data
    var stats = await loadUsageStats();
    var ultrasonicReadings = await loadUltrasonicReadings();
    var rfidTaps = await loadRfidTaps();
    
    console.log('Usage stats loaded:', stats);
    console.log('Ultrasonic readings loaded:', ultrasonicReadings.length);
    console.log('RFID taps loaded:', rfidTaps.length);
    
    // If no data, show message and use sample data for demo
    if (stats.length === 0) {
      console.warn('No resource_usage_stats data found. Using sample data for demo.');
      if (insightsList) {
        var noDataMsg = document.createElement('div');
        noDataMsg.className = 'insight';
        noDataMsg.textContent = 'No usage data available. Please ensure resource_usage_stats table is populated.';
        insightsList.appendChild(noDataMsg);
      }
      
      // Use sample data for demonstration
      stats = [
        { date: '2026-02-21', total_reservations: 8, avg_occupancy_duration: 2.5, peak_usage_time: '2026-02-21T14:00:00' },
        { date: '2026-02-22', total_reservations: 12, avg_occupancy_duration: 2.8, peak_usage_time: '2026-02-22T15:30:00' },
        { date: '2026-02-23', total_reservations: 5, avg_occupancy_duration: 1.9, peak_usage_time: '2026-02-23T10:00:00' },
        { date: '2026-02-24', total_reservations: 15, avg_occupancy_duration: 3.2, peak_usage_time: '2026-02-24T13:00:00' },
        { date: '2026-02-25', total_reservations: 18, avg_occupancy_duration: 3.5, peak_usage_time: '2026-02-25T14:30:00' },
        { date: '2026-02-26', total_reservations: 22, avg_occupancy_duration: 3.8, peak_usage_time: '2026-02-26T12:00:00' },
        { date: '2026-02-27', total_reservations: 9, avg_occupancy_duration: 2.1, peak_usage_time: '2026-02-27T16:00:00' },
        { date: '2026-02-28', total_reservations: 14, avg_occupancy_duration: 2.9, peak_usage_time: '2026-02-28T15:00:00' },
        { date: '2026-03-01', total_reservations: 16, avg_occupancy_duration: 3.1, peak_usage_time: '2026-03-01T14:00:00' },
        { date: '2026-03-02', total_reservations: 20, avg_occupancy_duration: 3.4, peak_usage_time: '2026-03-02T13:30:00' },
        { date: '2026-03-03', total_reservations: 11, avg_occupancy_duration: 2.6, peak_usage_time: '2026-03-03T11:00:00' },
        { date: '2026-03-04', total_reservations: 17, avg_occupancy_duration: 3.0, peak_usage_time: '2026-03-04T14:00:00' },
        { date: '2026-03-05', total_reservations: 24, avg_occupancy_duration: 3.9, peak_usage_time: '2026-03-05T15:00:00' },
        { date: '2026-03-06', total_reservations: 19, avg_occupancy_duration: 3.3, peak_usage_time: '2026-03-06T12:30:00' }
      ];
    }
    
    // Resize canvas to fit containers
    function resizeCanvas(canvas) {
      if (!canvas || !canvas.parentElement) return;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 32; // Account for padding
      canvas.height = 240;
      console.log('Canvas resized:', { width: canvas.width, height: canvas.height });
    }
    
    // Resize both canvases
    resizeCanvas(usageCanvas);
    resizeCanvas(peakCanvas);
    resizeCanvas(ultrasonicPeakCanvas);
    resizeCanvas(rfidPeakCanvas);
    
    // Usage over time chart
    var dates = stats.map(function(s){ return s.date; });
    var counts = stats.map(function(s){ return s.total_reservations || 0; });
    console.log('Drawing usage chart with dates:', dates, 'counts:', counts);
    drawLineChart(usageCanvas, dates, counts);

    // Peak hours chart (hours of day derived from peak_usage_time)
    var peakHours = new Array(24).fill(0);
    stats.forEach(function(s){
      if (s.peak_usage_time){
        var h = new Date(s.peak_usage_time).getHours();
        if (!isNaN(h)) peakHours[h]++;
      }
    });
    var hourLabels = peakHours.map(function(_, i){ return formatHourLabel(i); });
    console.log('Drawing peak hours chart with hours:', hourLabels, 'values:', peakHours);
    drawBarChart(peakCanvas, hourLabels, peakHours, { isHourly: true });

    // Ultrasonic peak hours chart
    var ultrasonicPeakHours = calculatePeakHours(ultrasonicReadings, 'timestamp');
    console.log('Drawing ultrasonic peak chart:', ultrasonicPeakHours);
    drawBarChart(ultrasonicPeakCanvas, hourLabels, ultrasonicPeakHours, { isHourly: true });

    // RFID peak hours chart
    var rfidPeakHours = calculatePeakHours(rfidTaps, 'timestamp');
    console.log('Drawing RFID peak chart:', rfidPeakHours);
    drawBarChart(rfidPeakCanvas, hourLabels, rfidPeakHours, { isHourly: true });

    var reservationPeaks = getPeakInfo(peakHours);
    var ultrasonicPeaks = getPeakInfo(ultrasonicPeakHours);
    var rfidPeaks = getPeakInfo(rfidPeakHours);
    var usageMax = Math.max.apply(null, counts.concat([0]));
    var usageMin = Math.min.apply(null, counts.concat([0]));
    setSummary(
      usageChartSummary,
      'Last 14 days: highest ' + usageMax + ', lowest ' + usageMin + ', average ' + (counts.length ? (counts.reduce(function(a, b){ return a + b; }, 0) / counts.length).toFixed(1) : '0') + ' reservations/day.'
    );
    setSummary(
      peakChartSummary,
      reservationPeaks.peakHour !== null
        ? 'Reservation peak hour: ' + formatHourLabel(reservationPeaks.peakHour) + ' (' + reservationPeaks.peakValue + ' peak-day hits).'
        : 'No reservation peak-hour data yet.'
    );
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

    // Define redraw function (has access to dates, counts, hourLabels, peakHours via closure)
    function redrawCharts() {
      resizeCanvas(usageCanvas);
      resizeCanvas(peakCanvas);
      resizeCanvas(ultrasonicPeakCanvas);
      resizeCanvas(rfidPeakCanvas);
      drawLineChart(usageCanvas, dates, counts);
      drawBarChart(peakCanvas, hourLabels, peakHours, { isHourly: true });
      drawBarChart(ultrasonicPeakCanvas, hourLabels, ultrasonicPeakHours, { isHourly: true });
      drawBarChart(rfidPeakCanvas, hourLabels, rfidPeakHours, { isHourly: true });
    }

    // Insights
    var insights = generateInsights(stats);
    console.log('Generated insights:', insights);
    if (insightsList){
      insightsList.innerHTML = '';
      insights.forEach(function(s){
        var div = document.createElement('div');
        div.className = 'insight';
        div.textContent = s;
        insightsList.appendChild(div);
      });
    }

    // Maintenance suggestions
    var maintenanceSugs = generateMaintenanceSuggestions(stats, ultrasonicReadings, rfidTaps);
    console.log('Generated maintenance suggestions:', maintenanceSugs);
    renderMaintenanceSuggestions(maintenanceSugs);

    // CSV export
    if (exportBtn){
      exportBtn.addEventListener('click', async function(){
        var reservations = await loadReservations();
        console.log('Exporting reservations:', reservations);
        exportCSV(reservations);
      });
    }

    // Handle window resize
    window.addEventListener('resize', redrawCharts);

  } catch (err) {
    console.error('Analytics error:', err);
  }
})();
