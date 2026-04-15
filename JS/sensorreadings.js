import { supabase } from './supabase-auth.js';
import { fetchOccupancyEvents, fetchResourcesLookup, fetchSensorsLookup } from './services/admin-observability-data.js';

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
        + '<td>' + escapeHtml(r.lastSeen ? formatTs(r.lastSeen) + ' (' + r.ageText + ')' : 'Never') + '</td>'
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
          id: ev.id,
          sensor_id: ev.sensor_id,
          resource_id: ev.resource_id,
          occupancy_change: value,
          recorded_at: ev.recorded_at
        },
        status: value > 0 ? 'ok' : 'warn'
      };
    });

    return {
      readings: mappedReadings,
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
    var sensors = unique(list.map(function(r){return r.sensor;})); sensors.unshift('all'); filterSensor.innerHTML = sensors.map(function(s){ return '<option value="'+s+'">'+(s==='all'?'All':s)+'</option>'}).join('');
    var resources = unique(list.map(function(r){return r.resource;})); resources.unshift('all'); filterResource.innerHTML = resources.map(function(s){ return '<option value="'+s+'">'+(s==='all'?'All':s)+'</option>'}).join('');
  }

  function unique(arr){ return arr.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function formatTs(ts){ var d = new Date(ts); return d.toISOString().replace('T',' ').split('.')[0]; }

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
    pageItems.forEach(function(r){
      var tr = document.createElement('tr');
      var statusClass = r.status==='ok' ? 'status-ok' : (r.status==='error' ? 'status-error' : 'status-warn');
      tr.innerHTML = '<td>'+formatTs(r.ts)+'</td><td>'+escapeHtml(r.sensor)+'</td><td>'+escapeHtml(r.resource)+'</td><td>'+escapeHtml(String(r.value))+'</td><td><button class="payload-btn">View</button></td><td><span class="status-dot '+statusClass+'"></span>'+escapeHtml(r.status)+'</td>';
      tbody.appendChild(tr);
      var payloadRow = document.createElement('tr'); payloadRow.className='payload-row'; payloadRow.style.display='none'; var payloadCell = document.createElement('td'); payloadCell.colSpan=6; payloadCell.className='payload-cell'; payloadCell.textContent = JSON.stringify(r.payload, null, 2); payloadRow.appendChild(payloadCell); tbody.appendChild(payloadRow);
      tr.querySelector('.payload-btn').addEventListener('click', function(){ payloadRow.style.display = payloadRow.style.display==='none' ? 'table-row' : 'none'; });
    });

    pageInfo.textContent = 'Page '+currentPage+' of '+pages+' ('+total+' items)';
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  prevPage.addEventListener('click', function(){ if(currentPage>1){ currentPage--; render(); } });
  nextPage.addEventListener('click', function(){ currentPage++; render(); });
  [filterSensor,filterResource,filterFrom,filterTo,filterKeyword].forEach(function(el){ if(el) el.addEventListener('input', function(){ currentPage=1; render(); }); });

  exportCsv.addEventListener('click', function(){ var list = readings || []; var rows = [['ts','sensor','resource','value','payload','status']]; list.forEach(function(r){ rows.push([r.ts,r.sensor,r.resource,r.value,JSON.stringify(r.payload),r.status]); }); var csv = rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n'); downloadBlob(csv,'sensor_readings.csv','text/csv'); });
  exportJson.addEventListener('click', function(){ var list = readings || []; downloadBlob(JSON.stringify(list,null,2),'sensor_readings.json','application/json'); });

  function downloadBlob(content, filename, type){ var blob = new Blob([content],{type:type}); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

  toggleGraph.addEventListener('click', function(){ if(graphSection.style.display==='none'){ graphSection.style.display='block'; drawGraph(); toggleGraph.textContent='Hide Graph'; } else { graphSection.style.display='none'; toggleGraph.textContent='Graph View'; } });

  function drawGraph(){ var list = (readings || []).slice().sort(function(a,b){ return new Date(a.ts)-new Date(b.ts); }); var labels = list.map(function(r){ return formatTs(r.ts); }); var values = list.map(function(r){ return Number(r.value) || 0; }); drawLine(chartCanvas, labels, values); }

  function drawLine(canvas, labels, values){ if(!canvas) return; var ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); var w=canvas.width, h=canvas.height; var max = Math.max.apply(null, values.concat([1])); ctx.strokeStyle='#2563eb'; ctx.lineWidth=2; ctx.beginPath(); values.forEach(function(v,i){ var x = 40 + (i*(w-60)/(values.length-1 || 1)); var y = (h-40) - ((v/max)*(h-60)); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }

  // init
  refreshData();

})();
