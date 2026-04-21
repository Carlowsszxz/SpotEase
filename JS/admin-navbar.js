import { supabase, getCurrentUser } from './supabase-auth.js'

// Initialize admin navbar: populate username and wire logout/login links
(async function initAdminNavbar(){
  const logoutBtn = document.getElementById('navLogout');
  const loginLink = document.getElementById('navLoginLink');
  const registerLink = document.getElementById('navRegisterLink');

  // Manage auth state: show/hide login/register or logout
  try {
    const user = await getCurrentUser();
    if (user) {
      const { data: profile, error: roleErr } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = String(profile?.role || '').trim().toLowerCase();
      if (roleErr || role !== 'admin') {
        window.location.href = 'FrameDashboard.html';
        return;
      }

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
      window.location.href = 'FrameHome.html';
    })
  }
  // Highlight the active nav link and wire clicks to set active state
  try {
    const links = document.querySelectorAll('.main-nav .nav-links a');
    function setActiveLink(target) {
      links.forEach(l => l.classList.remove('active'));
      if (target) target.classList.add('active');
    }

    // Determine current filename (e.g., FrameAdminPanel.html)
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
