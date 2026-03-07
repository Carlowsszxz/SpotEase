/* Resource list script: populate table, filters, search, and view details */
import { supabase } from './supabase-auth.js'
import { checkAuth } from './auth.js'

(async function(){
  // require auth
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;

  // ===== UX Helpers =====
  var loadingOverlay = document.getElementById('loadingOverlay');
  var statusBar = document.getElementById('statusBar');
  var retryBtn = document.getElementById('retryBtn');
  var lastUpdatedEl = document.getElementById('lastUpdated');
  
  function showLoading(){
    if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','false');
  }
  
  function hideLoading(){
    if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','true');
  }
  
  function setStatus(msg, isError){
    if(!statusBar) return;
    statusBar.textContent = msg || '';
    if(isError) { 
      statusBar.classList.add('error');
      if(retryBtn) retryBtn.style.display = 'inline-block';
    } else { 
      statusBar.classList.remove('error');
      if(retryBtn) retryBtn.style.display = 'none';
    }
  }
  
  // ===== End UX Helpers =====

  var resources = [];

  function mapType(rt){
    if(!rt) return 'other';
    rt = rt.toString().toLowerCase();
    if(rt.indexOf('parking') !== -1) return 'parking';
    if(rt.indexOf('seat') !== -1) return 'seat';
    if(rt.indexOf('room') !== -1 || rt.indexOf('meeting') !== -1) return 'room';
    return rt;
  }
  var tbody = document.getElementById('resourceTbody');
  var filterType = document.getElementById('filterType');
  var filterStatus = document.getElementById('filterStatus');
  var filterLocation = document.getElementById('filterLocation');
  var searchInput = document.getElementById('searchInput');
  var clearBtn = document.getElementById('clearFilters');

  function unique(values){ return values.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function populateFilters(){
    var types = unique(resources.map(function(r){return r.type || 'other';}));
    types.unshift('all');
    filterType.innerHTML = types.map(function(t){ return '<option value="'+t+'">'+(t==='all'? 'All types': t.charAt(0).toUpperCase()+t.slice(1))+'</option>'; }).join('');

    var statuses = unique(resources.map(function(r){return r.status;})); statuses.unshift('all');
    filterStatus.innerHTML = statuses.map(function(s){ return '<option value="'+s+'">'+(s==='all'? 'All status': s.charAt(0).toUpperCase()+s.slice(1))+'</option>'; }).join('');

    var locs = unique(resources.map(function(r){return r.location;})); locs.unshift('all');
    filterLocation.innerHTML = locs.map(function(l){ return '<option value="'+l+'">'+(l==='all'? 'All locations': l)+'</option>'; }).join('');
  }

  function statusClass(s){ if(s==='free') return 's-free'; if(s==='occupied') return 's-occupied'; if(s==='inactive') return 's-inactive'; return 's-pending'; }

  function renderTable(){
    // show loading placeholder if resources not yet loaded
    if(!resources){
      tbody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
      return;
    }

    var q = (searchInput && searchInput.value || '').toLowerCase();
    var t = filterType.value || 'all';
    var s = filterStatus.value || 'all';
    var l = filterLocation.value || 'all';

    var filtered = resources.filter(function(r){
      if(t!=='all' && r.type!==t) return false;
      if(s!=='all' && r.status!==s) return false;
      if(l!=='all' && r.location!==l) return false;
      if(q && !(r.name.toLowerCase().indexOf(q) > -1)) return false;
      return true;
    });

    tbody.innerHTML = '';
    filtered.forEach(function(r){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+r.name+'</td><td>'+r.type+'</td><td>'+r.location+'</td><td><span class="status-badge '+statusClass(r.status)+'">'+r.status.charAt(0).toUpperCase()+r.status.slice(1)+'</span></td>';
      var actions = document.createElement('td');
      var view = document.createElement('button'); view.className='action-btn action-view'; view.textContent='View';
      view.addEventListener('click', function(){ viewDetails(r); });
      actions.appendChild(view);
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
  }

  function viewDetails(r){
    // open map or details; simple behavior: open FrameMap and alert resource (demo)
    try{ window.open('FrameMap.html','_blank'); } catch(e){}
    setTimeout(function(){ alert(r.name + '\n' + r.type + ' • ' + r.location + '\nStatus: ' + r.status); }, 300);
  }

  if (clearBtn) clearBtn.addEventListener('click', function(){ if(searchInput) searchInput.value=''; if(filterType) filterType.value='all'; if(filterStatus) filterStatus.value='all'; if(filterLocation) filterLocation.value='all'; renderTable(); });
  [filterType,filterStatus,filterLocation,searchInput].forEach(function(el){ if(el) el.addEventListener('input', renderTable); });

  // Separate function to load resources with UX feedback
  async function loadResources() {
    showLoading();
    setStatus('Loading resources...', false);
    try {
      tbody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
      const { data, error } = await supabase.from('resources').select('*');
      if (!error && data) {
        // map DB rows to UI fields expected by the table
        resources = data.map(function(r){
          return {
            id: r.id,
            name: r.name || r.resource_name || '',
            type: mapType(r.resource_type || r.type),
            location: r.location || '',
            // determine status: prefer current_status, then reservation/occupancy, then is_active
            status: (r.current_status || r.reservation_status || r.occupancy_status) || (r.is_active===false ? 'inactive' : 'free')
          };
        });
        hideLoading();
        setStatus('', false);
        if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleTimeString();
      } else {
        resources = [];
        hideLoading();
        setStatus('Failed to load resources: ' + (error ? error.message : 'Unknown error'), true);
        console.warn('resourcelist fetch error', error);
      }
    } catch(e) { 
      resources = [];
      hideLoading();
      setStatus('Error loading resources: ' + (e.message || e), true);
      console.error('resourcelist error', e);
    }
    populateFilters();
    renderTable();
  }

  if(retryBtn) retryBtn.addEventListener('click', loadResources);

  // Initialize: load resources
  loadResources();

})();
