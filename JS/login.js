import { supabase } from './supabase-auth.js';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('error-message');
  const googleBtn = document.getElementById('googleSignBtn');

  async function showMessage(text, isError = true) {
    if (!msg) return
    msg.textContent = text
    msg.style.color = isError ? 'crimson' : 'green'
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await showMessage('');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        await showMessage('Please enter email and password.');
        return;
      }

      try {
        // Supabase expects an email for password sign-in.
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password
        });

        if (error) throw error;

        if (data && data.session) {
          // Check if email is confirmed for email-based authentication
          const user = data.user;
          if (!user.email_confirmed_at) {
            await supabase.auth.signOut();
            await showMessage('Please confirm your email first. Check your inbox for the confirmation link.');
            return;
          }

          try { localStorage.setItem('pm_username', data.user?.email || data.user?.id || ''); } catch (e) {}
          
          // Check user role
          const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id);
          
          const userRole = (userData && userData.length > 0) ? userData[0].role : 'unknown';
          const isAdmin = (userRole || '').toLowerCase() === 'admin';
          
          console.log('✅ Login successful');
          console.log('User ID:', data.user.id);
          console.log('User Email:', data.user.email);
          console.log('User Role from DB:', userRole);
          console.log('Is Admin?', isAdmin);
          
          await showMessage('Login successful. Role: ' + (userRole || 'unknown'), false);
          
          // Redirect based on role
          const redirectUrl = isAdmin ? 'FrameAdminPanel.html' : 'FrameDashboard.html';
          console.log('Redirecting to:', redirectUrl);
          setTimeout(() => { window.location.href = redirectUrl; }, 600);
        } else {
          await showMessage('Invalid email or password.');
        }
      } catch (err) {
        console.error('Supabase signInWithPassword error', err);
        await showMessage('Login failed: ' + (err.message || err), true);
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', async function () {
      try {
        const redirectTo = window.location.origin + '/FrameLogin.html'
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo }})
        if (error) throw error
        // Browser will redirect to Google for consent
      } catch (err) {
        console.error('Google sign-in error', err);
        await showMessage('Google sign-in failed: ' + (err.message || err), true);
      }
    });
  }

  // If already signed in (session present), check if user exists in users table
  (async function checkSession() {
    try {
      const { data } = await supabase.auth.getSession()
      if (data && data.session) {
        console.log('✅ Session found');
        console.log('User ID:', data.session.user?.id);
        console.log('User Email:', data.session.user?.email);
        
        // Check if user exists in users table
        const { data: userData, error: userCheckError } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', data.session.user.id);
        
        // If user doesn't exist in users table
        if (!userData || userData.length === 0) {
          console.log('⚠️ User not found in users table. Signing out.');
          // Sign out completely
          await supabase.auth.signOut();
          // Clear any stored auth data
          try { 
            localStorage.removeItem('pm_username'); 
            localStorage.removeItem('pm_registration_email');
            localStorage.removeItem('pm_registration_fullname');
          } catch (e) {}
          
          await showMessage('Account does not exist. Please register first.', true);
          return;
        }
        
        const userRole = (userData && userData.length > 0) ? userData[0].role : 'unknown';
        const isAdmin = (userRole || '').toLowerCase() === 'admin';
        
        console.log('User Role from DB:', userRole);
        console.log('Is Admin?', isAdmin);
        
        try { localStorage.setItem('pm_username', data.session.user?.email || data.session.user?.id); } catch (e) {}
        
        // Redirect based on role
        const redirectUrl = isAdmin ? 'FrameAdminPanel.html' : 'FrameDashboard.html';
        console.log('Already logged in. Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      }
    } catch (err) {
      console.warn('Error checking session', err)
    }
  })();
});

