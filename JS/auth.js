import { supabase } from './supabase-auth.js'

// Checks whether a Supabase session exists; if not, clears local state and redirects to login.
export async function checkAuth(redirectPath = 'FrameLogin.html') {
  try {
    const { data } = await supabase.auth.getSession()
    const session = data && data.session
    if (!session) {
      try { localStorage.clear() } catch (e) {}
      try { await supabase.auth.signOut() } catch (e) {}
      // redirect to login page
      window.location.href = redirectPath
    }
    return !!session
  } catch (err) {
    console.error('checkAuth error', err)
    try { localStorage.clear() } catch (e) {}
    try { await supabase.auth.signOut() } catch (e) {}
    window.location.href = redirectPath
    return false
  }
}
