// Reservation form behavior and Supabase integration
import { checkAuth } from './auth.js'
import { supabase } from './supabase-auth.js'

(async function(){
  // ensure user is authenticated before allowing reservations
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;
  
  // ===== UX Helpers =====
  var loadingOverlay = document.getElementById('loadingOverlay');
  var statusBar = document.getElementById('statusBar');
  var retryBtn = document.getElementById('retryBtn');
  var lastUpdatedEl = document.getElementById('lastUpdated');
  var checkBtn = document.getElementById('checkAvailability');
  var form = document.getElementById('reservationForm');
  var statusArea = document.getElementById('statusArea');
  
  function setButtonsDisabled(v){
    if(checkBtn) { checkBtn.disabled = !!v; checkBtn.setAttribute('aria-busy', !!v); }
    if(form) { 
      var submitBtn = form.querySelector('button[type="submit"]');
      if(submitBtn) { submitBtn.disabled = !!v; submitBtn.setAttribute('aria-busy', !!v); }
    }
  }
  
  function showLoading(){
    if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','false');
    setButtonsDisabled(true);
  }
  
  function hideLoading(){
    if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','true');
    setButtonsDisabled(false);
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
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user ? user.id : null;
  
  if (!currentUserId) {
    console.error('No user found');
    return;
  }
  
  var resources = [];
  
  // Check for existing active reservations for a specific resource type
  async function checkExistingReservationByType(resourceType) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, reserved_from, reserved_until, status, resource_id, resources(resource_type)')
        .eq('user_id', currentUserId)
        .in('status', ['pending', 'confirmed', 'approved']);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Find a reservation for the same resource type
        const existingOfType = data.find(res => {
          const resType = res.resources?.resource_type || '';
          const typeMatch = resourceType.includes('parking') ? resType.includes('parking') : 
                           resourceType.includes('seat') ? resType.includes('seat') : 
                           resType.includes('room');
          return typeMatch;
        });
        return existingOfType || null;
      }
      return null;
    } catch (err) {
      console.error('Error checking existing reservations:', err);
      return null;
    }
  }
  
  // Load resources from Supabase
  async function loadResources() {
    showLoading();
    setStatus('Loading resources...', false);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id, resource_type, name, location, is_active');
      
      if (error) throw error;
      
      resources = (data || []).map(r => ({
        id: r.id,
        type: r.resource_type.includes('parking') ? 'parking' : 
              r.resource_type.includes('seat') ? 'seat' : 'room',
        name: r.name,
        location: r.location,
        is_active: r.is_active,
        status: r.is_active ? 'free' : 'occupied'
      }));
      
      hideLoading();
      setStatus('', false);
      if(lastUpdatedEl) lastUpdatedEl.textContent = 'Resources loaded: ' + new Date().toLocaleTimeString();
      return resources;
    } catch (err) {
      hideLoading();
      setStatus('Failed to load resources: ' + (err.message || err), true);
      console.error('Error loading resources:', err);
      return [];
    }
  }

  var resType = document.getElementById('resType');
  var resSelect = document.getElementById('resSelect');
  var resTime = document.getElementById('resTime');
  
  // Resource details panel elements
  var resourceDetails = document.getElementById('resourceDetails');
  var detailResourceName = document.getElementById('detailResourceName');
  var detailResourceType = document.getElementById('detailResourceType');
  var detailResourceLocation = document.getElementById('detailResourceLocation');
  var detailStatusBadge = document.getElementById('detailStatusBadge');

  function populateResources(){
    var t = resType.value;
    resSelect.innerHTML = '';
    resources.filter(function(r){return r.type===t}).forEach(function(r){
      var opt = document.createElement('option'); opt.value = r.id; opt.textContent = r.name +' — '+ r.location; resSelect.appendChild(opt);
    });
    // Show details for the first resource after populating
    if(resources.filter(function(r){return r.type===t}).length > 0){
      showResourceDetails(resources.filter(function(r){return r.type===t})[0]);
    }
  }

  function getResourceById(id){ return resources.find(function(r){return String(r.id)===String(id);}); }

  function showResourceDetails(resource){
    if(!resource || !resourceDetails) return;
    detailResourceName.textContent = resource.name;
    detailResourceType.textContent = resource.type.charAt(0).toUpperCase() + resource.type.slice(1);
    detailResourceLocation.textContent = resource.location;
    
    // Update status badge
    if(detailStatusBadge){
      detailStatusBadge.textContent = resource.status.charAt(0).toUpperCase() + resource.status.slice(1);
      detailStatusBadge.className = 'status-badge status-' + resource.status;
    }
    
    resourceDetails.style.display = 'block';
  }

  function checkAvailability(){
    statusArea.className = 'status-area';
    var id = resSelect.value; var time = resTime.value;
    if(!id || !time){ statusArea.textContent = 'Please select resource and time.'; return {ok:false,reason:'incomplete'} }
    var r = getResourceById(id);
    if(!r){ statusArea.textContent = 'Resource not found.'; return {ok:false,reason:'notfound'} }

    // Check if time slot is available
    if(r.status==='occupied'){
      // Find available alternatives of the same type and location
      var sameTypeLocation = resources.filter(function(res){ 
        return res.type === r.type && res.location === r.location && res.status === 'free'; 
      });
      
      var errorMsg = '<div class="status-error"><strong>' + r.name + ' is occupied.</strong><br>';
      
      if(sameTypeLocation.length > 0){
        errorMsg += 'Available alternatives:<br><ul style="margin:8px 0;padding-left:20px;">';
        sameTypeLocation.slice(0, 5).forEach(function(alt){
          errorMsg += '<li>' + alt.name + '</li>';
        });
        if(sameTypeLocation.length > 5) errorMsg += '<li>... and ' + (sameTypeLocation.length - 5) + ' more</li>';
        errorMsg += '</ul>';
      } else {
        errorMsg += 'Sorry, all ' + r.type + 's in ' + r.location + ' are currently full.';
      }
      
      errorMsg += '</div>';
      statusArea.innerHTML = errorMsg;
      return {ok:false,reason:'occupied'};
    }
    if(r.status==='pending'){
      statusArea.innerHTML = '<div class="status-warning">Status pending — reservation may be tentative. Try another time or confirm.</div>';
      return {ok:true,warning:true};
    }

    statusArea.innerHTML = '<div class="status-success">Available — you can reserve this resource.</div>';
    return {ok:true};
  }

  function generateUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatDateTime(dateStr, timeStr){
    // Convert "2026-03-05" and "10:26" to "2026-03-05 10:26:00"
    return dateStr + ' ' + timeStr + ':00';
  }

  // live update when user changes time or resource
  ['change','input'].forEach(function(ev){
    resSelect.addEventListener(ev, function(){ 
      var resource = getResourceById(resSelect.value);
      if(resource) showResourceDetails(resource);
      if(resTime.value) checkAvailability(); 
    });
    resTime.addEventListener(ev, function(){ if(resSelect.value) checkAvailability(); });
  });

  if(resType) resType.addEventListener('change', async function(){
    populateResources();
    // Check if user already has a reservation for this type
    const existingReservation = await checkExistingReservationByType(resType.value);
    if (existingReservation) {
      const typeLabel = resType.value.charAt(0).toUpperCase() + resType.value.slice(1);
      statusArea.innerHTML = '<div class="status-warning">You already have an active ' + typeLabel.toLowerCase() + ' reservation. You can replace it by making a new reservation.</div>';
      statusArea.className = 'status-area warning';
    } else {
      statusArea.innerHTML = '';
      statusArea.className = 'status-area';
    }
  });
  if(checkBtn) checkBtn.addEventListener('click', checkAvailability);
  if(retryBtn) retryBtn.addEventListener('click', loadResources);

  if(form) form.addEventListener('submit', async function(e){
    e.preventDefault();
    var result = checkAvailability();
    if(!result.ok){ return; }

    try {
      // Check for existing active reservations for this resource type
      const selectedResourceType = resType.value;
      const existingReservation = await checkExistingReservationByType(selectedResourceType);
      if (existingReservation) {
        const typeLabel = selectedResourceType.charAt(0).toUpperCase() + selectedResourceType.slice(1);
        statusArea.innerHTML = '<div class="status-error">You already have an active reservation for ' + typeLabel + 's. You can only have one ' + typeLabel.toLowerCase() + ' reservation at a time. Please cancel it or wait until it expires.</div>';
        return;
      }
      
      var sel = getResourceById(resSelect.value);
      var timeStr = resTime.value;
      
      // Use today's date
      var today = new Date();
      var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      
      // Create from and until timestamps (1 hour duration)
      var fromDate = new Date(dateStr + 'T' + timeStr + ':00');
      var untilDate = new Date(fromDate.getTime() + 3600000); // +1 hour
      
      var fromISO = dateStr + ' ' + timeStr + ':00';
      var untilISO = untilDate.getFullYear() + '-' + 
                     String(untilDate.getMonth() + 1).padStart(2, '0') + '-' +
                     String(untilDate.getDate()).padStart(2, '0') + ' ' +
                     String(untilDate.getHours()).padStart(2, '0') + ':' +
                     String(untilDate.getMinutes()).padStart(2, '0') + ':00';
      
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          id: generateUUID(),
          user_id: currentUserId,
          resource_id: sel.id,
          reserved_from: fromISO,
          reserved_until: untilISO,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      
      if(error) throw error;
      
      statusArea.innerHTML = '<div class="status-success">Reservation confirmed for '+sel.name+' today at '+timeStr+'. Redirecting to my reservations…</div>';
      setTimeout(function(){ window.location.href = 'FrameMyReservations.html'; }, 1200);
    } catch(err){
      statusArea.innerHTML = '<div class="status-error">Error creating reservation: ' + (err.message || err) + '</div>';
      console.error('Reservation error:', err);
    }
  });

  // Check if resource_id is provided in URL query params and pre-select it
  var urlParams = new URLSearchParams(window.location.search);
  var resourceIdParam = urlParams.get('resource_id');

  // Initialize: load resources, then populate form
  (async function init(){
    await loadResources();
    
    if(resType) populateResources();
    
    // Pre-select resource if resource_id was passed
    if(resourceIdParam && resources.length > 0){
      var preSelectedResource = getResourceById(resourceIdParam);
      if(preSelectedResource){
        // Set the type dropdown first
        resType.value = preSelectedResource.type;
        populateResources();
        // Then set the resource selection
        resSelect.value = resourceIdParam;
        // Show details for pre-selected resource
        showResourceDetails(preSelectedResource);
        
        // Check if there's a conflict with this specific type
        const existingReservation = await checkExistingReservationByType(preSelectedResource.type);
        if (existingReservation) {
          const typeLabel = preSelectedResource.type.charAt(0).toUpperCase() + preSelectedResource.type.slice(1);
          statusArea.innerHTML = '<div class="status-warning">You already have an active ' + typeLabel.toLowerCase() + ' reservation. Submitting this form will cancel the previous one.</div>';
        }
      }
    }
  })();
})();
