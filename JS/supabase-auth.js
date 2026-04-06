import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: Replace these with your Supabase project URL and anon/public key
const SUPABASE_URL = 'https://xsgymjzkuiohsqalrqkw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZ3ltanprdWlvaHNxYWxycWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjk2NjMsImV4cCI6MjA4ODIwNTY2M30.CKZoZbIu0MDZplXl_8Qf-K6n5nFaPMvp4ZHp7TcdIkM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function syncUserRecord(user) {
  if (!user) return false

  const email = user.email || (user.user_metadata && user.user_metadata.email) || null
  const name = user.user_metadata?.full_name || user.user_metadata?.name || email || null

  try {
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', user.id)

    if (!error && existingUsers && existingUsers.length > 0) {
      const current = existingUsers[0]
      const patch = {
        name,
        email,
        updated_at: new Date().toISOString()
      }

      if (current.name !== patch.name || current.email !== patch.email) {
        await supabase.from('users').update(patch).eq('id', user.id)
      }

      return true
    }

    const now = new Date().toISOString()
    const newUser = {
      id: user.id,
      name,
      email,
      role: null,
      created_at: now,
      updated_at: now
    }

    const { error: insertErr } = await supabase.from('users').insert([newUser])
    if (insertErr) {
      console.warn('User sync insert failed', insertErr)
      return false
    }

    return true
  } catch (err) {
    console.warn('syncUserRecord failed', err)
    return false
  }
}

const gBtn = document.getElementById('gSignUpBtn')
const messageEl = document.getElementById('register-message')

function showMessage(msg, isError = false) {
  if (!messageEl) return
  messageEl.textContent = msg
  messageEl.style.color = isError ? 'crimson' : 'green'
}

async function signInWithGoogle() {
  try {
    // The redirectTo option should match a URL configured in Supabase
    const redirectTo = window.location.origin + '/FrameRegister.html'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (error) throw error
    // If successful, browser will be redirected to Google for consent
  } catch (err) {
    showMessage('Google sign-in error: ' + (err.message || err), true)
    console.error('signInWithGoogle error', err)
  }
}

if (gBtn) gBtn.addEventListener('click', signInWithGoogle)

let sessionProcessed = false

// Handle OAuth redirect on page load (if returning from Google)
;(async function handleOAuthRedirect() {
  try {
    // Some Supabase client builds may not include getSessionFromUrl; guard it.
    if (typeof supabase.auth.getSessionFromUrl === 'function') {
      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        if (error && !/No URL parameters found/.test(error.message || '')) {
          console.warn('getSessionFromUrl warning', error)
        }
      } catch (e) {
        console.warn('getSessionFromUrl failed', e)
      }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (session) onLoginSuccess(session)
  } catch (err) {
    console.error('OAuth redirect handling failed', err)
  }
})()

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) onLoginSuccess(session)
  else if (event === 'SIGNED_OUT') showMessage('Signed out', false)
})

async function onLoginSuccess(session) {
  if (sessionProcessed) return
  sessionProcessed = true
  
  const user = session.user || (session && session.user)
  if (!user) return
  const email = user.email || (user.user_metadata && user.user_metadata.email)
  
  // Check if user signed up with email (requires confirmation) or OAuth (no confirmation needed)
  const isEmailSignUp = user.identities && user.identities.some(id => id.provider === 'email');
  const isOAuthSignUp = user.identities && user.identities.some(id => id.provider !== 'email');
  
  // Check if we're on the register or email confirmation page
  let isRegisterPage = false;
  let isConfirmPage = false;
  try {
    isRegisterPage = window.location.pathname.endsWith('FrameRegister.html') || !!document.getElementById('register-message');
    isConfirmPage = window.location.pathname.endsWith('FrameEmailConfirm.html');
  } catch (e) {
    isRegisterPage = false;
    isConfirmPage = false;
  }

  // For email-based signups on register page, require email confirmation
  if (isRegisterPage && isEmailSignUp && !isOAuthSignUp) {
    if (!user.email_confirmed_at) {
      // Email not yet confirmed - signs them out and shows message
      await supabase.auth.signOut()
      showMessage('Please check your email to confirm your account.', false)
      return
    }
  }

  const synced = await syncUserRecord(user)

  if (isRegisterPage) {
    showMessage(synced ? 'Account created successfully! Redirecting...' : 'Signed in. Redirecting...', false)
    setTimeout(() => { window.location.href = 'FrameDashboard.html'; }, 1500)
    return
  }

  showMessage('Signed in as ' + (email || user.id), false)
  
  console.log('Supabase session:', session)
}

// Utility to fetch current user (callable from other scripts)
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession()
  return data.session ? data.session.user : null
}

// Utility to validate user has an entry in users table
export async function validateUserRecord(user) {
  if (!user) return false
  try {
    const { data, error } = await supabase.from('users').select('id').eq('id', user.id)
    return !error && data && data.length > 0
  } catch (e) {
    return false
  }
}

// Check auth and user record; redirect to login if either is invalid
export async function ensureValidAuth() {
  const user = await getCurrentUser()
  if (!user) {
    // No session, redirect to login
    window.location.href = '/FrameLogin.html'
    return false
  }
  
  const hasUserRecord = await validateUserRecord(user)
  if (!hasUserRecord) {
    // Session exists but no user record - sign out and redirect
    await supabase.auth.signOut()
    window.location.href = '/FrameLogin.html'
    return false
  }
  
  return true
}
