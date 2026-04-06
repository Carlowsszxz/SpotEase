import { supabase, getCurrentUser, ensureValidAuth } from './supabase-auth.js'

// greet, render stats, upcoming reservations and alerts (module)
(async function(){
    // Validate user has a valid record in users table before showing dashboard
    await ensureValidAuth()
    
    var name = 'User';
    try { name = localStorage.getItem('pm_username') || name; } catch(e){}

        // attempt to fetch signed-in user's profile (prefer `name` from users table)
        try {
            const user = await getCurrentUser();
            if (user) {
                try {
                    const { data: profile, error: profileErr } = await supabase.from('users').select('name').eq('id', user.id).single();
                    if (!profileErr && profile && profile.name) {
                        name = profile.name;
                        try { localStorage.setItem('pm_username', name); } catch(e){}
                    } else if (user.email) {
                        // fallback to email if no name in profile
                        name = user.email;
                        try { localStorage.setItem('pm_username', name); } catch(e){}
                    }
                } catch (e) {
                    // if profile fetch failed, fallback to email
                    if (user.email) {
                        name = user.email;
                        try { localStorage.setItem('pm_username', name); } catch(e){}
                    }
                }
            }
        } catch (e) {
            // ignore
        }

    // UI elements
    var userEl = document.getElementById('userName');
    var activeResCountEl = document.getElementById('activeReservationsCount');
    var upcomingCountEl = document.getElementById('upcomingCount');
    var totalCountEl = document.getElementById('totalCount');
    var nextReservationTimeEl = document.getElementById('nextReservationTime');
    var upcomingList = document.getElementById('upcomingList');
    var alertsList = document.getElementById('alertsList');
    var noUpcoming = document.getElementById('noUpcoming');

    if(userEl) userEl.textContent = name;

    // Loading / error UI helpers
    var loadingOverlay = document.getElementById('loadingOverlay');
    var statusBar = document.getElementById('statusBar');
    var retryBtn = document.getElementById('retryBtn');
    var lastUpdatedEl = document.getElementById('lastUpdated');

    function setButtonsDisabled(v){
        [reserveBtn, viewMapBtn].forEach(function(b){ if(!b) return; b.disabled = !!v; b.setAttribute('aria-busy', !!v); });
    }

    function showLoading(){
        if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','false');
        if(activeResCountEl) { activeResCountEl.classList.add('skeleton'); activeResCountEl.textContent = ''; }
        if(upcomingCountEl) { upcomingCountEl.classList.add('skeleton'); upcomingCountEl.textContent = ''; }
        if(totalCountEl) { totalCountEl.classList.add('skeleton'); totalCountEl.textContent = ''; }
        if(nextReservationTimeEl) { nextReservationTimeEl.classList.add('skeleton'); nextReservationTimeEl.textContent = ''; }
        if(upcomingList) upcomingList.innerHTML = '';
        if(noUpcoming){ noUpcoming.style.display = 'block'; noUpcoming.textContent = 'loading...'; }
        if(alertsList){ alertsList.innerHTML = '<li class="small-muted">loading...</li>'; }
        if(statusBar) { statusBar.textContent = ''; statusBar.classList.remove('error'); statusBar.style.display = 'none'; }
        if(lastUpdatedEl) lastUpdatedEl.textContent = '';
        setButtonsDisabled(true);
    }

    function hideLoading(){
        if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','true');
        if(activeResCountEl) { activeResCountEl.classList.remove('skeleton'); }
        if(upcomingCountEl) { upcomingCountEl.classList.remove('skeleton'); }
        if(totalCountEl) { totalCountEl.classList.remove('skeleton'); }
        if(nextReservationTimeEl) { nextReservationTimeEl.classList.remove('skeleton'); }
        if(noUpcoming && upcomingList && upcomingList.children.length>0) noUpcoming.style.display = 'none';
        setButtonsDisabled(false);
    }

    function setStatus(msg, isError){
        if(!statusBar) return;
        var text = (msg == null) ? '' : String(msg);
        var trimmed = text.trim();

        if(!trimmed){
            statusBar.textContent = '';
            statusBar.classList.remove('error');
            statusBar.style.display = 'none';
            if(retryBtn) retryBtn.style.display = 'none';
            return;
        }

        statusBar.textContent = text;
        statusBar.style.display = '';
        if(isError) statusBar.classList.add('error'); else statusBar.classList.remove('error');
        if(retryBtn) retryBtn.style.display = isError ? 'inline-block' : 'none';
    }

    // Render functions
    function renderStats(stats){
        if(activeResCountEl) activeResCountEl.textContent = stats.activeToday || 0;
        if(upcomingCountEl) upcomingCountEl.textContent = stats.upcoming7days || 0;
        if(totalCountEl) totalCountEl.textContent = stats.totalThisMonth || 0;
        if(nextReservationTimeEl) nextReservationTimeEl.textContent = stats.nextReservationTime || '—';
    }

    function renderUpcoming(list){
        if(!upcomingList) return;
        upcomingList.innerHTML = '';
        if(!list || list.length===0){
            if(noUpcoming){ noUpcoming.style.display = 'block'; noUpcoming.textContent = 'No upcoming reservations.'; }
            return;
        }
        if(noUpcoming) noUpcoming.style.display = 'none';
        list.slice(0, 5).forEach(function(r){
            var li = document.createElement('li');
            var left = document.createElement('div');
            var right = document.createElement('div');
            var dateObj = new Date(r.reserved_from);
            var timeStr = dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
            var dateStr = dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            left.innerHTML = '<strong>'+r.resource_id+'</strong><div class="meta">'+dateStr+' at '+timeStr+'</div>';
            right.innerHTML = '<span class="meta">'+r.status+'</span>';
            li.appendChild(left); li.appendChild(right);
            upcomingList.appendChild(li);
        });
    }

    function renderAlerts(list){
        if(!alertsList) return;
        alertsList.innerHTML = '';
        if(!list || list.length===0){
            alertsList.innerHTML = '<li class="small-muted">No alerts</li>';
            return;
        }
        list.forEach(function(a){
            var li = document.createElement('li');
            li.textContent = a.text || a.message || a.title || '';
            alertsList.appendChild(li);
        });
    }

    // wire actions
    var reserveBtn = document.getElementById('reserveBtn');
    if(reserveBtn){
        reserveBtn.addEventListener('click', function(){
            window.location.href = 'FrameReservation.html';
        });
    }

    var viewMapBtn = document.getElementById('viewMapBtn');
    if(viewMapBtn){
        viewMapBtn.addEventListener('click', function(){
            window.location.href = 'FrameMap.html';
        });
    }

    var logout = document.getElementById('logout');
    if(logout){
        logout.addEventListener('click', async function(){
            try {
                // Sign out from Supabase auth
                const { error } = await supabase.auth.signOut();
                if (error) console.warn('Supabase signOut error:', error);
            } catch (e) {
                console.error('Error during signOut', e);
            }
            try { localStorage.removeItem('pm_username'); } catch(e){}
            // Redirect to login
            window.location.href = 'FrameLogin.html';
        });
    }

    // initial render: show loading until API provides data
    showLoading();

    // Attempt to load real data from Supabase (best-effort). Shows error and retry on failure.
    async function loadData(){
        showLoading();
        setStatus('Loading...', false);
        try{
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;
            
            if (!userId) {
                renderUpcoming([]);
                renderAlerts([]);
                renderStats({ activeToday: 0, upcoming7days: 0, totalThisMonth: 0, nextReservationTime: '—' });
                hideLoading();
                setStatus('User not authenticated', true);
                return;
            }

            // Fetch user's reservations
            const { data: reservations, error: resErr } = await supabase
                .from('reservations')
                .select('*')
                .eq('user_id', userId)
                .order('reserved_from', { ascending: true });
            
            if (resErr) throw resErr;
            
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var tomorrow = new Date(today.getTime() + 86400000);
            var sevenDaysFromNow = new Date(today.getTime() + 7 * 86400000);
            var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            var thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            
            var activeToday = 0;
            var upcoming7days = 0;
            var totalThisMonth = 0;
            var nextReservation = null;
            var upcomingReservations = [];
            
            (reservations || []).forEach(function(r){
                var startTime = new Date(r.reserved_from);
                var endTime = new Date(r.reserved_until);
                
                // Count active today (currently happening)
                if(startTime <= now && endTime >= now && r.status !== 'cancelled'){
                    activeToday++;
                }
                
                // Count upcoming in next 7 days
                if(startTime > now && startTime < sevenDaysFromNow && r.status !== 'cancelled'){
                    upcoming7days++;
                }
                
                // Count total this month
                if(startTime >= thisMonthStart && startTime < thisMonthEnd && r.status !== 'cancelled'){
                    totalThisMonth++;
                }
                
                // Track next reservation
                if(startTime > now && r.status !== 'cancelled' && !nextReservation){
                    nextReservation = r;
                }
                
                // Collect upcoming for display
                if(startTime > now && r.status !== 'cancelled'){
                    upcomingReservations.push(r);
                }
            });
            
            var nextReservationTime = '—';
            if(nextReservation){
                var nextTime = new Date(nextReservation.reserved_from);
                var diffMs = nextTime - now;
                if(diffMs < 3600000){
                    nextReservationTime = Math.round(diffMs / 60000) + 'min';
                } else if(diffMs < 86400000){
                    nextReservationTime = Math.round(diffMs / 3600000) + 'h';
                } else {
                    nextReservationTime = Math.round(diffMs / 86400000) + 'd';
                }
            }
            
            // Render everything
            renderStats({
                activeToday: activeToday,
                upcoming7days: upcoming7days,
                totalThisMonth: totalThisMonth,
                nextReservationTime: nextReservationTime
            });
            renderUpcoming(upcomingReservations);
            
            // Simple alerts
            var alerts = [];
            if(activeToday > 0){
                alerts.push({ text: 'You have ' + activeToday + ' active reservation(s) today' });
            }
            if(upcoming7days > 0){
                alerts.push({ text: 'You have ' + upcoming7days + ' upcoming reservation(s) this week' });
            }
            if(nextReservation){
                alerts.push({ text: 'Next reservation: ' + new Date(nextReservation.reserved_from).toLocaleString() });
            }
            renderAlerts(alerts);

            hideLoading();
            var updateTime = new Date();
            if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + updateTime.toLocaleString();
            // Success: hide the status bar (reserve it for loading/errors)
            setStatus('', false);
        }catch(err){
            console.error('loadData error', err);
            hideLoading();
            setStatus('Failed to load data: ' + (err.message || err), true);
        }
    }

    if(retryBtn){ retryBtn.addEventListener('click', function(){ loadData(); }); }

    // Start loading data
    loadData();

})();
