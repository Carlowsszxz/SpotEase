/* Admin panel: manage resources from Supabase, view reservations */
import { supabase } from './supabase-auth.js'
import { openModal as openModalUtil, closeModal as closeModalUtil, attachModalHandlers } from './modal-utils.js'
import {
  fetchUsersForAdminUi,
  assignRfidTagToUser,
  fetchSecurityEvents,
  updateSecurityEventStatus,
  fetchResources,
  deleteResourceById,
  updateResourceById,
  createResource,
  fetchReservations,
  updateReservationStatus as updateReservationStatusData,
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncementById
} from './services/adminpanel-data.js'

(async function adminPanel(){
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    var tableBody = document.querySelector('#resourceTable tbody');
    var searchInput = document.getElementById('searchResource');
    var addBtn = document.getElementById('addResource');

    var modal = document.getElementById('resourceModal');
    var modalOverlay = document.getElementById('resourceOverlay');
    var closeModalBtn = document.getElementById('closeModal');
    var modalTitle = document.getElementById('modalTitle');
    var modalName = document.getElementById('modalName');
    var modalType = document.getElementById('modalType');
    var modalTypeCustom = document.getElementById('modalTypeCustom');
    var modalLocation = document.getElementById('modalLocation');
    var modalCapacity = document.getElementById('modalCapacity');
    var modalStatus = document.getElementById('modalStatus');
    var saveResource = document.getElementById('saveResource');

    var sensorList = document.getElementById('sensorList');
    var reservationsTable = document.getElementById('reservationsTable');
    var reservationsTableBody = reservationsTable ? reservationsTable.querySelector('tbody') : null;
    var noReservations = document.getElementById('noReservations');
    var resFilterStatus = document.getElementById('resFilterStatus');
    var totalResCount = document.getElementById('totalResCount');
    var pendingResCount = document.getElementById('pendingResCount');
    var confirmedResCount = document.getElementById('confirmedResCount');
    var cancelledResCount = document.getElementById('cancelledResCount');
    var logoutBtn = document.getElementById('logoutBtn');

    var securityEventsList = document.getElementById('securityEventsList');
    var noSecurityEvents = document.getElementById('noSecurityEvents');

    var rfidUserSelect = document.getElementById('rfidUserSelect');
    var rfidUidInput = document.getElementById('rfidUidInput');
    var rfidTagNameInput = document.getElementById('rfidTagNameInput');
    var assignRfidBtn = document.getElementById('assignRfidBtn');
    var rfidAssignStatus = document.getElementById('rfidAssignStatus');

    var notifTitle = document.getElementById('notifTitle');
    var notifMessage = document.getElementById('notifMessage');
    var notifStartAt = document.getElementById('notifStartAt');
    var notifEndAt = document.getElementById('notifEndAt');
    var notifIsActive = document.getElementById('notifIsActive');
    var notifAddBtn = document.getElementById('notifAddBtn');
    var notifList = document.getElementById('notifList');
    var noNotifs = document.getElementById('noNotifs');
    var notifStatus = document.getElementById('notifStatus');

    var resources = [];
    var editingId = null;
    var allReservations = [];
    var filteredReservations = [];
    var announcements = [];

    function escapeHtml(s){
      return String(s == null ? '' : s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
    }

    function formatWhen(ts){
      if(!ts) return '';
      var d = new Date(ts);
      if(isNaN(d.getTime())) return '';
      return d.toLocaleString();
    }

    function severityBadge(sev){
      var s = String(sev || '').toLowerCase();
      if(s === 'high') return 's-confirmed';
      if(s === 'medium') return 's-pending';
      return 's-cancelled';
    }

    function setRfidStatus(msg, isError){
      if(!rfidAssignStatus) return;
      var text = (msg == null) ? '' : String(msg);
      var trimmed = text.trim();
      if(!trimmed){
        rfidAssignStatus.style.display = 'none';
        rfidAssignStatus.textContent = '';
        return;
      }
      rfidAssignStatus.style.display = 'block';
      rfidAssignStatus.textContent = trimmed;
      rfidAssignStatus.classList.toggle('error', !!isError);
    }

    function setNotifStatus(msg, isError){
      if(!notifStatus) return;
      var text = (msg == null) ? '' : String(msg);
      var trimmed = text.trim();
      if(!trimmed){
        notifStatus.style.display = 'none';
        notifStatus.textContent = '';
        notifStatus.classList.remove('error');
        return;
      }
      notifStatus.style.display = 'block';
      notifStatus.textContent = trimmed;
      notifStatus.classList.toggle('error', !!isError);
    }

    function toIsoFromLocalDateTime(localValue){
      if(!localValue) return null;
      var d = new Date(localValue);
      if(isNaN(d.getTime())) return null;
      return d.toISOString();
    }

    function formatRange(startAt, endAt){
      var from = formatWhen(startAt);
      var until = formatWhen(endAt);
      if(from && until) return from + ' → ' + until;
      if(from) return 'Starts: ' + from;
      if(until) return 'Until: ' + until;
      return 'Always visible while active';
    }

    function renderAnnouncements(){
      if(!notifList) return;
      notifList.innerHTML = '';

      if(!announcements || announcements.length === 0){
        if(noNotifs) noNotifs.style.display = 'block';
        return;
      }

      if(noNotifs) noNotifs.style.display = 'none';

      announcements.forEach(function(item){
        var li = document.createElement('li');

        var left = document.createElement('div');
        var title = item.title ? '<strong>' + escapeHtml(item.title) + '</strong>' : '<strong>Notice</strong>';
        var msg = item.message ? '<div>' + escapeHtml(item.message) + '</div>' : '';
        var meta = '<div class="meta">' + escapeHtml(formatRange(item.start_at, item.end_at)) + '</div>';
        left.innerHTML = title + msg + meta;

        var right = document.createElement('div');
        var activeBadge = document.createElement('span');
        activeBadge.className = 'badge ' + (item.is_active ? 's-confirmed' : 's-cancelled');
        activeBadge.textContent = item.is_active ? 'active' : 'inactive';

        var delBtn = document.createElement('button');
        delBtn.className = 'action-btn';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', function(){ deleteAnnouncement(item.id); });

        right.appendChild(activeBadge);
        right.appendChild(delBtn);
        li.appendChild(left);
        li.appendChild(right);
        notifList.appendChild(li);
      });
    }

    async function loadAnnouncements(){
      if(!notifList) return;
      try{
        announcements = await fetchAnnouncements(supabase, 30);
        renderAnnouncements();
      }catch(err){
        console.error('Failed to load announcements', err);
        announcements = [];
        renderAnnouncements();
        setNotifStatus('Unable to load notifications: ' + (err.message || err), true);
      }
    }

    async function addAnnouncement(){
      if(!notifTitle || !notifMessage || !notifAddBtn) return;
      var titleVal = String(notifTitle.value || '').trim();
      var messageVal = String(notifMessage.value || '').trim();
      var startAtIso = toIsoFromLocalDateTime(notifStartAt ? notifStartAt.value : '');
      var endAtIso = toIsoFromLocalDateTime(notifEndAt ? notifEndAt.value : '');
      var isActive = !!(notifIsActive && notifIsActive.checked);

      if(!titleVal){
        setNotifStatus('Title is required.', true);
        return;
      }
      if(!messageVal){
        setNotifStatus('Message is required.', true);
        return;
      }
      if(startAtIso && endAtIso && new Date(endAtIso).getTime() < new Date(startAtIso).getTime()){
        setNotifStatus('End time must be after start time.', true);
        return;
      }

      notifAddBtn.disabled = true;
      notifAddBtn.setAttribute('aria-busy', 'true');
      setNotifStatus('Posting notification...', false);

      try{
        await createAnnouncement(supabase, {
          title: titleVal,
          message: messageVal,
          start_at: startAtIso,
          end_at: endAtIso,
          is_active: isActive,
          created_by: user.id
        });

        notifTitle.value = '';
        notifMessage.value = '';
        if(notifStartAt) notifStartAt.value = '';
        if(notifEndAt) notifEndAt.value = '';
        if(notifIsActive) notifIsActive.checked = true;

        setNotifStatus('Notification posted.', false);
        await loadAnnouncements();
      }catch(err){
        console.error('Failed to add announcement', err);
        setNotifStatus('Failed to post notification: ' + (err.message || err), true);
      }finally{
        notifAddBtn.disabled = false;
        notifAddBtn.removeAttribute('aria-busy');
      }
    }

    async function deleteAnnouncement(id){
      if(!id) return;
      if(!confirm('Delete this notification?')) return;

      try{
        await deleteAnnouncementById(supabase, id);
        setNotifStatus('Notification deleted.', false);
        await loadAnnouncements();
      }catch(err){
        console.error('Failed to delete announcement', err);
        setNotifStatus('Failed to delete notification: ' + (err.message || err), true);
      }
    }

    async function loadUsersForRfid(){
      if(!rfidUserSelect) return;
      try{
        const users = await fetchUsersForAdminUi(supabase);

        // Keep the placeholder option
        rfidUserSelect.innerHTML = '<option value="">Select a user...</option>';
        (users || []).forEach(function(u){
          var opt = document.createElement('option');
          opt.value = u.id;
          var nm = (u.name && String(u.name).trim()) ? String(u.name).trim() : '';
          var em = (u.email && String(u.email).trim()) ? String(u.email).trim() : '';
          opt.textContent = nm ? (nm + (em ? ' (' + em + ')' : '')) : (em || u.id);
          rfidUserSelect.appendChild(opt);
        });
        setRfidStatus('', false);
      }catch(err){
        console.warn('Failed to load users for RFID assignment', err);
        setRfidStatus('Cannot load users for RFID assignment. Check users RLS/policies.', true);
      }
    }

    async function assignRfidToUser(){
      if(!assignRfidBtn || !rfidUserSelect || !rfidUidInput) return;

      var userId = String(rfidUserSelect.value || '').trim();
      var uid = String(rfidUidInput.value || '').trim();
      var tagName = rfidTagNameInput ? String(rfidTagNameInput.value || '').trim() : '';

      if(!userId){
        setRfidStatus('Select a user first.', true);
        return;
      }
      if(!uid){
        setRfidStatus('Enter a UID first (e.g. A4845B82).', true);
        return;
      }

      assignRfidBtn.disabled = true;
      assignRfidBtn.setAttribute('aria-busy', 'true');
      setRfidStatus('Assigning...', false);

      try{
        await assignRfidTagToUser(supabase, userId, uid, tagName);

        setRfidStatus('RFID tag assigned.', false);
        rfidUidInput.value = '';
        if(rfidTagNameInput) rfidTagNameInput.value = '';
      }catch(err){
        console.error('RFID assign failed', err);
        if(err && err.code === 'PGRST202'){
          setRfidStatus(
            'Assign failed: missing RPC admin_assign_rfid_tag(). Run the Supabase migration Others/database/migrations/010_admin_assign_rfid.sql, then refresh the API schema cache (Supabase Dashboard → Settings → API → Reload schema) and try again.',
            true
          );
        }else{
          setRfidStatus('Assign failed: ' + (err.message || err), true);
        }
      }finally{
        assignRfidBtn.disabled = false;
        assignRfidBtn.removeAttribute('aria-busy');
      }
    }

    function statusBadge(st){
      var s = String(st || '').toLowerCase();
      if(s === 'open') return 's-pending';
      if(s === 'ack') return 's-confirmed';
      return 's-cancelled';
    }

    async function loadSecurityEvents(){
      if(!securityEventsList) return;

      try{
        const data = await fetchSecurityEvents(supabase, 15);

        // Attach resource info client-side (does not require FK constraints in PostgREST).
        var resourceMap = {};
        (resources || []).forEach(function(r){
          resourceMap[r.id] = { name: r.name, location: r.location };
        });

        var enriched = (data || []).map(function(ev){
          var res = resourceMap[ev.resource_id];
          return {
            ...ev,
            resources: res ? res : null
          };
        });

        renderSecurityEvents(enriched);
      }catch(err){
        console.warn('Security events not available:', err);
        securityEventsList.innerHTML = '';
        if(noSecurityEvents){
          noSecurityEvents.style.display = 'block';
          noSecurityEvents.textContent = 'Security events are not configured yet (missing database table/policies).';
        }
      }
    }

    function renderSecurityEvents(items){
      if(!securityEventsList) return;
      securityEventsList.innerHTML = '';

      if(!items || items.length === 0){
        if(noSecurityEvents){
          noSecurityEvents.style.display = 'block';
          noSecurityEvents.textContent = 'No after-hours events.';
        }
        return;
      }

      if(noSecurityEvents) noSecurityEvents.style.display = 'none';

      // Show open/ack first
      var sorted = items.slice().sort(function(a,b){
        var ar = (String(a.status||'').toLowerCase() === 'open') ? 0 : (String(a.status||'').toLowerCase() === 'ack' ? 1 : 2);
        var br = (String(b.status||'').toLowerCase() === 'open') ? 0 : (String(b.status||'').toLowerCase() === 'ack' ? 1 : 2);
        if(ar !== br) return ar - br;
        return new Date(b.triggered_at || 0) - new Date(a.triggered_at || 0);
      });

      sorted.forEach(function(ev){
        var li = document.createElement('li');

        var left = document.createElement('div');
        var resName = ev.resources && ev.resources.name ? ev.resources.name : (ev.resource_id || 'Unknown space');
        var loc = ev.resources && ev.resources.location ? ev.resources.location : '';

        left.innerHTML = '<strong>' + escapeHtml(resName) + '</strong>'
          + (loc ? '<div class="security-meta">' + escapeHtml(loc) + '</div>' : '')
          + '<div class="security-meta">' + escapeHtml(formatWhen(ev.triggered_at)) + '</div>';

        var right = document.createElement('div');

        var badges = document.createElement('div');
        badges.className = 'security-badges';
        badges.innerHTML =
          '<span class="badge ' + severityBadge(ev.severity) + '">' + escapeHtml(ev.severity || 'medium') + '</span>' +
          '<span class="badge ' + statusBadge(ev.status) + '">' + escapeHtml(ev.status || 'open') + '</span>';
        right.appendChild(badges);

        var actions = document.createElement('div');
        actions.className = 'security-actions';

        var st = String(ev.status || 'open').toLowerCase();
        if(st !== 'resolved'){
          var ackBtn = document.createElement('button');
          ackBtn.className = 'action-btn';
          ackBtn.textContent = (st === 'ack') ? 'Acknowledged' : 'Acknowledge';
          ackBtn.disabled = (st === 'ack');
          ackBtn.addEventListener('click', function(){ updateSecurityEventStatus(ev.id, 'ack'); });

          var resBtn = document.createElement('button');
          resBtn.className = 'action-btn';
          resBtn.textContent = 'Resolve';
          resBtn.addEventListener('click', function(){ updateSecurityEventStatus(ev.id, 'resolved'); });

          actions.appendChild(ackBtn);
          actions.appendChild(resBtn);
        }

        right.appendChild(actions);

        li.appendChild(left);
        li.appendChild(right);
        securityEventsList.appendChild(li);
      });
    }

    async function updateSecurityEventStatus(id, status){
      try{
        await updateSecurityEventStatus(supabase, id, status);
        loadSecurityEvents();
      }catch(err){
        console.error('Failed to update security event', err);
        alert('Failed to update event: ' + (err.message || err));
      }
    }

    // Load all resources from Supabase
    async function loadResources(){
      try {
        resources = await fetchResources(supabase);
        renderTable();
        renderSensors();
      } catch (err) {
        console.error('Error loading resources:', err);
        alert('Failed to load resources: ' + err.message);
      }
    }

    // Render resources table
    function renderTable(){
      if (!tableBody) return;
      tableBody.innerHTML = '';
      
      resources.forEach(function(r){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'+r.name+'</td><td>'+r.resource_type+'</td><td>'+r.location+'</td><td>'+(r.capacity || 1)+'</td><td><span class="badge s-'+(r.is_active?'free':'occupied')+'">'+(r.is_active?'Active':'Inactive')+'</span></td>';
        var actionsTd = document.createElement('td');
        
        var edit = document.createElement('button');
        edit.className = 'action-btn';
        edit.textContent = 'Edit';
        edit.addEventListener('click', function(){ openModal(r); });
        
        var del = document.createElement('button');
        del.className = 'action-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', function(){ 
          if(confirm('Delete "'+r.name+'"?')){ 
            deleteResource(r.id);
          }
        });
        
        actionsTd.appendChild(edit);
        actionsTd.appendChild(del);
        tr.appendChild(actionsTd);
        tableBody.appendChild(tr);
      });
    }

    // Delete resource from Supabase
    async function deleteResource(id){
      try {
        await deleteResourceById(supabase, id);
        loadResources();
      } catch (err) {
        console.error('Error deleting resource:', err);
        alert('Failed to delete: ' + err.message);
      }
    }

    // Open add/edit modal
    function openModal(r){
      editingId = r ? r.id : null;
      modalTitle.textContent = r ? 'Edit Resource' : 'Add Resource';
      modalName.value = r ? r.name : '';
      
      // Handle type: standard or custom
      var resourceType = r ? r.resource_type : 'parking';
      var standardTypes = ['parking', 'seat', 'room'];
      if (standardTypes.includes(resourceType)) {
        modalType.value = resourceType;
        modalTypeCustom.style.display = 'none';
        modalTypeCustom.value = '';
      } else {
        modalType.value = 'other';
        modalTypeCustom.value = resourceType;
        modalTypeCustom.style.display = 'block';
      }
      
      modalLocation.value = r ? r.location : '';
      modalCapacity.value = r ? (r.capacity || 1) : 1;
      modalStatus.checked = r ? r.is_active : true;
      openModalUtil(modal, modalOverlay);
    }

    function closeModal(){
      closeModalUtil(modal, modalOverlay);
      editingId = null;
    }

    // Save resource (add or update)
    saveResource.addEventListener('click', async function(){
      var name = modalName.value.trim();
      var type = modalType.value === 'other' ? modalTypeCustom.value.trim() : modalType.value;
      var location = modalLocation.value.trim();
      var capacity = parseInt(modalCapacity.value) || 1;
      var isActive = modalStatus.checked;

      if (!name || !location) {
        alert('Name and location required');
        return;
      }

      if (modalType.value === 'other' && !type) {
        alert('Please enter a custom type');
        return;
      }

      try {
        if (editingId) {
          await updateResourceById(supabase, editingId, {
            name: name,
            resource_type: type,
            location: location,
            capacity: capacity,
            is_active: isActive
          });
        } else {
          const newId = crypto.randomUUID();
          await createResource(supabase, {
            id: newId,
            name: name,
            resource_type: type,
            location: location,
            capacity: capacity,
            is_active: isActive
          });
        }
        
        loadResources();
        closeModal();
      } catch (err) {
        console.error('Error saving resource:', err);
        alert('Failed to save: ' + err.message);
      }
    });

    closeModalBtn.addEventListener('click', closeModal);
    addBtn.addEventListener('click', function(){ openModal(null); });
    attachModalHandlers(modal, modalOverlay, closeModalBtn);

    // Show/hide custom type input based on selection
    modalType.addEventListener('change', function(){
      if (modalType.value === 'other') {
        modalTypeCustom.style.display = 'block';
        modalTypeCustom.focus();
      } else {
        modalTypeCustom.style.display = 'none';
        modalTypeCustom.value = '';
      }
    });

    // Search filter
    searchInput.addEventListener('input', function(){
      var q = searchInput.value.toLowerCase();
      var rows = tableBody.querySelectorAll('tr');
      rows.forEach(function(r){
        r.style.display = (r.textContent.toLowerCase().indexOf(q) > -1) ? 'table-row' : 'none';
      });
    });

    // Render sensor status (derived from resources)
    function renderSensors(){
      if (!sensorList) return;
      sensorList.innerHTML = '';
      resources.forEach(function(r){
        var li = document.createElement('li');
        li.innerHTML = '<div>'+r.name+' <div class="meta">'+r.location+'</div></div>'+
          '<div><span class="sensor-state '+(r.is_active ? 'ok' : 'down')+'">'+(r.is_active ? 'OK' : 'Down')+'</span></div>';
        sensorList.appendChild(li);
      });
    }

    // Load reservations with user and resource info
    async function loadReservations(){
      try {
        const reservations = await fetchReservations(supabase);

        // Attach resource info client-side (does not require FK constraints in PostgREST).
        var resourceMap = {};
        (resources || []).forEach(function(r){
          resourceMap[r.id] = { name: r.name };
        });

        var reservationsWithResources = (reservations || []).map(function(r){
          var res = resourceMap[r.resource_id];
          return {
            ...r,
            resources: res ? res : null
          };
        });

        console.log('Reservations:', reservationsWithResources);

        // Fetch users (prefer admin RPC so we can map all user_id values)
        const users = await fetchUsersForAdminUi(supabase);
        console.log('Users:', users);

        // Create a user map for quick lookup
        var userMap = {};
        (users || []).forEach(function(u){
          userMap[u.id] = {
            email: u.email,
            name: u.name
          };
          console.log('Mapping user', u.id, '->', u.name, '(', u.email, ')');
        });
        console.log('User map:', userMap);

        // Combine reservation data with user info
        allReservations = (reservationsWithResources || []).map(function(r){
          var userInfo = userMap[r.user_id];
          console.log('Processing reservation, user_id:', r.user_id, 'Found user:', userInfo);
          return {
            ...r,
            userName: userInfo ? userInfo.name : 'Unknown',
            userEmail: userInfo ? userInfo.email : 'Unknown'
          };
        });
        console.log('Final reservations with user info:', allReservations);

        filterAndRenderReservations();
        updateReservationStats();
      } catch (err) {
        console.error('Error loading reservations:', err);
      }
    }

    function updateReservationStats(){
      var total = allReservations.length;
      var pending = allReservations.filter(function(r){ return r.status === 'pending'; }).length;
      var confirmed = allReservations.filter(function(r){ return r.status === 'confirmed'; }).length;
      var cancelled = allReservations.filter(function(r){ return r.status === 'cancelled'; }).length;
      
      if(totalResCount) totalResCount.textContent = total;
      if(pendingResCount) pendingResCount.textContent = pending;
      if(confirmedResCount) confirmedResCount.textContent = confirmed;
      if(cancelledResCount) cancelledResCount.textContent = cancelled;
    }

    function filterAndRenderReservations(){
      var filterStatus = resFilterStatus ? resFilterStatus.value : 'all';
      
      if(filterStatus === 'all'){
        filteredReservations = allReservations;
      } else {
        filteredReservations = allReservations.filter(function(r){ return r.status === filterStatus; });
      }
      
      renderReservationsTable();
    }

    function renderReservationsTable(){
      if (!reservationsTableBody) return;
      reservationsTableBody.innerHTML = '';
      
      if (filteredReservations.length === 0) {
        if(noReservations) noReservations.style.display = 'block';
        if(reservationsTable) reservationsTable.style.display = 'none';
        return;
      }
      
      if(noReservations) noReservations.style.display = 'none';
      if(reservationsTable) reservationsTable.style.display = 'table';
      
      filteredReservations.forEach(function(res){
        var tr = document.createElement('tr');
        var resourceName = res.resources ? res.resources.name : 'Unknown';
        var userName = res.userName || 'Unknown';
        var fromDate = new Date(res.reserved_from);
        var untilDate = new Date(res.reserved_until);
        var fromStr = fromDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        var untilStr = untilDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        tr.innerHTML = '<td>'+resourceName+'</td><td>'+userName+'</td><td>'+fromStr+'</td><td>'+untilStr+'</td><td><span class="badge s-'+res.status+'">'+res.status+'</span></td>';
        
        var actionsTd = document.createElement('td');
        
        if(res.status === 'pending'){
          var approveBtn = document.createElement('button');
          approveBtn.className = 'action-btn action-approve';
          approveBtn.textContent = 'Approve';
          approveBtn.addEventListener('click', function(){ updateReservationStatus(res.id, 'confirmed'); });
          
          var rejectBtn = document.createElement('button');
          rejectBtn.className = 'action-btn action-reject';
          rejectBtn.textContent = 'Reject';
          rejectBtn.addEventListener('click', function(){ updateReservationStatus(res.id, 'cancelled'); });
          
          actionsTd.appendChild(approveBtn);
          actionsTd.appendChild(rejectBtn);
        } else {
          var viewBtn = document.createElement('button');
          viewBtn.className = 'action-btn';
          viewBtn.textContent = 'View';
          viewBtn.addEventListener('click', function(){ alert('Reservation ID: ' + res.id + '\nStatus: ' + res.status); });
          actionsTd.appendChild(viewBtn);
        }
        
        tr.appendChild(actionsTd);
        reservationsTableBody.appendChild(tr);
      });
    }

    async function updateReservationStatus(resId, newStatus){
      try {
        await updateReservationStatusData(supabase, resId, newStatus);
        loadReservations();
      } catch (err) {
        console.error('Error updating reservation:', err);
        alert('Failed to update: ' + err.message);
      }
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error('Sign out failed', e);
        }
        window.location.href = 'FrameHome.html';
      });
    }

    // Initialize
    await loadResources();
    await loadReservations();
    await loadSecurityEvents();
    await loadUsersForRfid();
    await loadAnnouncements();

    if(assignRfidBtn){
      assignRfidBtn.addEventListener('click', assignRfidToUser);
    }
    if(notifAddBtn){
      notifAddBtn.addEventListener('click', addAnnouncement);
    }

    // Lightweight refresh (avoids needing realtime configuration)
    setInterval(loadSecurityEvents, 15000);
    setInterval(loadAnnouncements, 30000);

    // Filter listener
    if(resFilterStatus){
      resFilterStatus.addEventListener('change', filterAndRenderReservations);
    }

  } catch (err) {
    console.error('Admin panel error:', err);
  }
})();
