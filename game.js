/* ILLEGAL RUNNER loader: original engine + live customization + persistent Supabase progression. */
(() => {
  const ORIGINAL = 'https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  function replaceBetween(source, startMarker, endMarker, replacement) {
    const a = source.indexOf(startMarker)
    const b = source.indexOf(endMarker, a)
    if (a < 0 || b < 0) {
      console.error("[IR] replacement marker not found:", startMarker)
      return source
    }
    return source.slice(0, a) + replacement + "\n" + source.slice(b)
  }

  fetch(ORIGINAL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Impossible de charger le moteur du jeu'); return r.text() })
    .then(code => {
      code = code.replace('const G = {', 'const G = window.__IR_G = {')
      code = code.replace('const STEP = 1 / 120 // fixed physics step', `window.addEventListener('ir:customizationChanged', e => {
          if (e.detail && typeof profile === 'object' && profile) Object.assign(profile, e.detail)
          if (e.detail?.selected_background && typeof G !== 'undefined' && G.world) G.world = WORLDS[e.detail.selected_background] || G.world
        })
        window.addEventListener('ir:finishFlagTick', () => {})
        ;(() => {
          let finishFlag = null
          let finishFlagStyle = null
          function ensureFinishFlag() {
            if (finishFlag && document.body.contains(finishFlag)) return finishFlag
            finishFlag = document.createElement('div')
            finishFlag.id = 'irFinishFlag'
            finishFlag.innerHTML = '<div class="irff-pole"></div><div class="irff-check">🏁</div><div class="irff-base"></div>'
            finishFlagStyle = document.createElement('style')
            finishFlagStyle.textContent =
              '#irFinishFlag{position:fixed;left:72%;top:50%;transform:translate(-50%,-50%);width:110px;height:170px;z-index:2147483647;pointer-events:none;display:none}' +
              '#irFinishFlag .irff-pole{position:absolute;left:38px;bottom:8px;width:8px;height:150px;background:#fff;border-radius:5px;box-shadow:0 0 12px #00e5ff}' +
              '#irFinishFlag .irff-check{position:absolute;left:46px;top:5px;width:62px;height:46px;display:flex;align-items:center;justify-content:center;font-size:30px;filter:drop-shadow(0 0 10px #00e5ff)}' +
              '#irFinishFlag .irff-base{position:absolute;left:18px;bottom:0;width:50px;height:11px;border-radius:50%;background:#00e5ff;box-shadow:0 0 18px #00e5ff}'
            document.head.appendChild(finishFlagStyle)
            document.body.appendChild(finishFlag)
            return finishFlag
          }
          function updateFinishFlag() {
            const f = ensureFinishFlag()
            const game = document.getElementById('game')
            const over = document.getElementById('over')
            const playing = !!G && G.running === true
            const visibleGame = !!game && getComputedStyle(game).display !== 'none'
            const visibleOver = !!over && getComputedStyle(over).display !== 'none'
            if (!playing || !visibleGame || visibleOver || !G.level || !Number.isFinite(G.dist) || !Number.isFinite(G.goal) || G.goal <= 0) {
              f.style.display = 'none'
              return
            }
            const progress = Math.max(0, Math.min(1, G.dist / G.goal))
            if (progress < 0.95) {
              f.style.display = 'none'
              return
            }
            const approach = Math.max(0, Math.min(1, (progress - 0.95) / 0.05))
            f.style.left = (78 - approach * 58) + '%'
            f.style.top = (50 + Math.sin(approach * Math.PI) * 2) + '%'
            f.style.transform = 'translate(-50%, -50%) scale(' + (1 + approach * 0.18) + ')'
            f.style.display = 'block'
          }
          ensureFinishFlag()
          setInterval(updateFinishFlag, 50)
        })()
        ;(() => {
          let pauseStart = 0
          let pauseCountdown = null
          function showPause(show) {
            const p = document.getElementById("pauseOverlay")
            if (p) p.style.display = show ? "grid" : "none"
          }
          function pauseGame() {
            if (!G.running) return
            G.running = false
            cancelAnimationFrame(G.raf)
            pauseStart = performance.now()
            showPause(true)
          }
          function resumeGame() {
            if (G.running || !pauseStart) return
            showPause(false)
            const el = document.getElementById("countdown")
            el.style.display = "flex"
            el.classList.remove("go")
            let n = 3
            el.textContent = n
            SFX.tick()
            if (pauseCountdown) clearInterval(pauseCountdown)
            pauseCountdown = setInterval(() => {
              n--
              if (n > 0) { el.textContent = n; SFX.tick() }
              else if (n === 0) { el.textContent = "GO!"; el.classList.add("go"); SFX.go() }
              else {
                clearInterval(pauseCountdown)
                pauseCountdown = null
                el.style.display = "none"
                G.running = true
                G.startTime += performance.now() - pauseStart
                pauseStart = 0
                G.last = performance.now()
                G.acc = 0
                G.raf = requestAnimationFrame(loop)
              }
            }, 600)
          }
          function restartFromPause() {
            showPause(false)
            if (pauseCountdown) { clearInterval(pauseCountdown); pauseCountdown = null }
            pauseStart = 0
            start(G.level)
          }
          function quitFromPause() {
            showPause(false)
            if (pauseCountdown) { clearInterval(pauseCountdown); pauseCountdown = null }
            pauseStart = 0
            quit()
          }
          window.addEventListener("ir:pause", pauseGame)
          window.addEventListener("ir:resume", resumeGame)
          window.addEventListener("ir:pauseRestart", restartFromPause)
          window.addEventListener("ir:pauseQuit", quitFromPause)
        })()
        const STEP = 1 / 120 // fixed physics step`)
      code = code.replace('    $("btnQuit").onclick = quit', '    $("btnPause").onclick = () => window.dispatchEvent(new CustomEvent("ir:pause"))')
      code = code.replace('    $("btnOverMenu").onclick = quit', '    $("btnOverMenu").onclick = quit\n    $("btnResume").onclick = () => window.dispatchEvent(new CustomEvent("ir:resume"))\n    $("btnPauseRestart").onclick = () => window.dispatchEvent(new CustomEvent("ir:pauseRestart"))\n    $("btnPauseQuit").onclick = () => window.dispatchEvent(new CustomEvent("ir:pauseQuit"))')
      code = code.replace('  async function persist() {', `  async function persist() {
    try {
      const bonusKeys = ["bonus_shield_level","bonus_mega_level","bonus_x2_level","bonus_jetpack_level","bonus_scoreDouble_level","bonus_magnet_level"]
      const bonusSave = {}
      for (const k of bonusKeys) bonusSave[k] = Math.max(1, Math.min(6, Number(profile[k] || 1)))
      localStorage.setItem("ir_bonus_upgrades:" + (user?.id || profile.username || "guest"), JSON.stringify(bonusSave))
    } catch (e) {}
`);
      code = replaceBetween(code, "  async function commonSave() {", "  function freePack() {", `  async function commonSave() {
    const distance = Math.max(0, Math.floor(G.dist || 0))
    const runCoins = Math.max(0, Math.floor(G.coins || 0))
    const completedLevel = Number(G.level || 0)
    if (completedLevel > 0) profile.highest_level = Math.max(profile.highest_level || 1, Math.min(300, completedLevel + 1))
    if (isGuest || !sb || !user) {
      profile.coins = Math.max(0, Number(profile.coins || 0)) + runCoins
      profile.total_distance = Math.max(0, Number(profile.total_distance || 0)) + distance
      profile.best_distance = Math.max(Number(profile.best_distance || 0), distance)
      profile.quest_distance = Math.max(0, Number(profile.quest_distance || 0)) + distance
      profile.quest_coins = Math.max(0, Number(profile.quest_coins || 0)) + runCoins
      profile.quest_games = Math.max(0, Number(profile.quest_games || 0)) + 1
      saveLocal()
      refreshTop(); renderAll()
      return
    }
    try {
      const r = await sb.rpc("finish_run", {
        p_mode: completedLevel ? "level" : "infinite",
        p_level: completedLevel,
        p_distance: distance,
        p_coins: runCoins,
        p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        p_highest_level: profile.highest_level || 1
      })
      if (r.error) throw r.error
      if (r.data) Object.assign(profile, r.data)
      refreshTop(); renderAll()
      window.dispatchEvent(new CustomEvent("ir:profileChanged", { detail: r.data || {} }))
    } catch (e) {
      console.error("[IR] finish_run error:", e)
      toast("☁️ Sauvegarde du run impossible.")
    }
  }
`)
      code = code.replace(/  function freePack\(\) \{[\s\S]*?\n  \}\n(?=\s*function )/, `  async function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (isGuest) { if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui."); profile._freeToday = today; profile.coins = (profile.coins || 0) + 75; SFX.coin(); saveLocal(); refreshTop(); renderAll(); return toast('🎁 +75 pièces gratuites !') }
    if (!sb || !user) return toast('Connecte-toi pour utiliser le cloud.')
    const { data, error } = await sb.rpc('claim_free_pack')
    if (error) return toast(String(error.message || '').includes('Already') ? "Déjà récupéré aujourd'hui." : '❌ Récompense indisponible.')
    profile.coins = Number(data || profile.coins || 0); profile._freeToday = today; refreshTop(); renderAll(); SFX.coin(); window.dispatchEvent(new CustomEvent('ir:profileChanged', { detail: { coins: profile.coins, _freeToday: today } })); toast('🎁 +75 pièces gratuites !')
  }
`)
            code = replaceBetween(code, "  async function finish() {", "  async function end() {", `  async function finish() {
    if (!G.running) return
    G.running = false
    cancelAnimationFrame(G.raf)
    const firstCompletion = G.level >= (profile.highest_level || 1)
    const reward = firstCompletion ? (100 * Math.ceil(G.level / 10)) : 0
    if (firstCompletion) G.coins = Math.max(0, Math.floor(G.coins || 0)) + reward
    const collected = Math.max(0, Math.floor(G.coins || 0))
    if (G.level >= (profile.highest_level || 1) && G.level < 300) profile.highest_level = G.level + 1
    if (G.level >= 300) profile.highest_level = 300
    window.dispatchEvent(new CustomEvent("ir:levelCompletion", { detail: { level: G.level, collected, reward, total: collected, firstCompletion } }))
    await commonSave()
    const progressBar = $("progressBar")
    if (progressBar) progressBar.style.width = "0%"
    SFX.win()
    showEnd(G.level >= 300 ? "👑 CHAMPION !" : "🏁 NIVEAU " + G.level + " TERMINÉ")
  }
`)
      code = code.replace('    showEnd("TU ES MORT")', '    const progressBar = $("progressBar")\n    if (progressBar) progressBar.style.width = "0%"\n    showEnd("TU ES MORT")')
      code = code.replace(/  async function loadLeaderboard\(\) \{[\s\S]*?\n  \}\n(?=  async function loadFriends)/, "  async function loadLeaderboard() {\n    const box = $(\"leaderList\")\n    if (isGuest || !sb) { $(\"leaderInfo\").textContent = \"Mode local : connecte-toi pour le classement en ligne.\"; box.innerHTML = '<div class=\"card\">☁️ Classement disponible en MODE COMPTE.</div>'; return }\n    const q = await sb.rpc(\"get_leaderboard\")\n    if (q.error) { box.innerHTML = '<div class=\"card\">❌ Erreur de chargement du classement.</div>'; return }\n    const rows = Array.isArray(q.data) ? q.data : []\n    $(\"leaderInfo\").textContent = \"Classement complet — \" + rows.length + \" joueur(s).\"\n    box.innerHTML = rows.map((r,i) => '<div class=\"rank\"><strong>#'+(i+1)+'</strong><span style=\"flex:1\">'+escapeHtml(r.username)+'</span><b>🏆 '+Number(r.best_distance||0)+'m</b><span class=\"muted\">LV '+Number(r.highest_level||1)+'</span></div>').join('') || '<div class=\"card\">Aucun joueur.</div>'\n  }")
      code = code.replace('["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."]', '["dash", "⚡", "Dash", 5, "20s de base → 10s au niveau max. Niveau 5 = traverse les obstacles."]')
      code = code.replace('if (p.y > G.H + 40) { hurt(true); p.y = G.groundY - p.h; p.vy = 0 }', 'if (p.y > G.H + 40) { G.lives = 0; drawHearts(); end() }')
      code = code.replace('if (p.y > G.H + 40) { G.lives = 0; drawHearts(); end() }', 'let pitLava = null; for (const o of G.obs) { if (o.type === "pit" && p.x + 8 < o.x + o.w && p.x + p.w - 8 > o.x && p.y + p.h >= G.groundY + G.groundH - 24) { pitLava = o; break } } if (pitLava) { hurt(false); p.x = Math.max(80, G.W * 0.2); p.y = G.groundY - p.h; p.vy = 0; p.ground = true; return } if (p.y > G.H + 40) { hurt(true); p.y = G.groundY - p.h; p.vy = 0 }')
      code = code.replace('const w = rand(90, Math.min(160, 100 + d * 0.02))', 'const w = 160')
      code = code.replace('for (const o of G.obs) if (o.type === "pit") { ctx.fillStyle = "#000"; ctx.fillRect(o.x, gy - 1, o.w, G.groundH + 2) }', 'for (const o of G.obs) if (o.type === "pit") { ctx.fillStyle = "#000"; ctx.fillRect(o.x, gy - 1, o.w, G.groundH + 2); ctx.fillStyle = "#ff3b00"; ctx.fillRect(o.x, gy + G.groundH - 22, o.w, 22); ctx.fillStyle = "#ffb000"; ctx.fillRect(o.x, gy + G.groundH - 22, o.w, 5) }')
      code = code.replace('"Niveau 6 : traverse et détruit les obstacles."', '"Niveau 5 : traverse et détruit les obstacles."')
      code = code.replace('  function dash() {\n', `  const getDashCooldown = () => { const level = Math.max(1, Math.min(5, Number(profile.dash_level || 1))); return 20 - (level - 1) * 2.5 }

  function dash() {
`)
      code = code.replace('    G.dashCd = 1.6', '    G.dashCd = getDashCooldown()')
      code = code.replace(`        if (G.dashT > 0 && DESTRUCTIBLE[o.type]) {
          o.dead = true
          burst(o.x + o.w / 2, o.y + o.h / 2, G.world.accent, 14)
          SFX.dash()
        } else if (G.dashT > 0) {
          // dash phases through walls/cars: no damage, no destroy
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }`, `        const dashMaxed = (profile.dash_level || 1) >= 5
        if (G.dashT > 0 && dashMaxed && DESTRUCTIBLE[o.type]) {
          o.dead = true
          burst(o.x + o.w / 2, o.y + o.h / 2, G.world.accent, 14)
          SFX.dash()
        } else if (G.dashT > 0 && dashMaxed) {
        } else if (G.dashT > 0) {
          o.hitDone = true
          G.lives = 0
          drawHearts()
          end()
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }`)
      code = code.replace('["jump", "⬆️", "Saut", 6, "Hauteur et double-saut renforcés."]', '["jump", "🪽", "Saut", 2, "Niveau 2 : débloque le double saut pour 5000 pièces."]')
      code = replaceBetween(code, "  const UPGRADES = [", "  const DEFAULTS = {", `  const UPGRADES = [
    ["lives", "❤️", "Vies", 5, "Plus de vies par partie."],
    ["distance", "🏃", "Distance", 6, "Augmente la vitesse et le score de départ."],
    ["dash", "⚡", "Dash", 5, "Réduit le cooldown. Niveau 5 = traverse/détruit les obstacles."],
    ["jump", "🪽", "Saut", 2, "Niveau 2 = débloque le double saut."],
    ["coin", "🪙", "Pièces", 6, "Multiplie les pièces ramassées."],
    ["bonus", "✨", "Bonus", 6, "Augmente la fréquence d'apparition des bonus."],
    ["bonus_shield", "🛡️", "Bouclier", 6, "Augmente la durée du Bouclier."],
    ["bonus_mega", "🚀", "Méga-saut", 6, "Augmente la durée du Méga-saut."],
    ["bonus_x2", "🪙", "Pièces x2", 6, "Augmente la durée de Pièces x2."],
    ["bonus_jetpack", "🛩️", "Jetpack", 6, "Augmente la durée du Jetpack."],
    ["bonus_scoreDouble", "🏆", "Score x2", 6, "Augmente la durée du Score x2."],
    ["bonus_magnet", "🧲", "Aimant", 6, "Augmente la durée de l'Aimant."]
  ]
`)
      code = code.replace('lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1, bonus_level: 1,', 'lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1, bonus_level: 1, bonus_shield_level: 1, bonus_mega_level: 1, bonus_x2_level: 1, bonus_jetpack_level: 1, bonus_scoreDouble_level: 1, bonus_magnet_level: 1,')
      code = code.replace('  async function boot() {', `  async function boot() {
    try {
      const savedBonus = JSON.parse(localStorage.getItem("ir_bonus_upgrades:" + (user?.id || profile.username || "guest")) || "{}")
      for (const k of ["bonus_shield_level","bonus_mega_level","bonus_x2_level","bonus_jetpack_level","bonus_scoreDouble_level","bonus_magnet_level"]) {
        if (savedBonus[k]) profile[k] = Math.max(1, Math.min(6, Number(savedBonus[k])))
      }
    } catch (e) {}
`);
      code = code.replace('  function renderUpgrades() {', `  try { const savedBonus = JSON.parse(localStorage.getItem("ir_bonus_upgrades") || "{}"); for (const k of ["bonus_shield_level","bonus_mega_level","bonus_x2_level","bonus_jetpack_level","bonus_scoreDouble_level","bonus_magnet_level"]) if (savedBonus[k]) profile[k] = Math.max(1, Math.min(6, Number(savedBonus[k]))) } catch(e) {}
  function renderUpgrades() {`);
      code = replaceBetween(code, "  function renderUpgrades() {", "  function renderShop() {", `  function renderUpgrades() {
    const costFor = (v) => [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]
    const durationFor = (id, v) => id === "bonus" ? 0 : (5 + (v - 1) * 2)
    const bonusDurationIds = ["bonus_shield","bonus_mega","bonus_x2","bonus_jetpack","bonus_scoreDouble","bonus_magnet"]
    const bonusDurationKey = id => "ir_bonus_duration:" + (user?.id || profile.username || "guest") + ":" + id
    const selectedDuration = (id, level) => {
      const max = 5 + (Math.max(1, Math.min(6, level)) - 1) * 2
      let value = 5
      try { value = Number(localStorage.getItem(bonusDurationKey(id)) || 5) } catch (e) {}
      if (!Number.isFinite(value)) value = 5
      value = Math.round((value - 5) / 2) * 2 + 5
      return Math.max(5, Math.min(max, value))
    }
    const cards = UPGRADES.map(([id, em, n, max, desc]) => {
      const v = Number(profile[id + "_level"] || 1)
      const cost = costFor(v)
      const maxed = v >= max
      const duration = durationFor(id, v)
      const isDuration = bonusDurationIds.includes(id)
      const chosen = isDuration ? selectedDuration(id, v) : duration
      const options = isDuration
        ? [5,7,9,11,13,15].filter(s => s <= 5 + (Math.min(6, v) - 1) * 2).map(s => '<option value="' + s + '"' + (s === chosen ? ' selected' : '') + '>' + s + ' secondes</option>').join('')
        : ''
      return '<div class="card"><div class="emoji">' + em + '</div><h3>' + n + '</h3>' + (id === "bonus" ? '' : '<p class="muted">' + desc + '</p>') +
        '<p>Niveau ' + v + '/' + max + '</p>' +
        (id === "bonus" ? '<p>⚡ Apparition plus fréquente à chaque niveau.</p>' : isDuration ? '<div style="margin:10px 0"><div class="muted" style="margin-bottom:6px">⏱️ Choisir la durée</div><div style="display:flex;gap:6px;flex-wrap:wrap" data-bonus-duration="' + id + '">' + [5,7,9,11,13,15].filter(s => s <= 5 + (Math.min(6, v) - 1) * 2).map(s => '<button type="button" data-duration-value="' + s + '" style="min-width:52px;padding:7px 9px;font-weight:900;border:2px solid ' + (s === chosen ? '#00e5ff' : '#26324a') + ';background:' + (s === chosen ? '#0b2430' : '#0a0f18') + ';color:#fff;border-radius:6px;cursor:pointer">' + s + 's</button>').join('') + '</div></div>' : '<p>⏱️ Durée : <b>' + duration + 's</b></p>') +
        '<div class="progress"><i style="width:' + ((v / max) * 100) + '%"></i></div>' +
        '<button data-up="' + id + '" ' + (maxed ? 'disabled' : '') + '>' + (maxed ? 'MAX' : '⚡ AMÉLIORER · 🪙 ' + cost) + '</button></div>'
    }).join("")
    $("upgradeGrid").innerHTML = cards
    $("upgradeGrid").querySelectorAll("[data-bonus-duration]").forEach(box => {
      box.querySelectorAll("[data-duration-value]").forEach(btn => {
        btn.onclick = () => {
          const id = box.dataset.bonusDuration
          const level = Number(profile[id + "_level"] || 1)
          const max = 5 + (Math.min(6, level) - 1) * 2
          const value = Math.max(5, Math.min(max, Number(btn.dataset.durationValue)))
          try { localStorage.setItem(bonusDurationKey(id), String(value)) } catch (e) {}
          renderUpgrades()
          toast("⏱️ " + value + "s sélectionnées pour " + (UPGRADES.find(u => u[0] === id)?.[2] || "ce bonus") + ".")
        }
      })
    })
  }
`)
      code = replaceBetween(code, "  async function buyUpgrade(id) {", "  function freePack() {", `  async function buyUpgrade(id) {
    const entry = UPGRADES.find((u) => u[0] === id)
    if (!entry) return
    const max = entry[3]
    const key = id + "_level"
    const v = Number(profile[key] || 1)
    if (v >= max) return toast("Niveau maximum !")
    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]
    if ((profile.coins || 0) < cost) return toast("Pas assez de pièces.")
    profile.coins -= cost
    profile[key] = v + 1
    SFX.bonus()
    await persist()
    renderAll()
    toast("⚡ " + entry[2] + " amélioré ! Niveau " + (v + 1) + "/" + max)
  }
`)
      code = code.replace('const v = profile[id + "_level"] || 1\n      const cost = 100 * v', 'const v = id === "jump" ? Number(profile.jump_level || 1) : (profile[id + "_level"] || 1)\n      const cost = id === "jump" ? 5000 : 100 * Math.max(1, v)')
      code = code.replace('} else if (G.canDouble) {', '} else if ((profile.jump_level || 1) >= 2 && G.canDouble) {')
      code = code.replace('    const v = profile[key] || 1\n    if (v >= max) return toast("Niveau maximum !")\n    const cost = 100 * v', '    const v = id === "jump" ? Number(profile.jump_level || 1) : (profile[key] || 1)\n    if (v >= max) return toast("Niveau maximum !")\n    const cost = id === "jump" ? 5000 : 100 * Math.max(1, v)')
      code = code.replace(/const cost = id === "jump" \? 5000 : 100 \* Math\.max\(1, v\)/g, 'const OTHER_UPGRADE_COSTS = [100, 500, 1000, 2500, 5000]\n      const cost = id === "jump" ? 5000 : OTHER_UPGRADE_COSTS[Math.min(Math.max(0, v - 1), OTHER_UPGRADE_COSTS.length - 1)]')
      code = code.replace(/  function renderShop\(\) \{[\s\S]*?\n  \}\n(?=\s*function renderPacks)/, `  function renderShop() {
    const el = $("shopGrid")
    if (el) el.innerHTML = ""
  }
`)
      code = code.replace(`    const jb = $("btnJump")
    jb.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })
    jb.addEventListener("pointerup", releaseJump)
    jb.addEventListener("pointercancel", releaseJump)
    $("btnDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dash() })`, `    $("btnDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dash() })`)
      code = code.replace('else if (t.dataset.pack) openPack(t.dataset.pack)', 'else if (t.dataset.pack) { e.preventDefault(); }')
      code = code.replace('const ext = document.createElement(\'script\'); ext.src = \'customizer.js?v=8\'; document.body.appendChild(ext)', `const oldLegacy = document.getElementById('legacyPackBox')
      if (oldLegacy) oldLegacy.style.display = 'none'
      const ext = document.createElement('script'); ext.src = 'customizer.js?v=9'; document.body.appendChild(ext)`)
      code = code.replace(/  async function loadFriends\(\) \{[\s\S]*?\n  \}\n  async function addFriend\(\) \{[\s\S]*?\n  \}\n(?=  async function adminSearch)/, `  async function loadFriends() {
    const box = $("friendList")
    if (isGuest || !sb) { box.innerHTML = \`<div class="card">☁️ Les amis sont disponibles en MODE COMPTE.</div>\`; return }
    const q = await sb.from("friends").select("id,user_id,friend_id,status,created_at").or("user_id.eq." + user.id + ",friend_id.eq." + user.id).order("created_at", { ascending: false })
    if (q.error) { box.innerHTML = \`<div class="card">❌ Impossible de charger les demandes d'amis.</div>\`; return }
    const rows = q.data || []
    const ids = [...new Set(rows.map(r => r.user_id === user.id ? r.friend_id : r.user_id))]
    let profiles = []
    if (ids.length) {
      const p = await sb.from("profiles").select("id,username,best_distance").in("id", ids)
      if (p.error) { box.innerHTML = \`<div class="card">❌ Impossible de charger les profils.</div>\`; return }
      profiles = p.data || []
    }
    const byId = Object.fromEntries(profiles.map(p => [p.id, p]))
    if (!rows.length) { box.innerHTML = \`<div class="card">Aucun ami ou demande pour le moment.</div>\`; return }
    box.innerHTML = rows.map(r => {
      const other = r.user_id === user.id ? r.friend_id : r.user_id
      const name = escapeHtml(byId[other]?.username || "Joueur")
      const dist = Number(byId[other]?.best_distance || 0)
      if (r.status === "pending" && r.friend_id === user.id) return \`<div class="friend"><span style="flex:1">👤 \${name}<br><small class="muted">veut être ton ami</small></span><button data-friend-action="accept" data-friend-id="\${r.id}">✅ ACCEPTER</button><button data-friend-action="decline" data-friend-id="\${r.id}">❌ REFUSER</button></div>\`
      if (r.status === "pending") return \`<div class="friend"><span style="flex:1">👤 \${name}<br><small class="muted">demande envoyée</small></span><button data-friend-action="delete" data-friend-id="\${r.id}">↩️ ANNULER</button></div>\`
      return \`<div class="friend"><span style="flex:1">👤 \${name}<br><small class="muted">🏆 \${dist}m · ami</small></span><button data-friend-action="delete" data-friend-id="\${r.id}">🗑️ SUPPRIMER</button></div>\`
    }).join("")
  }
  async function addFriend() {
    if (isGuest || !sb) return toast("Connecte-toi pour ajouter des amis.")
    const n = cleanName($("friendName").value)
    if (!n) return toast("Entre un pseudo.")
    const q = await sb.from("profiles").select("id,username").ilike("username", n).limit(1).single()
    if (q.error) return toast("Joueur introuvable.")
    if (q.data.id === user.id) return toast("Impossible de t'ajouter toi-même.")
    const existing = await sb.from("friends").select("id,status,user_id,friend_id").or("and(user_id.eq." + user.id + ",friend_id.eq." + q.data.id + "),and(user_id.eq." + q.data.id + ",friend_id.eq." + user.id + ")").limit(1)
    if (existing.error) return toast("Impossible de vérifier la demande.")
    if (existing.data?.length) {
      const e = existing.data[0]
      if (e.status === "accepted") return toast("Vous êtes déjà amis.")
      if (e.status === "pending" && e.user_id === user.id) return toast("Demande déjà envoyée.")
      if (e.status === "pending" && e.friend_id === user.id) return toast("Cette personne t'a déjà envoyé une demande : accepte-la dans Amis.")
    }
    const r = await sb.from("friends").insert({ user_id: user.id, friend_id: q.data.id, status: "pending" })
    if (r.error) return toast("❌ " + (r.error.message || "Demande impossible."))
    $("friendName").value = ""
    toast("📨 Demande d'ami envoyée !")
    await loadFriends()
  }
  async function friendAction(action, rowId) {
    if (isGuest || !sb) return toast("Connecte-toi pour gérer tes amis.")
    if (action === "accept") {
      const r = await sb.from("friends").update({ status: "accepted" }).eq("id", rowId).eq("friend_id", user.id)
      if (r.error) return toast("❌ Impossible d'accepter.")
      toast("✅ Demande acceptée !")
    } else {
      const r = await sb.from("friends").delete().eq("id", rowId)
      if (r.error) return toast("❌ Impossible de supprimer cette demande.")
      toast(action === "delete" ? "🗑️ Ami supprimé." : "↩️ Demande annulée.")
    }
    await loadFriends()
  }
`)
      code = code.replace('  async function adminSearch() {', `  document.addEventListener("click", e => {
    const b = e.target.closest("[data-friend-action]")
    if (!b) return
    e.preventDefault()
    e.stopPropagation()
    friendAction(b.dataset.friendAction, b.dataset.friendId)
  })
  async function adminSearch() {`)
      code = code.replace('shield: false, coinMult: 1, coinBoostT: 0, jumpBoostT: 0,', 'shield: false, shieldT: 0, coinMult: 1, coinBoostT: 0, jumpBoostT: 0, scoreDoubleT: 0, jetpackT: 0, jetpackHold: false, magnetT: 0, scoreMult: 1,')
      code = code.replace('const types = ["shield", "mega", "x2"]', 'const types = ["shield", "mega", "x2", "jetpack", "scoreDouble", "magnet"]')
      code = code.replace('const t = pick(types)', 'const t = pick(types)')
      code = code.replace('if (G.coinBoostT > 0) { G.coinBoostT -= dt; G.coinMult = 2 } else G.coinMult = 1', 'if (G.shieldT > 0) { G.shieldT -= dt; if (G.shieldT <= 0) { G.shieldT = 0; G.shield = false } }\n    if (G.coinBoostT > 0) { G.coinBoostT -= dt; G.coinMult = 2 } else G.coinMult = 1\n    if (G.scoreDoubleT > 0) { G.scoreDoubleT -= dt; G.scoreMult = 2 } else G.scoreMult = 1\n    if (G.jetpackT > 0) G.jetpackT -= dt; else G.jetpackHold = false\n    if (G.magnetT > 0) G.magnetT -= dt')
      code = code.replace('for (const c of G.coinsArr) c.x -= G.speed * dt', 'for (const c of G.coinsArr) { c.x -= G.speed * dt; if (G.magnetT > 0 && !c.got) { const dx = (G.player.x + 20) - c.x, dy = (G.player.y + 20) - c.y, d = Math.hypot(dx, dy); if (d < 260 && d > 1) { c.x += dx / d * 900 * dt; c.y += dy / d * 900 * dt } } }')
      code = code.replace('const grav = 2600\n    p.vy += grav * dt', 'const grav = 2600\n    if (G.jetpackT > 0 && G.jetpackHold) { p.vy = -420; p.y = p.y + p.vy * dt } else p.vy += grav * dt')
      code = code.replace('  function applyBonus(type) {', '  function applyBonus(type) {\n    const durationLevel = { shield: "bonus_shield_level", mega: "bonus_mega_level", x2: "bonus_x2_level", jetpack: "bonus_jetpack_level", scoreDouble: "bonus_scoreDouble_level", magnet: "bonus_magnet_level" }[type]\n    const level = Math.max(1, Math.min(6, Number(profile[durationLevel] || 1)))\n    const durationId = { shield: "bonus_shield", mega: "bonus_mega", x2: "bonus_x2", jetpack: "bonus_jetpack", scoreDouble: "bonus_scoreDouble", magnet: "bonus_magnet" }[type] || type\n    const durationKey = "ir_bonus_duration:" + (user?.id || profile.username || "guest") + ":" + durationId\n    let duration = 5 + (level - 1) * 2\n    try { const saved = Number(localStorage.getItem(durationKey) || duration); if (Number.isFinite(saved)) duration = Math.max(5, Math.min(duration, 5 + Math.round((saved - 5) / 2) * 2)) } catch (e) {}')
      code = code.replace('if (type === "shield") { G.shield = true; toast("🛡️ Bouclier !") }', 'if (type === "shield") { G.shield = true; G.shieldT = duration; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.shield = Date.now() + duration * 1000; toast("🛡️ Bouclier !") }')
      code = code.replace('G.shield = false\\n      p.inv = 1.1', 'G.shield = false\\n      G.shieldT = 0\\n      p.inv = 1.1')
      code = code.replace('else if (type === "mega") { G.jumpBoostT = 6 + (profile.bonus_level || 1); toast("🚀 Méga-saut !") }', 'else if (type === "mega") { G.jumpBoostT = duration; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.mega = Date.now() + duration * 1000; toast("🚀 Méga-saut !") }')
      code = code.replace('else { G.coinBoostT = 8 + (profile.bonus_level || 1); toast("✨ Pièces x2 !") }', 'else if (type === "x2") { G.coinBoostT = duration; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.x2 = Date.now() + duration * 1000; toast("🪙 Pièces x2 !") }\n    else if (type === "jetpack") { G.jetpackT = duration; G.jetpackHold = false; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.jetpack = Date.now() + duration * 1000; toast("🛩️ Jetpack ! Maintiens ton doigt sur l’écran pour voler.") }\n    else if (type === "scoreDouble") { G.scoreDoubleT = duration; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.scoreDouble = Date.now() + duration * 1000; toast("🏆 Score x2 !") }\n    else if (type === "magnet") { G.magnetT = duration; window.__IR_BONUS_TIMERS = window.__IR_BONUS_TIMERS || {}; window.__IR_BONUS_TIMERS.magnet = Date.now() + duration * 1000; toast("🧲 Aimant !") }')
      code = code.replace('const icon = b.type === "shield" ? "🛡️" : b.type === "mega" ? "🚀" : "✨"', 'const icon = b.type === "shield" ? "🛡️" : b.type === "mega" ? "🚀" : b.type === "x2" ? "🪙" : b.type === "jetpack" ? "🛩️" : b.type === "scoreDouble" ? "🏆" : "🧲"')
      code = code.replace('const STEP = 1 / 120 // fixed physics step', `const STEP = 1 / 120 // fixed physics step
        const jetpackCanvas = document.getElementById("game")
        if (jetpackCanvas) {
          jetpackCanvas.addEventListener("pointerdown", e => { if (G.running && G.jetpackT > 0) { G.jetpackHold = true; e.preventDefault() } }, { passive: false })
          jetpackCanvas.addEventListener("pointerup", e => { if (G.jetpackT > 0) { G.jetpackHold = false; e.preventDefault() } }, { passive: false })
          jetpackCanvas.addEventListener("pointercancel", () => { G.jetpackHold = false })
          jetpackCanvas.addEventListener("pointerleave", () => { G.jetpackHold = false })
        }`)
      code += `
;(() => {
  const labels = { shield:"🛡️", mega:"🚀", x2:"🪙", jetpack:"🛩️", scoreDouble:"🏆", magnet:"🧲" }
  let bonusTimer = document.getElementById("irBonusTimer")
  if (!bonusTimer) {
    bonusTimer = document.createElement("div")
    bonusTimer.id = "irBonusTimer"
    bonusTimer.style.cssText = "position:fixed;left:16px;top:64px;z-index:2147483646;display:none;padding:7px 14px;border:2px solid rgba(0,229,255,.8);border-radius:12px;background:rgba(2,4,10,.94);color:#fff;font:900 18px Orbitron,Inter,sans-serif;box-shadow:0 0 16px rgba(0,229,255,.35);pointer-events:none;text-align:center;line-height:1.35;white-space:pre-line"
    document.body.appendChild(bonusTimer)
  }
  setInterval(() => {
    const G = window.__IR_G
    const source = window.__IR_BONUS_TIMERS || {}
    if (!G || !G.running) { bonusTimer.style.display = "none"; return }
    if (G.shield !== true || Number(G.shieldT || 0) <= 0) delete source.shield\n    const now = Date.now(), lines = []
    for (const type of Object.keys(labels)) {
      const until = Number(source[type] || 0)
      if (until <= now) { if (until > 0) delete source[type]; continue }
      lines.push(labels[type] + " " + ((until - now) / 1000).toFixed(1) + "s")
    }
    bonusTimer.textContent = lines.join("\\n")
    bonusTimer.style.display = lines.length ? "block" : "none"
  }, 50)
})()
`;





      code += `
;(() => {
  const adminAllowed = () => {
    try {
      const wanted = String((window.IR_CONFIG || {}).ADMIN_USERNAME || "Rubansu1").trim().toLowerCase()
      return String(profile?.username || "").trim().toLowerCase() === wanted
    } catch (e) { return false }
  }
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]))
  const adminRenderEditor = (p) => {
    const box = document.getElementById("adminResults")
    if (!box || !p) return
    const fields = [
      ["coins","🪙 Pièces",p.coins,0],
      ["highest_level","🏁 Niveau max",p.highest_level,1],
      ["best_distance","🏆 Meilleure distance",p.best_distance,0],
      ["total_distance","📏 Distance totale",p.total_distance,0],
      ["lives_level","❤️ Vies",p.lives_level,1],
      ["distance_level","🏃 Distance",p.distance_level,1],
      ["dash_level","⚡ Dash",p.dash_level,1],
      ["jump_level","🪽 Saut",p.jump_level,1],
      ["coin_level","🪙 Pièces x",p.coin_level,1],
      ["bonus_level","✨ Bonus",p.bonus_level,1]
    ]
    box.innerHTML = '<div class="card" id="adminEditor">' +
      '<h3>🛠️ Modifier : ' + esc(p.username) + '</h3>' +
      '<p class="muted">Modifie les ressources et la progression du joueur.</p>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">' +
      fields.map(f => '<label style="display:flex;flex-direction:column;gap:6px"><span>' + f[1] + '</span><input type="number" min="' + f[3] + '" data-admin-field="' + f[0] + '" value="' + Number(f[2] ?? 0) + '"></label>').join("") +
      '</div>' +
      '<div class="row" style="margin-top:14px"><button class="primary" id="btnAdminSave">💾 ENREGISTRER</button><button id="btnAdminCancel">ANNULER</button></div>' +
      '<div id="adminEditStatus" class="muted" style="margin-top:8px"></div>' +
      '</div>'
    const save = document.getElementById("btnAdminSave")
    const cancel = document.getElementById("btnAdminCancel")
    if (cancel) cancel.onclick = () => adminSearch()
    if (save) save.onclick = async () => {
      if (!adminAllowed()) return toast("⛔ Accès admin refusé.")
      const status = document.getElementById("adminEditStatus")
      const patch = {}
      fields.forEach(f => {
        const input = box.querySelector('[data-admin-field="' + f[0] + '"]')
        let v = Math.floor(Number(input?.value))
        if (!Number.isFinite(v)) v = Number(f[2] || 0)
        if (f[0] === "highest_level") v = Math.max(1, Math.min(300, v))
        if (f[0].endsWith("_level")) v = Math.max(1, Math.min(6, v))
        v = Math.max(f[3], v)
        patch[f[0]] = v
      })
      save.disabled = true
      if (status) status.textContent = "⏳ Enregistrement..."
      const q = await sb.from("profiles").update(patch).eq("id", p.id)
      if (q.error) {
        if (status) status.textContent = "❌ " + q.error.message
        save.disabled = false
        return
      }
      if (String(p.id) === String(user?.id)) Object.assign(profile, patch)
      if (status) status.textContent = "✅ Modifications enregistrées !"
      toast("✅ Ressources de " + p.username + " modifiées.")
      await adminSearch()
    }
  }
  async function adminSearch() {
    if (!adminAllowed()) return toast("⛔ Accès admin refusé.")
    const box = document.getElementById("adminResults")
    const input = document.getElementById("adminSearch")
    const qname = String(input?.value || "").trim()
    if (!qname) return toast("Entre un pseudo.")
    if (!sb) return toast("☁️ Supabase indisponible.")
    box.innerHTML = '<div class="card">⏳ Recherche...</div>'
    const q = await sb.from("profiles").select("id,username,coins,best_distance,total_distance,highest_level,lives_level,distance_level,dash_level,jump_level,coin_level,bonus_level").ilike("username", "%" + qname + "%").limit(20)
    if (q.error) { box.innerHTML = '<div class="card">❌ ' + esc(q.error.message) + '</div>'; return }
    const rows = q.data || []
    if (!rows.length) { box.innerHTML = '<div class="card">Aucun joueur trouvé.</div>'; return }
    box.innerHTML = rows.map(p => '<div class="card admin-player" data-admin-player="' + esc(p.id) + '" style="cursor:pointer;margin-bottom:10px">' +
      '<div class="row" style="align-items:center"><div style="flex:1"><b>👤 ' + esc(p.username) + '</b><div class="muted">🪙 ' + Number(p.coins || 0).toLocaleString("fr-FR") + ' · 🏆 ' + Number(p.best_distance || 0) + 'm · LV ' + Number(p.highest_level || 1) + '</div></div><button data-admin-edit="' + esc(p.id) + '">🛠️ MODIFIER</button></div></div>').join("")
    box.querySelectorAll("[data-admin-edit]").forEach(btn => btn.onclick = e => {
      e.preventDefault(); e.stopPropagation()
      const p = rows.find(x => String(x.id) === String(btn.dataset.adminEdit))
      if (p) adminRenderEditor(p)
    })
    box.querySelectorAll(".admin-player").forEach(card => card.onclick = () => {
      const p = rows.find(x => String(x.id) === String(card.dataset.adminPlayer))
      if (p) adminRenderEditor(p)
    })
  }
  const searchBtn = document.getElementById("btnAdminSearch")
  if (searchBtn) {
    searchBtn.addEventListener("click", e => {
      if (!adminAllowed()) return
      e.preventDefault(); e.stopImmediatePropagation()
      adminSearch()
    }, true)
  }
  const searchInput = document.getElementById("adminSearch")
  if (searchInput) searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && adminAllowed()) {
      e.preventDefault()
      e.stopImmediatePropagation()
      adminSearch()
    }
  }, true)
})()
`;
      code = replaceBetween(code, "async function adminSearch() {", "  /* ============================================================\n     GAME ENGINE", `async function adminSearch() {
    if ((profile.username || "").toLowerCase() !== ADMIN || !sb) return
    const n = cleanName($("adminSearch").value)
    let q = sb.from("profiles").select("id,username,coins,best_distance,total_distance,highest_level,lives_level,distance_level,dash_level,jump_level,coin_level,bonus_level").order("coins", { ascending: false }).limit(20)
    if (n) q = q.ilike("username", "%" + n + "%")
    const r = await q
    const box = $("adminResults")
    if (r.error) { box.innerHTML = \`<div class="card">❌ \${escapeHtml(r.error.message)}</div>\`; return }
    const rows = r.data || []
    if (!rows.length) { box.innerHTML = \`<div class="card">Aucun résultat.</div>\`; return }
    box.innerHTML = rows.map((u) => \`
      <div class="card" style="margin-bottom:10px;cursor:pointer" data-admin-player="\${escapeHtml(u.id)}">
        <div class="row" style="align-items:center">
          <div style="flex:1">
            <b>👤 \${escapeHtml(u.username)}</b>
            <div class="muted">🪙 \${Number(u.coins||0).toLocaleString("fr-FR")} · 🏆 \${Number(u.best_distance||0)}m · LV \${Number(u.highest_level||1)}</div>
          </div>
          <button type="button" data-admin-edit="\${escapeHtml(u.id)}">🛠️ MODIFIER</button>
        </div>
      </div>\`).join("")
    const edit = (id) => {
      const p = rows.find(x => String(x.id) === String(id))
      if (!p) return
      box.innerHTML = \`
        <div class="card">
          <h3>🛠️ Modifier : \${escapeHtml(p.username)}</h3>
          <p class="muted">Ressources et progression du joueur</p>
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">
            <label>🪙 Pièces<input type="number" min="0" data-af="coins" value="\${Number(p.coins||0)}"></label>
            <label>🏁 Niveau max<input type="number" min="1" max="300" data-af="highest_level" value="\${Number(p.highest_level||1)}"></label>
            <label>🏆 Meilleure distance<input type="number" min="0" data-af="best_distance" value="\${Number(p.best_distance||0)}"></label>
            <label>📏 Distance totale<input type="number" min="0" data-af="total_distance" value="\${Number(p.total_distance||0)}"></label>
            <label>❤️ Vies<input type="number" min="1" max="5" data-af="lives_level" value="\${Number(p.lives_level||1)}"></label>
            <label>🏃 Distance<input type="number" min="1" max="6" data-af="distance_level" value="\${Number(p.distance_level||1)}"></label>
            <label>⚡ Dash<input type="number" min="1" max="5" data-af="dash_level" value="\${Number(p.dash_level||1)}"></label>
            <label>🪽 Saut<input type="number" min="1" max="2" data-af="jump_level" value="\${Number(p.jump_level||1)}"></label>
            <label>🪙 Pièces upgrade<input type="number" min="1" max="6" data-af="coin_level" value="\${Number(p.coin_level||1)}"></label>
            <label>✨ Bonus<input type="number" min="1" max="6" data-af="bonus_level" value="\${Number(p.bonus_level||1)}"></label>
          </div>
          <div class="row" style="margin-top:14px">
            <button class="primary" type="button" id="adminSaveEdit">💾 ENREGISTRER</button>
            <button type="button" id="adminCancelEdit">ANNULER</button>
          </div>
          <div id="adminEditStatus" class="muted" style="margin-top:8px"></div>
        </div>\`
      $("adminSaveEdit").onclick = async () => {
        const patch = {}
        const mins = {coins:0,best_distance:0,total_distance:0,highest_level:1,lives_level:1,distance_level:1,dash_level:1,jump_level:1,coin_level:1,bonus_level:1}
        const maxs = {highest_level:300,lives_level:5,distance_level:6,dash_level:5,jump_level:2,coin_level:6,bonus_level:6}
        for (const k of Object.keys(mins)) {
          let v = Math.floor(Number(box.querySelector('[data-af="' + k + '"]').value))
          if (!Number.isFinite(v)) v = Number(p[k] || mins[k])
          patch[k] = Math.max(mins[k], Math.min(maxs[k] ?? Number.MAX_SAFE_INTEGER, v))
        }
        const status=$("adminEditStatus"), btn=$("adminSaveEdit")
        btn.disabled=true; status.textContent="⏳ Enregistrement..."
        const save=await sb.from("profiles").update(patch).eq("id",p.id)
        if(save.error){status.textContent="❌ "+save.error.message;btn.disabled=false;return}
        status.textContent="✅ Modifications enregistrées !"
        toast("✅ "+p.username+" a été modifié.")
        await adminSearch()
      }
      $("adminCancelEdit").onclick=()=>adminSearch()
    }
    box.querySelectorAll("[data-admin-edit]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();edit(b.dataset.adminEdit)})
    box.querySelectorAll("[data-admin-player]").forEach(card=>card.onclick=e=>{if(e.target.closest("button"))return;edit(card.dataset.adminPlayer)})
  }

  /* ============================================================
     GAME ENGINE`);
      // Apply the equipped collection items to the actual game renderer.
      code = code.replace('  function drawPlayer(ctx, w) {', `  function drawPlayer(ctx, w) {
    const p = G.player
    if (G.dashT > 0) {
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = 0.12 * (6 - i)
        ctx.fillStyle = w.accent
        rr(ctx, p.x - i * 16, p.y + 8, p.w, p.h - 12, 12); ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.save()
    ctx.translate(p.x + p.w / 2, p.y + p.h)
    const sy = clamp(p.sy, 0.6, 1.25)
    ctx.scale(1 / Math.sqrt(sy), sy)
    ctx.translate(-(p.w / 2), -p.h)
    if (p.inv > 0 && Math.floor(p.inv * 12) % 2) ctx.globalAlpha = 0.35
    if (G.shield) {
      ctx.strokeStyle = "#54ffc1"; ctx.lineWidth = 3; ctx.shadowBlur = 18; ctx.shadowColor = "#54ffc1"
      ctx.beginPath(); ctx.arc(p.w / 2, p.h / 2, 44, 0, 7); ctx.stroke(); ctx.shadowBlur = 0
    }
    const charId = profile.selected_character || "runner"
    const icon = ({runner:"🧑",ninja:"🥷",robot:"🤖",ghost:"👻",cyber:"🦾",pilot:"🧑‍✈️",soldier:"🪖",wizard:"🧙",astronaut:"🧑‍🚀",skater:"🛹",samurai:"👺",pirate:"🏴‍☠️",detective:"🕵️",vampire:"🧛",zombie:"🧟",alien:"👽",king:"🤴",queen:"👸",knight:"🛡️",racer:"🏎️",dragon:"🐉",phoenix:"🔥",shadow:"🌑",thunder:"⚡",ice:"❄️",flame:"🔥",cosmic:"🌌",cyborg:"🤖",reaper:"💀",angel:"😇",demon:"😈",time:"⏳",void:"🕳️",secret:"👁️"})[charId] || "🧑"
    ctx.font = "48px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
    ctx.shadowBlur = 18; ctx.shadowColor = w.accent
    ctx.fillText(icon, p.w / 2, p.h / 2)
    ctx.shadowBlur = 0
    ctx.restore()
    if (G.level) $("progressBar").style.width = clamp((G.dist / G.goal) * 100, 0, 100) + "%"
  }`);
      const coinDraw = `      const coinId = profile.selected_coin || "gold"
      const coinIcon = ({gold:"🪙",silver:"🥈",bronze:"🥉",blue:"🔵",green:"🟢",red:"🔴",pink:"🩷",orange:"🟠",purple:"🟣",white:"⚪",diamond:"💎",emerald:"💚",ruby:"❤️",sapphire:"🔷",amethyst:"🟪",topaz:"🔶",pearl:"🦪",crystal:"🔮",neon:"💠",star:"⭐",moon:"🌙",sun:"☀️",fire:"🔥",ice:"❄️",thunder:"⚡",rainbow:"🌈",galaxy:"🌌",cosmic:"☄️",void:"🕳️",crown:"👑",dragon:"🐉",secret:"🔐",glitch:"👾",infinite:"♾️"})[coinId] || "🪙"
      ctx.save(); ctx.font = "28px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowBlur = 14; ctx.shadowColor = w.coin; ctx.fillText(coinIcon, c.x, c.y); ctx.restore()`
      const coinStart = '      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = w.coin; ctx.fillStyle = w.coin'
      const coinEnd = '      ctx.restore()'
      const ci = code.indexOf(coinStart)
      const ce = ci >= 0 ? code.indexOf(coinEnd, ci) : -1
      if (ci >= 0 && ce >= 0) code = code.slice(0, ci) + coinDraw + "\n" + code.slice(ce + coinEnd.length)
      const s = document.createElement('script'); s.textContent = code; document.head.appendChild(s)
    })
    .catch(err => { console.error(err); const e = document.getElementById('err'); if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.' })
})()
