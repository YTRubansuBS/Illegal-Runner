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

      // One authoritative save at the end of each run: coins + level + distance + quests + history.
      code = code.replace(
        /  async function commonSave\(\) \{[\s\S]*?\n  \}\n(?=\s*(?:async )?function freePack)/,
        `  async function commonSave() {
    const distance = Math.floor(G.dist || 0)
    const runCoins = Math.max(0, Math.floor(G.coins || 0))
    // A completed level unlocks the next level. Infinite mode never decreases progress.
    const completedLevel = Number(G.level || 0)
    if (completedLevel > 0) profile.highest_level = Math.max(profile.highest_level || 1, Math.min(300, completedLevel + 1))

    if (isGuest || !sb || !user) {
      profile.coins = (profile.coins || 0) + runCoins
      profile.total_distance = (profile.total_distance || 0) + distance
      profile.best_distance = Math.max(profile.best_distance || 0, distance)
      profile.quest_distance = (profile.quest_distance || 0) + distance
      profile.quest_coins = (profile.quest_coins || 0) + runCoins
      profile.quest_games = (profile.quest_games || 0) + 1
      saveLocal()
      refreshTop()
      renderAll()
      return
    }

    try {
      const r = await sb.rpc('finish_run', {
        p_mode: completedLevel ? 'level' : 'infinite',
        p_level: completedLevel,
        p_distance: distance,
        p_coins: runCoins,
        p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        p_highest_level: profile.highest_level || 1
      })
      if (r.error) throw r.error
      // The database is authoritative: use its returned values immediately in the UI.
      if (r.data) Object.assign(profile, r.data)
      refreshTop()
      renderAll()
      window.dispatchEvent(new CustomEvent('ir:profileChanged', { detail: r.data || {} }))
    } catch (e) {
      console.error('[IR] finish_run error:', e)
      toast('☁️ Sauvegarde du run impossible.')
    }
  }
`
      )

      // Daily gift: Supabase prevents claiming it twice on the same day.
      code = code.replace(
        /  function freePack\(\) \{[\s\S]*?\n  \}\n(?=\s*function )/,
        `  async function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (isGuest) {
      if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui.")
      profile._freeToday = today
      profile.coins = (profile.coins || 0) + 75
      SFX.coin()
      saveLocal()
      refreshTop(); renderAll()
      return toast('🎁 +75 pièces gratuites !')
    }
    if (!sb || !user) return toast('Connecte-toi pour utiliser le cloud.')
    const { data, error } = await sb.rpc('claim_free_pack')
    if (error) return toast(String(error.message || '').includes('Already') ? "Déjà récupéré aujourd'hui." : '❌ Récompense indisponible.')
    profile.coins = Number(data || profile.coins || 0)
    profile._freeToday = today
    refreshTop(); renderAll(); SFX.coin()
    window.dispatchEvent(new CustomEvent('ir:profileChanged', { detail: { coins: profile.coins, _freeToday: today } }))
    toast('🎁 +75 pièces gratuites !')
  }
`
      )

      // Dash upgrade: 5 levels, from 20s at level 1 to 10s at level 5.
      code = code.replace(
        '["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."]',
        '["dash", "⚡", "Dash", 5, "20s de base → 10s au niveau max. Niveau 5 = traverse les obstacles."]'
      )
      code = code.replace(
        '["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."]',
        '["dash", "⚡", "Dash", 5, "20s de base → 10s au niveau max. Niveau 5 = traverse les obstacles."]'
      )
      code = code.replace(
        '["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."]',
        '["dash", "⚡", "Dash", 5, "20s de base → 10s au niveau max. Niveau 5 = traverse les obstacles."]'
      )
      code = code.replace(
        '"Niveau 6 : traverse et détruit les obstacles."',
        '"Niveau 5 : traverse et détruit les obstacles."'
      )

      // Dash cooldown: 20s / 17.5s / 15s / 12.5s / 10s.
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

      // Before max dash upgrade, colliding with an obstacle while dashing kills the run.
      // At level 5, the dash phases through obstacles and still destroys destructible ones.
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
          // Avant le niveau max, toucher un obstacle pendant le dash termine le run.
          o.hitDone = true
          G.lives = 0
          drawHearts()
          end()
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }`
      )

      // Keep equipped obstacle set attached to newly spawned obstacles.
      code = code.replace('    void set\n  }', '    if (G.obs.length) G.obs[G.obs.length - 1].set = set\n  }')
      code = code.replace(
        'ctx.fillStyle = "#ff2f7d"; ctx.shadowBlur = 16; ctx.shadowColor = "#ff2f7d"',
        'const set = o.set || profile.selected_obstacle_set || "classic"\n      const spikeColor = set === "energy" ? "#00e5ff" : set === "tech" ? "#a14dff" : set === "drone" ? "#54ffc1" : set === "chaos" ? "#ff5878" : "#ff2f7d"\n      ctx.fillStyle = spikeColor; ctx.shadowBlur = 16; ctx.shadowColor = spikeColor'
      )
      code = code.replace(
        'ctx.fillStyle = "#123f6e"; ctx.strokeStyle = w.accent; ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = w.accent',
        'const set = o.set || profile.selected_obstacle_set || "classic"\n      const wallColor = set === "energy" ? "#082f4a" : set === "tech" ? "#24104a" : set === "drone" ? "#123f35" : set === "chaos" ? "#3b101c" : "#123f6e"\n      ctx.fillStyle = wallColor; ctx.strokeStyle = w.accent; ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = w.accent'
      )
      code = code.replace(
        'ctx.fillStyle = "#0b1220"; ctx.strokeStyle = w.accent; ctx.lineWidth = 3; ctx.shadowBlur = 14; ctx.shadowColor = w.accent',
        `const character = profile.selected_character || "runner"
    const characterColor = character === "ninja" ? "#7c3aed" : character === "robot" ? "#94a3b8" : character === "ghost" ? "#e2e8f0" : character === "cyber" ? "#06b6d4" : "#0b1220"
    ctx.fillStyle = characterColor; ctx.strokeStyle = w.accent; ctx.lineWidth = 3; ctx.shadowBlur = 14; ctx.shadowColor = w.accent`
      )
      code = code.replace(
        'ctx.fillRect(12, 12, 20, 5)',
        `if (character === "ninja") { ctx.fillStyle = "#111827"; ctx.fillRect(7, 9, 28, 12); ctx.fillStyle = w.accent; ctx.fillRect(11, 13, 20, 4) }
    else if (character === "robot") { ctx.fillStyle = "#cbd5e1"; ctx.fillRect(9, 7, 24, 17); ctx.fillStyle = w.accent; ctx.fillRect(12, 13, 6, 4); ctx.fillRect(24, 13, 6, 4) }
    else if (character === "ghost") { ctx.fillStyle = "#f8fafc"; ctx.fillRect(10, 10, 22, 8); ctx.fillStyle = "#111827"; ctx.fillRect(14, 13, 4, 4); ctx.fillRect(24, 13, 4, 4) }
    else if (character === "cyber") { ctx.fillStyle = "#0f172a"; ctx.fillRect(8, 9, 26, 15); ctx.fillStyle = "#22d3ee"; ctx.fillRect(12, 13, 20, 5) }
    else { ctx.fillStyle = w.accent; ctx.fillRect(12, 12, 20, 5) }`
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
