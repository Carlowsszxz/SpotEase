import { supabase } from './supabase-auth.js'
import {
  fetchUsersForAdminUi,
  fetchResourcesLookup,
  fetchRfidScans,
  fetchActiveBlePresenceSessions,
  fetchBleScans
} from './services/admin-observability-data.js'

(function(){
  var tbody = document.getElementById('presenceTbody')
  var emptyEl = document.getElementById('presenceEmpty')
  var errEl = document.getElementById('presenceError')
  var searchEl = document.getElementById('presenceSearch')
  var refreshBtn = document.getElementById('presenceRefresh')
  var windowEl = document.getElementById('presenceWindowMinutes')
  var updatedEl = document.getElementById('presenceUpdated')

  var sumTracked = document.getElementById('sumTracked')
  var sumLikelyPresent = document.getElementById('sumLikelyPresent')
  var sumLastSeen = document.getElementById('sumLastSeen')
  var sumNoActivity = document.getElementById('sumNoActivity')

  var bleScansTbody = document.getElementById('bleScansTbody')
  var bleScansEmpty = document.getElementById('bleScansEmpty')
  var bleScansError = document.getElementById('bleScansError')
  var bleSumScans24h = document.getElementById('bleSumScans24h')
  var bleSumDevices24h = document.getElementById('bleSumDevices24h')
  var bleSumGateways = document.getElementById('bleSumGateways')
  var bleSumLatest = document.getElementById('bleSumLatest')

  var rowsAll = []
  var rfidChannel = null
  var bleChannel = null
  var refreshInFlight = false

  function setError(text){
    if(!errEl) return
    var msg = String(text || '').trim()
    errEl.style.display = msg ? 'block' : 'none'
    errEl.textContent = msg
  }

  function formatWhen(ts){
    if(!ts) return '—'
    var d = new Date(ts)
    if(isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function relative(ts){
    if(!ts) return '—'
    var d = new Date(ts)
    if(isNaN(d.getTime())) return '—'
    var mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))
    if(mins < 1) return 'just now'
    if(mins < 60) return mins + 'm ago'
    var hours = Math.floor(mins / 60)
    if(hours < 24) return hours + 'h ago'
    var days = Math.floor(hours / 24)
    return days + 'd ago'
  }

  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;')
  }

  function computeStatus(lastSeenAt, windowMinutes){
    if(!lastSeenAt) return { key: 'none', label: 'No activity' }
    var d = new Date(lastSeenAt)
    if(isNaN(d.getTime())) return { key: 'none', label: 'No activity' }
    var ageMinutes = (Date.now() - d.getTime()) / 60000
    if(ageMinutes <= Number(windowMinutes || 30)) return { key: 'present', label: 'Likely Present' }
    return { key: 'lastseen', label: 'Last Seen' }
  }

  function getBleTime(session){
    if(!session) return null
    return session.last_signal_time || session.last_seen_at || null
  }

  function getSearchText(r){
    var parts = [
      r.userName,
      r.userEmail,
      r.lastResource,
      r.signalSource,
      (r.movement || []).map(function(m){ return m.resource }).join(' ')
    ]
    return parts.join(' ').toLowerCase()
  }

  function applyFilters(){
    var q = String((searchEl && searchEl.value) || '').trim().toLowerCase()
    var filtered = rowsAll.filter(function(r){
      if(!q) return true
      return getSearchText(r).indexOf(q) !== -1
    })
    render(filtered)
  }

  function render(rows){
    if(!tbody) return
    tbody.innerHTML = ''

    var list = rows || []
    if(emptyEl) emptyEl.style.display = list.length ? 'none' : 'block'

    var presentCount = 0
    var lastSeenCount = 0
    var noActivityCount = 0

    list.forEach(function(r){
      if(r.status.key === 'present') presentCount++
      else if(r.status.key === 'lastseen') lastSeenCount++
      else noActivityCount++

      var movementHtml = ''
      if(!r.movement || !r.movement.length){
        movementHtml = '<span class="small-muted">No RFID taps recorded.</span>'
      } else {
        movementHtml = '<ul class="movement-list">' + r.movement.map(function(m){
          return '<li>' + escapeHtml(m.resource) + ' · ' + escapeHtml(formatWhen(m.when)) + '</li>'
        }).join('') + '</ul>'
      }

      var tr = document.createElement('tr')
      tr.innerHTML =
        '<td>' +
          '<div class="user-name">' + escapeHtml(r.userName) + '</div>' +
          '<div class="user-meta">' + escapeHtml(r.userEmail || 'No email') + '</div>' +
        '</td>' +
        '<td>' + escapeHtml((r.signalSource || 'rfid').toUpperCase()) + '</td>' +
        '<td><span class="status-chip ' + escapeHtml(r.status.key) + '">' + escapeHtml(r.status.label) + '</span></td>' +
        '<td>' + escapeHtml(r.lastSeenAt ? (formatWhen(r.lastSeenAt) + ' (' + relative(r.lastSeenAt) + ')') : '—') + '</td>' +
        '<td>' + escapeHtml(r.lastResource || '—') + '</td>' +
        '<td>' + movementHtml + '</td>'
      tbody.appendChild(tr)
    })

    if(sumTracked) sumTracked.textContent = String(list.length)
    if(sumLikelyPresent) sumLikelyPresent.textContent = String(presentCount)
    if(sumLastSeen) sumLastSeen.textContent = String(lastSeenCount)
    if(sumNoActivity) sumNoActivity.textContent = String(noActivityCount)
  }

  function renderBleScans(rows){
    if(!bleScansTbody) return
    bleScansTbody.innerHTML = ''
    if(bleScansError) bleScansError.style.display = 'none'

    var list = (rows || []).slice().sort(function(a,b){ return new Date(b.created_at || 0) - new Date(a.created_at || 0) })
    var now = Date.now()
    var cutoff = now - (24 * 60 * 60 * 1000)
    var rows24h = list.filter(function(r){ return new Date(r.created_at || 0).getTime() >= cutoff })
    var uniqueDevices = new Set(rows24h.map(function(r){ return String(r.device_address || '').toLowerCase() }).filter(Boolean))
    var uniqueGateways = new Set(rows24h.map(function(r){ return String(r.gateway_id || '').toLowerCase() }).filter(Boolean))

    if(bleSumScans24h) bleSumScans24h.textContent = String(rows24h.length)
    if(bleSumDevices24h) bleSumDevices24h.textContent = String(uniqueDevices.size)
    if(bleSumGateways) bleSumGateways.textContent = String(uniqueGateways.size)
    if(bleSumLatest) {
      bleSumLatest.textContent = list.length ? relative(list[0].created_at) : '—'
    }

    if(!list.length){
      if(bleScansEmpty) bleScansEmpty.style.display = 'block'
      return
    }
    if(bleScansEmpty) bleScansEmpty.style.display = 'none'

    list.slice(0, 120).forEach(function(r){
      var rssi = Number(r.rssi || 0)
      var tr = document.createElement('tr')
      tr.innerHTML =
        '<td>' + escapeHtml(formatWhen(r.created_at)) + ' (' + escapeHtml(relative(r.created_at)) + ')</td>' +
        '<td>' + escapeHtml(r.gateway_id || 'Unknown gateway') + '</td>' +
        '<td>' + escapeHtml(r.device_address || 'Unknown device') + '</td>' +
        '<td>' + escapeHtml(r.device_name || '—') + '</td>' +
        '<td><span class="status-chip ' + (rssi >= -75 ? 'present' : 'lastseen') + '">' + escapeHtml(String(rssi)) + '</span></td>' +
        '<td>' + escapeHtml(String(r.scan_batch == null ? '—' : r.scan_batch)) + '</td>'
      bleScansTbody.appendChild(tr)
    })
  }

  function buildRoster(users, resources, scans, bleSessions, windowMinutes){
    var userMap = {}
    ;(users || []).forEach(function(u){
      userMap[u.id] = {
        id: u.id,
        name: String((u && u.name) || '').trim(),
        email: String((u && u.email) || '').trim()
      }
    })

    var resourceMap = {}
    ;(resources || []).forEach(function(r){
      var name = String((r && r.name) || '').trim() || 'Unknown resource'
      var location = String((r && r.location) || '').trim()
      resourceMap[r.id] = location ? (name + ' (' + location + ')') : name
    })

    var scansByUser = {}
    ;(scans || []).forEach(function(s){
      if(!s || !s.user_id) return
      if(!scansByUser[s.user_id]) scansByUser[s.user_id] = []
      scansByUser[s.user_id].push(s)
    })

    Object.keys(scansByUser).forEach(function(userId){
      scansByUser[userId].sort(function(a,b){ return new Date(b.scanned_at || 0) - new Date(a.scanned_at || 0) })
    })

    var bleByUser = {}
    ;(bleSessions || []).forEach(function(s){
      if(!s || !s.user_id) return
      var existing = bleByUser[s.user_id]
      if(!existing){
        bleByUser[s.user_id] = s
        return
      }
      var existingTs = new Date(getBleTime(existing) || 0).getTime()
      var nextTs = new Date(getBleTime(s) || 0).getTime()
      if(nextTs > existingTs) bleByUser[s.user_id] = s
    })

    var ids = new Set(Object.keys(userMap))
    Object.keys(scansByUser).forEach(function(id){ ids.add(id) })
    Object.keys(bleByUser).forEach(function(id){ ids.add(id) })

    var rows = Array.from(ids).map(function(userId){
      var profile = userMap[userId] || { id: userId, name: '', email: '' }
      var taps = scansByUser[userId] || []
      var latest = taps[0] || null
      var ble = bleByUser[userId] || null

      var rfidLastAt = latest && latest.scanned_at ? new Date(latest.scanned_at).getTime() : 0
      var bleLastSeen = getBleTime(ble)
      var bleLastAt = bleLastSeen ? new Date(bleLastSeen).getTime() : 0
      var useBle = bleLastAt > rfidLastAt

      var effectiveLastSeenAt = useBle
        ? bleLastSeen
        : (latest ? latest.scanned_at : null)

      var effectiveLastResource = useBle
        ? (resourceMap[ble.resource_id] || 'Unknown resource')
        : (latest ? (resourceMap[latest.resource_id] || 'Unknown resource') : null)

      var signalSource = useBle ? 'ble' : (latest ? 'rfid' : 'none')

      var movement = taps.slice(0, 5).map(function(t){
        return {
          resource: resourceMap[t.resource_id] || 'Unknown resource',
          when: t.scanned_at
        }
      })

      if(useBle){
        movement.unshift({
          resource: effectiveLastResource || 'Unknown resource',
          when: bleLastSeen
        })
      }

      movement = movement.slice(0, 5)

      var displayName = profile.name || profile.email || ('User ' + String(userId).slice(0, 8))
      var status = computeStatus(effectiveLastSeenAt, windowMinutes)

      return {
        userId: userId,
        userName: displayName,
        userEmail: profile.email || '',
        lastSeenAt: effectiveLastSeenAt,
        lastResource: effectiveLastResource,
        signalSource: signalSource,
        movement: movement,
        status: status
      }
    })

    rows.sort(function(a,b){
      var rank = { present: 0, lastseen: 1, none: 2 }
      var ar = rank[a.status.key] == null ? 9 : rank[a.status.key]
      var br = rank[b.status.key] == null ? 9 : rank[b.status.key]
      if(ar !== br) return ar - br

      var at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0
      var bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0
      if(bt !== at) return bt - at

      return String(a.userName || '').localeCompare(String(b.userName || ''))
    })

    return rows
  }

  async function refreshRoster(){
    if(refreshInFlight) return
    refreshInFlight = true
    try{
      setError('')
      const windowMinutes = Number((windowEl && windowEl.value) || 30)

      const result = await Promise.all([
        fetchUsersForAdminUi(supabase),
        fetchResourcesLookup(supabase),
        fetchRfidScans(supabase, 4000)
      ])

      var bleSessions = []
      var bleScans = []
      try{
        bleSessions = await fetchActiveBlePresenceSessions(supabase, 4000)
      }catch(e){
        bleSessions = []
      }

      try{
        bleScans = await fetchBleScans(supabase, 2000)
      }catch(e){
        bleScans = []
        if(bleScansError){
          bleScansError.style.display = 'block'
          bleScansError.textContent = 'BLE scans are not configured yet (missing ble_scans table or policies).'
        }
      }

      rowsAll = buildRoster(result[0], result[1], result[2], bleSessions, windowMinutes)
      applyFilters()
      renderBleScans(bleScans)
      if(updatedEl) updatedEl.textContent = 'Updated: ' + formatWhen(new Date().toISOString())
    }catch(err){
      console.error('Presence roster load failed', err)
      rowsAll = []
      render([])
      renderBleScans([])
      setError('Unable to load presence roster: ' + (err.message || err))
    }finally{
      refreshInFlight = false
    }
  }

  function ensureRealtime(){
    if(!rfidChannel){
      rfidChannel = supabase
      .channel('presence-rfid-roster-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rfid_scans' }, function(){
        refreshRoster()
      })

      try{ rfidChannel.subscribe(function(){}) }catch(e){ rfidChannel.subscribe() }
    }

    if(!bleChannel){
      bleChannel = supabase
      .channel('presence-ble-roster-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ble_presence_sessions' }, function(){
        refreshRoster()
      })

      try{ bleChannel.subscribe(function(){}) }catch(e){ bleChannel.subscribe() }
    }
  }

  if(searchEl) searchEl.addEventListener('input', applyFilters)
  if(windowEl) windowEl.addEventListener('change', refreshRoster)
  if(refreshBtn) refreshBtn.addEventListener('click', refreshRoster)

  ensureRealtime()
  refreshRoster()
})()
