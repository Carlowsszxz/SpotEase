import { supabase } from './supabase-auth.js'

// Checks whether a Supabase session exists AND user has admin role; redirects appropriately.
export async function checkAdminAuth(loginRedirect = 'FrameLogin.html', dashboardRedirect = 'FrameDashboard.html') {
  try {
    // First check authentication
    const { data } = await supabase.auth.getSession()
    const session = data && data.session
    if (!session) {
      try { localStorage.clear() } catch (e) {}
      try { await supabase.auth.signOut() } catch (e) {}
      window.location.href = loginRedirect
      return false
    }

    // Then check admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = loginRedirect
      return false
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !userData || (userData.role || '').toLowerCase() !== 'admin') {
      alert('Admin access required')
      window.location.href = dashboardRedirect
      return false
    }

    return true
  } catch (err) {
    console.error('checkAdminAuth error', err)
    try { localStorage.clear() } catch (e) {}
    try { await supabase.auth.signOut() } catch (e) {}
    window.location.href = loginRedirect
    return false
  }
}