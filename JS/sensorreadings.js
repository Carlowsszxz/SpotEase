/* Sensor Readings viewer (demo). Stores/loads readings from localStorage key 'pm_sensor_readings'.
   Features: filtering, pagination, expandable payload, export CSV/JSON, simple graph view.
*/
(function(){
  var storageKey = 'pm_sensor_readings';

  function load(){ try{ return JSON.parse(localStorage.getItem(storageKey) || '[]'); }catch(e){ return []; } }
  function save(list){ try{ localStorage.setItem(storageKey, JSON.stringify(list)); }catch(e){} }

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

  var currentPage = 1; var pageSize = 20;

  function populateFilters(list){
    var sensors = unique(list.map(function(r){return r.sensor;})); sensors.unshift('all'); filterSensor.innerHTML = sensors.map(function(s){ return '<option value="'+s+'">'+(s==='all'?'All':s)+'</option>'}).join('');
    var resources = unique(list.map(function(r){return r.resource;})); resources.unshift('all'); filterResource.innerHTML = resources.map(function(s){ return '<option value="'+s+'">'+(s==='all'?'All':s)+'</option>'}).join('');
  }

  function unique(arr){ return arr.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function formatTs(ts){ var d = new Date(ts); return d.toISOString().replace('T',' ').split('.')[0]; }

  function render(){
    var list = load().sort(function(a,b){ return new Date(b.ts) - new Date(a.ts); });
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

  exportCsv.addEventListener('click', function(){ var list = load(); var rows = [['ts','sensor','resource','value','payload','status']]; list.forEach(function(r){ rows.push([r.ts,r.sensor,r.resource,r.value,JSON.stringify(r.payload),r.status]); }); var csv = rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n'); downloadBlob(csv,'sensor_readings.csv','text/csv'); });
  exportJson.addEventListener('click', function(){ var list = load(); downloadBlob(JSON.stringify(list,null,2),'sensor_readings.json','application/json'); });

  function downloadBlob(content, filename, type){ var blob = new Blob([content],{type:type}); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

  toggleGraph.addEventListener('click', function(){ if(graphSection.style.display==='none'){ graphSection.style.display='block'; drawGraph(); toggleGraph.textContent='Hide Graph'; } else { graphSection.style.display='none'; toggleGraph.textContent='Graph View'; } });

  function drawGraph(){ var list = load().sort(function(a,b){ return new Date(a.ts)-new Date(b.ts); }); var labels = list.map(function(r){ return formatTs(r.ts); }); var values = list.map(function(r){ return Number(r.value) || 0; }); drawLine(chartCanvas, labels, values); }

  function drawLine(canvas, labels, values){ if(!canvas) return; var ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); var w=canvas.width, h=canvas.height; var max = Math.max.apply(null, values.concat([1])); ctx.strokeStyle='#2563eb'; ctx.lineWidth=2; ctx.beginPath(); values.forEach(function(v,i){ var x = 40 + (i*(w-60)/(values.length-1 || 1)); var y = (h-40) - ((v/max)*(h-60)); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }

  // init
  render();

})();
