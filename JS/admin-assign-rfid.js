import { supabase } from './supabase-auth.js'
import { checkAdminAuth } from './admin-auth.js'
import { fetchAssignableUsersForAdminUi, assignRfidTagToUser, fetchRecentUnassignedRfidTaps } from './services/adminpanel-data.js'

async function init(){
  try {
    await checkAdminAuth('FrameLogin.html', 'FrameAdminPanel.html')
  } catch (e) {}

  const userSelect = document.getElementById('userSelect')
  const rfidInput = document.getElementById('rfidInput')
  const assignBtn = document.getElementById('assignBtn')
  const status = document.getElementById('rfidStatus')
  const tagName = document.getElementById('tagName')
  const recentTapList = document.getElementById('recentTapList')
  const recentTapMeta = document.getElementById('recentTapMeta')
  const refreshRecentTapsBtn = document.getElementById('refreshRecentTapsBtn')

  const tapTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  function setStatus(msg, isError){
    if(!status) return
    status.textContent = msg
    status.classList.toggle('error', !!isError)
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function formatTapTime(value) {
    const date = value ? new Date(value) : null
    if (!date || Number.isNaN(date.getTime())) return 'Unknown time'
    return tapTimeFormatter.format(date)
  }

  function shortTagValue(value) {
    const cleaned = String(value || '').trim().replace(/\s+/g, '').toUpperCase()
    if (!cleaned) return 'Unknown tag'
    return cleaned.length > 8 ? cleaned.slice(0, 8) : cleaned
  }

  function getDisplayTagUid(tap) {
    const payloadUid = tap && tap.payload && typeof tap.payload === 'object' ? tap.payload.tag_uid : ''
    if (payloadUid) return shortTagValue(payloadUid)
    if (tap && tap.tag_uid) return shortTagValue(tap.tag_uid)
    return shortTagValue(tap && tap.tag_hash ? tap.tag_hash : '')
  }

  function renderRecentTaps(taps) {
    if (!recentTapList) return

    if (!taps || taps.length === 0) {
      recentTapList.innerHTML = '<div class="rfid-tap-empty">No unassigned taps yet.</div>'
      if (recentTapMeta) recentTapMeta.textContent = 'Nothing to show yet.'
      return
    }

    recentTapList.innerHTML = taps.map((tap) => {
      const tagUid = escapeHtml(getDisplayTagUid(tap))
      const scannedAt = formatTapTime(tap.scanned_at)
      const sensorId = escapeHtml(tap.sensor_id || 'Unknown sensor')
      return `
        <article class="rfid-tap-item">
          <div class="rfid-tap-top">
            <strong>${tagUid}</strong>
            <span class="rfid-tap-badge">Unassigned</span>
          </div>
          <div class="rfid-tap-meta">Seen ${scannedAt} • Sensor ${sensorId}</div>
        </article>
      `
    }).join('')

    if (recentTapMeta) {
      recentTapMeta.textContent = `Showing ${taps.length} recent unassigned tap${taps.length === 1 ? '' : 's'}.`
    }
  }

  async function loadRecentTaps() {
    if (!recentTapList) return

    if (recentTapMeta) recentTapMeta.textContent = 'Loading recent taps…'
    try {
      const taps = await fetchRecentUnassignedRfidTaps(supabase, 10)
      renderRecentTaps(taps)
    } catch (err) {
      console.error('Failed to load recent unassigned RFID taps', err)
      recentTapList.innerHTML = '<div class="rfid-tap-empty error">Unable to load recent taps.</div>'
      if (recentTapMeta) recentTapMeta.textContent = 'Could not load recent taps.'
    }
  }

  async function loadUsers(){
    try {
      const users = await fetchAssignableUsersForAdminUi(supabase)
      userSelect.innerHTML = ''
      if (!users || users.length === 0) {
        userSelect.appendChild(new Option('No available users', ''))
        setStatus('All users already have active RFID tags.', true)
        return
      }

      userSelect.appendChild(new Option('Select a user', ''))
      users.forEach(u => {
        const label = (u.name && u.name.trim()) ? (u.name + ' — ' + (u.email || u.id)) : (u.email || u.id)
        userSelect.appendChild(new Option(label, u.id))
      })
    } catch (err) {
      console.error('Failed to load users', err)
      userSelect.innerHTML = '<option value="">Unable to load users</option>'
    }
  }

  // Allow scanner input via focused input (most RFID readers behave like keyboards)
  if(rfidInput) {
    rfidInput.addEventListener('keyup', (ev) => {
      if(ev.key === 'Enter') {
        rfidInput.blur()
        setStatus('Tag read: ' + rfidInput.value)
      }
    })
  }

  if (refreshRecentTapsBtn) {
    refreshRecentTapsBtn.addEventListener('click', () => {
      loadRecentTaps()
    })
  }

  // Assign handler
  if(assignBtn){
    assignBtn.addEventListener('click', async () => {
      const userId = userSelect.value
      const uid = (rfidInput.value || '').trim()
      const name = (tagName.value || '').trim()

      if(!userId){ setStatus('Please select a user', true); return }
      if(!uid){ setStatus('Please scan or enter an RFID UID', true); return }

      assignBtn.disabled = true
      setStatus('Assigning tag…')
      try {
        await assignRfidTagToUser(supabase, userId, uid, name || null)
        setStatus('Tag assigned successfully')
        rfidInput.value = ''
        tagName.value = ''
      } catch (err) {
        console.error('Assign failed', err)
        setStatus('Assign failed: ' + (err.message || err), true)
      } finally {
        assignBtn.disabled = false
      }
    })
  }

  // Quick focus on scan input
  if(rfidInput) {
    rfidInput.focus()
  }

  await Promise.all([
    loadUsers(),
    loadRecentTaps()
  ])

  setInterval(() => {
    loadRecentTaps().catch(() => {})
  }, 10000)
}

init().catch(err => console.error('admin-assign-rfid init failed', err))
