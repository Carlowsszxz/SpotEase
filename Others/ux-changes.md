# Dashboard UX changes — summary

This file documents the UX changes applied to the Dashboard so you can copy them to other pages.

## Overview
- Replace inline "loading..." text with explicit loading state (skeletons + overlay spinner).
- Add a status bar for messages (success/error) + a `Retry` button for reloads.
- Disable action buttons while loading and show `last-updated` timestamp when data arrives.
- Improve empty states for lists (Upcoming / Alerts).
- Add basic accessibility attributes (`aria-hidden`, `aria-live`, `aria-busy`).

## Files modified
- `FrameDashboard.html`
  - Removed static `loading...` placeholders from stat values and lists.
  - Added a status bar: `<div id="statusBar" class="status-bar"></div>`
  - Added retry / last-updated area: `#retryBtn` and `#lastUpdated`.
  - Added a loading overlay with spinner: `#loadingOverlay` containing `.spinner` and loading text.

- `CSS/dashboard.css`
  - Added `.loading-overlay`, `.spinner`, `.dot` animation.
  - Added `.stat-value.skeleton` for skeleton blocks.
  - Added `.status-bar` styles and `.btn[disabled]` style.

- `JS/dashboard.js`
  - Removed demo hard-coded data and added `showLoading()` / `hideLoading()` helpers.
  - Added `setStatus(msg, isError)` that toggles the status bar and the retry button.
  - Added `setButtonsDisabled(bool)` to toggle `disabled` and `aria-busy` on action buttons.
  - Implemented `loadData()` which attempts to fetch real data from Supabase (best-effort):
    - `dashboard_stats` → `renderStats()`
    - `reservations` → `renderUpcoming()`
    - `alerts` → `renderAlerts()`
  - Wired `#retryBtn` to re-run `loadData()`.
  - Improved `renderUpcoming()` and `renderAlerts()` empty states.
  - Updates `#lastUpdated` on successful load.

## IDs and classes introduced (copy to other pages)
- HTML IDs: `statusBar`, `retryBtn`, `lastUpdated`, `loadingOverlay`.
- CSS classes: `skeleton` (applied to stat value elements), `.loading-overlay`, `.spinner`, `.dot`, `.status-bar`.

## Minimal copy-paste snippets

HTML: Add these where appropriate in your page layout (header area and actions area):

```html
<!-- status bar (place near page header) -->
<div id="statusBar" class="status-bar" aria-live="polite"></div>

<!-- retry and last-updated (place in actions/footer area) -->
<div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
  <button id="retryBtn" class="btn" style="display:none">Retry</button>
  <div id="lastUpdated" class="small-muted" style="font-size:12px"></div>
</div>

<!-- global loading overlay (put near end of body) -->
<div id="loadingOverlay" class="loading-overlay" aria-hidden="true">
  <div class="spinner" role="status" aria-live="polite">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="loading-text">Loading…</div>
  </div>
</div>
```

CSS: Add the block below (from `CSS/dashboard.css`) to your page stylesheet or shared stylesheet:

```css
/* Loading overlay and spinner */
.loading-overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;z-index:60;visibility:hidden;opacity:0;transition:opacity .18s ease}
.loading-overlay[aria-hidden="false"]{visibility:visible;opacity:1}
.spinner{display:flex;flex-direction:column;align-items:center;gap:8px}
.spinner .dot{width:10px;height:10px;background:#2563eb;border-radius:50%;display:inline-block;animation:dot-bounce 0.9s infinite ease-in-out}
.spinner .dot:nth-child(2){animation-delay:0.12s}
.spinner .dot:nth-child(3){animation-delay:0.24s}
.loading-text{color:#0f172a;font-weight:600}
@keyframes dot-bounce{0%,80%,100%{transform:translateY(0);opacity:.6}40%{transform:translateY(-8px);opacity:1}}

/* Skeleton for stat values during loading */
.stat-value.skeleton{background:linear-gradient(90deg,#f3f4f6,#e5e7eb);color:transparent;border-radius:6px;height:24px}

.status-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px}
.status-bar .error{color:crimson}
.btn[disabled]{opacity:0.6;cursor:not-allowed}
```

JS: Copy the helpers (adapt element IDs and API calls per page):

```javascript
// Elements (ensure these IDs exist in HTML)
var loadingOverlay = document.getElementById('loadingOverlay');
var statusBar = document.getElementById('statusBar');
var retryBtn = document.getElementById('retryBtn');
var lastUpdatedEl = document.getElementById('lastUpdated');

function setButtonsDisabled(v){
  // pass in the action buttons you want to disable
  [reserveBtn, viewMapBtn].forEach(function(b){ if(!b) return; b.disabled = !!v; b.setAttribute('aria-busy', !!v); });
}

function showLoading(){
  if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','false');
  if(spotsEl) { spotsEl.classList.add('skeleton'); spotsEl.textContent = ''; }
  // ... add skeleton for other stat elements
  if(noUpcoming){ noUpcoming.style.display = 'block'; noUpcoming.textContent = 'loading...'; }
  if(alertsList){ alertsList.innerHTML = '<li class="small-muted">loading...</li>'; }
  setButtonsDisabled(true);
}

function hideLoading(){
  if(loadingOverlay) loadingOverlay.setAttribute('aria-hidden','true');
  if(spotsEl) { spotsEl.classList.remove('skeleton'); }
  setButtonsDisabled(false);
}

function setStatus(msg, isError){
  if(!statusBar) return;
  statusBar.textContent = msg || '';
  if(isError) statusBar.classList.add('error'); else statusBar.classList.remove('error');
  if(retryBtn) retryBtn.style.display = isError ? 'inline-block' : 'none';
}

// Example loadData (adapt queries/table names)
async function loadData(){
  showLoading();
  setStatus('Loading...', false);
  try{
    var any = false;
    const { data: stats, error: statsErr } = await supabase.from('dashboard_stats').select('*').single();
    if(!statsErr && stats){ renderStats(stats); any = true; }
    // fetch lists similarly
    hideLoading();
    if(any){ if(lastUpdatedEl) lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleString(); setStatus('Data loaded', false); }
    else setStatus('No data available', true);
  }catch(err){ hideLoading(); setStatus('Failed to load data: ' + (err.message || err), true); }
}

if(retryBtn) retryBtn.addEventListener('click', loadData);
```

## Applying to other pages — checklist
1. Add the HTML IDs (`statusBar`, `retryBtn`, `lastUpdated`, `loadingOverlay`).
2. Add the CSS block (or import shared stylesheet where you place it).
3. Add the JS helpers (`showLoading`, `hideLoading`, `setStatus`, `setButtonsDisabled`, `loadData`).
4. Replace any inline `loading...` text with skeleton-ready elements (add the `skeleton` class while loading).
5. Update `loadData()` to call the appropriate API endpoints or Supabase tables for that page.
6. Test by serving the folder and opening the page; check the console for Supabase errors.

## Notes
- IDs and class names are intentionally generic; change them if they conflict with existing pages.
- Make sure `supabase` (or other API client) is available in the module scope where you copy the JS.
- The Supabase table names used in `loadData()` are examples — adapt to your schema.

---
Created to help you apply consistent loading/error UX across your project pages.
