/* Analytics: fetch data from resource_usage_stats and reservations tables */
import { supabase } from './supabase-auth.js'

(async function analytics(){
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    var usageCanvas = document.getElementById('usageChart');
    var peakCanvas = document.getElementById('peakChart');
    var insightsList = document.getElementById('insightsList');
    var exportBtn = document.getElementById('exportCsv');
    
    console.log('Elements found:', {
      usageCanvas: usageCanvas,
      peakCanvas: peakCanvas, 
      insightsList: insightsList,
      exportBtn: exportBtn
    });

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

    // Load reservations for CSV export
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
      console.log('Chart dimensions: width=' + w + ', height=' + h + ', max value=' + max);
      
      // draw axes
      ctx.strokeStyle = '#e6e9ef';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, h - 30);
      ctx.lineTo(w - 10, h - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(40, h - 30);
      ctx.stroke();
      
      // draw line
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach(function(v, i){
        var x = 40 + (i * (w - 60) / (values.length - 1 || 1));
        var y = (h - 40) - ((v / max) * (h - 60));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // draw points and labels
      ctx.fillStyle = '#2563eb';
      values.forEach(function(v, i){
        var x = 40 + (i * (w - 60) / (values.length - 1 || 1));
        var y = (h - 40) - ((v / max) * (h - 60));
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (i % Math.ceil(values.length / 10) === 0){
          ctx.fillStyle = '#334155';
          ctx.font = '11px sans-serif';
          ctx.fillText(labels[i], x - 10, h - 8);
          ctx.fillStyle = '#2563eb';
        }
      });
      console.log('Line chart drawn successfully');
    }

    // Draw bar chart
    function drawBarChart(canvas, labels, values){
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
      var barW = (w - 60) / labels.length;
      console.log('Bar chart dimensions: width=' + w + ', height=' + h + ', barWidth=' + barW + ', max value=' + max);
      
      values.forEach(function(v, i){
        var x = 40 + i * barW;
        var bw = barW * 0.8;
        var y = (h - 40) - (v / max) * (h - 60);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, y, bw, (h - 40) - y);
        if (i % 2 === 0){
          ctx.fillStyle = '#334155';
          ctx.font = '11px sans-serif';
          ctx.fillText(labels[i], x, h - 8);
        }
      });
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
    console.log('Usage stats loaded:', stats);
    
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
    var hourLabels = peakHours.map(function(_, i){ return String(i); });
    console.log('Drawing peak hours chart with hours:', hourLabels, 'values:', peakHours);
    drawBarChart(peakCanvas, hourLabels, peakHours);

    // Define redraw function (has access to dates, counts, hourLabels, peakHours via closure)
    function redrawCharts() {
      resizeCanvas(usageCanvas);
      resizeCanvas(peakCanvas);
      drawLineChart(usageCanvas, dates, counts);
      drawBarChart(peakCanvas, hourLabels, peakHours);
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
