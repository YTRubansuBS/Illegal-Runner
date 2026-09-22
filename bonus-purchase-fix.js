(() => {
  'use strict'

  const BONUS_IDS = new Set([
    'bonus_shield',
    'bonus_mega',
    'bonus_x2',
    'bonus_jetpack',
    'bonus_scoreDouble',
    'bonus_magnet'
  ])

  const cfg = window.IR_CONFIG || {}
  const sb = window.supabase && cfg.SUPABASE_URL
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null

  async function syncCoins() {
    const badge = document.getElementById('userBadge')
    const coinsEl = document.getElementById('coins')
    if (!coinsEl) return

    const coins = Math.max(0, Math.floor(Number(coinsEl.textContent || 0)))
    if (!Number.isFinite(coins)) return

    // Mode local : le moteur principal sauvegarde déjà irGuest.
    if (badge?.textContent?.includes('local')) return
    if (!sb) return

    try {
      const { data: { user }, error: userError } = await sb.auth.getUser()
      if (userError || !user) return

      // On ne touche qu'à coins : aucune autre donnée de profil n'est modifiée.
      const { error } = await sb
        .from('profiles')
        .update({ coins })
        .eq('id', user.id)

      if (error) {
        console.warn('[IR] bonus coin save failed:', error.message)
        return
      }

      window.dispatchEvent(new CustomEvent('ir:profileChanged', {
        detail: { coins }
      }))
    } catch (e) {
      console.warn('[IR] bonus coin sync failed:', e)
    }
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-up]')
    if (!button) return
    const id = button.getAttribute('data-up')
    if (!BONUS_IDS.has(id)) return

    // Le moteur retire d'abord le prix et termine son rendu.
    // On attend ensuite et on sauvegarde uniquement le nouveau solde.
    setTimeout(syncCoins, 250)
    setTimeout(syncCoins, 900)
  }, true)
})()
