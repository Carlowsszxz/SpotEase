/* Audit logs viewer (demo). Logs are stored in localStorage under 'pm_audit_logs'.
   Features: filtering, pagination, expandable details (JSON viewer), seeding demo logs.
*/
(function(){
  var storageKey = 'pm_audit_logs';

  function load(){ try{ return JSON.parse(localStorage.getItem(storageKey) || '[]'); }catch(e){ return []; } }
  function save(list){ try{ localStorage.setItem(storageKey, JSON.stringify(list)); }catch(e){} }

  var logs = [];
  var tbody = document.getElementById('logsTbody');
  var filterAction = document.getElementById('filterAction');
  var filterUser = document.getElementById('filterUser');
  var filterResource = document.getElementById('filterResource');
  var filterFrom = document.getElementById('filterFrom');
  var filterTo = document.getElementById('filterTo');
  var filterKeyword = document.getElementById('filterKeyword');
  var clearBtn = document.getElementById('clearFilters');
  var prevPage = document.getElementById('prevPage');
  var nextPage = document.getElementById('nextPage');
  var pageInfo = document.getElementById('pageInfo');
  var pageSizeSel = document.getElementById('pageSize');

  var currentPage = 1; function pageSize(){ return parseInt(pageSizeSel.value,10) || 10; }

  function populateFilters(){
    var actions = unique(logs.map(function(l){return l.action;})); actions.unshift('all');
    filterAction.innerHTML = actions.map(function(a){ return '<option value="'+a+'">'+(a==='all'?'All':a)+'</option>'}).join('');
    var users = unique(logs.map(function(l){return l.user;})); users.unshift('all'); filterUser.innerHTML = users.map(function(u){ return '<option value="'+u+'">'+(u==='all'?'All':u)+'</option>'}).join('');
    var resources = unique(logs.map(function(l){return l.resource||'';})).filter(Boolean); resources.unshift('all'); filterResource.innerHTML = resources.map(function(r){ return '<option value="'+r+'">'+(r==='all'?'All':r)+'</option>'}).join('');
  }

  function unique(arr){ return arr.filter(function(v,i,a){return a.indexOf(v)===i}); }

  function render(){
    logs = load().sort(function(a,b){ return new Date(b.ts) - new Date(a.ts); });
    populateFilters();
    var filtered = logs.filter(function(l){
      var a = filterAction.value || 'all'; if(a!=='all' && l.action!==a) return false;
      var u = filterUser.value || 'all'; if(u!=='all' && l.user!==u) return false;
      var r = filterResource.value || 'all'; if(r!=='all' && (l.resource||'')!==r) return false;
      var k = (filterKeyword.value||'').toLowerCase(); if(k && JSON.stringify(l.details).toLowerCase().indexOf(k)===-1 && (l.user||'').toLowerCase().indexOf(k)===-1) return false;
      var from = filterFrom.value; var to = filterTo.value; if(from && new Date(l.ts) < new Date(from+'T00:00:00')) return false; if(to && new Date(l.ts) > new Date(to+'T23:59:59')) return false;
      return true;
    });

    var total = filtered.length; var ps = pageSize(); var pages = Math.max(1, Math.ceil(total/ps)); if(currentPage>pages) currentPage = pages;
    var start = (currentPage-1)*ps; var pageItems = filtered.slice(start, start+ps);

    tbody.innerHTML = '';
    pageItems.forEach(function(l,idx){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+formatTs(l.ts)+'</td><td>'+escapeHtml(l.user)+'</td><td>'+escapeHtml(l.action)+'</td><td>'+escapeHtml(l.resource||'')+'</td><td><button class="btn view-details">View</button></td>';
      tbody.appendChild(tr);
      // details row
      var dtr = document.createElement('tr'); dtr.className='details-row'; dtr.style.display='none'; var dtd = document.createElement('td'); dtd.colSpan=5; dtd.className='details-cell'; dtd.textContent = JSON.stringify(l.details, null, 2); dtr.appendChild(dtd); tbody.appendChild(dtr);
      tr.querySelector('.view-details').addEventListener('click', function(){ dtr.style.display = dtr.style.display==='none' ? 'table-row' : 'none'; });
    });

    pageInfo.textContent = 'Page '+currentPage+' of '+pages+' ('+total+' items)';
  }

  function formatTs(ts){ var d = new Date(ts); return d.toISOString().replace('T',' ').split('.')[0]; }
  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  clearBtn.addEventListener('click',function(){ filterAction.value='all'; filterUser.value='all'; filterResource.value='all'; filterFrom.value=''; filterTo.value=''; filterKeyword.value=''; currentPage=1; render(); });
  [filterAction,filterUser,filterResource,filterFrom,filterTo,filterKeyword,pageSizeSel].forEach(function(el){ if(el) el.addEventListener('input', function(){ currentPage=1; render(); }); });
  prevPage.addEventListener('click', function(){ if(currentPage>1){ currentPage--; render(); } }); nextPage.addEventListener('click', function(){ currentPage++; render(); });

  // init
  render();

})();
