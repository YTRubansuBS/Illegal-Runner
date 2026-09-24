(() => {
  'use strict'

  // Legacy compatibility file kept in the build.
  // Upgrade purchases are now saved directly and authoritatively by game.js,
  // so this old click-based coin overwrite is intentionally disabled.

  // Small HUD: active timed boosts are shown directly UNDER the PAUSE button.
  function installBoostCooldowns() {
    const pause = document.getElementById('btnPause')
    if (!pause || !pause.parentElement) return false

    let box = document.getElementById('irBoostCooldowns')
    if (!box) {
      box = document.createElement('div')
      box.id = 'irBoostCooldowns'
      box.style.cssText = 'display:none;flex-direction:column;gap:5px;margin-top:7px;width:max-content;max-width:180px;pointer-events:none;z-index:30;'
      pause.parentElement.appendChild(box)
    }

    if (!document.getElementById('irBoostCooldownStyle')) {
      const style = document.createElement('style')
      style.id = 'irBoostCooldownStyle'
      style.textContent = '#irBoostCooldowns .irBoostCooldown{display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:rgba(4,8,18,.88);box-shadow:0 5px 16px rgba(0,0,0,.3);color:#fff;font:800 11px Inter,Arial,sans-serif;white-space:nowrap}#irBoostCooldowns .irBoostCooldown b{margin-left:auto;font-variant-numeric:tabular-nums;color:#7ffcff}#irBoostCooldowns .irBoostBar{width:38px;height:3px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden}#irBoostCooldowns .irBoostBar i{display:block;height:100%;border-radius:99px;background:#7ffcff}'
      document.head.appendChild(style)
    }
    return true
  }

  function updateBoostCooldowns() {
    const box = document.getElementById('irBoostCooldowns')
    const G = window.__IR_G
    if (!box || !G) return

    const items = []
    const mega = Number(G.jumpBoostT || 0)
    const coins = Number(G.coinBoostT || 0)

    if (mega > 0) items.push(['🚀', 'MÉGA-SAUT', mega, 15])
    if (coins > 0) items.push(['🪙', 'PIÈCES x2', coins, 15])

    box.innerHTML = items.map(([icon, label, left, max]) =>
      '<div class="irBoostCooldown">' +
      '<span>' + icon + '</span>' +
      '<span>' + label + '</span>' +
      '<b>' + left.toFixed(1) + 's</b>' +
      '<span class="irBoostBar"><i style="width:' + Math.max(0, Math.min(100, left / max * 100)).toFixed(1) + '%"></i></span>' +
      '</div>'
    ).join('')

    box.style.display = items.length && G.running ? 'flex' : 'none'
  }

  const timer = setInterval(() => {
    if (!installBoostCooldowns()) return
    updateBoostCooldowns()
  }, 100)
  window.__IR_BOOST_COOLDOWN_TIMER = timer
})()
