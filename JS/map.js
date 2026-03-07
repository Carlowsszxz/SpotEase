/* Interactive map/grid for resources */
import { checkAuth } from './auth.js'
import { supabase } from './supabase-auth.js'
import { openModal, closeModal, attachModalHandlers } from './modal-utils.js'
import { showLoading, hideLoading, setStatus, setButtonsDisabled } from './loading-utils.js'

(async function(){
  // redirect to login if not authenticated
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;
  
  // get current user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user ? user.id : null;
  
  // fetch resources from database
  var resources = [];
  var currentResource = null; // track resource being reserved
  
  // UI elements for loading state
  var loadingOverlay = document.getElementById('loadingOverlay');
  var statusBar = document.getElementById('statusBar');
  var retryBtn = document.getElementById('retryBtn');
  var lastUpdatedEl = document.getElementById('lastUpdated');
  var grid = document.getElementById('mapGrid');
  var filterType = document.getElementById('filterType');
  var filterLocation = document.getElementById('filterLocation');
  
  var actionButtons = [document.getElementById('reserveResource'), document.getElementById('viewSchedule'), document.getElementById('shareResource')];
  
  async function loadResources(){
    showLoading(loadingOverlay, grid, 'Loading resources...');
    setStatus('Loading resources...', false, statusBar, retryBtn);
    setButtonsDisabled(actionButtons, true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          resource_type,
          name,
          location,
          is_active
        `);
      
      if(error) {
        throw error;
      }
      
      if(!data || data.length === 0) {
        hideLoading(loadingOverlay);
        setStatus('No resources available', false, statusBar, retryBtn);
        setButtonsDisabled(actionButtons, false);
        if(grid) grid.innerHTML = '<p class="small-muted" style="padding:20px">No resources found.</p>';
        return;
      }
      
      // map database columns to UI format
      resources = (data || []).map(r => ({
        id: r.id,
        type: r.resource_type.includes('parking') ? 'parking' : 
              r.resource_type.includes('seat') ? 'seat' : 'room',
        name: r.name,
        location: r.location,
        status: 'free' // default; fetch occupancy separately if needed
      }));
      
      populateFilters();
      renderGrid();
      hideLoading(loadingOverlay);
      setButtonsDisabled(actionButtons, false);
      if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleString();
      setStatus('Resources loaded', false, statusBar, retryBtn);
    } catch(err) {
      hideLoading(loadingOverlay);
      setButtonsDisabled(actionButtons, false);
      setStatus('Failed to load resources: ' + (err.message || err), true, statusBar, retryBtn);
      if(grid) grid.innerHTML = '<p class="small-muted" style="padding:20px">Error loading resources.</p>';
    }
  }

  function populateFilters(){
    // extract unique types and locations from loaded resources
    var types = new Set();
    var locations = new Set();
    
    resources.forEach(function(r){
      types.add(r.type);
      locations.add(r.location);
    });
    
    // populate Type filter
    if(filterType){
      filterType.innerHTML = '<option value="all">All</option>';
      Array.from(types).sort().forEach(function(type){
        var opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        filterType.appendChild(opt);
      });
    }
    
    // populate Location filter
    if(filterLocation){
      filterLocation.innerHTML = '<option value="all">All</option>';
      Array.from(locations).sort().forEach(function(loc){
        var opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        filterLocation.appendChild(opt);
      });
    }
  }

  var detailPanel = document.getElementById('detailPanel');
  var modalOverlay = document.getElementById('modalOverlay');
  var reservationPanel = document.getElementById('reservationPanel');
  var reservationOverlay = document.getElementById('reservationOverlay');
  var reservationForm = document.getElementById('reservationForm');
  var reserveFromDate = document.getElementById('reserveFromDate');
  var reserveUntilDate = document.getElementById('reserveUntilDate');
  var reserveResourceName = document.getElementById('reserveResourceName');
  var detailName = document.getElementById('detailName');
  var detailType = document.getElementById('detailType');
  var detailLocation = document.getElementById('detailLocation');
  var statusBadge = document.getElementById('statusBadge');
  var detailUpdated = document.getElementById('detailUpdated');
  var detailAvailability = document.getElementById('detailAvailability');
  var reserveBtn = document.getElementById('reserveResource');
  var shareBtn = document.getElementById('shareResource');
  var scheduleBtn = document.getElementById('viewSchedule');
  var closeBtn = document.getElementById('closeDetail');
  var closeReservationBtn = document.getElementById('closeReservation');
  var cancelReservationBtn = document.getElementById('cancelReservation');

  function statusClass(s){
    if(s==='free') return 'status-free';
    if(s==='occupied') return 'status-occupied';
    return 'status-pending';
  }

  function renderGrid(){
    if(!grid) return;
    grid.innerHTML = '';
    var t = filterType ? filterType.value : 'all';
    var l = filterLocation ? filterLocation.value : 'all';

    var filtered = resources.filter(function(r){
      if(t!=='all' && r.type!==t) return false;
      if(l!=='all' && r.location!==l) return false;
      return true;
    });

    filtered.forEach(function(r){
      var card = document.createElement('div');
      card.className = 'resource-card';
      card.tabIndex = 0;
      card.setAttribute('data-id', r.id);

      var dot = document.createElement('div');
      dot.className = 'dot ' + (r.status==='free' ? 'free' : (r.status==='occupied'?'occupied':'pending'));

      var meta = document.createElement('div');
      meta.className = 'resource-meta';
      meta.innerHTML = '<div class="resource-name">'+r.name+'</div><div class="resource-sub">'+r.location+' • '+r.type+'</div>';

      var status = document.createElement('div');
      status.className = 'resource-status '+statusClass(r.status);
      status.textContent = r.status.charAt(0).toUpperCase()+r.status.slice(1);

      card.appendChild(dot);
      card.appendChild(meta);
      card.appendChild(status);

      card.addEventListener('click', function(){ showDetail(r); });
      card.addEventListener('keypress', function(e){ if(e.key==='Enter') showDetail(r); });

      grid.appendChild(card);
    });
  }

  function showDetail(r){
    if(!detailPanel) return;
    
    // populate header and info
    detailName.textContent = r.name;
    detailType.textContent = r.type.charAt(0).toUpperCase() + r.type.slice(1);
    detailLocation.textContent = r.location;
    
    // update status badge
    if(statusBadge){
      statusBadge.textContent = r.status.charAt(0).toUpperCase() + r.status.slice(1);
      statusBadge.className = 'status-badge status-' + r.status;
    }
    
    // set last updated time
    if(detailUpdated){
      detailUpdated.textContent = 'Just now';
    }
    
    // populate simple availability (demo: show free slots)
    if(detailAvailability){
      detailAvailability.innerHTML = '';
      if(r.status === 'free'){
        var availDiv = document.createElement('div');
        availDiv.className = 'availability-info';
        availDiv.innerHTML = '<p style="color: green; font-size: 0.9em;"><strong>✓ Available now</strong> – Next available for 2 hours</p>';
        detailAvailability.appendChild(availDiv);
      } else if(r.status === 'occupied'){
        var availDiv = document.createElement('div');
        availDiv.className = 'availability-info';
        availDiv.innerHTML = '<p style="color: orange; font-size: 0.9em;"><strong>⏱ In use</strong> – Available from 3:00 PM</p>';
        detailAvailability.appendChild(availDiv);
      }
    }
    
    openModal(detailPanel, modalOverlay);

    // attach action handlers
    if(reserveBtn){
      reserveBtn.onclick = function(){
        // navigate to reservation page with resource id
        window.location.href = 'FrameReservation.html?resource_id=' + encodeURIComponent(r.id);
      };
    }
    if(shareBtn){
      shareBtn.onclick = function(){
        if(navigator.share){
          navigator.share({ title: r.name, text: 'Check out ' + r.name + ' at ' + r.location });
        } else {
          alert('Share: ' + r.name);
        }
      };
    }
    if(scheduleBtn){
      scheduleBtn.onclick = function(){
        alert('Schedule for ' + r.name + ' – Feature coming soon');
      };
    }
  }

  function generateUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function openReservationModal(resource){
    if(!reservationPanel) return;
    
    // populate resource name
    if(reserveResourceName) reserveResourceName.textContent = resource.name;
    
    // set default dates (now + 1 hour)
    var now = new Date();
    var in1Hour = new Date(now.getTime() + 3600000);
    
    if(reserveFromDate){
      reserveFromDate.value = now.toISOString().slice(0, 16);
    }
    if(reserveUntilDate){
      reserveUntilDate.value = in1Hour.toISOString().slice(0, 16);
    }
    
    openModal(reservationPanel, reservationOverlay);
  }

  // handle reservation form submission
  if(reservationForm){
    reservationForm.addEventListener('submit', async function(e){
      e.preventDefault();
      
      if(!currentResource || !currentUserId){
        alert('Error: Missing resource or user info');
        return;
      }
      
      var fromDate = reserveFromDate ? reserveFromDate.value : null;
      var untilDate = reserveUntilDate ? reserveUntilDate.value : null;
      
      if(!fromDate || !untilDate){
        alert('Please fill in all required dates');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .insert([{
            id: generateUUID(),
            user_id: currentUserId,
            resource_id: currentResource.id,
            reserved_from: fromDate,
            reserved_until: untilDate,
            status: 'pending',
            created_at: new Date().toISOString()
          }]);
        
        if(error) throw error;
        
        alert('Reservation created successfully! Status: pending');
        closeModal(reservationPanel, reservationOverlay);
        reservationForm.reset();
      } catch(err){
        alert('Error creating reservation: ' + (err.message || err));
      }
    });
  }

  // close reservation modal handlers
  if(closeReservationBtn){
    closeReservationBtn.addEventListener('click', function(){
      closeModal(reservationPanel, reservationOverlay);
    });
  }
  
  if(cancelReservationBtn){
    cancelReservationBtn.addEventListener('click', function(){
      closeModal(reservationPanel, reservationOverlay);
      reservationForm.reset();
    });
  }
  
  if(reservationOverlay){
    reservationOverlay.addEventListener('click', function(){
      closeModal(reservationPanel, reservationOverlay);
    });
  }

  if(closeBtn){ closeBtn.addEventListener('click', function(){ 
    closeModal(detailPanel, modalOverlay);
  }); }
  
  // close panel when clicking overlay background
  if(modalOverlay){ modalOverlay.addEventListener('click', function(){ 
    closeModal(detailPanel, modalOverlay);
  }); }

  if(filterType) filterType.addEventListener('change', renderGrid);
  if(filterLocation) filterLocation.addEventListener('change', renderGrid);

  // wire retry button
  if(retryBtn) retryBtn.addEventListener('click', loadResources);

  // load resources and render
  await loadResources();

})();
