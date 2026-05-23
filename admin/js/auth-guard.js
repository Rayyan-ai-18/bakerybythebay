// Shared auth guard for all admin pages
// Session persisted in localStorage — survives page navigation and browser restarts.
// Owner only needs to log in once; use the Sign Out button to end the session.
// Home link (/) and View Site (/menu/) are safe to click — session stays active.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://rrokmjzrnbapyjziqpbp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2ttanpybmJhcHlqemlxcGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTE4NzAsImV4cCI6MjA5NDk2Nzg3MH0.eR53yyeUuyTYp5XtxTugJplTxIPgjxusdiDrIDQ_DSo'

// Admin-specific Supabase client — session persisted in localStorage
// Allows navigation between admin pages without re-login
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false
  }
})

/**
 * Require authentication before page content loads.
 * Checks URL hash for session tokens (passed from login page redirect).
 * If found, restores session and clears the hash from the URL.
 * If not found, redirects to login page.
 */
export async function requireAuth() {
  // 1) Check URL hash for session tokens from login redirect
  const hash = window.location.hash.substring(1)
  if (hash) {
    try {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await adminSupabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        // Clear hash from URL immediately — prevents token exposure on refresh
        window.history.replaceState(null, '', window.location.pathname)
        if (!error) return // Authenticated!
      } else {
        // Invalid hash content — clear it
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch {
      // Malformed hash — clear it
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  // 2) Check if we already have a session in memory (from setSession above)
  const { data: { session } } = await adminSupabase.auth.getSession()
  if (session) return

  // 3) Not authenticated — redirect to login (replace so back button can't return here)
  window.location.replace('index.html')
}

/**
 * Log out and redirect to login page
 */
export async function handleLogout() {
  await adminSupabase.auth.signOut()
  window.location.replace('index.html')
}
