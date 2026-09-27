(() => {
  'use strict'

  // Mobile stability fix: never let menu scaling affect the game canvas/touch layer.
  function fixGameLayer() {
    const game = document.getElementById('game')
    const canvas = document.getElementById('c')
    if (!game || !canvas) return
    game.style.transform = 'none'
    game.style.zoom = '1'
    canvas.style.transform = 'none'
    canvas.style.zoom = '1'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    game.style.touchAction = 'none'
  }

  // Prevent accidental double purchases/taps while the previous Supabase save is still running.
  let lockedUntil = 0
  function purchaseGuard(e) {
    const target = e.target && e.target.closest ? e.target.closest('#shop button, #upgradeGrid button, #shopGrid button, #packGrid button, #btnFreePack') : null
    if (!target || target.disabled) return
    const now = Date.now()
    if (now < lockedUntil) {
      e.preventDefault()
      e.stopImmediatePropagation()
      return
    }
    lockedUntil = now + 450
    target.dataset.irPurchaseLock = '1'
    target.disabled = true
    setTimeout(() => {
      if (target.isConnected) {
        target.disabled = false
        delete target.dataset.irPurchaseLock
      }
    }, 500)
  }

  function boot() {
    fixGameLayer()
    document.addEventListener('pointerdown', purchaseGuard, true)
    document.addEventListener('touchstart', purchaseGuard, { capture: true, passive: false })
    const observer = new MutationObserver(fixGameLayer)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', fixGameLayer, { passive: true })
    window.addEventListener('orientationchange', () => setTimeout(fixGameLayer, 50), { passive: true })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
