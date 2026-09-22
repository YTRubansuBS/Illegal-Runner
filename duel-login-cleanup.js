/* ILLEGAL RUNNER — clear incoming duel requests after login/reconnect */
(() => {
  'use strict'
  const cfg = window.IR_CONFIG || {}
  if (!window.supabase || !cfg.SUPABASE_URL) return
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)

  async function clearIncoming() {
    try {
      const session = (await sb.auth.getSession()).data?.session
      if (!session?.user) return
      const { error } = await sb.rpc('duel_clear_incoming_requests')
      if (error) console.warn('[IR] Impossible de nettoyer les demandes 1V1 entrantes:', error)
    } catch (e) {
      console.warn('[IR] Nettoyage des demandes 1V1:', e)
    }
  }

  clearIncoming()
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      if (session?.user) setTimeout(clearIncoming, 0)
    }
  })
})()
