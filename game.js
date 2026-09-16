/* ILLEGAL RUNNER loader: original engine + live customization + persistent Supabase progression. */
(() => {
  const ORIGINAL = 'https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  fetch(ORIGINAL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Impossible de charger le moteur du jeu'); return r.text() })
    .then(code => {
      code = code.replace(
        'const STEP = 1 / 120 // fixed physics step',
        `window.addEventListener('ir:customizationChanged', e => {
          if (e.detail && typeof profile === 'object' && profile) Object.assign(profile, e.detail)
          if (e.detail?.selected_background && typeof G !== 'undefined' && G.world) G.world = WORLDS[e.detail.selected_background] || G.world
        })
        window.addEventListener('ir:profileChanged', e => {
          if (e.detail && typeof profile === 'object' && profile) Object.assign(profile, e.detail)
          if (typeof refreshTop === 'function') refreshTop()
          if (typeof renderAll === 'function') renderAll()
        })
        const STEP = 1 / 120 // fixed physics step`
      )

      code = code.replace(
        /  async function commonSave\(\) \{[\s\S]*?\n  \}\n(?=\s*(?:async )?function freePack)/,
        `  async function commonSave() {
    const distance = Math.floor(G.dist || 0)
    const runCoins = Math.max(0, Math.floor(G.coins || 0))
    const completedLevel = Number(G.level || 0)
    if (completedLevel > 0) profile.highest_level = Math.max(profile.highest_level || 1, Math.min(300, completedLevel + 1))
    if (isGuest || !sb || !user) {
      profile.coins = (profile.coins || 0) + runCoins
      profile.total_distance = (profile.total_distance || 0) + distance
      profile.best_distance = Math.max(profile.best_distance || 0, distance)
      profile.quest_distance = (profile.quest_distance || 0) + distance
      profile.quest_coins = (profile.quest_coins || 0) + runCoins
      profile.quest_games = (profile.quest_games || 0) + 1
      saveLocal(); refreshTop(); renderAll(); return
    }
    try {
      const r = await sb.rpc('finish_run', {
        p_mode: completedLevel ? 'level' : 'infinite', p_level: completedLevel,
        p_distance: distance, p_coins: runCoins,
        p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        p_highest_level: profile.highest_level || 1
      })
      if (r.error) throw r.error
      if (r.data) Object.assign(profile, r.data)
      refreshTop(); renderAll()
      window.dispatchEvent(new CustomEvent('ir:profileChanged', { detail: r.data || {} }))
    } catch (e) { console.error('[IR] finish_run error:', e); toast('☁️ Sauvegarde du run impossible.') }
  }
`
      )

      code = code.replace(
        /  function freePack\(\) \{[\s\S]*?\n  \}\n(?=\s*function )/,
        `  async function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (isGuest) {
      if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui.")
      profile._freeToday = today; profile.coins = (profile.coins || 0) + 75; SFX.coin(); saveLocal(); refreshTop(); renderAll(); return toast('🎁 +75 pièces gratuites !')
    }
    if (!sb || !user) return toast('Connecte-toi pour utiliser le cloud.')
    const { data, error } = await sb.rpc('claim_free_pack')
    if (error) return toast(String(error.message || '').includes('Already') ? "Déjà récupéré aujourd'hui." : '❌ Récompense indisponible.')
    profile.coins = Number(data || profile.coins || 0); profile._freeToday = today; refreshTop(); renderAll(); SFX.coin()
    window.dispatchEvent(new CustomEvent('ir:profileChanged', { detail: { coins: profile.coins, _freeToday: today } })); toast('🎁 +75 pièces gratuites !')
  }
`
      )

      // Dash upgrade: 5 levels, from 20s at level 1 to 10s at level 5.
      code = code.replace(
        '["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."]',
        '["dash", "⚡", "Dash", 5, "20s de base → 10s au niveau max. Niveau 5 = traverse les obstacles."]'
      )
      code = code.replace('"Niveau 6 : traverse et détruit les obstacles."', '"Niveau 5 : traverse et détruit les obstacles."')
      code = code.replace(
        '  function dash() {\n',
        `  const getDashCooldown = () => {
    const level = Math.max(1, Math.min(5, Number(profile.dash_level || 1)))
    return 20 - (level - 1) * 2.5
  }

  function dash() {
`
      )
      code = code.replace('    G.dashCd = 1.6', '    G.dashCd = getDashCooldown()')
      code = code.replace(
        `        if (G.dashT > 0 && DESTRUCTIBLE[o.type]) {
          o.dead = true
          burst(o.x + o.w / 2, o.y + o.h / 2, G.world.accent, 14)
          SFX.dash()
        } else if (G.dashT > 0) {
          // dash phases through walls/cars: no damage, no destroy
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }`,
        `        const dashMaxed = (profile.dash_level || 1) >= 5
        if (G.dashT > 0 && dashMaxed && DESTRUCTIBLE[o.type]) {
          o.dead = true
          burst(o.x + o.w / 2, o.y + o.h / 2, G.world.accent, 14)
          SFX.dash()
        } else if (G.dashT > 0 && dashMaxed) {
          // Niveau 5 : le dash traverse les obstacles.
        } else if (G.dashT > 0) {
          o.hitDone = true
          G.lives = 0
          drawHearts()
          end()
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }`
      )

      // Double jump upgrade: level 0 = locked, level 1+ = double jump unlocked, max 5.
      code = code.replace(
        '["jump", "⬆️", "Saut", 6, "Hauteur et double-saut renforcés."]',
        '["jump", "🪽", "Double Saut", 5, "Niveau 1 débloque le double saut. Les niveaux suivants renforcent le saut."]'
      )
      code = code.replace(
        'lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1, bonus_level: 1,',
        'lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 0, coin_level: 1, bonus_level: 1,'
      )
      code = code.replace(
        'const v = profile[id + "_level"] || 1\n      const cost = 100 * v',
        'const v = id === "jump" ? Number(profile.jump_level || 0) : (profile[id + "_level"] || 1)\n      const cost = 100 * Math.max(1, v)'
      )
      code = code.replace(
        'if (G.player.ground) {\n      G.player.vy = -power',
        'if (G.player.ground) {\n      G.player.vy = -power'
      )
      code = code.replace(
        '} else if (G.canDouble) {',
        '} else if ((profile.jump_level || 0) >= 1 && G.canDouble) {'
      )

      // Remove the deleted jump button wiring. Jump is now done by tapping/clicking the game screen.
      code = code.replace(
        `    const jb = $("btnJump")
    jb.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })
    jb.addEventListener("pointerup", releaseJump)
    jb.addEventListener("pointercancel", releaseJump)
    $("btnDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dash() })`,
        `    $("btnDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dash() })`
      )

      // Canvas already fills the game area: a click/tap jumps; the only visible control is Dash.
      code = code.replace(
        'const c = $("c")\n    c.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })',
        'const c = $("c")\n    c.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })'
      )

      const s = document.createElement('script')
      s.textContent = code
      document.head.appendChild(s)
      const ext = document.createElement('script')
      ext.src = 'customizer.js?v=8'
      document.body.appendChild(ext)
    })
    .catch(err => {
      console.error(err)
      const e = document.getElementById('err')
      if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.'
    })
})()
