import { supabase, getCurrentUser, ensureValidAuth } from './supabase-auth.js'
import {
    getDashboardUserName,
    fetchOccupancyResources,
    fetchSensorsCoverage,
    fetchRecentOccupancyEvents,
    fetchResourcesByIds,
    fetchActiveAnnouncements
} from './services/dashboard-data.js'

(async function(){
    await ensureValidAuth();

    var name = await getDashboardUserName(supabase, getCurrentUser);

    // UI elements
    var userEl = document.getElementById('userName');
    var peopleInsideNowEl = document.getElementById('peopleInsideNow');
    var activeSpacesCountEl = document.getElementById('activeSpacesCount');
    var nearFullSpacesCountEl = document.getElementById('nearFullSpacesCount');
    var fullSpacesCountEl = document.getElementById('fullSpacesCount');

    var sensorsInstalledCountEl = document.getElementById('sensorsInstalledCount');
    var spacesCoveredCountEl = document.getElementById('spacesCoveredCount');
    var noSensorsEl = document.getElementById('noSensors');

    var activityListEl = document.getElementById('activityList');
    var noActivityEl = document.getElementById('noActivity');
    var activityFooterEl = document.getElementById('activityFooter');

    var toggleActivityPanelBtn = document.getElementById('toggleActivityPanelBtn');
    var toggleActivityBtn = document.getElementById('toggleActivityBtn');
    var activityPanelExpanded = false;
    var activityExpanded = false;
    var activityAllItems = [];
    var activityCollapsedLimit = 6;

    var alertsList = document.getElementById('alertsList');
    var systemAlerts = [];
    var announcementAlerts = [];

    // Live occupancy UI
    var occupancyCards = document.getElementById('occupancyCards');
    var noOccupancy = document.getElementById('noOccupancy');
    var occupancySample = document.getElementById('occupancySample');
    var occupancyCache = new Map();
    var occupancyCardEls = new Map();
    var occupancyChannel = null;
    var occupancyPollTimer = null;
    var occupancyPollMs = 1000;
    var occupancyPollStopped = false;
    var occupancyLoadInFlight = false;

    // Activity polling
    var activityTimer = null;
    var activityChannel = null;
    var lastActivityId = null;

    // Loading / error UI helpers
    var loadingOverlay = document.getElementById('loadingOverlay');
    var statusBar = document.getElementById('statusBar');
    var retryBtn = document.getElementById('retryBtn');
    var lastUpdatedEl = document.getElementById('lastUpdated');

    var viewMapBtn = document.getElementById('viewMapBtn');
    var viewSensorsBtn = document.getElementById('viewSensorsBtn');
    var openEmergencyBtn = document.getElementById('openEmergencyBtn');

    if(userEl) userEl.textContent = name;

    function setButtonsDisabled(v){
        [viewMapBtn, viewSensorsBtn, openEmergencyBtn].forEach(function(b){
            if(!b) return;
            b.disabled = !!v;
            b.setAttribute('aria-busy', !!v);
        });
    }

    function setStatLoading(el, isLoading){
        if(!el) return;
        if(isLoading){
            el.classList.add('skeleton');
            el.textContent = '';
        } else {
            el.classList.remove('skeleton');
        }
    }

    function showLoading(){
        if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','false');
        setStatLoading(peopleInsideNowEl, true);
        setStatLoading(activeSpacesCountEl, true);
        setStatLoading(nearFullSpacesCountEl, true);
        setStatLoading(fullSpacesCountEl, true);

        if(occupancyCards) occupancyCards.innerHTML = '';
        if(noOccupancy){ noOccupancy.style.display = 'block'; noOccupancy.textContent = 'loading...'; }

        setStatLoading(sensorsInstalledCountEl, true);
        setStatLoading(spacesCoveredCountEl, true);
        if(noSensorsEl){ noSensorsEl.style.display = 'block'; noSensorsEl.textContent = 'loading...'; }

        if(activityListEl) activityListEl.innerHTML = '';
        if(noActivityEl){ noActivityEl.style.display = 'block'; noActivityEl.textContent = 'loading...'; }

        if(alertsList){ alertsList.innerHTML = '<li class="small-muted">loading...</li>'; }

        if(statusBar) { statusBar.textContent = ''; statusBar.classList.remove('error'); statusBar.style.display = 'none'; }
        if(lastUpdatedEl) lastUpdatedEl.textContent = '';
        setButtonsDisabled(true);
    }

    function hideLoading(){
        if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','true');
        setStatLoading(peopleInsideNowEl, false);
        setStatLoading(activeSpacesCountEl, false);
        setStatLoading(nearFullSpacesCountEl, false);
        setStatLoading(fullSpacesCountEl, false);
        setStatLoading(sensorsInstalledCountEl, false);
        setStatLoading(spacesCoveredCountEl, false);
        setButtonsDisabled(false);
    }

    function occupancyStatus(current, capacity){
        var c = Number(current || 0);
        var cap = Number(capacity || 0);
        if(!cap || cap <= 0) return 'Unknown';
        if(c >= cap) return 'Full';
        if(c / cap >= 0.8) return 'Near full';
        return 'Available';
    }

    function occupancySeverityRank(r){
        if(!r) return 99;
        var current = Number(r.current_occupancy || 0);
        var cap = Number(r.capacity || 0);
        var status = occupancyStatus(current, cap);
        if(status === 'Full') return 0;
        if(status === 'Near full') return 1;
        if(status === 'Available') return 2;
        return 3;
    }

    function formatWhen(ts){
        if(!ts) return '';
        var d = new Date(ts);
        if(isNaN(d.getTime())) return '';
        return d.toLocaleString();
    }

    function escapeHtml(s){
        return String(s == null ? '' : s)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
    }

    function setRollingNumber(containerEl, value){
        if(!containerEl) return;

        var v = Number(value || 0);
        if(!isFinite(v)) v = 0;
        v = Math.max(0, Math.floor(v));
        var s = String(v);

        // Ensure columns
        var existing = Array.prototype.slice.call(containerEl.querySelectorAll('.roll-col'));

        // If digit count changed, rebuild for simplicity
        if(existing.length !== s.length){
            containerEl.innerHTML = '';
            for(var i=0;i<s.length;i++){
                var col = document.createElement('span');
                col.className = 'roll-col';
                col.dataset.digit = '0';

                var stack = document.createElement('span');
                stack.className = 'roll-stack';

                // 0-9 repeated twice for wrap animation
                for(var r=0;r<2;r++){
                    for(var d=0; d<=9; d++){
                        var dig = document.createElement('span');
                        dig.className = 'roll-digit';
                        dig.textContent = String(d);
                        stack.appendChild(dig);
                    }
                }

                col.appendChild(stack);
                containerEl.appendChild(col);
            }
            existing = Array.prototype.slice.call(containerEl.querySelectorAll('.roll-col'));
        }

        // Roll each digit column
        for(var j=0;j<s.length;j++){
            var desired = parseInt(s[j], 10);
            if(isNaN(desired)) desired = 0;

            var colEl = existing[j];
            var stackEl = colEl.querySelector('.roll-stack');
            var currentDigit = parseInt(colEl.dataset.digit || '0', 10);
            if(isNaN(currentDigit)) currentDigit = 0;

            if(currentDigit === desired){
                stackEl.style.transform = 'translateY(-' + desired + 'em)';
                continue;
            }

            // Ensure the browser recognizes a transition between two frames.
            // Without this, rapid DOM updates can get batched and look like an instant jump.
            stackEl.style.transition = 'none';
            stackEl.style.transform = 'translateY(-' + currentDigit + 'em)';
            void stackEl.offsetHeight;

            // Always roll forward like a slot
            var targetIndex = desired;
            if(desired < currentDigit) targetIndex = desired + 10;

            // Animate to targetIndex (0..19)
            stackEl.style.transition = 'transform 520ms cubic-bezier(.22, 1, .36, 1)';
            stackEl.style.transform = 'translateY(-' + targetIndex + 'em)';

            // If wrapped (>=10), snap back to 0..9 after the animation
            if(targetIndex >= 10){
                (function(colRef, stackRef, desiredRef){
                    var handler = function(){
                        stackRef.removeEventListener('transitionend', handler);
                        stackRef.style.transition = 'none';
                        stackRef.style.transform = 'translateY(-' + desiredRef + 'em)';
                        colRef.dataset.digit = String(desiredRef);
                        // Re-enable transition for next time
                        setTimeout(function(){
                            stackRef.style.transition = 'transform 520ms cubic-bezier(.22, 1, .36, 1)';
                        }, 0);
                    };
                    stackRef.addEventListener('transitionend', handler);
                })(colEl, stackEl, desired);
            } else {
                colEl.dataset.digit = String(desired);
            }
        }
    }

    function buildOccupancyCard(r){
        var card = document.createElement('div');
        card.className = 'occupancy-card';
        card.dataset.resourceId = r.id;

        var top = document.createElement('div');
        top.className = 'occupancy-top';

        var left = document.createElement('div');
        var name = document.createElement('div');
        name.className = 'occupancy-name';
        name.textContent = r.name || r.id;
        left.appendChild(name);

        if(r.location){
            var loc = document.createElement('div');
            loc.className = 'meta';
            loc.textContent = r.location;
            left.appendChild(loc);
        }

        var status = document.createElement('div');
        status.className = 'occupancy-status';
        status.textContent = '—';
        status.dataset.role = 'status';

        top.appendChild(left);
        top.appendChild(status);
        card.appendChild(top);

        var valueRow = document.createElement('div');
        valueRow.className = 'occupancy-value-row';

        var roll = document.createElement('div');
        roll.className = 'roll-number';
        roll.dataset.role = 'roll';
        valueRow.appendChild(roll);

        var suffix = document.createElement('div');
        suffix.className = 'capacity-suffix';
        suffix.dataset.role = 'cap';
        valueRow.appendChild(suffix);

        card.appendChild(valueRow);

        return card;
    }

    function updateOccupancyCard(card, r){
        if(!card || !r) return;
        var nameEl = card.querySelector('.occupancy-name');
        if(nameEl) nameEl.textContent = r.name || r.id;

        var statusEl = card.querySelector('[data-role="status"]');
        var current = Number(r.current_occupancy || 0);
        var cap = Number(r.capacity || 0);
        if(statusEl) statusEl.textContent = occupancyStatus(current, cap);

        var rollEl = card.querySelector('[data-role="roll"]');
        setRollingNumber(rollEl, current);

        var capEl = card.querySelector('[data-role="cap"]');
        if(capEl) capEl.textContent = '/ ' + cap;
    }

    function renderOccupancyFromCache(){
        if(!occupancyCards) return;
        var list = Array.from(occupancyCache.values())
            .filter(function(r){ return r && (r.is_active === true || r.is_active == null); })
            .sort(function(a,b){
                var ar = occupancySeverityRank(a);
                var br = occupancySeverityRank(b);
                if(ar !== br) return ar - br;

                var an = (a.name || '').toLowerCase();
                var bn = (b.name || '').toLowerCase();
                if(an < bn) return -1;
                if(an > bn) return 1;
                return 0;
            });

        if(!list || list.length===0){
            if(noOccupancy){ noOccupancy.style.display = 'block'; noOccupancy.textContent = 'No active resources. Showing sample data below.'; }
            occupancyCards.innerHTML = '';
            occupancyCardEls.clear();
            return;
        }
        if(noOccupancy) noOccupancy.style.display = 'none';

        var nextIds = new Set();
        var ordered = [];
        list.forEach(function(r){
            nextIds.add(r.id);
            var card = occupancyCardEls.get(r.id);
            if(!card){
                card = buildOccupancyCard(r);
                occupancyCardEls.set(r.id, card);
            }
            ordered.push({ r: r, card: card });
        });

        // Remove cards that are no longer present
        Array.from(occupancyCardEls.keys()).forEach(function(id){
            if(!nextIds.has(id)){
                var el = occupancyCardEls.get(id);
                if(el && el.parentNode) el.parentNode.removeChild(el);
                occupancyCardEls.delete(id);
            }
        });

        // Reorder cards in DOM without clearing the container.
        // Important: update rolling numbers AFTER cards are attached so CSS transitions fire.
        ordered.forEach(function(x){
            if(x && x.card) occupancyCards.appendChild(x.card);
        });

        ordered.forEach(function(x){
            updateOccupancyCard(x.card, x.r);
        });
    }

    function renderOpsStatsFromCache(){
        var list = Array.from(occupancyCache.values()).filter(function(r){
            return r && (r.is_active === true || r.is_active == null);
        });

        var peopleInside = 0;
        var activeSpaces = 0;
        var nearFullSpaces = 0;
        var fullSpaces = 0;

        list.forEach(function(r){
            var current = Number(r.current_occupancy || 0);
            var cap = Number(r.capacity || 0);
            if(!isFinite(current)) current = 0;
            if(!isFinite(cap)) cap = 0;
            peopleInside += Math.max(0, current);
            activeSpaces++;
            if(cap > 0){
                if(current >= cap) fullSpaces++;
                else if(current / cap >= 0.8) nearFullSpaces++;
            }
        });

        if(peopleInsideNowEl) peopleInsideNowEl.textContent = String(Math.max(0, Math.floor(peopleInside)));
        if(activeSpacesCountEl) activeSpacesCountEl.textContent = String(activeSpaces);
        if(nearFullSpacesCountEl) nearFullSpacesCountEl.textContent = String(nearFullSpaces);
        if(fullSpacesCountEl) fullSpacesCountEl.textContent = String(fullSpaces);

        // Alerts from current stats (simple + non-reservation)
        systemAlerts = [];
        if(fullSpaces > 0) systemAlerts.push({ type: 'system', message: fullSpaces + ' space(s) are full right now' });
        if(nearFullSpaces > 0) systemAlerts.push({ type: 'system', message: nearFullSpaces + ' space(s) are near full' });
        if(activeSpaces === 0) systemAlerts.push({ type: 'system', message: 'No active spaces found in resources' });

        renderCombinedAlerts();
    }

    async function loadAnnouncementAlerts(){
        try{
            var rows = await fetchActiveAnnouncements(supabase, 8);
            announcementAlerts = (rows || []).map(function(item){
                return {
                    type: 'announcement',
                    title: String(item.title || 'Notice'),
                    message: String(item.message || ''),
                    when: formatAnnouncementRange(item.start_at, item.end_at)
                };
            });
        }catch(err){
            console.warn('loadAnnouncementAlerts error', err);
            announcementAlerts = [];
        }
        renderCombinedAlerts();
    }

    function formatAnnouncementRange(startAt, endAt){
        var from = formatWhen(startAt);
        var until = formatWhen(endAt);
        if(from && until) return from + ' to ' + until;
        if(from) return 'starts ' + from;
        if(until) return 'until ' + until;
        return '';
    }

    function renderCombinedAlerts(){
        var all = [];
        if(Array.isArray(announcementAlerts) && announcementAlerts.length) all = all.concat(announcementAlerts);
        if(Array.isArray(systemAlerts) && systemAlerts.length) all = all.concat(systemAlerts);
        renderAlerts(all);
    }

    async function loadOccupancy(){
        if(occupancyLoadInFlight) return;
        occupancyLoadInFlight = true;
        try{
            const data = await fetchOccupancyResources(supabase);

            occupancyCache.clear();
            (data || []).forEach(function(r){ occupancyCache.set(r.id, r); });
            renderOccupancyFromCache();
            renderOpsStatsFromCache();
        }catch(err){
            console.error('loadOccupancy error', err);
            if(noOccupancy){
                noOccupancy.style.display = 'block';
                noOccupancy.textContent = 'Failed to load live occupancy. Showing sample data below.';
            }
            if(occupancySample){ occupancySample.style.display = ''; occupancySample.setAttribute('aria-hidden','false'); }
            // Still try to show something in quick stats
            if(statusBar) setStatus('Failed to load resources: ' + (err.message || err), true);
        }finally{
            occupancyLoadInFlight = false;
        }
    }

    function startOccupancyPolling(ms){
        if(typeof ms === 'number' && isFinite(ms) && ms > 0) occupancyPollMs = Math.max(250, Math.floor(ms));
        if(occupancyPollTimer) return;
        occupancyPollStopped = false;

        var tick = async function(){
            if(occupancyPollStopped) return;
            try{ await loadOccupancy(); }catch(e){ /* loadOccupancy handles errors */ }
            if(occupancyPollStopped) return;
            occupancyPollTimer = setTimeout(tick, occupancyPollMs);
        };
        tick();
    }

    function stopOccupancyPolling(){
        occupancyPollStopped = true;
        if(!occupancyPollTimer) return;
        clearTimeout(occupancyPollTimer);
        occupancyPollTimer = null;
    }

    function subscribeOccupancyRealtime(){
        if(occupancyChannel) return;

        occupancyChannel = supabase
            .channel('dashboard-resources-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, function(payload){
                try{
                    if(payload && payload.eventType === 'DELETE'){
                        if(payload.old && payload.old.id) occupancyCache.delete(payload.old.id);
                        renderOccupancyFromCache();
                        renderOpsStatsFromCache();
                        return;
                    }

                    if(payload && payload.new && payload.new.id){
                        occupancyCache.set(payload.new.id, payload.new);
                        renderOccupancyFromCache();
                        renderOpsStatsFromCache();
                    }
                }catch(e){
                    console.warn('occupancy realtime handler error', e);
                }
            })

        // Subscribe with status callback when supported (supabase-js v2)
        try{
            occupancyChannel.subscribe(function(status, err){
                try{
                    console.log('occupancy realtime status:', status);
                    if(status === 'SUBSCRIBED'){
                        // Keep polling as a safety net: some environments show SUBSCRIBED
                        // but never deliver events (blocked websockets/publication issues).
                        startOccupancyPolling(1000);
                        // Refresh once to ensure we have the latest snapshot.
                        loadOccupancy();
                    } else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
                        // Fall back to polling so the UI still updates without refresh.
                        startOccupancyPolling(1000);
                    }
                    if(err) console.warn('occupancy realtime subscribe error', err);
                }catch(e){
                    // ignore
                }
            });
        }catch(e){
            // Older client: no status callback. Use polling fallback.
            startOccupancyPolling(1000);
        }
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
    function renderAlerts(list){
        if(!alertsList) return;
        alertsList.innerHTML = '';
        if(!list || list.length===0){
            alertsList.innerHTML = '<li class="small-muted">No alerts</li>';
            return;
        }
        list.forEach(function(a){
            var li = document.createElement('li');
            var isAnnouncement = (a && a.type === 'announcement');
            li.className = isAnnouncement ? 'alert-item alert-announcement' : 'alert-item alert-system';

            if(isAnnouncement){
                var badge = document.createElement('span');
                badge.className = 'alert-badge';
                badge.textContent = 'Notice';
                li.appendChild(badge);

                var title = document.createElement('div');
                title.className = 'alert-title';
                title.textContent = a.title || 'Notice';
                li.appendChild(title);

                if(a.message){
                    var msg = document.createElement('div');
                    msg.className = 'alert-text';
                    msg.textContent = a.message;
                    li.appendChild(msg);
                }

                if(a.when){
                    var meta = document.createElement('div');
                    meta.className = 'alert-meta';
                    meta.textContent = a.when;
                    li.appendChild(meta);
                }
            } else {
                var text = document.createElement('div');
                text.className = 'alert-text';
                text.textContent = (a && (a.message || a.text || a.title)) ? (a.message || a.text || a.title) : '';
                li.appendChild(text);
            }

            alertsList.appendChild(li);
        });
    }

    function renderSensorsCoverage(res){
        if(!res){
            if(noSensorsEl){ noSensorsEl.style.display = 'block'; noSensorsEl.textContent = 'Unable to load sensors.'; }
            if(sensorsInstalledCountEl) sensorsInstalledCountEl.textContent = '—';
            if(spacesCoveredCountEl) spacesCoveredCountEl.textContent = '—';
            return;
        }
        if(sensorsInstalledCountEl) sensorsInstalledCountEl.textContent = String(res.installed || 0);
        if(spacesCoveredCountEl) spacesCoveredCountEl.textContent = String(res.covered || 0);

        if(noSensorsEl){
            if((res.installed || 0) === 0){
                noSensorsEl.style.display = 'block';
                noSensorsEl.textContent = 'No sensors found.';
            } else {
                noSensorsEl.style.display = 'none';
                noSensorsEl.textContent = '';
            }
        }
    }

    async function loadSensorsCoverage(){
        try{
            var coverage = await fetchSensorsCoverage(supabase);
            renderSensorsCoverage(coverage);
        }catch(err){
            console.warn('loadSensorsCoverage error', err);
            renderSensorsCoverage(null);
        }
    }

    function renderActivity(items){
        activityAllItems = Array.isArray(items) ? items.slice() : [];

        if(activityListEl) activityListEl.innerHTML = '';

        if(!items || items.length === 0){
            if(noActivityEl){
                noActivityEl.textContent = 'No recent activity.';
            }

            if(toggleActivityBtn) toggleActivityBtn.style.display = 'none';
            applyActivityPanelVisibility();
            return;
        }

        if(noActivityEl){
            noActivityEl.textContent = '';
        }

        var showToggle = items.length > activityCollapsedLimit;
        if(toggleActivityBtn){
            toggleActivityBtn.style.display = showToggle ? '' : 'none';
            toggleActivityBtn.textContent = activityExpanded ? 'Show less' : 'View all';
        }

        var visible = activityExpanded ? items : items.slice(0, activityCollapsedLimit);
        visible.forEach(function(it){
            var li = document.createElement('li');
            var left = document.createElement('div');
            var right = document.createElement('div');

            var verb = (Number(it.occupancy_change) === 1) ? 'Entered' : 'Exited';
            var who = (it.resource && (it.resource.name || it.resource.location))
                ? (it.resource.name || 'Space')
                : (it.resource_id || 'Space');
            var loc = it.resource && it.resource.location ? it.resource.location : '';

            left.innerHTML = '<strong>' + escapeHtml(verb) + '</strong> · ' + escapeHtml(who)
                + (loc ? '<div class="meta">' + escapeHtml(loc) + '</div>' : '');

            right.innerHTML = '<span class="meta">' + escapeHtml(formatWhen(it.recorded_at)) + '</span>';

            li.appendChild(left);
            li.appendChild(right);
            if(activityListEl) activityListEl.appendChild(li);
        });

        applyActivityPanelVisibility();
    }

    function applyActivityPanelVisibility(){
        var expanded = !!activityPanelExpanded;

        if(toggleActivityPanelBtn){
            toggleActivityPanelBtn.textContent = expanded ? 'Hide activity' : 'Show activity';
        }

        if(activityListEl){
            activityListEl.style.display = expanded ? '' : 'none';
        }

        if(activityFooterEl){
            activityFooterEl.style.display = expanded ? 'flex' : 'none';
        }

        if(noActivityEl){
            if(!expanded){
                noActivityEl.style.display = 'none';
            } else if(!activityAllItems || activityAllItems.length === 0){
                noActivityEl.style.display = 'block';
                if(!noActivityEl.textContent) noActivityEl.textContent = 'No recent activity.';
            } else {
                noActivityEl.style.display = 'none';
            }
        }
    }

    async function loadRecentActivity(){
        try{
            var events = await fetchRecentOccupancyEvents(supabase, 25);

            if(events && events.length > 0){
                lastActivityId = events[0].id;
            }

            var resourceIds = Array.from(new Set((events || []).map(function(e){ return e.resource_id; }).filter(Boolean)));
            var resourcesById = new Map();

            if(resourceIds.length > 0){
                try{
                    const resRows = await fetchResourcesByIds(supabase, resourceIds);
                    (resRows || []).forEach(function(r){ resourcesById.set(r.id, r); });
                }catch(e){
                    // ignore
                }
            }

            var hydrated = (events || []).map(function(e){
                return {
                    id: e.id,
                    resource_id: e.resource_id,
                    occupancy_change: e.occupancy_change,
                    recorded_at: e.recorded_at,
                    resource: e.resource_id ? resourcesById.get(e.resource_id) : null
                };
            });

            renderActivity(hydrated);
        }catch(err){
            console.warn('loadRecentActivity error', err);
            renderActivity([]);
            if(noActivityEl){
                noActivityEl.textContent = 'Recent activity is unavailable.';
            }
            applyActivityPanelVisibility();
        }
    }

    if(toggleActivityPanelBtn){
        toggleActivityPanelBtn.addEventListener('click', function(){
            activityPanelExpanded = !activityPanelExpanded;
            applyActivityPanelVisibility();
        });
    }

    if(toggleActivityBtn){
        toggleActivityBtn.addEventListener('click', function(){
            activityExpanded = !activityExpanded;
            renderActivity(activityAllItems);
        });
    }

    function startActivityPolling(ms){
        var interval = (typeof ms === 'number' && isFinite(ms) && ms > 0) ? Math.max(2000, Math.floor(ms)) : 10000;
        if(activityTimer) return;
        var tick = async function(){
            try{ await loadRecentActivity(); }catch(e){ /* handled */ }
            activityTimer = setTimeout(tick, interval);
        };
        tick();
    }

    function stopActivityPolling(){
        if(!activityTimer) return;
        clearTimeout(activityTimer);
        activityTimer = null;
    }

    function subscribeActivityRealtime(){
        if(activityChannel) return;
        try{
            activityChannel = supabase
                .channel('dashboard-occupancy-events')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'occupancy_events' }, function(payload){
                    try{
                        if(payload && payload.new && payload.new.id){
                            if(lastActivityId && payload.new.id === lastActivityId) return;
                            loadRecentActivity();
                        }
                    }catch(e){
                        // ignore
                    }
                });

            activityChannel.subscribe(function(status){
                if(status === 'SUBSCRIBED'){
                    startActivityPolling(15000);
                }
            });
        }catch(e){
            startActivityPolling(15000);
        }
    }

    // wire actions
    if(viewMapBtn){
        viewMapBtn.addEventListener('click', function(){
            window.location.href = 'FrameMap.html';
        });
    }

    if(viewSensorsBtn){
        viewSensorsBtn.addEventListener('click', function(){
            window.location.href = 'FrameSensorReadings.html';
        });
    }

    if(openEmergencyBtn){
        openEmergencyBtn.addEventListener('click', function(){
            window.location.href = 'FrameEmergency.html';
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
            // Redirect to home
            window.location.href = 'FrameHome.html';
        });
    }

    async function loadAll(){
        showLoading();
        setStatus('Loading...', false);

        try{
            var tasks = [loadOccupancy(), loadAnnouncementAlerts()];

            // Only load admin-style sensor coverage if the panel exists.
            if(sensorsInstalledCountEl || spacesCoveredCountEl || noSensorsEl){
                tasks.push(loadSensorsCoverage());
            }

            // Only load activity if the panel exists.
            if(activityListEl || noActivityEl){
                tasks.push(loadRecentActivity());
            }

            await Promise.all(tasks);

            hideLoading();
            var updateTime = new Date();
            if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + updateTime.toLocaleString();
            setStatus('', false);
        }catch(err){
            console.error('loadAll error', err);
            hideLoading();
            setStatus('Failed to load dashboard: ' + (err.message || err), true);
        }
    }

    if(retryBtn){ retryBtn.addEventListener('click', function(){ loadAll(); }); }

    // start
    loadAll();
    applyActivityPanelVisibility();
    subscribeOccupancyRealtime();
    startOccupancyPolling(1000);
    setInterval(loadAnnouncementAlerts, 30000);

    if(activityListEl || noActivityEl){
        subscribeActivityRealtime();
        startActivityPolling(15000);
    }

    window.addEventListener('beforeunload', function(){
        try{
            stopOccupancyPolling();
            stopActivityPolling();
            if(occupancyChannel) supabase.removeChannel(occupancyChannel);
            if(activityChannel) supabase.removeChannel(activityChannel);
        }catch(e){
            // ignore
        }
    });

})();
