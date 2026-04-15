import { supabase } from './supabase-auth.js';
import {
  fetchAuditLogs,
  fetchUsersForAdminUi,
  fetchResourcesLookup,
  fetchOccupancyEvents,
  fetchSecurityEvents,
  fetchRfidScans
} from './services/admin-observability-data.js';

/* Audit logs viewer. Primary source is Supabase `audit_logs`, with localStorage fallback. */
(function(){
  var storageKey = 'pm_audit_logs';

  function load(){ try{ return JSON.parse(localStorage.getItem(storageKey) || '[]'); }catch(e){ return []; } }

  var logs = [];
  var tbody = document.getElementById('logsTbody');
  var filterSource = document.getElementById('filterSource');
  var filterAction = document.getElementById('filterAction');
  var filterUser = document.getElementById('filterUser');
  var filterResource = document.getElementById('filterResource');
  var filterFrom = document.getElementById('filterFrom');
  var filterTo = document.getElementById('filterTo');
  var filterKeyword = document.getElementById('filterKeyword');
  var clearBtn = document.getElementById('clearFilters');
  var prevPage = document.getElementById('prevPage');
  var nextPage = document.getElementById('nextPage');
  var pageInfo = document.getElementById('pageInfo');
  var pageSizeSel = document.getElementById('pageSize');

  var currentPage = 1; function pageSize(){ return parseInt(pageSizeSel.value,10) || 10; }

  function shortId(id){ return String(id || '').slice(0,8); }

  async function loadFromSupabase(){
    const [users, resources] = await Promise.all([
      fetchUsersForAdminUi(supabase),
      fetchResourcesLookup(supabase)
    ]);

    var userMap = {};
    (users || []).forEach(function(u){
      var nm = String((u && u.name) || '').trim();
      var em = String((u && u.email) || '').trim();
      userMap[u.id] = nm || em || ('User ' + shortId(u.id));
    });

    var resourceMap = {};
    (resources || []).forEach(function(r){
      var name = String((r && r.name) || '').trim();
      var location = String((r && r.location) || '').trim();
      resourceMap[r.id] = name ? (location ? (name + ' (' + location + ')') : name) : ('Resource ' + shortId(r.id));
    });

    const results = await Promise.allSettled([
      fetchAuditLogs(supabase, 1500),
      fetchSecurityEvents(supabase, 800),
      fetchOccupancyEvents(supabase, 1500),
      fetchRfidScans(supabase, 1500)
    ]);

    function listAt(idx){
      var entry = results[idx];
      if(entry && entry.status === 'fulfilled') return entry.value || [];
      return [];
    }

    var auditRows = listAt(0);
    var securityRows = listAt(1);
    var occupancyRows = listAt(2);
    var rfidRows = listAt(3);

    var timeline = (auditRows || []).map(function(row){
      return {
        source: 'audit',
        ts: row.timestamp || new Date().toISOString(),
        user: userMap[row.user_id] || ('User ' + shortId(row.user_id)),
        action: row.action || 'unknown',
        resource: resourceMap[row.resource_id] || (row.resource_id ? ('Resource ' + shortId(row.resource_id)) : ''),
        details: row.details || {}
      };
    });

    timeline = timeline.concat((securityRows || []).map(function(row){
      var evt = String(row.event_type || 'security_event');
      var sev = String(row.severity || 'medium');
      var st = String(row.status || 'open');
      return {
        source: 'security',
        ts: row.triggered_at || new Date().toISOString(),
        user: 'System',
        action: evt,
        resource: resourceMap[row.resource_id] || (row.resource_id ? ('Resource ' + shortId(row.resource_id)) : ''),
        details: Object.assign({ severity: sev, status: st }, row.details || {})
      };
    }));

    timeline = timeline.concat((occupancyRows || []).map(function(row){
      var change = Number(row.occupancy_change || 0);
      return {
        source: 'occupancy',
        ts: row.recorded_at || new Date().toISOString(),
        user: 'System',
        action: change > 0 ? 'occupancy_in' : 'occupancy_out',
        resource: resourceMap[row.resource_id] || (row.resource_id ? ('Resource ' + shortId(row.resource_id)) : ''),
        details: {
          occupancy_change: change,
          sensor_id: row.sensor_id || null
        }
      };
    }));

    timeline = timeline.concat((rfidRows || []).map(function(row){
      return {
        source: 'rfid',
        ts: row.scanned_at || new Date().toISOString(),
        user: userMap[row.user_id] || ('User ' + shortId(row.user_id)),
        action: 'rfid_tap',
        resource: resourceMap[row.resource_id] || (row.resource_id ? ('Resource ' + shortId(row.resource_id)) : ''),
        details: {
          user_id: row.user_id || null,
          resource_id: row.resource_id || null
        }
      };
    }));

    return timeline;
  }

  async function refreshData(){
    try {
      logs = await loadFromSupabase();
    } catch (err) {
      console.warn('Audit logs fallback to localStorage:', err);
      logs = load();
    }
    render();
  }

  function populateFilters(){
    var sources = unique(logs.map(function(l){return l.source || 'audit';})); sources.unshift('all');
    if(filterSource) filterSource.innerHTML = sources.map(function(s){ return '<option value="'+s+'">'+(s==='all'?'All':s)+'</option>'; }).join('');
    var actions = unique(logs.map(function(l){return l.action;})); actions.unshift('all');
    filterAction.innerHTML = actions.map(function(a){ return '<option value="'+a+'">'+(a==='all'?'All':a)+'</option>'}).join('');
    var users = unique(logs.map(function(l){return l.user;})); users.unshift('all'); filterUser.innerHTML = users.map(function(u){ return '<option value="'+u+'">'+(u==='all'?'All':u)+'</option>'}).join('');
    var resources = unique(logs.map(function(l){return l.resource||'';})).filter(Boolean); resources.unshift('all'); filterResource.innerHTML = resources.map(function(r){ return '<option value="'+r+'">'+(r==='all'?'All':r)+'</option>'}).join('');
  }

  function unique(arr){ return arr.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function render(){
    logs = (logs || []).slice().sort(function(a,b){ return new Date(b.ts) - new Date(a.ts); });
    populateFilters();
    var filtered = logs.filter(function(l){
      var src = (filterSource && filterSource.value) ? filterSource.value : 'all'; if(src!=='all' && (l.source||'')!==src) return false;
      var a = filterAction.value || 'all'; if(a!=='all' && l.action!==a) return false;
      var u = filterUser.value || 'all'; if(u!=='all' && l.user!==u) return false;
      var r = filterResource.value || 'all'; if(r!=='all' && (l.resource||'')!==r) return false;
      var k = (filterKeyword.value||'').toLowerCase(); if(k && JSON.stringify(l.details).toLowerCase().indexOf(k)===-1 && (l.user||'').toLowerCase().indexOf(k)===-1) return false;
      var from = filterFrom.value; var to = filterTo.value; if(from && new Date(l.ts) < new Date(from+'T00:00:00')) return false; if(to && new Date(l.ts) > new Date(to+'T23:59:59')) return false;
      return true;
    });

    var total = filtered.length; var ps = pageSize(); var pages = Math.max(1, Math.ceil(total/ps)); if(currentPage>pages) currentPage = pages;
    var start = (currentPage-1)*ps; var pageItems = filtered.slice(start, start+ps);

    tbody.innerHTML = '';
    pageItems.forEach(function(l,idx){
      var tr = document.createElement('tr');
      var source = String(l.source || 'audit').toLowerCase();
      tr.innerHTML = '<td>'+formatTs(l.ts)+'</td><td><span class="badge-source src-' + escapeHtml(source) + '">'+escapeHtml(source)+'</span></td><td>'+escapeHtml(l.user)+'</td><td>'+escapeHtml(l.action)+'</td><td>'+escapeHtml(l.resource||'')+'</td><td><button class="btn view-details">View</button></td>';
      tbody.appendChild(tr);
      // details row
      var dtr = document.createElement('tr'); dtr.className='details-row'; dtr.style.display='none'; var dtd = document.createElement('td'); dtd.colSpan=6; dtd.className='details-cell'; dtd.textContent = JSON.stringify(l.details, null, 2); dtr.appendChild(dtd); tbody.appendChild(dtr);
      tr.querySelector('.view-details').addEventListener('click', function(){ dtr.style.display = dtr.style.display==='none' ? 'table-row' : 'none'; });
    });

    pageInfo.textContent = 'Page '+currentPage+' of '+pages+' ('+total+' items)';
  }

  function formatTs(ts){ var d = new Date(ts); return d.toISOString().replace('T',' ').split('.')[0]; }
  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  clearBtn.addEventListener('click',function(){ if(filterSource) filterSource.value='all'; filterAction.value='all'; filterUser.value='all'; filterResource.value='all'; filterFrom.value=''; filterTo.value=''; filterKeyword.value=''; currentPage=1; render(); });
  [filterSource,filterAction,filterUser,filterResource,filterFrom,filterTo,filterKeyword,pageSizeSel].forEach(function(el){ if(el) el.addEventListener('input', function(){ currentPage=1; render(); }); });
  prevPage.addEventListener('click', function(){ if(currentPage>1){ currentPage--; render(); } }); nextPage.addEventListener('click', function(){ currentPage++; render(); });

  // init
  refreshData();

})();
