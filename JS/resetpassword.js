// Password Reset Handler
import { supabase } from './supabase-auth.js';

const form = document.getElementById('resetForm');
const msgEl = document.getElementById('reset-message');
const passwordEl = document.getElementById('password');
const confirmPasswordEl = document.getElementById('confirmPassword');

let sessionValid = false;

async function processRecoveryUrlIfPresent(){
    try{
        // supabase-js v2 supports this helper.
        if(typeof supabase.auth.getSessionFromUrl === 'function'){
            try{
                const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
                if(error && !/No URL parameters found/i.test(error.message || '')){
                    console.warn('getSessionFromUrl warning', error);
                }
            }catch(e){
                // ignore
            }
        }
    }catch(e){
        // ignore
    }
}

// Check if we have a valid session (from the reset email link)
async function checkSession() {
    try {
        // Ensure the recovery link params (hash/query) are processed and stored.
        await processRecoveryUrlIfPresent();

        // Supabase will automatically process the URL parameters and create a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (sessionError) {
            throw new Error('Session error: ' + sessionError.message);
        }

        if (!session || !session.user) {
            throw new Error('Invalid or expired reset link. Please request a new password reset.');
        }

        sessionValid = true;
        return true;
    } catch (err) {
        console.error('Session check error:', err);
        showError(err.message || 'Failed to verify reset link');
        return false;
    }
}

async function handleReset(e) {
    e.preventDefault();
    msgEl.style.display = 'none';

    const password = passwordEl.value;
    const confirmPassword = confirmPasswordEl.value;

    // Validation
    if (!password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        // Update user password
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        showSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'FrameLogin.html';
        }, 1500);
    } catch (err) {
        console.error('Password update error:', err);
        showError('Error resetting password: ' + (err.message || 'Unknown error'));
    }
}

function showError(msg) {
    msgEl.textContent = msg;
    msgEl.className = 'message error';
    msgEl.style.display = 'block';
}

function showSuccess(msg) {
    msgEl.textContent = msg;
    msgEl.className = 'message success';
    msgEl.style.display = 'block';
}

// Initialize
(async function init() {
    const isValid = await checkSession();
    if (isValid) {
        form.addEventListener('submit', handleReset);
    } else {
        form.style.display = 'none';
    }
})();
