import { supabase, getCurrentUser } from './supabase-auth.js'

function isLocalhostHost(hostname) {
  const host = (hostname || '').toLowerCase()
  return host === '' || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')
}

function isHomePageView() {
  const path = (window.location.pathname || '').toLowerCase()
  return path.endsWith('framehome.html') || path === '/'
}

function normalizeNavbarLinks() {
  const isLocal = isLocalhostHost(window.location.hostname)

  // For local dev, prefer Frame*.html files.
  // For deployed hosts, prefer clean routes (Vercel shortcuts).
  const cleanToFile = {
    '/': 'FrameHome.html',
    '/login': 'FrameLogin.html',
    '/register': 'FrameRegister.html',
    '/dashboard': 'FrameDashboard.html',
    '/map': 'FrameMap.html',
    '/chat': 'FrameChat.html',
    '/emergency': 'FrameEmergency.html',
    '/my-reservations': 'FrameMyReservations.html',
    '/profile': 'FrameProfile.html',
    '/reserve': 'FrameReservation.html'
  }

  const fileToClean = {
    'FrameHome.html': '/',
    'FrameLogin.html': '/login',
    'FrameRegister.html': '/register',
    'FrameDashboard.html': '/dashboard',
    'FrameMap.html': '/map',
    'FrameChat.html': '/chat',
    'FrameEmergency.html': '/emergency',
    'FrameMyReservations.html': '/my-reservations',
    'FrameProfile.html': '/profile',
    'FrameReservation.html': '/reserve'
  }

  const links = document.querySelectorAll('.main-nav a')
  links.forEach(a => {
    try {
      const raw = a.getAttribute('href') || ''
      if (!raw) return

      if (isLocal) {
        // Backward compatible: if link is using clean route, convert to file.
        const mapped = cleanToFile[raw]
        if (mapped) a.setAttribute('href', mapped)
        return
      }

      // Deployed host: if link points to a Frame*.html file, convert to clean route.
      const mapped = fileToClean[raw]
      if (mapped) a.setAttribute('href', mapped)
    } catch (e) {
      // ignore
    }
  })
}

async function loadAppPillNav() {
  const host = document.getElementById('appPillNavRoot')
  if (!host) return
  try {
    await import('./react-nav/app-pill-nav.js')
  } catch (e) {
    console.error('Failed to load app PillNav bundle', e)
  }
}

function initStaggeredMenuNavigationFallback() {
  if (window.__smNavFallbackBound) return;
  window.__smNavFallbackBound = true;

  document.addEventListener('click', function (event) {
    try {
      const item = event.target && event.target.closest ? event.target.closest('.sm-panel-item') : null;
      if (!item) return;
      if (item.dataset && item.dataset.action === 'logout') return;

      const href = item.getAttribute('href');
      if (!href) return;

      // Let normal navigation happen, but force it if a library handler blocks it.
      setTimeout(function () {
        try {
          if (window.location.href.indexOf(href) === -1) {
            window.location.href = href;
          }
        } catch (e) {
          window.location.href = href;
        }
      }, 0);
    } catch (e) {
      // ignore
    }
  }, true);
}

function ensureMenuLogoutItem() {
  const panelList = document.querySelector('.main-nav .sm-panel-list');
  if (!panelList) return null;

  let wrap = document.getElementById('navMenuLogoutWrap');
  if (!wrap) {
    wrap = document.createElement('li');
    wrap.id = 'navMenuLogoutWrap';
    wrap.className = 'sm-panel-itemWrap';

    const link = document.createElement('a');
    link.id = 'navMenuLogout';
    link.className = 'sm-panel-item';
    link.href = 'FrameHome.html';
    link.setAttribute('aria-label', 'Logout');
    link.dataset.action = 'logout';

    const label = document.createElement('span');
    label.className = 'sm-panel-itemLabel';
    label.textContent = 'Logout';

    link.appendChild(label);
    wrap.appendChild(link);
    panelList.appendChild(wrap);
  }

  const allItems = Array.from(panelList.querySelectorAll('.sm-panel-item[data-index]'));
  let maxIndex = 0;
  allItems.forEach(function(item){
    if (item && item.id === 'navMenuLogout') return;
    const value = Number(item.getAttribute('data-index') || 0);
    if (Number.isFinite(value) && value > maxIndex) maxIndex = value;
  });

  const logoutLink = wrap.querySelector('#navMenuLogout');
  if (logoutLink) logoutLink.setAttribute('data-index', String(maxIndex + 1));
  return wrap;
}

function isGuestNavHref(href) {
  var value = String(href || '').toLowerCase().trim();
  if (!value) return false;
  return value === '/'
    || value === '/about'
    || value === '/login'
    || value === '/register'
    || value.endsWith('framehome.html')
    || value.endsWith('frameabout.html')
    || value.endsWith('framelogin.html')
    || value.endsWith('frameregister.html');
}

function setGuestNavVisibility(isVisible) {
  var links = document.querySelectorAll('.main-nav a, .main-nav .sm-panel-item');
  links.forEach(function(link){
    try {
      var action = (link.getAttribute('data-action') || '').toLowerCase().trim();
      if (action === 'logout') return;

      var href = link.getAttribute('href') || '';
      var text = String((link.textContent || '')).toLowerCase().trim();
      var guestByText = text === 'home' || text === 'about' || text === 'sign in' || text === 'login' || text === 'register';
      var isGuest = isGuestNavHref(href) || guestByText;
      if (!isGuest) return;
      link.style.display = isVisible ? '' : 'none';
    } catch (e) {
      // ignore
    }
  });
}

function setMenuLogoutVisibility(isVisible) {
  const wrap = ensureMenuLogoutItem();
  if (!wrap) return;
  wrap.style.display = isVisible ? '' : 'none';
}

function bindMenuLogoutHandler() {
  if (window.__menuLogoutHandlerBound) return;
  window.__menuLogoutHandlerBound = true;

  document.addEventListener('click', async function(event){
    const trigger = event.target && event.target.closest ? event.target.closest('#navMenuLogout, [data-action="logout"]') : null;
    if (!trigger) return;

    try { event.preventDefault(); } catch (e) {}
    try { await supabase.auth.signOut(); } catch (e) {}
    try { localStorage.removeItem('pm_username'); } catch (e) {}
    window.location.href = 'FrameHome.html';
  });
}

function initEmergencyCta(){
  var el = document.getElementById('emergencyCta');
  if(!el) return;

  var holdMs = 800;
  var timer = null;
  var href = el.getAttribute('href') || 'FrameEmergency.html';

  function clear(){
    if(timer){
      clearTimeout(timer);
      timer = null;
    }
    el.classList.remove('holding');
  }

  function start(){
    clear();
    el.classList.add('holding');
    timer = setTimeout(function(){
      try{ window.location.href = href; }catch(e){}
    }, holdMs);
  }

  // Prevent accidental short taps from navigating.
  el.addEventListener('click', function(e){
    try{ e.preventDefault(); }catch(_e){}
  });

  // Pointer / touch long-press
  el.addEventListener('mousedown', function(e){
    if(e && typeof e.button === 'number' && e.button !== 0) return;
    start();
  });
  el.addEventListener('mouseup', clear);
  el.addEventListener('mouseleave', clear);
  el.addEventListener('touchstart', function(){ start(); }, { passive: true });
  el.addEventListener('touchend', clear);
  el.addEventListener('touchcancel', clear);

  // Keyboard long-press (Space/Enter)
  el.addEventListener('keydown', function(e){
    var key = (e && (e.key || e.code)) || '';
    if(key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar'){
      try{ e.preventDefault(); }catch(_e){}
      start();
    }
  });
  el.addEventListener('keyup', function(e){
    var key = (e && (e.key || e.code)) || '';
    if(key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar'){
      clear();
    }
  });
}

// Initialize navbar: populate username and wire logout/login links
(async function initNavbar(){
  normalizeNavbarLinks()
  await loadAppPillNav()
  initStaggeredMenuNavigationFallback()
  bindMenuLogoutHandler()

  const navRight = document.querySelector('.main-nav .nav-right')
  if (isHomePageView()) {
    if (navRight) navRight.style.display = 'none'
    return
  }

  const loginLink = document.getElementById('navLoginLink');
  const registerLink = document.getElementById('navRegisterLink');

  // Manage auth state: show/hide login/register or logout
  try {
    const user = await getCurrentUser();
    setMenuLogoutVisibility(!!user);
    if (user) {
      setGuestNavVisibility(false);
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
    } else {
      setGuestNavVisibility(true);
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
    }
  } catch (e) {
    // ignore
  }

  // Highlight active link for whichever nav renderer is present
  try {
    const links = document.querySelectorAll('.main-nav .nav-links a, .main-nav .sm-panel-item');
    function setActiveLink(target) {
      links.forEach(l => {
        l.classList.remove('active');
        l.classList.remove('is-active');
      });
      if (!target) return;
      target.classList.add('active');
      target.classList.add('is-active');
    }

    const currentPath = (window.location.pathname || '').toLowerCase();
    const currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
    let matched = null;

    links.forEach(function(link){
      try {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (!href) return;

        const hrefFile = href.split('/').pop();
        if (href.startsWith('/') && href === currentPath) matched = link;
        if (hrefFile && hrefFile === currentFile) matched = link;

        link.addEventListener('click', function(){ setActiveLink(link); });
      } catch(e){}
    });

    if (matched) setActiveLink(matched);
  } catch (e) {
    // ignore if navbar not present
  }

})();

// Emergency CTA behavior
try{ initEmergencyCta(); }catch(e){}

// Initialize Lucide icons
console.log('=== NAVBAR.JS LOADED ===');
console.log('Lucide available:', typeof window.lucide);

function initLucideIcons() {
  console.log('Attempting to initialize Lucide icons...');
  if (window.lucide) {
    console.log('Lucide found, creating icons');
    window.lucide.createIcons();
    console.log('Icons created successfully');
  } else {
    console.log('Lucide not yet available, retrying...');
    setTimeout(initLucideIcons, 100);
  }
}

// Wait a bit for Lucide to load, then initialize
setTimeout(initLucideIcons, 50);

