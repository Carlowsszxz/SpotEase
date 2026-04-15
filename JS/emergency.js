import { supabase } from './supabase-auth.js'

// Emergency page: use sensor-derived occupancy now.
// RFID identification is intentionally placeholder until hardware + DB exist.

var statusBar = null
var estimatedTotalEl = null
var spacesListEl = null
var sensorUpdatedEl = null
var roomSelectEl = null
var priorityBannerEl = null
var priorityTitleEl = null
var priorityMetaEl = null

var callSecurityBtn = null
var shareLocationBtn = null
var emergencyContactsBtn = null
var checkInSafeBtn = null
var locationShareStatusEl = null
var checkInStatusEl = null

var updatesListEl = null
var updatesEmptyEl = null

var signalLossListEl = null
var signalLossEmptyEl = null

var announcementPollTimer = null
var announcementPollMs = 30000
var activeUpdates = []

var signalLossEvents = []
var signalLossPollTimer = null
var signalLossPollMs = 60000  // Poll signal loss every 60 seconds

var selectedRoom = ''

var occupancyCache = new Map()
var channel = null
var pollTimer = null
var pollMs = 1000
var loadInFlight = false
var includeUpdatedAtInSelect = true

function setStatus(msg, isError){
  if(!statusBar) return
  var text = (msg == null) ? '' : String(msg)
  var trimmed = text.trim()
  if(!trimmed){
    statusBar.textContent = ''
    statusBar.classList.remove('error')
    statusBar.style.display = 'none'
    return
  }
  statusBar.textContent = text
  statusBar.style.display = ''
  if(isError) statusBar.classList.add('error'); else statusBar.classList.remove('error')
}

function occupancyStatus(current, capacity){
  var c = Number(current || 0)
  var cap = Number(capacity || 0)
  if(!cap || cap <= 0) return '—'
  if(c >= cap) return 'Full'
  if(c / cap >= 0.8) return 'Near full'
  return 'Available'
}

function formatTime(ts){
  if(!ts) return '—'
  var d = new Date(ts)
  if(isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}

function formatRange(startAt, endAt){
  var from = formatTime(startAt)
  var until = formatTime(endAt)
  if(from !== '—' && until !== '—') return from + ' to ' + until
  if(from !== '—') return 'Starts ' + from
  if(until !== '—') return 'Until ' + until
  return 'Active notice'
}

function getRoomTotal(){
  if(!selectedRoom) return 0
  return Array.from(occupancyCache.values())
    .filter(function(r){ return r && (r.is_active === true || r.is_active == null) })
    .filter(function(r){ return String(r.location || '') === selectedRoom })
    .reduce(function(sum, r){ return sum + Number(r.current_occupancy || 0) }, 0)
}

function detectEmergencyUpdate(item){
  var text = ((item && item.title) ? item.title : '') + ' ' + ((item && item.message) ? item.message : '')
  return /(emergency|evacuat|fire|earthquake|lockdown|hazard|incident|threat|shelter)/i.test(text)
}

function updatePriorityBanner(){
  if(!priorityBannerEl || !priorityTitleEl || !priorityMetaEl) return

  var emergencyNotice = (activeUpdates || []).find(detectEmergencyUpdate)
  var roomTotal = getRoomTotal()

  priorityBannerEl.classList.remove('is-alert')
  priorityBannerEl.classList.remove('is-watch')

  if(emergencyNotice){
    priorityBannerEl.classList.add('is-alert')
    priorityTitleEl.textContent = 'Emergency Notice Active'
    priorityMetaEl.textContent = (emergencyNotice.title || 'Notice') + ' · ' + formatRange(emergencyNotice.start_at, emergencyNotice.end_at)
    return
  }

  if(selectedRoom && roomTotal > 0){
    priorityBannerEl.classList.add('is-watch')
    priorityTitleEl.textContent = 'Monitoring ' + selectedRoom
    priorityMetaEl.textContent = roomTotal + ' estimated inside. Follow nearest exit signage if instructed.'
    return
  }

  priorityTitleEl.textContent = 'No Active Emergency Reported'
  priorityMetaEl.textContent = 'Follow posted guidance and stay alert.'
}

function getSafePointForRoom(room){
  var roomName = String(room || '').toLowerCase()
  if(!roomName) return {
    name: 'Main Quadrangle Assembly Area',
    hint: 'Select a room to get a tailored safe point suggestion.',
    route: 'Route: Use nearest marked exit, then proceed to assembly area.'
  }

  if(roomName.indexOf('library') > -1) return {
    name: 'East Parking Assembly Area',
    hint: 'Best for library and adjacent study spaces.',
    route: 'Route: Exit east stairwell, continue to East Parking assembly lane.'
  }
  if(roomName.indexOf('lab') > -1 || roomName.indexOf('tech') > -1) return {
    name: 'North Gate Assembly Area',
    hint: 'Best for tech wing and laboratories.',
    route: 'Route: Use north corridor exit, regroup at North Gate assembly area.'
  }
  if(roomName.indexOf('hall') > -1 || roomName.indexOf('cafeteria') > -1) return {
    name: 'South Court Assembly Area',
    hint: 'Best for hallways, cafeteria, and central common areas.',
    route: 'Route: Move to ground-level south exits, then to South Court.'
  }

  return {
    name: 'Main Quadrangle Assembly Area',
    hint: 'Default assembly point for this location.',
    route: 'Route: Use nearest marked exit, then proceed to assembly area.'
  }
}

function renderSafePoint(){
  var nameEl = document.getElementById('safePointName')
  var hintEl = document.getElementById('safePointHint')
  var routeEl = document.getElementById('safePointRoute')
  if(!nameEl || !hintEl || !routeEl) return

  var safePoint = getSafePointForRoom(selectedRoom)
  nameEl.textContent = safePoint.name
  hintEl.textContent = safePoint.hint
  routeEl.textContent = safePoint.route
}

function renderCheckInStatus(){
  if(!checkInStatusEl) return
  var raw = null
  try{ raw = localStorage.getItem('pm_emergency_checkin') }catch(e){ raw = null }
  if(!raw){
    checkInStatusEl.textContent = 'No check-in yet.'
    return
  }

  try{
    var data = JSON.parse(raw)
    var when = formatTime(data && data.time)
    var room = (data && data.room) ? (' · ' + data.room) : ''
    checkInStatusEl.textContent = 'Checked in safe: ' + when + room
  }catch(e){
    checkInStatusEl.textContent = 'No check-in yet.'
  }
}

function renderUpdates(){
  if(!updatesListEl || !updatesEmptyEl) return
  updatesListEl.innerHTML = ''

  if(!activeUpdates || activeUpdates.length === 0){
    updatesEmptyEl.style.display = 'block'
    updatePriorityBanner()
    return
  }

  updatesEmptyEl.style.display = 'none'
  activeUpdates.forEach(function(item){
    var li = document.createElement('li')
    li.innerHTML =
      '<div class="update-title">' + escapeHtml(item.title || 'Notice') + '</div>' +
      '<div class="update-message">' + escapeHtml(item.message || '') + '</div>' +
      '<div class="update-meta">' + escapeHtml(formatRange(item.start_at, item.end_at)) + '</div>'
    updatesListEl.appendChild(li)
  })

  updatePriorityBanner()
}

async function loadAnnouncements(){
  try{
    const { data, error } = await supabase
      .from('announcements')
      .select('id,title,message,start_at,end_at,created_at,is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if(error) throw error

    var nowMs = Date.now()
    activeUpdates = (data || []).filter(function(item){
      var startsOk = !item.start_at || (!isNaN(new Date(item.start_at).getTime()) && new Date(item.start_at).getTime() <= nowMs)
      var endsOk = !item.end_at || (!isNaN(new Date(item.end_at).getTime()) && new Date(item.end_at).getTime() >= nowMs)
      return startsOk && endsOk
    })

    renderUpdates()
  }catch(err){
    console.warn('announcements load error', err)
    activeUpdates = []
    renderUpdates()
  }
}

function startAnnouncementsPolling(ms){
  if(typeof ms === 'number' && isFinite(ms) && ms > 0) announcementPollMs = Math.max(10000, Math.floor(ms))
  if(announcementPollTimer) return

  var tick = async function(){
    try{ await loadAnnouncements() }catch(e){}
    announcementPollTimer = setTimeout(tick, announcementPollMs)
  }
  tick()
}

function renderSignalLoss(){
  if(!signalLossListEl || !signalLossEmptyEl) return
  signalLossListEl.innerHTML = ''

  if(!signalLossEvents || signalLossEvents.length === 0){
    signalLossEmptyEl.style.display = 'block'
    return
  }

  signalLossEmptyEl.style.display = 'none'
  signalLossEvents.forEach(function(item){
    var li = document.createElement('li')
    var timeStr = formatTime(item.closed_at)
    var locationStr = escapeHtml(item.last_seen_location || 'Unknown')
    li.innerHTML =
      '<div class="update-title">Signal Lost</div>' +
      '<div class="update-message">Lost at: ' + locationStr + '</div>' +
      '<div class="update-meta">' + timeStr + '</div>'
    signalLossListEl.appendChild(li)
  })
}

async function loadSignalLossEvents(){
  try{
    const { data: auditData, error } = await supabase
      .from('audit_logs')
      .select('id,user_id,details,created_at')
      .eq('action_type', 'occupancy_updated')
      .gte('created_at', new Date(Date.now() - 4 * 60 * 60000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if(error) throw error

    // Parse audit logs to extract BLE timeouts
    var events = []
    (auditData || []).forEach(function(log){
      try{
        var details = (log.details && typeof log.details === 'object') ? log.details : (typeof log.details === 'string' ? JSON.parse(log.details) : {})
        if(details.reason === 'ble_timeout'){
          events.push({
            id: log.id,
            user_id: log.user_id,
            closed_at: details.closed_at || log.created_at,
            last_seen_location: details.location || 'Unknown',
            reason: 'ble_timeout'
          })
        }
      }catch(e){
        // Skip malformed entries
      }
    })

    signalLossEvents = events.slice(0, 10)  // Keep only most recent 10
    renderSignalLoss()
  }catch(err){
    console.warn('signal loss load error', err)
    signalLossEvents = []
    renderSignalLoss()
  }
}

function startSignalLossPolling(ms){
  if(typeof ms === 'number' && isFinite(ms) && ms > 0) signalLossPollMs = Math.max(30000, Math.floor(ms))
  if(signalLossPollTimer) return

  var tick = async function(){
    try{ await loadSignalLossEvents() }catch(e){}
    signalLossPollTimer = setTimeout(tick, signalLossPollMs)
  }
  tick()
}

function render(){
  if(!spacesListEl || !estimatedTotalEl) return

  if(!selectedRoom){
    estimatedTotalEl.textContent = '—'
    if(sensorUpdatedEl) sensorUpdatedEl.textContent = '—'
    spacesListEl.innerHTML = '<div class="emergency-empty">Select a room to view sensor occupancy.</div>'
    renderSafePoint()
    updatePriorityBanner()
    return
  }

  var list = Array.from(occupancyCache.values())
    .filter(function(r){ return r && (r.is_active === true || r.is_active == null) })
    .filter(function(r){ return String(r.location || '') === selectedRoom })
    .filter(function(r){ return Number(r.current_occupancy || 0) > 0 })
    .sort(function(a,b){
      var ao = Number(a.current_occupancy || 0)
      var bo = Number(b.current_occupancy || 0)
      if(bo !== ao) return bo - ao
      var an = String(a.name || '').toLowerCase()
      var bn = String(b.name || '').toLowerCase()
      if(an < bn) return -1
      if(an > bn) return 1
      return 0
    })

  // Total is per-room sum across all resources (including 0 occupancy)
  var total = Array.from(occupancyCache.values())
    .filter(function(r){ return r && (r.is_active === true || r.is_active == null) })
    .filter(function(r){ return String(r.location || '') === selectedRoom })
    .reduce(function(sum, r){ return sum + Number(r.current_occupancy || 0) }, 0)

  estimatedTotalEl.textContent = String(total)

  if(sensorUpdatedEl){
    // Best-effort last updated from newest updated_at/created_at in selected room
    var newest = null
    Array.from(occupancyCache.values())
      .filter(function(r){ return r && (r.is_active === true || r.is_active == null) })
      .filter(function(r){ return String(r.location || '') === selectedRoom })
      .forEach(function(r){
      var t = r.updated_at || r.created_at
      if(!t) return
      if(!newest) newest = t
      else if(new Date(t).getTime() > new Date(newest).getTime()) newest = t
    })
    sensorUpdatedEl.textContent = formatTime(newest)
  }

  spacesListEl.innerHTML = ''
  if(!list.length){
    spacesListEl.innerHTML = '<div class="emergency-empty">No occupied spaces reported for this room right now.</div>'
    renderSafePoint()
    updatePriorityBanner()
    return
  }

  list.slice(0, 12).forEach(function(r){
    var row = document.createElement('div')
    row.className = 'emergency-space'

    var left = document.createElement('div')
    left.className = 'emergency-space-main'

    var name = document.createElement('div')
    name.className = 'emergency-space-name'
    name.textContent = r.name || r.id
    left.appendChild(name)

    if(r.location){
      var loc = document.createElement('div')
      loc.className = 'emergency-space-meta'
      loc.textContent = r.location
      left.appendChild(loc)
    }

    var right = document.createElement('div')
    right.className = 'emergency-space-right'

    var count = document.createElement('div')
    count.className = 'emergency-space-count'
    var occ = Number(r.current_occupancy || 0)
    var cap = Number(r.capacity || 0)
    count.textContent = cap ? (occ + ' / ' + cap) : String(occ)

    var status = document.createElement('div')
    status.className = 'emergency-space-status'
    status.textContent = occupancyStatus(occ, cap)

    right.appendChild(count)
    right.appendChild(status)

    row.appendChild(left)
    row.appendChild(right)
    spacesListEl.appendChild(row)
  })

  renderSafePoint()
  updatePriorityBanner()
}

function getRoomsFromCache(){
  var set = new Set()
  occupancyCache.forEach(function(r){
    try{
      if(!r) return
      if(!(r.is_active === true || r.is_active == null)) return
      var loc = (r.location == null) ? '' : String(r.location).trim()
      if(!loc) return
      set.add(loc)
    }catch(e){}
  })
  return Array.from(set.values()).sort(function(a,b){
    return a.localeCompare(b, undefined, { sensitivity: 'base' })
  })
}

function populateRoomSelect(){
  if(!roomSelectEl) return
  var rooms = getRoomsFromCache()

  // Preserve current selection if still present
  var current = selectedRoom

  // Rebuild options
  roomSelectEl.innerHTML = '<option value="">Select a room</option>'
  rooms.forEach(function(room){
    var opt = document.createElement('option')
    opt.value = room
    opt.textContent = room
    roomSelectEl.appendChild(opt)
  })

  if(current && rooms.indexOf(current) !== -1){
    roomSelectEl.value = current
    return
  }

  // Auto-select if only one room exists
  if(!current && rooms.length === 1){
    selectedRoom = rooms[0]
    roomSelectEl.value = selectedRoom
    return
  }

  // If current selection vanished, reset
  if(current && rooms.indexOf(current) === -1){
    selectedRoom = ''
    roomSelectEl.value = ''
  }
}

async function querySnapshot(){
  var base = 'id,name,location,capacity,current_occupancy,is_active,created_at'
  var fields = includeUpdatedAtInSelect ? (base + ',updated_at') : base

  const { data, error } = await supabase
    .from('resources')
    .select(fields)
    .or('is_active.is.null,is_active.eq.true')

  if(error && includeUpdatedAtInSelect){
    var msg = String(error.message || error.details || '')
    if(/updated_at/i.test(msg) && /does not exist/i.test(msg)){
      includeUpdatedAtInSelect = false
      return querySnapshot()
    }
  }
  if(error) throw error
  return data || []
}

async function load(){
  if(loadInFlight) return
  loadInFlight = true
  try{
    const data = await querySnapshot()
    occupancyCache.clear()
    ;(data || []).forEach(function(r){ occupancyCache.set(r.id, r) })
    setStatus('', false)
    populateRoomSelect()
    render()
  }catch(err){
    console.error('emergency load error', err)
    setStatus('Failed to load sensor occupancy.', true)
  }finally{
    loadInFlight = false
  }
}

function startPolling(ms){
  if(typeof ms === 'number' && isFinite(ms) && ms > 0) pollMs = Math.max(500, Math.floor(ms))
  if(pollTimer) return

  var tick = async function(){
    try{ await load() }catch(e){}
    pollTimer = setTimeout(tick, pollMs)
  }
  tick()
}

function subscribeRealtime(){
  if(channel) return
  channel = supabase
    .channel('emergency-resources-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, function(payload){
      try{
        if(payload && payload.eventType === 'DELETE'){
          if(payload.old && payload.old.id) occupancyCache.delete(payload.old.id)
          populateRoomSelect()
          render()
          return
        }
        if(payload && payload.new && payload.new.id){
          occupancyCache.set(payload.new.id, payload.new)
          populateRoomSelect()
          render()
        }
      }catch(e){
        // ignore
      }
    })

  try{
    channel.subscribe(function(status){
      // Keep polling as safety net (same reason as dashboard)
      if(status === 'SUBSCRIBED'){
        startPolling(1000)
        load()
      } else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
        startPolling(1000)
      }
    })
  }catch(e){
    startPolling(1000)
  }
}

document.addEventListener('DOMContentLoaded', function(){
  statusBar = document.getElementById('emergencyStatus')
  estimatedTotalEl = document.getElementById('estimatedInsideTotal')
  spacesListEl = document.getElementById('occupiedSpacesList')
  sensorUpdatedEl = document.getElementById('sensorLastUpdated')
  roomSelectEl = document.getElementById('emergencyRoomSelect')
  priorityBannerEl = document.getElementById('emergencyPriorityBanner')
  priorityTitleEl = document.getElementById('emergencyPriorityTitle')
  priorityMetaEl = document.getElementById('emergencyPriorityMeta')

  callSecurityBtn = document.getElementById('callSecurityBtn')
  shareLocationBtn = document.getElementById('shareLocationBtn')
  emergencyContactsBtn = document.getElementById('emergencyContactsBtn')
  checkInSafeBtn = document.getElementById('checkInSafeBtn')
  locationShareStatusEl = document.getElementById('locationShareStatus')
  checkInStatusEl = document.getElementById('checkInStatus')

  updatesListEl = document.getElementById('emergencyUpdatesList')
  updatesEmptyEl = document.getElementById('emergencyUpdatesEmpty')

  signalLossListEl = document.getElementById('signalLossList')
  signalLossEmptyEl = document.getElementById('signalLossEmpty')

  if(roomSelectEl){
    roomSelectEl.addEventListener('change', function(){
      selectedRoom = (roomSelectEl.value || '')
      render()
    })
  }

  if(callSecurityBtn){
    callSecurityBtn.addEventListener('click', function(){
      var key = 'pm_emergency_security_number'
      var num = ''
      try{ num = String(localStorage.getItem(key) || '').trim() }catch(e){ num = '' }
      if(!num){
        var entered = window.prompt('Enter campus security hotline number (numbers only):', '')
        num = String(entered || '').trim()
        if(num){
          try{ localStorage.setItem(key, num) }catch(e){}
        }
      }
      if(!num){
        setStatus('Campus security number not set.', true)
        return
      }
      window.location.href = 'tel:' + num
    })
  }

  if(shareLocationBtn){
    shareLocationBtn.addEventListener('click', function(){
      if(!navigator.geolocation){
        if(locationShareStatusEl) locationShareStatusEl.textContent = 'Geolocation not supported on this browser.'
        return
      }
      if(locationShareStatusEl) locationShareStatusEl.textContent = 'Getting current location...'

      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude
        var lng = pos.coords.longitude
        var text = 'My emergency location: https://maps.google.com/?q=' + lat + ',' + lng

        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(function(){
            if(locationShareStatusEl) locationShareStatusEl.textContent = 'Location copied. Paste and send it to responders.'
          }).catch(function(){
            if(locationShareStatusEl) locationShareStatusEl.textContent = text
          })
        }else{
          if(locationShareStatusEl) locationShareStatusEl.textContent = text
        }
      }, function(){
        if(locationShareStatusEl) locationShareStatusEl.textContent = 'Unable to get location. Check browser permission and try again.'
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 })
    })
  }

  if(emergencyContactsBtn){
    emergencyContactsBtn.addEventListener('click', function(){
      window.alert('Emergency contacts:\n• Local emergency services: 911\n• Campus security: use Call Campus Security button\n• Front desk / admin office: use your local posted number')
    })
  }

  if(checkInSafeBtn){
    checkInSafeBtn.addEventListener('click', function(){
      var payload = {
        time: new Date().toISOString(),
        room: selectedRoom || null
      }
      try{ localStorage.setItem('pm_emergency_checkin', JSON.stringify(payload)) }catch(e){}
      renderCheckInStatus()
      setStatus('Safe check-in saved.', false)
    })
  }

  renderCheckInStatus()
  render()
  loadAnnouncements()
  startAnnouncementsPolling(30000)
  loadSignalLossEvents()
  startSignalLossPolling(60000)
  subscribeRealtime()
})

window.addEventListener('beforeunload', function(){
  try{
    if(pollTimer){
      clearTimeout(pollTimer)
      pollTimer = null
    }
    if(announcementPollTimer){
      clearTimeout(announcementPollTimer)
      announcementPollTimer = null
    }
    if(signalLossPollTimer){
      clearTimeout(signalLossPollTimer)
      signalLossPollTimer = null
    }
    if(channel) supabase.removeChannel(channel)
  }catch(e){
    // ignore
  }
})
