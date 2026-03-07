import { supabase, getCurrentUser } from './supabase-auth.js'

// Initialize navbar: populate username and wire logout/login links
(async function initNavbar(){
  const logoutBtn = document.getElementById('navLogout');
  const loginLink = document.getElementById('navLoginLink');
  const registerLink = document.getElementById('navRegisterLink');

  // Manage auth state: show/hide login/register or logout
  try {
    const user = await getCurrentUser();
    if (user) {
      if (logoutBtn) logoutBtn.style.display = '';
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
    }
  } catch (e) {
    // ignore
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(){
      try { await supabase.auth.signOut(); } catch(e){}
      try { localStorage.removeItem('pm_username'); } catch(e){}
      window.location.href = 'FrameLogin.html';
    })
  }
  // Highlight the active nav link and wire clicks to set active state
  try {
    const links = document.querySelectorAll('.main-nav .nav-links a');
    function setActiveLink(target) {
      links.forEach(l => l.classList.remove('active'));
      if (target) target.classList.add('active');
    }

    // Determine current filename (e.g., FrameDashboard.html)
    const currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
    let matched = null;
    links.forEach(function(link){
      try {
        const href = link.getAttribute('href') || '';
        const hrefFile = href.split('/').pop().toLowerCase();
        if (hrefFile && hrefFile === currentFile) matched = link;
        // wire click to activate (useful for single-page nav or to show active state immediately)
        link.addEventListener('click', function(){ setActiveLink(link); });
      } catch(e){}
    });
    if (matched) setActiveLink(matched);
  } catch (e) {
    // ignore if navbar not present
  }

})();

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

// Hamburger menu functionality
function initHamburgerMenu() {
  console.log('=== HAMBURGER MENU INIT ===');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  
  console.log('hamburgerBtn:', hamburgerBtn);
  console.log('navLinks:', navLinks);
  console.log('navOverlay:', navOverlay);
  
  if (hamburgerBtn && navLinks && navOverlay) {
    console.log('All elements found, setting up click handlers');
    
    // Toggle menu on hamburger click
    hamburgerBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Hamburger clicked!');
      navLinks.classList.toggle('active');
      hamburgerBtn.classList.toggle('active');
      navOverlay.classList.toggle('active');
    });
    
    // Close menu when overlay is clicked
    navOverlay.addEventListener('click', function() {
      console.log('Overlay clicked, closing menu');
      navLinks.classList.remove('active');
      hamburgerBtn.classList.remove('active');
      navOverlay.classList.remove('active');
    });
    
    // Close menu when a link is clicked
    const links = navLinks.querySelectorAll('a');
    console.log('Found', links.length, 'nav links');
    
    links.forEach(link => {
      link.addEventListener('click', function() {
        console.log('Nav link clicked, closing menu');
        navLinks.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        navOverlay.classList.remove('active');
      });
    });
    
    console.log('Hamburger menu initialized successfully');
  } else {
    console.error('Failed to find hamburgerBtn, navLinks, or navOverlay!');
  }
}

// Initialize hamburger after navbar is loaded
setTimeout(initHamburgerMenu, 50);
