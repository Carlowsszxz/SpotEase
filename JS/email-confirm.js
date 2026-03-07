// Email Confirmation Handler
import { supabase } from './supabase-auth.js';

const statusEl = document.getElementById('confirm-status');
const messageEl = document.getElementById('confirm-message');
const linksEl = document.getElementById('confirm-links');

async function handleEmailConfirmation() {
    try {
        // Check if we have a session from the email confirmation link
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (sessionError) {
            throw new Error('Failed to get session: ' + sessionError.message);
        }

        if (!session || !session.user) {
            // No session - check URL hash for email/token (older Supabase versions)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const hasToken = hashParams.has('access_token') || hashParams.has('error');

            if (hasToken) {
                // Let supabase-auth.js handle the OAuth redirect processing
                statusEl.textContent = 'Processing confirmation...';
                // Wait a moment for supabase-auth.js to process
                await new Promise(resolve => setTimeout(resolve, 2000));
                const { data: newSession } = await supabase.auth.getSession();
                if (newSession?.session?.user) {
                    await createUserRecord(newSession.session.user);
                } else {
                    throw new Error('Email confirmation failed - no authenticated user');
                }
            } else {
                throw new Error('Invalid confirmation link');
            }
        } else {
            // Session exists, create user record
            await createUserRecord(session.user);
        }
    } catch (err) {
        console.error('Email confirmation error:', err);
        showError(err.message || 'Email confirmation failed');
    }
}

async function createUserRecord(user) {
    try {
        if (!user.email_confirmed_at) {
            throw new Error('Email not yet verified');
        }

        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id);

        if (existingUsers && existingUsers.length > 0) {
            // User already exists, just redirect
            showSuccess('Account verified! Redirecting...');
            setTimeout(() => {
                window.location.href = 'FrameDashboard.html';
            }, 1500);
            return;
        }

        if (checkError) {
            // Log the error but continue with user creation
            console.error('Error checking for existing user', checkError);
        }

        // Create new user record
        const newUser = {
            id: user.id,
            name: user.user_metadata?.full_name || null,
            email: user.email || null,
            role: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insertErr } = await supabase
            .from('users')
            .insert([newUser]);

        if (insertErr) {
            throw insertErr;
        }

        showSuccess('Email confirmed! Account created successfully. Redirecting...');
        setTimeout(() => {
            window.location.href = 'FrameDashboard.html';
        }, 1500);
    } catch (err) {
        console.error('Error creating user record:', err);
        showError('Account verification failed: ' + (err.message || 'Unknown error'));
    }
}

function showSuccess(msg) {
    statusEl.style.display = 'none';
    messageEl.textContent = msg;
    messageEl.classList.remove('error');
    messageEl.classList.add('success');
    messageEl.style.display = 'block';
}

function showError(msg) {
    statusEl.style.display = 'none';
    messageEl.textContent = msg;
    messageEl.classList.remove('success');
    messageEl.classList.add('error');
    messageEl.style.display = 'block';
    linksEl.innerHTML = '<a href="FrameRegister.html">Back to Register</a><a href="FrameLogin.html">Sign In</a>';
    linksEl.style.display = 'block';
}

// Start email confirmation handling on page load
handleEmailConfirmation();
