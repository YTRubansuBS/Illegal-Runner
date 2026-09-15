/* ILLEGAL RUNNER loader: original engine + live customization + efficient persistence patch. */
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
        const STEP = 1 / 120 // fixed physics step`
      )

      // The database function now saves the whole run atomically. This avoids double-counting
      // coins/distance/quests and avoids a second profile write after every run.
      code = code.replace(
        `  async function commonSave() {
    profile.coins = (profile.coins || 0) + G.coins
    profile.total_distance = (profile.total_distance || 0) + Math.floor(G.dist)
    profile.best_distance = Math.max(profile.best_distance || 0, Math.floor(G.dist))
    profile.quest_distance = (profile.quest_distance || 0) + Math.floor(G.dist)
    profile.quest_coins = (profile.quest_coins || 0) + G.coins
    profile.quest_games = (profile.quest_games || 0) + 1
    if (!isGuest && sb) {
      try {
        await sb.rpc("finish_run", {
          p_mode: G.level ? "level" : "infinite", p_level: G.level,
          p_distance: Math.floor(G.dist), p_coins: G.coins,
          p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        })
      } catch (e) {}
    }
    await persist()
  }`,
        `  async function commonSave() {
    const distance = Math.floor(G.dist)
    if (isGuest || !sb || !user) {
      profile.coins = (profile.coins || 0) + G.coins
      profile.total_distance = (profile.total_distance || 0) + distance
      profile.best_distance = Math.max(profile.best_distance || 0, distance)
      profile.quest_distance = (profile.quest_distance || 0) + distance
      profile.quest_coins = (profile.quest_coins || 0) + G.coins
      profile.quest_games = (profile.quest_games || 0) + 1
      await persist()
      return
    }
    try {
      const r = await sb.rpc("finish_run", {
        p_mode: G.level ? "level" : "infinite", p_level: G.level,
        p_distance: distance, p_coins: G.coins,
        p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        p_highest_level: profile.highest_level || 1,
      })
      if (r.error) throw r.error
      if (r.data) Object.assign(profile, r.data)
      refreshTop()
    } catch (e) {
      console.log("[IR] finish_run error:", e.message || e)
      toast("☁️ Sauvegarde du run impossible.")
    }
  }`
      )

      // Free daily pack: one RPC in cloud, localStorage in local mode.
      code = code.replace(
        `  function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui.")
    profile._freeToday = today
    profile.coins += 75
    SFX.coin()
    persist(); toast("🎁 +75 pièces gratuites !")
  }`,
        `  async function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (isGuest) {
      if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui.")
      profile._freeToday = today
      profile.coins += 75
      SFX.coin()
      await persist()
      renderAll()
      return toast("🎁 +75 pièces gratuites !")
    }
    if (!sb || !user) return toast("Connecte-toi pour utiliser le cloud.")
    const { data, error } = await sb.rpc("claim_free_pack")
    if (error) return toast(error.message.includes("Already") ? "Déjà récupéré aujourd'hui." : "❌ Récompense indisponible.")
    profile.coins = Number(data || profile.coins)
    refreshTop(); renderAll(); SFX.coin(); toast("🎁 +75 pièces gratuites !")
  }`
      )

      // Keep the engine's character/obstacle visuals driven by the equipped selection.
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
      ext.src = 'customizer.js?v=5'
      document.body.appendChild(ext)
    })
    .catch(err => {
      console.error(err)
      const e = document.getElementById('err')
      if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.'
    })
})()
