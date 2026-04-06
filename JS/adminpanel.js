/* Admin panel: manage resources from Supabase, view reservations */
import { supabase } from './supabase-auth.js'
import { openModal as openModalUtil, closeModal as closeModalUtil, attachModalHandlers } from './modal-utils.js'

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

    var resources = [];
    var editingId = null;
    var allReservations = [];
    var filteredReservations = [];

    // Load all resources from Supabase
    async function loadResources(){
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        resources = data || [];
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
        tr.innerHTML = '<td>'+r.name+'</td><td>'+r.resource_type+'</td><td>'+r.location+'</td><td>'+(r.capacity || 1)+'</td><td><span class="badge s-'+(r.is_active?'free':'occupied')+'">+'+(r.is_active?'Active':'Inactive')+'</span></td>';
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
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
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
          // Update existing
          const { error } = await supabase
            .from('resources')
            .update({
              name: name,
              resource_type: type,
              location: location,
              capacity: capacity,
              is_active: isActive
            })
            .eq('id', editingId);
          
          if (error) throw error;
        } else {
          // Create new - generate UUID for id
          const newId = crypto.randomUUID();
          const { error } = await supabase
            .from('resources')
            .insert([{
              id: newId,
              name: name,
              resource_type: type,
              location: location,
              capacity: capacity,
              is_active: isActive
            }]);
          
          if (error) throw error;
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
        li.innerHTML = '<div>'+r.name+' <div class="meta">'+r.location+'</div></div><div class="meta">'+
                       (r.is_active ? '<span style="color:green">✓ OK</span>' : '<span style="color:red">✗ Down</span>')+
                       '</div>';
        sensorList.appendChild(li);
      });
    }

    // Load reservations with user and resource info
    async function loadReservations(){
      try {
        // Fetch reservations with resource info
        const { data: reservations, error: resError } = await supabase
          .from('reservations')
          .select(`
            *,
            resources:resource_id(name)
          `)
          .order('created_at', { ascending: false });
        
        if (resError) throw resError;
        console.log('Reservations:', reservations);

        // Fetch all users with name and email
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, name');
        
        if (usersError) throw usersError;
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
        allReservations = (reservations || []).map(function(r){
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
        const { error } = await supabase
          .from('reservations')
          .update({ status: newStatus })
          .eq('id', resId);
        
        if (error) throw error;
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
        window.location.href = 'FrameLogin.html';
      });
    }

    // Initialize
    await loadResources();
    await loadReservations();

    // Filter listener
    if(resFilterStatus){
      resFilterStatus.addEventListener('change', filterAndRenderReservations);
    }

  } catch (err) {
    console.error('Admin panel error:', err);
  }
})();
