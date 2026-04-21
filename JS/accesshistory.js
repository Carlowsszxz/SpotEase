import { checkAuth } from './auth.js'
import { supabase } from './supabase-auth.js'

(async function(){
  const ok = await checkAuth('FrameLogin.html');
  if(!ok) return;

  var MANILA_TIMEZONE = 'Asia/Manila';
  var MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  var MANILA_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  var listEl = document.getElementById('accessHistoryList');
  var helpEl = document.getElementById('historyHelp');
  var emptyEl = document.getElementById('historyEmpty');
  var errEl = document.getElementById('historyErr');
  var searchEl = document.getElementById('historySearch');
  var rangeEl = document.getElementById('historyRange');
  var refreshBtn = document.getElementById('historyRefresh');
  var countEl = document.getElementById('historyCount');
  var lastTapEl = document.getElementById('historyLastTap');

  var allRows = [];
  var resourceMap = {};

  function manilaDateKey(dateLike){
    var d = new Date(dateLike);
    if(isNaN(d.getTime())) return '';
    return MANILA_DATE_KEY_FORMATTER.format(d);
  }

  function formatWhen(ts){
    if(!ts) return '—';

    var raw = ts;
    var s = (typeof ts === 'string') ? ts.trim() : ts;

    if(typeof s === 'string'){
      if(s.indexOf('T') === -1 && s.indexOf(' ') !== -1) s = s.replace(' ', 'T');
      var hasTz = (s.endsWith('Z') || s.indexOf('+') !== -1 || /-\d\d:?\d\d$/.test(s));
      if(!hasTz) s = s + 'Z';
    }

    var d = new Date(s);
    if(isNaN(d.getTime())) return (typeof raw === 'string') ? raw : '—';
    return MANILA_DATE_TIME_FORMATTER.format(d);
  }

  function setError(text){
    if(!errEl) return;
    var msg = text ? String(text) : '';
    errEl.textContent = msg;
    errEl.style.display = msg ? 'block' : 'none';
  }

  function setEmpty(isEmpty){
    if(emptyEl) emptyEl.style.display = isEmpty ? 'block' : 'none';
  }

  function setHelp(text){
    if(!helpEl) return;
    helpEl.textContent = text || '';
  }

  function renderRows(rows, resourceMap){
    if(!listEl) return;
    listEl.innerHTML = '';

    if(!rows || !rows.length){
      setEmpty(true);
      setHelp('No activity yet for your assigned RFID tag.');
      return;
    }

    setEmpty(false);
    setHelp('Showing your latest ' + rows.length + ' RFID taps.');

    if(countEl) countEl.textContent = String(rows.length);
    if(lastTapEl) lastTapEl.textContent = rows.length ? formatWhen(rows[0].scanned_at) : '—';

    rows.forEach(function(row){
      var li = document.createElement('li');

      var where = document.createElement('div');
      where.className = 'access-where';
      var resource = resourceMap && row.resource_id ? resourceMap[row.resource_id] : null;
      if(resource && resource.name){
        where.textContent = resource.location ? (resource.name + ' • ' + resource.location) : resource.name;
      } else {
        where.textContent = 'Tap recorded';
      }

      var when = document.createElement('div');
      when.className = 'access-when';
      when.textContent = formatWhen(row.scanned_at);

      li.appendChild(where);
      li.appendChild(when);
      listEl.appendChild(li);
    });
  }

  function applyFilters(rows){
    var list = rows || [];
    var q = searchEl ? String(searchEl.value || '').trim().toLowerCase() : '';
    var range = rangeEl ? String(rangeEl.value || 'all') : 'all';
    var now = Date.now();

    return list.filter(function(row){
      var resource = (resourceMap && row.resource_id) ? resourceMap[row.resource_id] : null;
      var whereText = resource && resource.name
        ? (resource.location ? (resource.name + ' ' + resource.location) : resource.name)
        : 'tap recorded';

      if(q && whereText.toLowerCase().indexOf(q) === -1) return false;

      if(range !== 'all'){
        var d = new Date(row.scanned_at);
        if(isNaN(d.getTime())) return false;
        if(range === 'today'){
          if(manilaDateKey(d) !== manilaDateKey(Date.now())) return false;
        } else if(range === '7d'){
          if(now - d.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
        } else if(range === '30d'){
          if(now - d.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }

  function renderFiltered(){
    var filtered = applyFilters(allRows);
    renderRows(filtered, resourceMap);
    if(!filtered.length && allRows.length){
      setHelp('No taps match your filters.');
      if(lastTapEl) lastTapEl.textContent = '—';
    }
  }

  async function load(){
    try{
      setError('');
      setHelp('Loading…');
      setEmpty(false);
      if(listEl) listEl.innerHTML = '';

      const { data } = await supabase.auth.getUser();
      const user = data && data.user;
      if(!user){
        setHelp('');
        setEmpty(true);
        return;
      }

      const { data: scans, error: scansErr } = await supabase
        .from('rfid_scans')
        .select('scanned_at, resource_id')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(200);

      if(scansErr){
        setHelp('');
        setEmpty(true);
        setError('RFID activity is not available yet (missing database migration/policies).');
        return;
      }

      var rows = scans || [];
      var ids = [];
      var seen = {};
      rows.forEach(function(row){
        if(row && row.resource_id && !seen[row.resource_id]){
          seen[row.resource_id] = true;
          ids.push(row.resource_id);
        }
      });

      resourceMap = {};
      if(ids.length){
        const { data: resources, error: resErr } = await supabase
          .from('resources')
          .select('id,name,location')
          .in('id', ids);

        if(!resErr && resources){
          resources.forEach(function(r){ resourceMap[r.id] = r; });
        }
      }

      allRows = rows;
      renderFiltered();
    }catch(e){
      setHelp('');
      setEmpty(true);
      setError('RFID activity is not available yet.');
      if(countEl) countEl.textContent = '0';
      if(lastTapEl) lastTapEl.textContent = '—';
    }
  }

  [searchEl, rangeEl].forEach(function(el){
    if(el) el.addEventListener('input', renderFiltered);
  });
  if(refreshBtn) refreshBtn.addEventListener('click', load);

  await load();
})();
