/* Resource list script: populate table, filters, search, and view details */
import { supabase } from './supabase-auth.js'

(async function(){
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
  var sortBy = document.getElementById('sortBy');
  var searchInput = document.getElementById('searchInput');
  var clearBtn = document.getElementById('clearFilters');
  var sumTotal = document.getElementById('sumTotal');
  var sumAvailable = document.getElementById('sumAvailable');
  var sumOccupied = document.getElementById('sumOccupied');

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

  function deriveStatus(resource){
    if(!resource) return 'inactive';
    if(resource.is_active === false) return 'inactive';
    var cap = Number(resource.capacity || 0);
    var occ = Number(resource.current_occupancy || 0);
    if(cap > 0 && occ >= cap) return 'occupied';
    var fallback = (resource.current_status || resource.reservation_status || resource.occupancy_status || '').toString().toLowerCase();
    if(fallback === 'inactive') return 'inactive';
    if(fallback === 'occupied' || fallback === 'full') return 'occupied';
    return 'free';
  }

  function updateSummary(items){
    var list = items || [];
    var total = list.length;
    var available = list.filter(function(r){ return r.status === 'free'; }).length;
    var occupied = list.filter(function(r){ return r.status === 'occupied'; }).length;
    if(sumTotal) sumTotal.textContent = String(total);
    if(sumAvailable) sumAvailable.textContent = String(available);
    if(sumOccupied) sumOccupied.textContent = String(occupied);
  }

  function applySort(list){
    var mode = (sortBy && sortBy.value) ? sortBy.value : 'name-asc';
    var arr = (list || []).slice();
    arr.sort(function(a,b){
      if(mode === 'name-desc') return String(b.name || '').localeCompare(String(a.name || ''), undefined, { sensitivity: 'base' });
      if(mode === 'capacity-desc') return Number(b.capacity || 0) - Number(a.capacity || 0);
      if(mode === 'available-first'){
        var ar = a.status === 'free' ? 0 : (a.status === 'occupied' ? 1 : 2);
        var br = b.status === 'free' ? 0 : (b.status === 'occupied' ? 1 : 2);
        if(ar !== br) return ar - br;
      }
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
    });
    return arr;
  }

  function renderTable(){
    // show loading placeholder if resources not yet loaded
    if(!resources){
      tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
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
      if(q){
        var haystack = [r.name, r.type, r.location, r.status].join(' ').toLowerCase();
        if(haystack.indexOf(q) === -1) return false;
      }
      return true;
    });

    filtered = applySort(filtered);
    updateSummary(filtered);

    tbody.innerHTML = '';
    filtered.forEach(function(r){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+r.name+'</td><td>'+r.type+'</td><td>'+r.location+'</td><td>'+(r.capacity || '—')+'</td><td><span class="status-badge '+statusClass(r.status)+'">'+r.status.charAt(0).toUpperCase()+r.status.slice(1)+'</span></td>';
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

  if (clearBtn) clearBtn.addEventListener('click', function(){ if(searchInput) searchInput.value=''; if(filterType) filterType.value='all'; if(filterStatus) filterStatus.value='all'; if(filterLocation) filterLocation.value='all'; if(sortBy) sortBy.value='name-asc'; renderTable(); });
  [filterType,filterStatus,filterLocation,searchInput,sortBy].forEach(function(el){ if(el) el.addEventListener('input', renderTable); });

  // Separate function to load resources with UX feedback
  async function loadResources() {
    showLoading();
    setStatus('Loading resources...', false);
    try {
      tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
      const { data, error } = await supabase.from('resources').select('*').eq('is_active', true);
      if (!error && data) {
        // map DB rows to UI fields expected by the table
        resources = data.map(function(r){
          return {
            id: r.id,
            name: r.name || r.resource_name || '',
            type: mapType(r.resource_type || r.type),
            location: r.location || '',
            capacity: r.capacity || 1,
            current_occupancy: r.current_occupancy || 0,
            is_active: r.is_active,
            status: deriveStatus(r)
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
