/* Render user's reservations from Supabase reservations table
  Provide cancel and edit (date/time) actions.
*/
import { checkAuth } from './auth.js'
import { supabase } from './supabase-auth.js'
import { showLoading, hideLoading, setStatus } from './loading-utils.js'

(async function(){
  // ensure user is authenticated before rendering reservations
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;

  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    console.error('No user session found')
    return
  }
  const userId = session.user.id

  var activeListEl = document.getElementById('activeList');
  var upcomingListEl = document.getElementById('upcomingList');
  var pastListEl = document.getElementById('pastList');
  var countUpcoming = document.getElementById('countUpcoming');
  var countActive = document.getElementById('countActive');
  var countPast = document.getElementById('countPast');
  var noActive = document.getElementById('noActive');
  var noUpcoming = document.getElementById('noUpcoming');
  var noPast = document.getElementById('noPast');
  
  // Loading UI elements
  var loadingOverlay = document.getElementById('loadingOverlay');
  var statusBar = document.getElementById('statusBar');
  var retryBtn = document.getElementById('retryBtn');
  var lastUpdatedEl = document.getElementById('lastUpdated');

  var reservations = [];

  async function load(){
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('reserved_from', { ascending: false })
      
      if (error) {
        console.error('Error loading reservations:', error)
        return []
      }
      
      reservations = data || []
      return reservations
    } catch (e) {
      console.error('Error loading reservations:', e)
      return []
    }
  }

  function toDateTime(r){ return new Date(r.reserved_from); }
  function toEndDateTime(r){ return new Date(r.reserved_until); }
  function isExpired(r){ return toEndDateTime(r) < new Date(); }
  function isActive(r){ 
    const now = new Date()
    const start = new Date(r.reserved_from)
    const end = new Date(r.reserved_until)
    return start <= now && now <= end
  }

  async function render(){
    showLoading(loadingOverlay, null, 'Loading reservations...');
    setStatus('Loading reservations...', false, statusBar, retryBtn);
    try {
      var all = await load();
      if (!all.length) {
        renderList(upcomingListEl, [], 'upcoming');
        renderList(activeListEl, [], 'active');
        renderList(pastListEl, [], 'past');
        if(countUpcoming) countUpcoming.textContent = 0;
        if(countActive) countActive.textContent = 0;
        if(countPast) countPast.textContent = 0;
        if(noActive) noActive.style.display = 'block';
        if(noUpcoming) noUpcoming.style.display = 'block';
        if(noPast) noPast.style.display = 'block';
        hideLoading(loadingOverlay);
        setStatus('No reservations found', false, statusBar, retryBtn);
        if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleString();
        return;
      }

      var upcoming = all.filter(function(r){ 
        return !isExpired(r) && !isActive(r) && r.status !== 'cancelled'; 
      });
      var active = all.filter(function(r){ 
        return isActive(r) && r.status !== 'cancelled'; 
      });
      var past = all.filter(function(r){ 
        return isExpired(r) || r.status === 'cancelled'; 
      });

      renderList(upcomingListEl, upcoming, 'upcoming');
      renderList(activeListEl, active, 'active');
      renderList(pastListEl, past, 'past');

      if(countUpcoming) countUpcoming.textContent = upcoming.length;
      if(countActive) countActive.textContent = active.length;
      if(countPast) countPast.textContent = past.length;

      if(noActive) noActive.style.display = active.length? 'none':'block';
      if(noUpcoming) noUpcoming.style.display = upcoming.length? 'none':'block';
      if(noPast) noPast.style.display = past.length? 'none':'block';
      
      hideLoading(loadingOverlay);
      setStatus('Reservations loaded', false, statusBar, retryBtn);
      if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleString();
    } catch(err) {
      hideLoading(loadingOverlay);
      setStatus('Failed to load reservations: ' + (err.message || err), true, statusBar, retryBtn);
      console.error('Error in render:', err);
    }
  }

  function statusBadge(r){
    if(r.status === 'cancelled') return '<span class="badge badge-cancelled">Cancelled</span>';
    if(r.status === 'pending') return '<span class="badge badge-pending">Pending</span>';
    if(isExpired(r)) return '<span class="badge badge-expired">Expired</span>';
    return '<span class="badge badge-confirmed">Confirmed</span>';
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function renderList(container, items, kind){
    if(!container) return;
    container.innerHTML = '';
    items.forEach(function(r){
      var li = document.createElement('li');
      var meta = document.createElement('div'); meta.className = 'res-meta';
      var title = document.createElement('div'); title.className = 'res-title'; title.textContent = r.resource_id || 'Resource';
      var sub = document.createElement('div'); sub.className = 'res-sub'; 
      sub.textContent = formatDateTime(r.reserved_from) + ' to ' + formatDateTime(r.reserved_until);
      meta.appendChild(title); meta.appendChild(sub);

      var right = document.createElement('div');
      right.innerHTML = statusBadge(r);

      var actions = document.createElement('div'); actions.className='action-group';
      // Cancel allowed if not expired and not already cancelled
      if(!isExpired(r) && r.status !== 'cancelled'){
        var cancel = document.createElement('button'); cancel.className='action-btn action-cancel'; cancel.textContent='Cancel';
        cancel.addEventListener('click',function(){ cancelReservation(r.id); });
        actions.appendChild(cancel);
      }

      right.appendChild(actions);
      li.appendChild(meta); li.appendChild(right);
      container.appendChild(li);
    });
  }

  async function cancelReservation(id){
    if(!confirm('Cancel this reservation?')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', userId)
      
      if (error) {
        alert('Error cancelling reservation: ' + error.message)
        console.error('Error cancelling reservation:', error)
        return
      }
      
      alert('Reservation cancelled successfully')
      render()
    } catch (e) {
      alert('Error cancelling reservation: ' + e.message)
      console.error('Error cancelling reservation:', e)
    }
  }

  // wire retry button
  if(retryBtn) retryBtn.addEventListener('click', render);

  // initialize UI
  render();

  // expose for debugging
  window._pm_reservations_render = render;
  window._pm_reservations_cancel = cancelReservation;

})();
