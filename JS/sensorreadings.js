import { supabase } from './supabase-auth.js';
import { fetchOccupancyEvents, fetchResourcesLookup, fetchSensorsLookup, fetchBleScans } from './services/admin-observability-data.js';

/* Sensor Readings viewer. Primary source is Supabase `occupancy_events`, with localStorage fallback. */
(function(){
  var storageKey = 'pm_sensor_readings';

  function load(){ try{ return JSON.parse(localStorage.getItem(storageKey) || '[]'); }catch(e){ return []; } }

  var tbody = document.getElementById('readingsTbody');
  var filterSensor = document.getElementById('filterSensor');
  var filterResource = document.getElementById('filterResource');
  var filterFrom = document.getElementById('filterFrom');
  var filterTo = document.getElementById('filterTo');
  var filterKeyword = document.getElementById('filterKeyword');
  var prevPage = document.getElementById('prevPage');
  var nextPage = document.getElementById('nextPage');
  var pageInfo = document.getElementById('pageInfo');
  var exportCsv = document.getElementById('exportCsv');
  var exportJson = document.getElementById('exportJson');
  var toggleGraph = document.getElementById('toggleGraph');
  var graphSection = document.getElementById('graphSection');
  var chartCanvas = document.getElementById('readingsChart');
  var healthTotalSensors = document.getElementById('healthTotalSensors');
  var healthHealthySensors = document.getElementById('healthHealthySensors');
  var healthStaleSensors = document.getElementById('healthStaleSensors');
  var healthNoDataSensors = document.getElementById('healthNoDataSensors');
  var healthTbody = document.getElementById('healthTbody');
  var healthEmpty = document.getElementById('healthEmpty');

  var currentPage = 1; var pageSize = 20;
  var readings = [];
  var sensorHealth = [];

  function shortId(id){ return String(id || '').slice(0,8); }

  function setText(el, text){ if(el) el.textContent = text; }

  function titleCase(value){
    var str = String(value || '').replace(/[_-]+/g, ' ').trim();
    if(!str) return 'Unknown';
    return str.split(' ').map(function(part){ return part.charAt(0).toUpperCase() + part.slice(1); }).join(' ');
  }

  function formatRelativeAge(ts){
    if(!ts) return 'Never';
    var d = new Date(ts);
    if(isNaN(d.getTime())) return 'Unknown';
    var diffMs = Date.now() - d.getTime();
    var mins = Math.floor(diffMs / 60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if(hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    return days + 'd ago';
  }

  function computeSensorHealthRows(sensors, events, resourceMap, sensorMap){
    var lastSeenBySensor = {};
    (events || []).forEach(function(ev){
      if(!ev || !ev.sensor_id || !ev.recorded_at) return;
      var prev = lastSeenBySensor[ev.sensor_id];
      if(!prev || new Date(ev.recorded_at) > new Date(prev)){
        lastSeenBySensor[ev.sensor_id] = ev.recorded_at;
      }
    });

    var now = Date.now();
    return (sensors || []).map(function(s){
      var sensorId = s.id;
      var lastSeen = lastSeenBySensor[sensorId] || null;
      var resourceLabel = resourceMap[s.resource_id] || ('Resource ' + shortId(s.resource_id));
      var ageMs = lastSeen ? (now - new Date(lastSeen).getTime()) : null;

      var status = 'healthy';
      if(!lastSeen){
        status = 'nodata';
      } else if(ageMs > 24 * 60 * 60 * 1000){
        status = 'stale';
      }

      return {
        sensor: sensorMap[sensorId] || ('Sensor ' + shortId(sensorId)),
        resource: resourceLabel,
        lastSeen: lastSeen,
        ageText: formatRelativeAge(lastSeen),
        status: status
      };
    });
  }

  function renderHealth(){
    var rows = sensorHealth || [];
    var total = rows.length;
    var healthy = rows.filter(function(r){ return r.status === 'healthy'; }).length;
    var stale = rows.filter(function(r){ return r.status === 'stale'; }).length;
    var noData = rows.filter(function(r){ return r.status === 'nodata'; }).length;

    if(healthTotalSensors) healthTotalSensors.textContent = String(total);
    if(healthHealthySensors) healthHealthySensors.textContent = String(healthy);
    if(healthStaleSensors) healthStaleSensors.textContent = String(stale);
    if(healthNoDataSensors) healthNoDataSensors.textContent = String(noData);

    if(!healthTbody) return;
    healthTbody.innerHTML = '';

    var flagged = rows
      .filter(function(r){ return r.status !== 'healthy'; })
      .sort(function(a,b){ return new Date(a.lastSeen || 0) - new Date(b.lastSeen || 0); });

    if(!flagged.length){
      if(healthEmpty) healthEmpty.style.display = 'block';
      return;
    }
    if(healthEmpty) healthEmpty.style.display = 'none';

    flagged.forEach(function(r){
      var tr = document.createElement('tr');
      var statusLabel = r.status === 'nodata' ? 'No Data' : 'Stale';
      tr.innerHTML = '<td>' + escapeHtml(r.sensor) + '</td>'
        + '<td>' + escapeHtml(r.resource) + '</td>'
        + '<td>' + escapeHtml(r.lastSeen ? formatTsLocal(r.lastSeen) + ' (' + r.ageText + ')' : 'Never') + '</td>'
        + '<td><span class="health-status ' + r.status + '">' + statusLabel + '</span></td>';
      healthTbody.appendChild(tr);
    });
  }

  async function loadFromSupabase(){
    const [events, resources, sensors] = await Promise.all([
      fetchOccupancyEvents(supabase, 3000),
      fetchResourcesLookup(supabase),
      fetchSensorsLookup(supabase)
    ]);

    var bleEvents = [];
    try {
      bleEvents = await fetchBleScans(supabase, 3000);
    } catch (err) {
      console.warn('BLE scans table unavailable or not allowed yet:', err);
      bleEvents = [];
    }

    var resourceMap = {};
    (resources || []).forEach(function(r){
      var name = String((r && r.name) || '').trim();
      var location = String((r && r.location) || '').trim();
      resourceMap[r.id] = name ? (location ? (name + ' (' + location + ')') : name) : ('Resource ' + shortId(r.id));
    });

    var sensorMap = {};
    (sensors || []).forEach(function(s){
      var direction = String((s && s.direction) || '').trim();
      sensorMap[s.id] = direction ? ('Sensor ' + shortId(s.id) + ' (' + direction + ')') : ('Sensor ' + shortId(s.id));
    });

    var mappedReadings = (events || []).map(function(ev){
      var value = Number(ev.occupancy_change || 0);
      return {
        ts: ev.recorded_at || new Date().toISOString(),
        sensor: sensorMap[ev.sensor_id] || ('Sensor ' + shortId(ev.sensor_id)),
        resource: resourceMap[ev.resource_id] || ('Resource ' + shortId(ev.resource_id)),
        value: value,
        payload: {
          source: 'occupancy_events',
          id: ev.id,
          sensor_id: ev.sensor_id,
          resource_id: ev.resource_id,
          occupancy_change: value,
          recorded_at: ev.recorded_at
        },
        status: value > 0 ? 'ok' : 'warn'
      };
    });

    var mappedBleReadings = (bleEvents || []).map(function(ev){
      var signal = Number(ev.rssi || 0);
      var hasName = !!String(ev.device_name || '').trim();
      return {
        ts: ev.created_at || new Date().toISOString(),
        sensor: ev.gateway_id ? ('BLE GW ' + ev.gateway_id) : 'BLE Gateway',
        resource: 'BLE Nearby Devices',
        value: signal,
        payload: {
          source: 'ble_scans',
          id: ev.id,
          gateway_id: ev.gateway_id,
          scan_batch: ev.scan_batch,
          device_address: ev.device_address,
          device_name: hasName ? ev.device_name : null,
          rssi: signal,
          created_at: ev.created_at
        },
        status: signal >= -75 ? 'ok' : 'warn'
      };
    });

    var allReadings = mappedReadings.concat(mappedBleReadings);

    return {
      readings: allReadings,
      sensorHealth: computeSensorHealthRows(sensors || [], events || [], resourceMap, sensorMap)
    };
  }

  async function refreshData(){
    try {
      var result = await loadFromSupabase();
      readings = result.readings || [];
      sensorHealth = result.sensorHealth || [];
    } catch (err) {
      console.warn('Sensor readings fallback to localStorage:', err);
      readings = load();
      sensorHealth = [];
    }
    renderHealth();
    render();
  }

  function populateFilters(list){
    var sensors = unique(list.map(function(r){return r.sensor;}));
    sensors.unshift('all');
    setSelectOptions(filterSensor, sensors, function(s){ return s === 'all' ? 'All' : s; });

    var resources = unique(list.map(function(r){return r.resource;}));
    resources.unshift('all');
    setSelectOptions(filterResource, resources, function(s){ return s === 'all' ? 'All' : s; });
  }

  function unique(arr){ return arr.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function setSelectOptions(el, values, toLabel){
    if(!el) return;
    var previous = el.value || 'all';
    el.innerHTML = (values || []).map(function(v){
      var label = toLabel ? toLabel(v) : v;
      return '<option value="' + escapeHtml(v) + '">' + escapeHtml(label) + '</option>';
    }).join('');
    if((values || []).indexOf(previous) !== -1) el.value = previous;
    else if((values || []).indexOf('all') !== -1) el.value = 'all';
  }

  function formatTsLocal(ts){
    var d = new Date(ts);
    if(isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  }

  function render(){
    var list = (readings || []).slice().sort(function(a,b){ return new Date(b.ts) - new Date(a.ts); });
    populateFilters(list);
    var sensor = filterSensor.value || 'all'; var resource = filterResource.value || 'all'; var from = filterFrom.value; var to = filterTo.value; var k = (filterKeyword.value||'').toLowerCase();
    var filtered = list.filter(function(r){
      if(sensor!=='all' && r.sensor!==sensor) return false;
      if(resource!=='all' && r.resource!==resource) return false;
      if(from && new Date(r.ts) < new Date(from+'T00:00:00')) return false;
      if(to && new Date(r.ts) > new Date(to+'T23:59:59')) return false;
      if(k){ if(r.sensor.toLowerCase().indexOf(k)===-1 && r.resource.toLowerCase().indexOf(k)===-1 && JSON.stringify(r.payload).toLowerCase().indexOf(k)===-1) return false; }
      return true;
    });

    var total = filtered.length; var pages = Math.max(1, Math.ceil(total/pageSize)); if(currentPage>pages) currentPage = pages;
    var start = (currentPage-1)*pageSize; var pageItems = filtered.slice(start, start+pageSize);

    tbody.innerHTML = '';
    if(pageItems.length === 0){
      var emptyTr = document.createElement('tr');
      emptyTr.className = 'payload-row';
      emptyTr.innerHTML = '<td colspan="6" class="payload-cell">No sensor readings matched your current filters.</td>';
      tbody.appendChild(emptyTr);
    }

    pageItems.forEach(function(r){
      var tr = document.createElement('tr');
      var statusClass = r.status==='ok' ? 'status-ok' : (r.status==='error' ? 'status-error' : 'status-warn');
      tr.innerHTML = '<td>'+formatTsLocal(r.ts)+'</td><td>'+escapeHtml(r.sensor)+'</td><td>'+escapeHtml(r.resource)+'</td><td>'+escapeHtml(String(r.value))+'</td><td><button class="payload-btn" aria-expanded="false">View</button></td><td><span class="status-dot '+statusClass+'"></span>'+escapeHtml(titleCase(r.status))+'</td>';
      tbody.appendChild(tr);
      var payloadRow = document.createElement('tr'); payloadRow.className='payload-row'; payloadRow.style.display='none'; var payloadCell = document.createElement('td'); payloadCell.colSpan=6; payloadCell.className='payload-cell'; payloadCell.textContent = JSON.stringify(r.payload, null, 2); payloadRow.appendChild(payloadCell); tbody.appendChild(payloadRow);
      tr.querySelector('.payload-btn').addEventListener('click', function(e){
        var isHidden = payloadRow.style.display === 'none';
        payloadRow.style.display = isHidden ? 'table-row' : 'none';
        e.currentTarget.textContent = isHidden ? 'Hide' : 'View';
        e.currentTarget.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      });
    });

    setText(pageInfo, 'Page '+currentPage+' of '+pages+' · '+total+' records');
    if(prevPage) prevPage.disabled = currentPage <= 1;
    if(nextPage) nextPage.disabled = currentPage >= pages;
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  prevPage.addEventListener('click', function(){ if(currentPage>1){ currentPage--; render(); } });
  nextPage.addEventListener('click', function(){ currentPage++; render(); });
  [filterSensor,filterResource,filterFrom,filterTo,filterKeyword].forEach(function(el){ if(el) el.addEventListener('input', function(){ currentPage=1; render(); }); });

  exportCsv.addEventListener('click', function(){
    var original = exportCsv.textContent;
    exportCsv.disabled = true;
    exportCsv.textContent = 'Exporting...';
    try {
      var list = readings || [];
      var rows = [['ts','sensor','resource','value','payload','status']];
      list.forEach(function(r){ rows.push([r.ts,r.sensor,r.resource,r.value,JSON.stringify(r.payload),r.status]); });
      var csv = rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
      downloadBlob(csv,'sensor_readings.csv','text/csv');
    } finally {
      exportCsv.disabled = false;
      exportCsv.textContent = original;
    }
  });

  exportJson.addEventListener('click', function(){
    var original = exportJson.textContent;
    exportJson.disabled = true;
    exportJson.textContent = 'Exporting...';
    try {
      var list = readings || [];
      downloadBlob(JSON.stringify(list,null,2),'sensor_readings.json','application/json');
    } finally {
      exportJson.disabled = false;
      exportJson.textContent = original;
    }
  });

  function downloadBlob(content, filename, type){ var blob = new Blob([content],{type:type}); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

  toggleGraph.addEventListener('click', function(){
    if(graphSection.style.display==='none'){
      graphSection.style.display='block';
      drawGraph();
      toggleGraph.textContent='Hide Graph';
    } else {
      graphSection.style.display='none';
      toggleGraph.textContent='Show Graph';
    }
  });

  function drawGraph(){
    var list = (readings || []).slice().sort(function(a,b){ return new Date(a.ts)-new Date(b.ts); });
    var labels = list.map(function(r){ return formatTsLocal(r.ts); });
    var values = list.map(function(r){ return Number(r.value) || 0; });
    drawLine(chartCanvas, labels, values);
  }

  function drawLine(canvas, labels, values){
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    if(!ctx) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    var w=canvas.width, h=canvas.height;
    var max = Math.max.apply(null, values.concat([1]));

    var left = 44;
    var right = 14;
    var top = 16;
    var bottom = 30;
    var chartW = w - left - right;
    var chartH = h - top - bottom;

    var styles = getComputedStyle(document.documentElement);
    var axisColor = (styles.getPropertyValue('--bt-border') || '#262626').trim();
    var textColor = (styles.getPropertyValue('--bt-muted-foreground') || '#737373').trim();
    var accentColor = (styles.getPropertyValue('--bt-accent') || '#FF3D00').trim();

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach(function(ratio){
      var y = top + chartH - chartH * ratio;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + chartW, y);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + chartH);
    ctx.lineTo(left + chartW, top + chartH);
    ctx.stroke();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach(function(v,i){
      var x = left + (i*(chartW)/(values.length-1 || 1));
      var y = top + chartH - ((v/max)*(chartH));
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    ctx.fillStyle = accentColor;
    values.forEach(function(v,i){
      var x = left + (i*(chartW)/(values.length-1 || 1));
      var y = top + chartH - ((v/max)*(chartH));
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    if(values.length){
      ctx.fillText('Latest: ' + values[values.length - 1], left + chartW - 85, top + 12);
    }
  }

  // init
  refreshData();

})();
