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
      code = code.replace('const v = profile[id + "_level"] || 1\n      const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]', 'const v = id === "jump" ? Number(profile.jump_level || 1) : (profile[id + "_level"] || 1)\n      const cost = id === "jump" ? 5000 : 100 * Math.max(1, v)')
      code = code.replace('} else if (G.canDouble) {', '} else if ((profile.jump_level || 1) >= 2 && G.canDouble) {')
      code = code.replace('    const v = profile[key] || 1\n    if (v >= max) return toast("Niveau maximum !")\n    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]', '    const v = id === "jump" ? Number(profile.jump_level || 1) : (profile[key] || 1)\n    if (v >= max) return toast("Niveau maximum !")\n    const cost = id === "jump" ? 5000 : 100 * Math.max(1, v)')
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
      code = code.replace("  const UPGRADES = [\n    [\"lives\", \"❤️\", \"Vies\", 5, \"Max de vies par run.\"],\n    [\"distance\", \"🏃\", \"Distance\", 6, \"Vitesse & score de départ.\"],\n    [\"dash\", \"⚡\", \"Dash\", 5, \"20s de base → 10s au niveau max.\"],\n    [\"jump\", \"⬆️\", \"Sauts\", 2, \"Niveau 2 : débloque le double saut.\"],\n    [\"coin\", \"🪙\", \"Pièces\", 6, \"Multiplie les pièces ramassées.\"],\n    [\"distance\", \"🏃\", \"Distance\", 6, \"Vitesse & score de départ.\"],\n  ]", "  const UPGRADES = [\n    [\"lives\", \"❤️\", \"Vies\", 5, \"Max de vies par run.\"],\n    [\"dash\", \"⚡\", \"Dash\", 5, \"20s de base → 10s au niveau max.\"],\n    [\"jump\", \"⬆️\", \"Sauts\", 2, \"Niveau 2 : débloque le double saut.\"],\n    [\"coin\", \"🪙\", \"Pièces\", 6, \"Multiplie les pièces ramassées.\"],\n    [\"distance\", \"🏃\", \"Distance\", 6, \"Vitesse & score de départ.\"],\n  ]\n  const BONUS_UPGRADES = [\n    [\"mega\", \"🚀\", \"Mega saut\", 6, \"Durée : 5s → 15s.\"],\n    [\"x2\", \"🪙\", \"Doubles pièces\", 6, \"Durée : 5s → 15s.\"],\n    [\"shield\", \"🛡️\", \"Bouclier\", 6, \"Durée : 5s → 15s.\"],\n    [\"jetpack\", \"🛩️\", \"Jetpack\", 6, \"Durée : 5s → 15s.\"],\n    [\"scoreDouble\", \"🏆\", \"Double score\", 6, \"Durée : 5s → 15s.\"],\n    [\"magnet\", \"🧲\", \"Aimant\", 6, \"Durée : 5s → 15s.\"],\n  ]\n  const BONUS_DURATION = (level) => 3 + Math.max(1, Math.min(6, Number(level || 1))) * 2")
      code = code.replace("    lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1, bonus_level: 1,", "    lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1,\n    bonus_mega_level: 1, bonus_x2_level: 1, bonus_shield_level: 1, bonus_jetpack_level: 1,\n    bonus_scoreDouble_level: 1, bonus_magnet_level: 1,")
      code = code.replace("  function renderUpgrades() {\n    $(\"upgradeGrid\").innerHTML = UPGRADES.map(([id, em, n, max, desc]) => {\n      const v = profile[id + \"_level\"] || 1\n      const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]\n      const maxed = v >= max\n      return `<div class=\"card\"><div class=\"emoji\">${em}</div><h3>${n}</h3><p class=\"muted\">${desc}</p>\n        <p>Niveau ${v}/${max}</p><div class=\"progress\"><i style=\"width:${(v / max) * 100}%\"></i></div>\n        <button data-up=\"${id}\" ${maxed ? \"disabled\" : \"\"}>${maxed ? \"MAX\" : \"🪙 \" + cost}</button></div>`\n    }).join(\"\")\n  }", "  function upgradeCard([id, em, n, max, desc], bonus = false) {\n    const key = bonus ? \"bonus_\" + id + \"_level\" : id + \"_level\"\n    const v = Number(profile[key] || 1)\n    const maxed = v >= max\n    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]\n    const buttonId = bonus ? \"bonus:\" + id : id\n    return `<div class=\"card\"><div class=\"emoji\">${em}</div><h3>${n}</h3><p class=\"muted\">${desc}</p>\n      <p>Niveau ${v}/${max}</p><div class=\"progress\"><i style=\"width:${(v / max) * 100}%\"></i></div>\n      <button data-up=\"${buttonId}\" ${maxed ? \"disabled\" : \"\"}>${maxed ? \"MAX\" : \"🪙 \" + cost}</button></div>`\n  }\n  function renderUpgrades() {\n    $(\"upgradeGrid\").innerHTML =\n      `<div style=\"grid-column:1/-1\"><h2>🧑 AMÉLIORATIONS DU PERSONNAGE</h2><p class=\"muted\">Vies, dash, sauts, pièces et distance.</p></div>` +\n      UPGRADES.map(u => upgradeCard(u)).join(\"\") +\n      `<div style=\"grid-column:1/-1;margin-top:10px\"><h2>✨ AMÉLIORATIONS DES BONUS</h2><p class=\"muted\">Base 5 secondes. Chaque niveau ajoute 2 secondes. Maximum 6/6 = 15 secondes.</p></div>` +\n      BONUS_UPGRADES.map(u => upgradeCard(u, true)).join(\"\")\n  }")
      code = code.replace("  function buyUpgrade(id) {\n    const max = UPGRADES.find((u) => u[0] === id)[3]\n    const key = id + \"_level\"\n    const v = profile[key] || 1\n    if (v >= max) return toast(\"Niveau maximum !\")\n    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]\n    if ((profile.coins || 0) < cost) return toast(\"Pas assez de pièces.\")\n    profile.coins -= cost\n    profile[key] = v + 1\n    SFX.bonus()\n    persist(); renderAll(); toast(\"⚡ Amélioration achetée !\")\n  }", "  function buyUpgrade(id) {\n    const isBonus = String(id).startsWith(\"bonus:\")\n    const realId = isBonus ? String(id).slice(6) : id\n    const list = isBonus ? BONUS_UPGRADES : UPGRADES\n    const item = list.find((u) => u[0] === realId)\n    if (!item) return\n    const max = item[3]\n    const key = isBonus ? \"bonus_\" + realId + \"_level\" : realId + \"_level\"\n    const v = Number(profile[key] || 1)\n    if (v >= max) return toast(\"Niveau maximum !\")\n    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]\n    if ((profile.coins || 0) < cost) return toast(\"Pas assez de pièces.\")\n    profile.coins -= cost\n    profile[key] = v + 1\n    SFX.bonus()\n    persist(); renderAll(); toast(\"⚡ Amélioration achetée !\")\n  }")
      code = code.replace("    const types = [\"shield\", \"mega\", \"x2\"]", "    const types = [\"shield\", \"mega\", \"x2\", \"jetpack\", \"scoreDouble\", \"magnet\"]")
      code = code.replace("    shield: false, coinMult: 1, coinBoostT: 0, jumpBoostT: 0,", "    shield: false, shieldT: 0, coinMult: 1, coinBoostT: 0, jumpBoostT: 0,\n    jetpackT: 0, scoreDoubleT: 0, magnetT: 0,")
      code = code.replace("    G.shield = false; G.coinMult = 1; G.coinBoostT = 0; G.jumpBoostT = 0", "    G.shield = false; G.shieldT = 0; G.coinMult = 1; G.coinBoostT = 0; G.jumpBoostT = 0\n    G.jetpackT = 0; G.scoreDoubleT = 0; G.magnetT = 0")
      code = code.replace("    if (G.jumpBoostT > 0) G.jumpBoostT -= dt", "    if (G.jumpBoostT > 0) G.jumpBoostT -= dt\n    if (G.shieldT > 0) { G.shieldT -= dt; if (G.shieldT <= 0) { G.shieldT = 0; G.shield = false } }\n    if (G.jetpackT > 0) G.jetpackT -= dt\n    if (G.scoreDoubleT > 0) G.scoreDoubleT -= dt\n    if (G.magnetT > 0) G.magnetT -= dt")
      code = code.replace("    G.dist += G.speed * dt * 0.06", "    G.dist += G.speed * dt * 0.06 * (G.scoreDoubleT > 0 ? 2 : 1)")
      code = code.replace("    const grav = 2600\n    p.vy += grav * dt", "    const grav = G.jetpackT > 0 ? 520 : 2600\n    p.vy += grav * dt\n    if (G.jetpackT > 0 && p.vy > 120) p.vy = 120")
      code = code.replace("    for (const c of G.coinsArr) c.x -= G.speed * dt", "    for (const c of G.coinsArr) {\n      c.x -= G.speed * dt\n      if (G.magnetT > 0 && !c.got) {\n        const dx = (p.x + p.w / 2) - c.x\n        const dy = (p.y + p.h / 2) - c.y\n        const d = Math.hypot(dx, dy)\n        if (d < 260 && d > 1) { c.x += dx * Math.min(1, dt * 8); c.y += dy * Math.min(1, dt * 8) }\n      }\n    }")
      code = code.replace("  function applyBonus(type) {\n    SFX.bonus()\n    if (type === \"shield\") { G.shield = true; toast(\"🛡️ Bouclier !\") }\n    else if (type === \"mega\") { G.jumpBoostT = 6 + (profile.bonus_level || 1); toast(\"🚀 Méga-saut !\") }\n    else { G.coinBoostT = 8 + (profile.bonus_level || 1); toast(\"✨ Pièces x2 !\") }\n    burst(G.player.x + 20, G.player.y + 20, \"#fff\", 16)\n  }", "  function bonusDuration(id) {\n    const key = \"bonus_\" + id + \"_level\"\n    return BONUS_DURATION(profile[key] || 1)\n  }\n  function applyBonus(type) {\n    SFX.bonus()\n    const seconds = bonusDuration(type)\n    if (type === \"shield\") { G.shield = true; G.shieldT = seconds; toast(\"🛡️ Bouclier ! \" + seconds + \"s\") }\n    else if (type === \"mega\") { G.jumpBoostT = seconds; toast(\"🚀 Méga-saut ! \" + seconds + \"s\") }\n    else if (type === \"x2\") { G.coinBoostT = seconds; toast(\"✨ Pièces x2 ! \" + seconds + \"s\") }\n    else if (type === \"jetpack\") { G.jetpackT = seconds; toast(\"🛩️ Jetpack ! \" + seconds + \"s\") }\n    else if (type === \"scoreDouble\") { G.scoreDoubleT = seconds; toast(\"🏆 Score x2 ! \" + seconds + \"s\") }\n    else if (type === \"magnet\") { G.magnetT = seconds; toast(\"🧲 Aimant ! \" + seconds + \"s\") }\n    burst(G.player.x + 20, G.player.y + 20, \"#fff\", 16)\n  }")
      code = code.replace("      const col = b.type === \"shield\" ? \"#54ffc1\" : b.type === \"mega\" ? \"#a14dff\" : \"#ffd84a\"\n      const icon = b.type === \"shield\" ? \"🛡️\" : b.type === \"mega\" ? \"🚀\" : \"✨\"", "      const col = b.type === \"shield\" ? \"#54ffc1\" : b.type === \"mega\" ? \"#a14dff\" : b.type === \"x2\" ? \"#ffd84a\" : b.type === \"jetpack\" ? \"#00e5ff\" : b.type === \"scoreDouble\" ? \"#ffcf4a\" : \"#ff5aa0\"\n      const icon = b.type === \"shield\" ? \"🛡️\" : b.type === \"mega\" ? \"🚀\" : b.type === \"x2\" ? \"🪙\" : b.type === \"jetpack\" ? \"🛩️\" : b.type === \"scoreDouble\" ? \"🏆\" : \"🧲\"")
      code = code.replace("    G.bonusT -= dt\n    if (G.bonusT <= 0) { spawnBonus(); G.bonusT = rand(9, 15) - (profile.bonus_level || 1) }", "    G.bonusT -= dt\n    if (G.bonusT <= 0) { spawnBonus(); G.bonusT = rand(7, 12) }")
      code = code.replace("  const UPGRADES = [\n    [\"lives\", \"❤️\", \"Vies\", 5, \"Max de vies par run.\"],\n    [\"distance\", \"🏃\", \"Distance\", 6, \"Vitesse & score de départ.\"],\n    [\"dash\", \"⚡\", \"Dash\", 5, \"20s de base → 10s au niveau max.\"],\n    [\"jump\", \"⬆️\", \"Saut\", 2, \"Niveau 2 : débloque le double saut.\"],\n    [\"coin\", \"🪙\", \"Pièces\", 6, \"Multiplie les pièces ramassées.\"],\n    [\"bonus\", \"✨\", \"Bonus\", 6, \"Durée & fréquence des bonus.\"],\n  ]", "  const UPGRADES = [\n    [\"lives\", \"❤️\", \"Vies\", 5, \"Max de vies par run.\"],\n    [\"dash\", \"⚡\", \"Dash\", 5, \"20s de base → 10s au niveau max.\"],\n    [\"jump\", \"⬆️\", \"Sauts\", 2, \"Niveau 2 : débloque le double saut.\"],\n    [\"coin\", \"🪙\", \"Pièces\", 6, \"Multiplie les pièces ramassées.\"],\n    [\"distance\", \"🏃\", \"Distance\", 6, \"Vitesse & score de départ.\"],\n  ]\n  const BONUS_UPGRADES = [\n    [\"mega\", \"🚀\", \"Mega saut\", 6, \"Durée : 5s → 15s.\"],\n    [\"x2\", \"🪙\", \"Doubles pièces\", 6, \"Durée : 5s → 15s.\"],\n    [\"shield\", \"🛡️\", \"Bouclier\", 6, \"Durée : 5s → 15s.\"],\n    [\"jetpack\", \"🛩️\", \"Jetpack\", 6, \"Durée : 5s → 15s.\"],\n    [\"scoreDouble\", \"🏆\", \"Double score\", 6, \"Durée : 5s → 15s.\"],\n    [\"magnet\", \"🧲\", \"Aimant\", 6, \"Durée : 5s → 15s.\"],\n  ]\n  const BONUS_DURATION = (level) => 3 + Math.max(1, Math.min(6, Number(level || 1))) * 2")
      const s = document.createElement('script'); s.textContent = code; document.head.appendChild(s)
    })
    .catch(err => { console.error(err); const e = document.getElementById('err'); if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.' })
})()