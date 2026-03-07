// Register (using Supabase Auth)
import { supabase } from './supabase-auth.js';

// Redirect to dashboard if user is already logged in
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'FrameDashboard.html';
        return;
    }
})();

const form = document.getElementById('registerForm');
const msgEl = document.getElementById('register-message');
const googleBtn = document.getElementById('gSignUpBtn');

if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        msgEl.textContent = '';
        msgEl.classList.remove('success');

        if (!fullname || !email || !password || !confirmPassword) {
            msgEl.textContent = 'Please fill in all fields.';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            msgEl.textContent = 'Please enter a valid email address.';
            return;
        }

        if (password.length < 6) {
            msgEl.textContent = 'Password must be at least 6 characters.';
            return;
        }

        if (password !== confirmPassword) {
            msgEl.textContent = 'Passwords do not match.';
            return;
        }

        try {
            // Check if user already exists in the users table
            const { data: existingUsers, error: checkError } = await supabase.from('users').select('id').eq('email', email);
            if (existingUsers && existingUsers.length > 0) {
                msgEl.textContent = 'Account already exists. Please sign in.';
                return;
            }
            if (checkError) {
                // Log the error but continue
                console.error('Error checking for existing user', checkError);
            }

            // Sign up with Supabase Auth - email confirmation will be required
            const confirmRedirectUrl = window.location.origin + '/FrameEmailConfirm.html';
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    emailRedirectTo: confirmRedirectUrl,
                    data: {
                        full_name: fullname
                    }
                }
            });
            if (error) throw error;

            // Store user info for confirmation page
            try { 
                localStorage.setItem('pm_registration_email', email);
                localStorage.setItem('pm_registration_fullname', fullname);
            } catch (e) {}

            // Show confirmation message and do NOT redirect
            msgEl.textContent = 'Registration successful! Please check your email to confirm your account.';
            msgEl.classList.add('success');
        } catch (err) {
            console.error('Registration error', err);
            msgEl.textContent = 'Registration failed: ' + (err.message || 'Unknown error');
        }
    });
}

if (googleBtn) {
    googleBtn.addEventListener('click', async function () {
        try {
            // Use Supabase OAuth for Google sign-in; redirect returns to this page where
            // `supabase-auth.js` handles the session and onLoginSuccess will create a profile.
            const redirectTo = window.location.origin + '/FrameRegister.html';
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
            if (error) throw error;
            // Browser will redirect to Google for consent. Further handling occurs on redirect.
            return;
        } catch (err) {
            console.error('Google sign-up error', err);
            if (msgEl) {
                msgEl.innerHTML = 'Sign-in blocked or failed. Serve the app over HTTP(S) (not file://) and verify OAuth redirect/authorized domains in your Supabase/Google settings.';
            }
        }
    });
}