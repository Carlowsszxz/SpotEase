/* Admin panel: read-only overview */
import { supabase } from './supabase-auth.js'
import {
  fetchSecurityEvents,
  fetchResources,
  fetchAnnouncements,
  fetchUsersForAdminUi,
  updateUserRole
} from './services/adminpanel-data.js'
import { fetchBleScans } from './services/admin-observability-data.js'

;(async function adminPanel(){
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tableBody = document.querySelector('#resourceTable tbody')
    const searchInput = document.getElementById('searchResource')
    const sensorList = document.getElementById('sensorList')
    const logoutBtn = document.getElementById('logoutBtn')

    const roleUserSelect = document.getElementById('roleUserSelect')
    const roleSelect = document.getElementById('roleSelect')
    const updateRoleBtn = document.getElementById('updateRoleBtn')
    const roleStatus = document.getElementById('roleStatus')

    const securityEventsList = document.getElementById('securityEventsList')
    const noSecurityEvents = document.getElementById('noSecurityEvents')
    const exportSecurityBtn = document.getElementById('exportSecurityBtn')
    const securityExportContainer = document.getElementById('securityExportContainer')
    const securityExportText = document.getElementById('securityExportText')
    const copySecurityTextBtn = document.getElementById('copySecurityTextBtn')
    const securityExportStatus = document.getElementById('securityExportStatus')

    const notifList = document.getElementById('notifList')
    const noNotifs = document.getElementById('noNotifs')
    const bleOverviewList = document.getElementById('bleOverviewList')
    const bleOverviewEmpty = document.getElementById('bleOverviewEmpty')

    const capacityFullCountEl = document.getElementById('capacityFullCount')
    const capacityNearCountEl = document.getElementById('capacityNearCount')
    const capacityPublicStatusEl = document.getElementById('capacityPublicStatus')
    const capacityAlertsTable = document.getElementById('capacityAlertsTable')
    const capacityAlertsEmpty = document.getElementById('capacityAlertsEmpty')

    const resourceCountEl = document.getElementById('resourceCount')
    const sensorCountEl = document.getElementById('sensorCount')
    const alertCountEl = document.getElementById('alertCount')
    const noticeCountEl = document.getElementById('noticeCount')

    let resources = []
    let announcements = []
    let currentSecurityEvents = []
    let currentBleScans = []
    let currentCapacityAlerts = []
    let currentCapacityStatus = []
    let roleUsers = []
    let roleUsersById = {}

    function escapeHtml(s){
      return String(s == null ? '' : s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;')
    }

    function normalizeRole(value){
      return String(value || '').trim().toLowerCase()
    }

    function displayRole(value){
      return normalizeRole(value) === 'admin' ? 'Admin' : 'Member'
    }

    function setRoleStatus(msg, isError){
      if(!roleStatus) return
      roleStatus.textContent = msg
      roleStatus.classList.toggle('error', !!isError)
    }

    function formatUserLabel(user){
      if(!user) return 'Unknown user'
      const name = String(user.name || '').trim()
      const email = String(user.email || '').trim()
      const base = name ? (email ? name + ' - ' + email : name) : (email || user.id)
      return base + ' (' + displayRole(user.role) + ')'
    }

    function populateRoleUsers(users){
      roleUsers = users || []
      roleUsersById = {}

      if(!roleUserSelect) return
      roleUserSelect.innerHTML = ''

      if(!roleUsers || roleUsers.length === 0){
        roleUserSelect.appendChild(new Option('No users found', ''))
        setRoleStatus('No users available to update.', true)
        if(updateRoleBtn) updateRoleBtn.disabled = true
        return
      }

      roleUserSelect.appendChild(new Option('Select a user', ''))
      roleUsers.forEach(function(user){
        roleUsersById[user.id] = user
        roleUserSelect.appendChild(new Option(formatUserLabel(user), user.id))
      })

      setRoleStatus('Select a user to update their role.')
      if(updateRoleBtn) updateRoleBtn.disabled = true
    }

    function syncRoleSelection(){
      if(!roleUserSelect || !roleSelect) return
      const userId = roleUserSelect.value
      const user = roleUsersById[userId]
      if(!user){
        roleSelect.value = 'member'
        if(updateRoleBtn) updateRoleBtn.disabled = true
        return
      }

      roleSelect.value = normalizeRole(user.role) === 'admin' ? 'admin' : 'member'
      if(updateRoleBtn) updateRoleBtn.disabled = false
      setRoleStatus('Selected: ' + formatUserLabel(user))
    }

    async function loadRoleUsers(selectedId){
      if(!roleUserSelect) return
      try{
        const users = await fetchUsersForAdminUi(supabase)
        populateRoleUsers(users)
        if(selectedId){
          roleUserSelect.value = selectedId
          syncRoleSelection()
        }
      }catch(err){
        console.error('Failed to load users for roles', err)
        roleUserSelect.innerHTML = '<option value="">Unable to load users</option>'
        setRoleStatus('Unable to load users.', true)
        if(updateRoleBtn) updateRoleBtn.disabled = true
      }
    }

    function formatWhen(ts){
      if(!ts) return ''
      const d = new Date(ts)
      if(isNaN(d.getTime())) return ''
      return d.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    }

    function formatRange(startAt, endAt){
      const from = formatWhen(startAt)
      const until = formatWhen(endAt)
      if(from && until) return from + ' → ' + until
      if(from) return 'Starts: ' + from
      if(until) return 'Until: ' + until
      return 'Always visible while active'
    }

    function badgeClass(value, map){
      const key = String(value || '').toLowerCase()
      return map[key] || 's-cancelled'
    }

    function renderResources(){
      if(!tableBody) return
      const query = String(searchInput && searchInput.value ? searchInput.value : '').toLowerCase().trim()
      tableBody.innerHTML = ''

      ;(resources || []).forEach(function(r){
        const rowText = [r.name, r.resource_type, r.location, r.capacity, r.is_active ? 'active' : 'inactive'].join(' ').toLowerCase()
        if(query && rowText.indexOf(query) === -1) return

        const tr = document.createElement('tr')
        tr.innerHTML = '<td>' + escapeHtml(r.name) + '</td>' +
          '<td>' + escapeHtml(r.resource_type) + '</td>' +
          '<td>' + escapeHtml(r.location) + '</td>' +
          '<td>' + escapeHtml(r.capacity || 1) + '</td>' +
          '<td><span class="badge s-' + (r.is_active ? 'free' : 'occupied') + '">' + (r.is_active ? 'Active' : 'Inactive') + '</span></td>'
        tableBody.appendChild(tr)
      })

      if(tableBody.children.length === 0){
        const tr = document.createElement('tr')
        tr.innerHTML = '<td colspan="5" class="small-muted">No resources matched your current filters.</td>'
        tableBody.appendChild(tr)
      }

      if(resourceCountEl) resourceCountEl.textContent = String(resources.length)
      if(sensorCountEl) sensorCountEl.textContent = String(resources.filter(function(r){ return !!r.is_active }).length)
    }

    function renderSensors(){
      if(!sensorList) return
      sensorList.innerHTML = ''

      if(!resources || resources.length === 0){
        const li = document.createElement('li')
        li.innerHTML = '<div class="small-muted">No resource data is currently available.</div>'
        sensorList.appendChild(li)
        return
      }

      resources.forEach(function(r){
        const li = document.createElement('li')
        li.innerHTML = '<div><strong>' + escapeHtml(r.name) + '</strong><div class="meta">' + escapeHtml(r.location || 'Location not set') + '</div></div>' +
          '<div><span class="sensor-state ' + (r.is_active ? 'ok' : 'down') + '">' + (r.is_active ? 'OK' : 'Down') + '</span></div>'
        sensorList.appendChild(li)
      })
    }

    function renderAnnouncements(){
      if(!notifList) return
      notifList.innerHTML = ''

      if(!announcements || announcements.length === 0){
        if(noNotifs) noNotifs.style.display = 'block'
        if(noticeCountEl) noticeCountEl.textContent = '0'
        return
      }

      if(noNotifs) noNotifs.style.display = 'none'
      if(noticeCountEl) noticeCountEl.textContent = String(announcements.length)

      announcements.forEach(function(item){
        const li = document.createElement('li')
        li.innerHTML = '<div>' +
          '<strong>' + escapeHtml(item.title || 'Notice') + '</strong>' +
          (item.message ? '<div>' + escapeHtml(item.message) + '</div>' : '') +
          '<div class="meta">' + escapeHtml(formatRange(item.start_at, item.end_at)) + '</div>' +
          '</div>' +
          '<div><span class="badge ' + (item.is_active ? 's-confirmed' : 's-cancelled') + '">' + (item.is_active ? 'active' : 'inactive') + '</span></div>'
        notifList.appendChild(li)
      })
    }

    function relativeWhen(ts){
      if(!ts) return '—'
      const d = new Date(ts)
      if(isNaN(d.getTime())) return '—'
      const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))
      if(mins < 1) return 'just now'
      if(mins < 60) return mins + 'm ago'
      const hours = Math.floor(mins / 60)
      if(hours < 24) return hours + 'h ago'
      const days = Math.floor(hours / 24)
      return days + 'd ago'
    }

    function renderBleOverview(items){
      if(!bleOverviewList) return
      bleOverviewList.innerHTML = ''
      currentBleScans = items || []

      if(!items || items.length === 0){
        if(bleOverviewEmpty){
          bleOverviewEmpty.style.display = 'block'
          bleOverviewEmpty.textContent = 'No BLE scans received yet.'
        }
        return
      }

      if(bleOverviewEmpty) bleOverviewEmpty.style.display = 'none'

      const latestByGateway = {}
      items.forEach(function(row){
        const gateway = String(row.gateway_id || 'Unknown gateway')
        const existing = latestByGateway[gateway]
        if(!existing){
          latestByGateway[gateway] = row
          return
        }
        const et = new Date(existing.created_at || 0).getTime()
        const nt = new Date(row.created_at || 0).getTime()
        if(nt > et) latestByGateway[gateway] = row
      })

      const recencyCutoff = Date.now() - (24 * 60 * 60 * 1000)
      const rows24h = items.filter(function(row){ return new Date(row.created_at || 0).getTime() >= recencyCutoff })
      const uniqueDevices24h = new Set(rows24h.map(function(row){ return String(row.device_address || '').toLowerCase() }).filter(Boolean))

      const summaryLi = document.createElement('li')
      summaryLi.innerHTML = '<div><strong>Last 24h</strong><div class="meta">Scans: ' + escapeHtml(rows24h.length) + ' · Devices: ' + escapeHtml(uniqueDevices24h.size) + '</div></div>' +
        '<div><span class="sensor-state ok">ACTIVE</span></div>'
      bleOverviewList.appendChild(summaryLi)

      Object.keys(latestByGateway)
        .sort(function(a,b){
          return new Date(latestByGateway[b].created_at || 0) - new Date(latestByGateway[a].created_at || 0)
        })
        .slice(0, 4)
        .forEach(function(gateway){
          const row = latestByGateway[gateway]
          const signal = Number(row.rssi || 0)
          const state = signal >= -75 ? 'ok' : 'down'
          const deviceLabel = row.device_name ? (row.device_name + ' · ' + row.device_address) : (row.device_address || 'Unknown device')

          const li = document.createElement('li')
          li.innerHTML = '<div><strong>' + escapeHtml(gateway) + '</strong><div class="meta">' + escapeHtml(deviceLabel) + '</div><div class="meta">' + escapeHtml(formatWhen(row.created_at)) + ' (' + escapeHtml(relativeWhen(row.created_at)) + ')</div></div>' +
            '<div><span class="sensor-state ' + state + '">RSSI ' + escapeHtml(signal) + '</span></div>'
          bleOverviewList.appendChild(li)
        })
    }

    function renderSecurityEvents(items){
      if(!securityEventsList) return
      securityEventsList.innerHTML = ''
      currentSecurityEvents = items || []

      if(!items || items.length === 0){
        if(noSecurityEvents){
          noSecurityEvents.style.display = 'block'
          noSecurityEvents.textContent = 'No after-hours events.'
        }
        if(securityExportContainer) securityExportContainer.style.display = 'none'
        if(alertCountEl) alertCountEl.textContent = '0'
        return
      }

      if(noSecurityEvents) noSecurityEvents.style.display = 'none'

      const resourceMap = {}
      ;(resources || []).forEach(function(r){
        resourceMap[r.id] = { name: r.name, location: r.location }
      })

      const sorted = items.slice().sort(function(a,b){
        const ar = (String(a.status || '').toLowerCase() === 'open') ? 0 : (String(a.status || '').toLowerCase() === 'ack' ? 1 : 2)
        const br = (String(b.status || '').toLowerCase() === 'open') ? 0 : (String(b.status || '').toLowerCase() === 'ack' ? 1 : 2)
        if(ar !== br) return ar - br
        return new Date(b.triggered_at || 0) - new Date(a.triggered_at || 0)
      })

      sorted.forEach(function(ev){
        const li = document.createElement('li')
        const res = ev.resource_id ? resourceMap[ev.resource_id] : null
        const resName = res && res.name ? res.name : (ev.resource_id || 'Unknown space')
        const loc = res && res.location ? res.location : ''
        const sevClass = badgeClass(ev.severity, { high: 's-confirmed', medium: 's-pending' })
        const statusClass = badgeClass(ev.status, { ack: 's-confirmed', resolved: 's-cancelled', open: 's-pending' })

        li.innerHTML = '<div>' +
          '<strong>' + escapeHtml(resName) + '</strong>' +
          (loc ? '<div class="security-meta">' + escapeHtml(loc) + '</div>' : '') +
          '<div class="security-meta">' + escapeHtml(formatWhen(ev.triggered_at)) + '</div>' +
          '</div>' +
          '<div>' +
          '<div class="security-badges">' +
          '<span class="badge ' + sevClass + '">' + escapeHtml(ev.severity || 'medium') + '</span>' +
          '<span class="badge ' + statusClass + '">' + escapeHtml(ev.status || 'open') + '</span>' +
          '</div>' +
          '</div>'
        securityEventsList.appendChild(li)
      })

      if(alertCountEl) alertCountEl.textContent = String(sorted.length)
    }

    function formatCapacityAlertType(alertType){
      const type = String(alertType || '').toLowerCase()
      if(type === 'full_capacity') return 'Full Capacity'
      if(type === 'threshold_95') return 'Near Capacity'
      if(type === 'threshold_80') return 'Approaching Capacity'
      return 'Capacity Alert'
    }

    function renderCapacityAlerts(items){
      if(!capacityAlertsTable) return
      const tbody = capacityAlertsTable.querySelector('tbody')
      if(!tbody) return

      tbody.innerHTML = ''
      currentCapacityAlerts = items || []

      if(!items || items.length === 0){
        if(capacityAlertsEmpty) capacityAlertsEmpty.style.display = 'block'
        return
      }

      if(capacityAlertsEmpty) capacityAlertsEmpty.style.display = 'none'

      items.forEach(function(alert){
        const tr = document.createElement('tr')
        const statusLabel = formatCapacityAlertType(alert.alert_type)
        const occText = alert.occupancy_count != null && alert.occupancy_percentage != null
          ? String(alert.occupancy_count) + ' (' + String(alert.occupancy_percentage) + '%)'
          : '—'

        tr.innerHTML = '<td>' + escapeHtml(alert.resource_name || 'Unknown space') + '</td>' +
          '<td>' + escapeHtml(alert.location || '—') + '</td>' +
          '<td><span class="badge ' + (String(alert.alert_type || '').toLowerCase() === 'full_capacity' ? 's-confirmed' : 's-pending') + '">' + escapeHtml(statusLabel) + '</span></td>' +
          '<td>' + escapeHtml(occText) + '</td>' +
          '<td>' + escapeHtml(formatWhen(alert.triggered_at)) + '</td>'
        tbody.appendChild(tr)
      })
    }

    function renderCapacityStatus(items){
      currentCapacityStatus = items || []
      const valid = (items || []).filter(function(row){ return row && row.current_percentage != null })

      const fullCount = valid.filter(function(row){
        const pct = Number(row.current_percentage || 0)
        return pct >= 100 || row.is_full === true
      }).length

      const nearCount = valid.filter(function(row){
        const pct = Number(row.current_percentage || 0)
        return pct >= 95 && pct < 100
      }).length

      if(capacityFullCountEl) capacityFullCountEl.textContent = String(fullCount)
      if(capacityNearCountEl) capacityNearCountEl.textContent = String(nearCount)

      if(capacityPublicStatusEl){
        capacityPublicStatusEl.classList.remove('status-full', 'status-near', 'status-available')

        let label = 'Website status: Data unavailable'
        if(valid.length > 0){
          if(fullCount > 0){
            label = 'Website status: Full Capacity'
            capacityPublicStatusEl.classList.add('status-full')
          } else if(nearCount > 0){
            label = 'Website status: Near Capacity'
            capacityPublicStatusEl.classList.add('status-near')
          } else {
            label = 'Website status: Available'
            capacityPublicStatusEl.classList.add('status-available')
          }
        }

        const badge = capacityPublicStatusEl.querySelector('.badge')
        if(badge) badge.textContent = label
      }
    }

    function formatSecurityEventsAsText(){
      if(!currentSecurityEvents || currentSecurityEvents.length === 0){
        return 'No security events to export.'
      }

      const lines = []
      lines.push('========================================')
      lines.push('AFTER-HOURS SECURITY EVENTS REPORT')
      lines.push('Generated: ' + new Date().toLocaleString())
      lines.push('========================================')
      lines.push('')

      const resourceMap = {}
      ;(resources || []).forEach(function(r){
        resourceMap[r.id] = { name: r.name, location: r.location }
      })

      currentSecurityEvents.forEach(function(ev, idx){
        const res = ev.resource_id ? resourceMap[ev.resource_id] : null
        const resName = res && res.name ? res.name : (ev.resource_id || 'Unknown space')
        const loc = res && res.location ? res.location : 'Location not specified'

        lines.push('EVENT ' + (idx + 1) + ':')
        lines.push('-'.repeat(40))
        lines.push('Room/Space: ' + resName)
        lines.push('Location: ' + loc)
        lines.push('Triggered At: ' + formatWhen(ev.triggered_at))
        lines.push('Severity: ' + (ev.severity || 'medium'))
        lines.push('Status: ' + (ev.status || 'open'))
        lines.push('')
      })

      lines.push('========================================')
      lines.push('Total Events: ' + currentSecurityEvents.length)
      lines.push('========================================')

      return lines.join('\n')
    }

    function exportSecurityEventsAsText(){
      if(!securityExportText || !securityExportContainer) return

      const text = formatSecurityEventsAsText()
      securityExportText.value = text
      securityExportContainer.style.display = 'block'

      if(securityExportStatus){
        securityExportStatus.style.display = 'block'
        securityExportStatus.textContent = 'Export is ready. Click "Copy to Clipboard" to copy the report.'
        securityExportStatus.classList.remove('error')
      }

      securityExportText.select()
    }

    function copySecurityTextToClipboard(){
      if(!securityExportText) return

      try{
        securityExportText.select()
        document.execCommand('copy')

        if(securityExportStatus){
          securityExportStatus.style.display = 'block'
          securityExportStatus.textContent = 'Copied to clipboard successfully.'
          securityExportStatus.classList.remove('error')
        }
      }catch(err){
        console.error('Copy failed:', err)
        if(securityExportStatus){
          securityExportStatus.style.display = 'block'
          securityExportStatus.textContent = 'Copy failed. Please select the report text and copy manually.'
          securityExportStatus.classList.add('error')
        }
      }
    }

    async function loadResources(){
      try {
        resources = await fetchResources(supabase)
        renderResources()
        renderSensors()
      } catch (err) {
        console.error('Error loading resources:', err)
        if(tableBody){
          tableBody.innerHTML = '<tr><td colspan="5" class="small-muted">Unable to load resources right now.</td></tr>'
        }
      }
    }

    async function loadSecurityEvents(){
      if(!securityEventsList) return
      try{
        const data = await fetchSecurityEvents(supabase, 15)
        renderSecurityEvents(data || [])
      }catch(err){
        console.warn('Security events not available:', err)
        securityEventsList.innerHTML = ''
        if(noSecurityEvents){
          noSecurityEvents.style.display = 'block'
          noSecurityEvents.textContent = 'Security events are currently unavailable (database table or policies not configured).'
        }
      }
    }

    async function loadAnnouncements(){
      if(!notifList) return
      try{
        announcements = await fetchAnnouncements(supabase, 30)
        renderAnnouncements()
      }catch(err){
        console.error('Failed to load announcements', err)
        announcements = []
        renderAnnouncements()
      }
    }

    async function loadBleOverview(){
      if(!bleOverviewList) return
      try{
        const data = await fetchBleScans(supabase, 500)
        renderBleOverview(data || [])
      }catch(err){
        console.warn('BLE overview not available:', err)
        bleOverviewList.innerHTML = ''
        if(bleOverviewEmpty){
          bleOverviewEmpty.style.display = 'block'
          bleOverviewEmpty.textContent = 'BLE overview is currently unavailable (ble_scans table or policies not configured).'
        }
      }
    }

    async function loadCapacityAlerts(){
      if(!capacityAlertsTable) return
      try{
        const { data, error } = await supabase
          .from('active_capacity_alerts')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(20)

        if(error) throw error
        renderCapacityAlerts(data || [])
      }catch(err){
        console.warn('Capacity alerts not available:', err)
        if(capacityAlertsEmpty){
          capacityAlertsEmpty.style.display = 'block'
          capacityAlertsEmpty.textContent = 'Capacity alerts are currently unavailable (view not configured).'
        }
      }
    }

    async function loadCapacityStatus(){
      try{
        const { data, error } = await supabase
          .from('current_resource_capacity')
          .select('id,name,location,max_capacity,current_occupancy,current_percentage,is_full,active_alert_count,latest_alert_time')
          .order('name', { ascending: true })

        if(error) throw error
        renderCapacityStatus(data || [])
      }catch(err){
        console.warn('Capacity status not available:', err)
        renderCapacityStatus([])
      }
    }

    if(searchInput){
      searchInput.addEventListener('input', renderResources)
    }

    if(exportSecurityBtn){
      exportSecurityBtn.addEventListener('click', exportSecurityEventsAsText)
    }
    if(copySecurityTextBtn){
      copySecurityTextBtn.addEventListener('click', copySecurityTextToClipboard)
    }

    if(logoutBtn){
      logoutBtn.addEventListener('click', async () => {
        try {
          await supabase.auth.signOut()
        } catch (e) {
          console.error('Sign out failed', e)
        }
        window.location.href = 'FrameHome.html'
      })
    }

    if(roleUserSelect){
      roleUserSelect.addEventListener('change', syncRoleSelection)
    }

    if(updateRoleBtn){
      updateRoleBtn.addEventListener('click', async () => {
        if(!roleUserSelect || !roleSelect) return
        const userId = roleUserSelect.value
        const user = roleUsersById[userId]

        if(!userId || !user){
          setRoleStatus('Please select a user first.', true)
          return
        }

        const nextRole = roleSelect.value === 'admin' ? 'admin' : 'member'
        updateRoleBtn.disabled = true
        setRoleStatus('Updating role for ' + formatUserLabel(user) + '...')

        try{
          await updateUserRole(supabase, userId, nextRole)
          await loadRoleUsers(userId)
          setRoleStatus('Role updated to ' + displayRole(nextRole) + '.')
        }catch(err){
          console.error('Role update failed', err)
          setRoleStatus('Role update failed. Please try again.', true)
        }finally{
          updateRoleBtn.disabled = false
        }
      })
    }

    await loadResources()
    await loadSecurityEvents()
    await loadAnnouncements()
    await loadBleOverview()
    await loadCapacityAlerts()
    await loadCapacityStatus()
    await loadRoleUsers()

    setInterval(loadResources, 30000)
    setInterval(loadSecurityEvents, 15000)
    setInterval(loadAnnouncements, 30000)
    setInterval(loadBleOverview, 15000)
    setInterval(loadCapacityAlerts, 15000)
    setInterval(loadCapacityStatus, 30000)
  } catch (err) {
    console.error('Admin panel error:', err)
  }
})()
