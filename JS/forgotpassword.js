// Forgot Password - using Supabase Auth
import { supabase } from './supabase-auth.js';

(async function(){
  const form = document.getElementById('forgotForm');
  const emailEl = document.getElementById('email');
  const msgEl = document.getElementById('fpMessage');

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    msgEl.textContent = '';
    
    const email = (emailEl.value || '').trim().toLowerCase();
    if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
      msgEl.textContent = 'Please enter a valid email address.';
      return;
    }

    try {
      const redirectUrl = window.location.origin + '/FrameResetPassword.html';
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      msgEl.textContent = 'If an account exists, a password reset link has been sent to your email.';
      msgEl.style.color = 'green';
      emailEl.value = '';
    } catch (err) {
      console.error('Password reset error:', err);
      msgEl.textContent = 'Error sending reset email: ' + (err.message || 'Unknown error');
      msgEl.style.color = 'crimson';
    }
  });

})();
