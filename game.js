/* ILLEGAL RUNNER loader: original engine + live customization + persistent Supabase progression. */
(() => {
  const ORIGINAL = 'https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  let __duelRngState = 1
  window.IR_DUEL_SET_WORLD_RNG = (seed) => {
    let s = (Number(seed) >>> 0) || 1
    __duelRngState = s
    window.__IR_DUEL_WORLD_RNG = () => {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0
      return s / 4294967296
    }
    __duelRngState = s
  }
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
      code = code.replace('      const r = Math.random()','      const r = IR_WORLD_RANDOM()')
      code = code.replace('const r = Math.random()','const r = IR_WORLD_RANDOM()')
      code = code.replace('      const h = rand(46, Math.min(120, 60 + d * 0.02))','      const h = IR_WORLD_RANGE(46, Math.min(120, 60 + d * 0.02))')
      code = code.replace('      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: rand(20, 70) })','      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: IR_WORLD_RANGE(20, 70) })')
      code = code.replace('gy - rand(150, 200), w: 48, h: 34, destructible: true, bob: rand(0, 6.28)','gy - IR_WORLD_RANGE(150, 200), w: 48, h: 34, destructible: true, bob: IR_WORLD_RANGE(0, 6.28)')
      code = code.replace('gy - rand(50, 95), w: 28, h: 18, destructible: true, vx: rand(180, 260)','gy - IR_WORLD_RANGE(50, 95), w: 28, h: 18, destructible: true, vx: IR_WORLD_RANGE(180, 260)')
      code = code.replace('const w = rand(90, Math.min(160, 100 + d * 0.02))','const w = IR_WORLD_RANGE(90, Math.min(160, 100 + d * 0.02))')
      code = code.replace('const py = gy - rand(90, 150)','const py = gy - IR_WORLD_RANGE(90, 150)')
      code = code.replace('if (Math.random() < 0.4) G.obs.push({ type: "spike"','if (IR_WORLD_RANDOM() < 0.4) G.obs.push({ type: "spike"')
      code = code.replace('const n = 4 + ((Math.random() * 3) | 0)','const n = 4 + ((IR_WORLD_RANDOM() * 3) | 0)')
      code = code.replace('const baseY = G.groundY - rand(60, 230)','const baseY = G.groundY - IR_WORLD_RANGE(60, 230)')
      code = code.replace('const arc = Math.random() < 0.5','const arc = IR_WORLD_RANDOM() < 0.5')
      code = code.replace('const t = pick(types)','const t = IR_WORLD_PICK(types)')
      code = code.replace('G.groundY - rand(80, 200)','G.groundY - IR_WORLD_RANGE(80, 200)')
      code = code.replace('G.spawnT = minGap + Math.random() * 0.35','G.spawnT = minGap + IR_WORLD_RANDOM() * 0.35')
      code = code.replace('    G.baseSpeed = 360 + (profile.distance_level || 1) * 22','    G.baseSpeed = window.IR_DUEL_ACTIVE ? 420 : 360 + (profile.distance_level || 1) * 22')
      code = code.replace('    const d = G.dist','    const d = window.IR_DUEL_ACTIVE ? 0 : G.dist')
      code = code.replace('const minGap = clamp(1.05 - G.dist / 6000, 0.5, 1.05)','const minGap = window.IR_DUEL_ACTIVE ? 0.82 : clamp(1.05 - G.dist / 6000, 0.5, 1.05)')
      code = code.replace('G.coinT = 1.4 + Math.random() * 0.8','G.coinT = 1.4 + IR_WORLD_RANDOM() * 0.8')
      code = code.replace('G.bonusT = rand(9, 15) - (profile.bonus_level || 1)','G.bonusT = IR_WORLD_RANGE(9, 15) - (profile.bonus_level || 1)')
      code = code.replace('  const CFG = window.IR_CONFIG || {}', '  const IR_WORLD_RANDOM = () => (window.IR_DUEL_ACTIVE && window.__IR_DUEL_WORLD_RNG ? window.__IR_DUEL_WORLD_RNG() : globalThis.Math.random())\n  const IR_WORLD_RANGE = (a,b) => a + IR_WORLD_RANDOM() * (b-a)\n  const IR_WORLD_PICK = arr => arr[(IR_WORLD_RANDOM() * arr.length) | 0]\n  const CFG = window.IR_CONFIG || {}')

      code = code.replace('    G.lives = G.maxLives', '    G.lives = G.maxLives\n    if (window.IR_DUEL_ACTIVE && window.IR_DUEL_CONFIG && Number.isFinite(Number(window.IR_DUEL_CONFIG.lives)) && Number(window.IR_DUEL_CONFIG.lives) > 0) { G.maxLives = Math.max(1, Math.floor(Number(window.IR_DUEL_CONFIG.lives))); G.lives = G.maxLives }')
      code = code.replace('        G.running = true\n        G.startTime = performance.now()', '        G.running = true\n        G.startTime = performance.now()\n        window.dispatchEvent(new CustomEvent("ir:duelStarted"))')
      code = code.replace('  async function end() {\n    if (!G.running) return', '  async function end() {\n    if (window.IR_DUEL_ACTIVE) { G.running = false; cancelAnimationFrame(G.raf); window.dispatchEvent(new CustomEvent("ir:duelPlayerLost", { detail: { distance: G.dist, lives: G.lives } })); return }\n    if (!G.running) return')
      code = code.replace('    drawPlayer(ctx, w)\n\n    ctx.restore()', '    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW) { try { window.IR_DUEL_GHOST_DRAW(ctx, W, H, w, G) } catch (e) {} }\n\n    ctx.restore()')
      code = code.replace('  function quit() {', '  window.addEventListener("ir:duelStartGame", () => { if (window.IR_DUEL_ACTIVE) start(0) })\n  window.addEventListener("ir:duelExitToMenu", () => { try { window.IR_DUEL_ACTIVE = false; window.IR_DUEL_CONFIG = null; window.__IR_DUEL_SEED = null; window.__IR_DUEL_WORLD_RNG = null; $("btnPause").style.display = ""; quit() } catch (e) {} })\n  function quit() {')

      code = code.replace("    // coins\n    for (const c of G.coinsArr) {\n      if (c.got) continue\n      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = w.coin; ctx.fillStyle = w.coin\n      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill()\n      ctx.fillStyle = \"#ffffffaa\"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 3, c.r * 0.35, 0, 7); ctx.fill()\n      ctx.restore()\n    }", "    // coins\n    const getSelectedCoinId = () => {\n      try { return (profile && profile.selected_coin) || localStorage.getItem(\"irSelectedCoin_\" + (user?.id || \"guest\")) || \"gold\" }\n      catch (e) { return (profile && profile.selected_coin) || \"gold\" }\n    }\n    const drawSelectedCoin = (ctx,c,id,time) => {\n      const r=c.r, P={\n        gold:[\"#f7c948\",\"#fff4a3\"],silver:[\"#cbd5e1\",\"#fff\"],bronze:[\"#a85a24\",\"#e5a86a\"],blue:[\"#1d4ed8\",\"#60a5fa\"],green:[\"#15803d\",\"#86efac\"],red:[\"#b91c1c\",\"#f87171\"],pink:[\"#db2777\",\"#f9a8d4\"],orange:[\"#ea580c\",\"#fdba74\"],purple:[\"#7e22ce\",\"#c084fc\"],white:[\"#dbeafe\",\"#fff\"],\n        diamond:[\"#67e8f9\",\"#fff\"],emerald:[\"#059669\",\"#86efac\"],ruby:[\"#be123c\",\"#fecdd3\"],sapphire:[\"#2563eb\",\"#bfdbfe\"],amethyst:[\"#9333ea\",\"#e9d5ff\"],topaz:[\"#d97706\",\"#fde68a\"],pearl:[\"#e5e7eb\",\"#fff\"],crystal:[\"#60a5fa\",\"#e0f2fe\"],neon:[\"#00f5ff\",\"#ff37c7\"],star:[\"#facc15\",\"#fff7ae\"],\n        moon:[\"#64748b\",\"#dbeafe\"],sun:[\"#f59e0b\",\"#fff7ae\"],fire:[\"#ef4444\",\"#f97316\"],ice:[\"#38bdf8\",\"#dff6ff\"],thunder:[\"#f8ff3f\",\"#67e8f9\"],rainbow:[\"#ec4899\",\"#22d3ee\"],galaxy:[\"#7c3aed\",\"#ec4899\"],cosmic:[\"#06b6d4\",\"#f0abfc\"],void:[\"#05030a\",\"#ff4bd8\"],crown:[\"#f59e0b\",\"#fde68a\"],dragon:[\"#dc2626\",\"#fb923c\"],glitch:[\"#00f5ff\",\"#ff3cf2\"],infinite:[\"#7c3aed\",\"#fff\"],secret:[\"#00e5ff\",\"#fbbf24\"]\n      };\n      const p=P[id]||P.gold; ctx.save();ctx.translate(c.x,c.y);const pulse=1+Math.sin(time*4+c.x*.02)*.04;ctx.scale(pulse,1);\n      ctx.lineWidth=Math.max(2,r*.16);ctx.shadowBlur=id===\"secret\"?28:id===\"infinite\"?24:16;ctx.shadowColor=p[1];ctx.fillStyle=p[0];ctx.strokeStyle=p[1];ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;\n      if([\"diamond\",\"emerald\",\"ruby\",\"sapphire\",\"amethyst\",\"topaz\",\"crystal\",\"ice\"].includes(id)){ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(-r*.65,0);ctx.lineTo(0,-r*.72);ctx.lineTo(r*.65,0);ctx.lineTo(0,r*.72);ctx.closePath();ctx.stroke();ctx.globalAlpha=1}\n      if(id===\"neon\"){ctx.lineWidth=2;ctx.strokeStyle=p[1];ctx.beginPath();ctx.arc(0,0,r*1.25,0,Math.PI*2);ctx.stroke()}\n      else if(id===\"star\"){ctx.fillStyle=p[1];ctx.font=r*1.22+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"★\",0,1)}\n      else if(id===\"moon\"){ctx.fillStyle=p[1];ctx.beginPath();ctx.arc(-1,-1,r*.48,0,Math.PI*2);ctx.fill();ctx.fillStyle=p[0];ctx.beginPath();ctx.arc(r*.12,-r*.1,r*.44,0,Math.PI*2);ctx.fill()}\n      else if(id===\"sun\"){ctx.fillStyle=p[1];ctx.beginPath();ctx.arc(0,0,r*.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p[1];ctx.lineWidth=2;for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.48,Math.sin(a)*r*.48);ctx.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.stroke()}}\n      else if(id===\"fire\"){ctx.font=r*.85+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"🔥\",0,1)}\n      else if(id===\"thunder\"){ctx.strokeStyle=p[1];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.2,-r*.75);ctx.lineTo(r*.12,-r*.1);ctx.lineTo(-r*.08,-r*.1);ctx.lineTo(r*.22,r*.75);ctx.stroke()}\n      else if(id===\"rainbow\"){const q=ctx.createLinearGradient(-r,-r,r,r);q.addColorStop(0,\"#ef4444\");q.addColorStop(.25,\"#f59e0b\");q.addColorStop(.5,\"#eab308\");q.addColorStop(.75,\"#22c55e\");q.addColorStop(1,\"#8b5cf6\");ctx.fillStyle=q;ctx.fillRect(-r*.7,-2,r*1.4,4)}\n      else if(id===\"galaxy\"||id===\"cosmic\"){ctx.fillStyle=\"#fff\";for(let k=0;k<6;k++){const a=time*(.5+k*.08)+k;ctx.beginPath();ctx.arc(Math.cos(a)*r*.55,Math.sin(a)*r*.55,Math.max(1,r*.08),0,Math.PI*2);ctx.fill()}if(id===\"cosmic\"){ctx.strokeStyle=p[1];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*1.38,time,time+Math.PI*1.4);ctx.stroke()}}\n      else if(id===\"void\"){ctx.fillStyle=\"#000\";ctx.beginPath();ctx.arc(0,0,r*.52,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p[1];ctx.beginPath();ctx.arc(0,0,r*.7,time,time+Math.PI*1.5);ctx.stroke()}\n      else if(id===\"crown\"){ctx.fillStyle=p[1];ctx.font=r*.95+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"♛\",0,1)}\n      else if(id===\"dragon\"){ctx.fillStyle=p[1];ctx.font=r*.9+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"🐉\",0,1)}\n      else if(id===\"glitch\"){ctx.fillStyle=p[1];ctx.fillRect(-r*.65,-r*.12,r*.4,r*.2);ctx.fillStyle=\"#ff3cf2\";ctx.fillRect(r*.25,r*.18,r*.4,r*.18);ctx.strokeStyle=p[1];ctx.beginPath();ctx.moveTo(-r*.8,r*.3);ctx.lineTo(r*.8,r*.3);ctx.stroke()}\n      else if(id===\"infinite\"){ctx.fillStyle=p[1];ctx.font=\"bold \"+r*1.05+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"∞\",0,1);ctx.strokeStyle=\"#00f5ff\";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*1.45,-time,time+Math.PI*1.2);ctx.stroke();for(let k=0;k<5;k++){const a=time*(1+k*.12)+k*1.2;ctx.fillStyle=[\"#00f5ff\",\"#ff3cf2\",\"#ffd166\",\"#7cff6b\",\"#8e5cff\"][k];ctx.beginPath();ctx.arc(Math.cos(a)*r*1.7,Math.sin(a)*r*1.7,Math.max(1.2,r*.08),0,Math.PI*2);ctx.fill()}}\n      else if(id===\"secret\"){ctx.fillStyle=p[1];ctx.font=\"bold \"+r*.85+\"px serif\";ctx.textAlign=\"center\";ctx.textBaseline=\"middle\";ctx.fillText(\"🔐\",0,1);ctx.strokeStyle=\"#ff37c7\";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*1.45,time,time+Math.PI*1.5);ctx.stroke()}\n      ctx.fillStyle=\"#ffffffaa\";ctx.beginPath();ctx.ellipse(-r*.3,-r*.35,r*.28,r*.13,-.5,0,Math.PI*2);ctx.fill();ctx.restore()\n    };\n    const selectedCoinId=getSelectedCoinId();for(const c of G.coinsArr){if(c.got)continue;drawSelectedCoin(ctx,c,selectedCoinId,performance.now()/1000)}")
      code = code.replace('  function drawPlayer(ctx, w) {\n    const p = G.player', '  function drawPlayer(ctx, w) {\n    const p = G.player\n    if (window.IR_CHARACTER_DRAW) { try { if (window.IR_CHARACTER_DRAW(ctx, w, p, G)) return } catch (e) { console.warn("[IR] Character renderer fallback:", e) } }')
      code = code.replace('    // moon/sun glow', `    if (window.IR_WORLD_BG_DRAW) { try { window.IR_WORLD_BG_DRAW(ctx, W, H, w) } catch (e) { console.warn("[IR] World visual error:", e) } }\n\n    // moon/sun glow`)
      code = code.replace('    renderAll()\n    switchTab("home")', '    renderAll()\n    window.dispatchEvent(new CustomEvent("ir:profileLoaded", { detail: { selected_background: profile.selected_background || "city", selected_character: profile.selected_character || "runner", selected_coin: (profile && profile.selected_coin) || (() => { try { return localStorage.getItem("irSelectedCoin_" + (user?.id || "guest")) || "gold" } catch (e) { return "gold" } })() } }))\n    switchTab("home")')
      code = code.replace('    if (!isGuest) { await claimAutoLogin(); }', '    if (window.IR_LOADING) window.IR_LOADING.done("daily", profile.last_login_reward === new Date().toISOString().slice(0,10) ? "Cadeau quotidien déjà récupéré." : "Cadeau quotidien non récupéré."); refreshTop(); if (window.IR_LOADING) { window.IR_LOADING.done("custom","Personnalisations vérifiées."); window.IR_LOADING.done("quests","État des quêtes vérifié."); window.IR_LOADING.done("coins","Pièces vérifiées : " + Number(profile.coins || 0).toLocaleString("fr-FR") + "."); window.IR_LOADING.done("best","Meilleur score vérifié : " + Number(profile.best_distance || 0) + " m."); window.IR_LOADING.done("level","Niveau vérifié : " + Number(profile.highest_level || 1) + "."); window.IR_LOADING.finishSession(); } if (!isGuest) { claimAutoLogin().catch(e => console.warn("[IR] daily reward:", e)); }')
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
          function applyDuelPause(){
            if (!G.running) return
            G.running = false
            cancelAnimationFrame(G.raf)
            G.last = performance.now()
            G.acc = 0
          }
          function releaseDuelPause(){
            if (G.running) return
            G.running = true
            G.last = performance.now()
            G.acc = 0
            G.raf = requestAnimationFrame(loop)
          }
          window.addEventListener("ir:duelPauseApply", applyDuelPause)
          window.addEventListener("ir:duelPauseRelease", releaseDuelPause)
          window.addEventListener("ir:pause", pauseGame)
          window.addEventListener("ir:resume", resumeGame)
          window.addEventListener("ir:pauseRestart", restartFromPause)
          window.addEventListener("ir:pauseQuit", quitFromPause)
        })()
        const STEP = 1 / 120 // fixed physics step`)
      code = code.replace('    $("btnQuit").onclick = quit', '    $("btnPause").onclick = () => window.IR_DUEL_ACTIVE ? window.dispatchEvent(new CustomEvent("ir:duelPauseRequest")) : window.dispatchEvent(new CustomEvent("ir:pause"))')
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
      code = code.replace('      user = r.data.user', '      user = r.data.user\n      $("login").style.display = "none"\n      $("app").style.display = "flex"')
      code = code.replace('  async function boot() {', `  async function boot() {
    if (window.IR_LOADING) window.IR_LOADING.startSession()
    if (window.IR_LOADING) { window.IR_LOADING.done('engine','Moteur du jeu chargé.'); window.IR_LOADING.done('profile','Profil et sauvegarde chargés.') }
    while (window.IR_LOADING && window.IR_LOADING.isActive && window.IR_LOADING.isActive()) await new Promise(r => setTimeout(r, 50))
    $("login").style.display = "none"
    $("app").style.display = "flex"
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
    const upgradeCostFor = (id, v) => id === "jump" ? 5000 : [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]
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
      const cost = upgradeCostFor(id, v)
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
    let v = Math.max(1, Number(profile[key] || 1))
    if (v >= max) return toast("Niveau maximum !")
    const cost = id === "jump" ? 5000 : [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]

    if (isGuest || !sb || !user) {
      const coins = Math.max(0, Math.floor(Number(profile.coins || 0)))
      if (coins < cost) return toast("Pas assez de pièces.")
      profile.coins = coins - cost
      profile[key] = v + 1
      saveLocal()
    } else {
      try {
        const fresh = await sb.from("profiles").select("coins," + key).eq("id", user.id).single()
        if (fresh.error) throw fresh.error
        const freshCoins = Math.max(0, Math.floor(Number(fresh.data?.coins || 0)))
        const freshLevel = Math.max(1, Number(fresh.data?.[key] || v))
        v = freshLevel
        if (v >= max) {
          profile[key] = v
          profile.coins = freshCoins
          refreshTop()
          renderAll()
          return toast("Niveau maximum !")
        }
        if (freshCoins < cost) {
          profile.coins = freshCoins
          profile[key] = v
          refreshTop()
          renderAll()
          return toast("Pas assez de pièces.")
        }
        const nextCoins = freshCoins - cost
        const nextLevel = v + 1
        const saved = await sb.from("profiles").update({ coins: nextCoins, [key]: nextLevel }).eq("id", user.id)
        if (saved.error) throw saved.error
        profile.coins = nextCoins
        profile[key] = nextLevel
      } catch (e) {
        console.error("[IR] upgrade save:", e)
        return toast("❌ Impossible d'enregistrer l'amélioration.")
      }
    }

    SFX.bonus()
    refreshTop()
    renderAll()
    window.dispatchEvent(new CustomEvent("ir:profileChanged", { detail: { coins: profile.coins, [key]: profile[key] } }))
    toast("⚡ " + entry[2] + " amélioré ! Niveau " + profile[key] + "/" + max)
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
      {
        const friendStart = "  async function loadFriends() {"
        const friendEnd = "  async function adminSearch() {"
        const friendA = code.indexOf(friendStart)
        const friendB = code.indexOf(friendEnd, friendA)
        if (friendA >= 0 && friendB > friendA) {
          code = code.slice(0, friendA) + `
  async function loadFriends() {
    const box = $("friendList")
    if (isGuest || !sb) { box.innerHTML = '<div class="card">☁️ Les amis sont disponibles en MODE COMPTE.</div>'; return }
    const q = await sb.rpc("get_my_friends")
    if (q.error) {
      console.error("[IR] get_my_friends:", q.error)
      box.innerHTML = '<div class="card">❌ Impossible de charger les amis.</div>'
      return
    }
    const rows = Array.isArray(q.data) ? q.data : []
    if (!rows.length) { box.innerHTML = '<div class="card">Aucun ami ou demande pour le moment.</div>'; return }
    box.innerHTML = rows.map(r => {
      const other = r.user_id === user.id ? r.friend_id : r.user_id
      const name = escapeHtml(r.friend_username || "Joueur")
      const dist = Number(r.friend_best_distance || 0)
      if (r.status === "pending" && r.friend_id === user.id) return '<div class="friend"><span style="flex:1">👤 ' + name + '<br><small class="muted">veut être ton ami</small></span><button data-friend-action="accept" data-friend-id="' + r.id + '">✅ ACCEPTER</button><button data-friend-action="decline" data-friend-id="' + r.id + '">❌ REFUSER</button></div>'
      if (r.status === "pending") return '<div class="friend"><span style="flex:1">👤 ' + name + '<br><small class="muted">demande envoyée</small></span><button data-friend-action="delete" data-friend-id="' + r.id + '">↩️ ANNULER</button></div>'
      return '<div class="friend" data-trade-friend-id="' + other + '"><span style="flex:1">👤 ' + name + '<br><small class="muted">🏆 ' + dist + 'm · ami</small></span><button data-friend-action="delete" data-friend-id="' + r.id + '">🗑️ SUPPRIMER</button></div>'
    }).join("")
  }
  async function addFriend() {
    if (isGuest || !sb) return toast("Connecte-toi pour ajouter des amis.")
    const n = String($("friendName").value || "").trim().slice(0, 20)
    if (!n) return toast("Entre un pseudo.")
    const q = await sb.rpc("friend_send_request", { p_username: n })
    if (q.error) {
      console.error("[IR] friend_send_request:", q.error)
      const msg = String(q.error.message || "")
      if (msg.includes("PLAYER_NOT_FOUND")) return toast("Joueur introuvable.")
      if (msg.includes("SELF_FRIEND")) return toast("Impossible de t'ajouter toi-même.")
      if (msg.includes("ALREADY_FRIENDS")) return toast("Vous êtes déjà amis.")
      if (msg.includes("REQUEST_ALREADY_SENT")) return toast("Demande déjà envoyée.")
      if (msg.includes("REQUEST_ALREADY_RECEIVED")) return toast("Cette personne t'a déjà envoyé une demande.")
      if (msg.includes("BLOCKED")) return toast("Cette demande ne peut pas être envoyée.")
      if (msg.includes("Not authenticated")) return toast("Reconnecte-toi.")
      return toast("❌ " + msg)
    }
    $("friendName").value = ""
    toast("📨 Demande d'ami envoyée !")
    await loadFriends()
  }
  async function friendAction(action, rowId) {
    if (isGuest || !sb) return toast("Connecte-toi pour gérer tes amis.")
    const id = Number(rowId)
    if (!Number.isFinite(id)) return toast("Demande invalide.")
    let r
    if (action === "accept") r = await sb.rpc("friend_respond", { p_request_id: id, p_accept: true })
    else if (action === "decline") r = await sb.rpc("friend_respond", { p_request_id: id, p_accept: false })
    else r = await sb.rpc("friend_remove", { p_request_id: id })
    if (r.error) { console.error("[IR] friend action:", r.error); return toast("❌ " + (r.error.message || "Action impossible.")) }
    toast(action === "accept" ? "✅ Demande acceptée !" : action === "delete" ? "🗑️ Ami supprimé." : "↩️ Demande refusée.")
    await loadFriends()
  }
  ` + code.slice(friendB)
        } else {
          console.warn("[IR] Bloc amis introuvable dans le moteur original.")
        }
      }
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
  const ADMIN_USERNAME = String((window.IR_CONFIG || {}).ADMIN_USERNAME || "Rubansu1").trim().toLowerCase()
  const ADMIN_LOGIN_PASSWORD = "Doliprane"
  const ADMIN_GATE_PASSWORD = "HaalandTheBest"
  let adminGateUnlocked = false

  const adminAllowed = () => {
    try { return String(profile?.username || "").trim().toLowerCase() === ADMIN_USERNAME }
    catch (e) { return false }
  }
  const adminEnsureGate = () => {
    if (!adminAllowed()) return false
    if (adminGateUnlocked) return true
    const pass = window.prompt("🔐 Mot de passe ADMIN :")
    if (pass !== ADMIN_GATE_PASSWORD) { toast("❌ Mot de passe ADMIN incorrect."); return false }
    adminGateUnlocked = true
    return true
  }
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]))

  const adminInventoryTypes = { world:["background","world"], character:["character"], coin:["obstacle","coin"] }
  const adminCatalog = () => (window.IR_PACK_CATALOG || {world:[],character:[],coin:[]})

  async function adminInventoryAction(p, type, id, action, box) {
    if (!adminEnsureGate() || !sb) return
    const types = adminInventoryTypes[type] || []
    if (!types.length) return
    if (action === "add") {
      const check = await sb.from("inventory").select("item_type,item_id").eq("user_id",p.id).in("item_type",types).eq("item_id",id)
      if (check.error) return toast("❌ Lecture de l'inventaire impossible.")
      if (!check.data?.length) {
        const add = await sb.from("inventory").insert({user_id:p.id,item_type:types[0],item_id:id})
        if (add.error) return toast("❌ Ajout impossible : " + add.error.message)
      } else toast("✅ Objet déjà possédé.")
    } else if (action === "remove") {
      const del = await sb.from("inventory").delete().eq("user_id",p.id).in("item_type",types).eq("item_id",id)
      if (del.error) return toast("❌ Retrait impossible : " + del.error.message)
      if (type === "world" && String(p.selected_background||"") === String(id)) {
        await sb.from("profiles").update({selected_background:"city"}).eq("id",p.id); p.selected_background="city"
      }
      if (type === "character" && String(p.selected_character||"") === String(id)) {
        await sb.from("profiles").update({selected_character:"runner"}).eq("id",p.id); p.selected_character="runner"
      }
      if (type === "coin" && String(p.selected_coin||"") === String(id) && String(p.id) === String(user?.id)) {
        const meta=(user&&user.user_metadata)||{}
        const upd=await sb.auth.updateUser({data:{...meta,selected_coin:"gold"}})
        if (!upd.error) p.selected_coin="gold"
      }
    }
    await adminRenderInventory(p,box)
  }

  async function adminRenderInventory(p,box) {
    if (!box || !p || !sb) return
    const q=await sb.from("inventory").select("item_type,item_id").eq("user_id",p.id)
    if (q.error) { box.innerHTML='<div class="card">❌ Inventaire inaccessible : '+esc(q.error.message)+'</div>'; return }
    const inv=q.data||[]
    const has=(type,id)=>{
      const types=adminInventoryTypes[type]||[]
      return inv.some(x=>types.includes(String(x.item_type)) && String(x.item_id)===String(id))
    }
    const catalog=adminCatalog()
    const sections=[["world","🌍 MONDES"],["character","🧑 PERSONNAGES"],["coin","🪙 PIÈCES"]]
    box.innerHTML='<div class="card" style="margin-top:14px"><h3>🎒 COLLECTION — '+esc(p.username)+'</h3><p class="muted">Ajoute ou retire les objets du compte.</p>'+
      sections.map(([type,title])=>{
        const rows=Array.isArray(catalog[type])?catalog[type]:[]
        return '<div style="margin-top:14px"><h4 style="margin:8px 0">'+title+'</h4><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+
          rows.map(item=>{
            const id=item[0],emoji=item[1],name=item[2],owned=has(type,id)
            const starter=(type==="world"&&id==="city")||(type==="character"&&id==="runner")||(type==="coin"&&id==="gold")
            const action=owned||starter?"remove":"add"
            const disabled=starter?' disabled title="Objet de départ"':''
            return '<div class="card" style="padding:10px;text-align:center"><div style="font-size:28px">'+emoji+'</div><b>'+esc(name)+'</b><div class="muted" style="font-size:11px;margin:5px 0">'+(owned||starter?'✅ POSSÉDÉ':'🔒 NON POSSÉDÉ')+'</div><button type="button" data-admin-inv-action="'+action+'" data-admin-inv-type="'+type+'" data-admin-inv-id="'+esc(id)+'"'+disabled+'>'+ (owned||starter?'➖ RETIRER':'➕ AJOUTER') +'</button></div>'
          }).join('')+'</div></div>'
      }).join('')+'</div>'
    box.querySelectorAll("[data-admin-inv-action]").forEach(btn=>btn.onclick=async e=>{
      e.preventDefault();e.stopPropagation()
      await adminInventoryAction(p,btn.dataset.adminInvType,btn.dataset.adminInvId,btn.dataset.adminInvAction,box)
    })
  }

  async function adminRenderEditor(p) {
    if (!adminEnsureGate()) return
    const box=document.getElementById("adminResults")
    if (!box||!p) return
    const fields=[
      ["coins","🪙 Pièces",p.coins,0,999999999],
      ["highest_level","🏁 Niveau max",p.highest_level,1,300],
      ["best_distance","🏆 Meilleure distance",p.best_distance,0,999999999],
      ["total_distance","📏 Distance totale",p.total_distance,0,999999999],
      ["lives_level","❤️ Vies",p.lives_level,1,5],
      ["distance_level","🏃 Distance",p.distance_level,1,6],
      ["dash_level","⚡ Dash",p.dash_level,1,5],
      ["jump_level","🪽 Saut",p.jump_level,1,2],
      ["coin_level","🪙 Pièces x",p.coin_level,1,6],
      ["bonus_level","✨ Bonus",p.bonus_level,1,6],
      ["bonus_shield_level","🛡️ Bouclier",p.bonus_shield_level,1,6],
      ["bonus_mega_level","🚀 Méga-saut",p.bonus_mega_level,1,6],
      ["bonus_x2_level","🪙 Pièces x2",p.bonus_x2_level,1,6],
      ["bonus_jetpack_level","🛩️ Jetpack",p.bonus_jetpack_level,1,6],
      ["bonus_scoreDouble_level","🏆 Score x2",p.bonus_scoreDouble_level,1,6],
      ["bonus_magnet_level","🧲 Aimant",p.bonus_magnet_level,1,6]
    ]
    box.innerHTML='<div class="card" id="adminEditor"><h3>🛠️ Modifier : '+esc(p.username)+'</h3><p class="muted">Progression, pièces, améliorations de bonus et collection.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">'+
      fields.map(f=>'<label style="display:flex;flex-direction:column;gap:6px"><span>'+f[1]+'</span><input type="number" min="'+f[3]+'" max="'+f[4]+'" data-admin-field="'+f[0]+'" value="'+Number(f[2]??1)+'"></label>').join('')+
      '</div><div class="row" style="margin-top:14px"><button class="primary" id="btnAdminSave">💾 ENREGISTRER</button><button id="btnAdminCollection">🎒 COLLECTION</button><button id="btnAdminCancel">ANNULER</button></div><div id="adminEditStatus" class="muted" style="margin-top:8px"></div><div id="adminCollectionBox"></div></div>'
    const save=document.getElementById("btnAdminSave"),cancel=document.getElementById("btnAdminCancel"),collectionBtn=document.getElementById("btnAdminCollection")
    if(cancel) cancel.onclick=()=>adminSearch()
    if(collectionBtn) collectionBtn.onclick=async()=>adminRenderInventory(p,document.getElementById("adminCollectionBox"))
    if(save) save.onclick=async()=>{
      if(!adminEnsureGate()) return
      const status=document.getElementById("adminEditStatus"),patch={}
      fields.forEach(f=>{
        const input=box.querySelector('[data-admin-field="'+f[0]+'"]')
        let v=Math.floor(Number(input?.value))
        if(!Number.isFinite(v)) v=Number(f[2]||f[3])
        patch[f[0]]=Math.max(f[3],Math.min(f[4],v))
      })
      save.disabled=true
      if(status) status.textContent="⏳ Enregistrement..."
      const q=await sb.from("profiles").update(patch).eq("id",p.id)
      if(q.error){if(status)status.textContent="❌ "+q.error.message;save.disabled=false;return}
      if(String(p.id)===String(user?.id)){
        Object.assign(profile,patch)
        try{
          const bonusKeys=["bonus_shield_level","bonus_mega_level","bonus_x2_level","bonus_jetpack_level","bonus_scoreDouble_level","bonus_magnet_level"],bonusSave={}
          for(const k of bonusKeys) bonusSave[k]=Number(profile[k]||1)
          localStorage.setItem("ir_bonus_upgrades:"+user.id,JSON.stringify(bonusSave))
        }catch(e){}
        renderAll()
      }
      if(status) status.textContent="✅ Modifications enregistrées !"
      toast("✅ "+p.username+" a été modifié.")
    }
    await adminRenderInventory(p,document.getElementById("adminCollectionBox"))
  }

  async function adminSearch() {
    if(!adminAllowed()||!adminEnsureGate()) return
    const box=document.getElementById("adminResults"),input=document.getElementById("adminSearch"),qname=String(input?.value||"").trim()
    if(!qname)return toast("Entre un pseudo.")
    if(!sb)return toast("☁️ Supabase indisponible.")
    box.innerHTML='<div class="card">⏳ Recherche...</div>'
    const q=await sb.from("profiles").select("id,username,coins,best_distance,total_distance,highest_level,lives_level,distance_level,dash_level,jump_level,coin_level,bonus_level,bonus_shield_level,bonus_mega_level,bonus_x2_level,bonus_jetpack_level,bonus_scoreDouble_level,bonus_magnet_level,selected_background,selected_character").ilike("username","%"+qname+"%").limit(20)
    if(q.error){box.innerHTML='<div class="card">❌ '+esc(q.error.message)+'</div>';return}
    const rows=q.data||[]
    if(!rows.length){box.innerHTML='<div class="card">Aucun joueur trouvé.</div>';return}
    box.innerHTML=rows.map(p=>'<div class="card admin-player" data-admin-player="'+esc(p.id)+'" style="cursor:pointer;margin-bottom:10px"><div class="row" style="align-items:center"><div style="flex:1"><b>👤 '+esc(p.username)+'</b><div class="muted">🪙 '+Number(p.coins||0).toLocaleString("fr-FR")+' · 🏆 '+Number(p.best_distance||0)+'m · LV '+Number(p.highest_level||1)+'</div></div><button type="button" data-admin-edit="'+esc(p.id)+'">🛠️ MODIFIER</button></div></div>').join("")
    box.querySelectorAll("[data-admin-edit]").forEach(btn=>btn.onclick=e=>{
      e.preventDefault();e.stopPropagation()
      const p=rows.find(x=>String(x.id)===String(btn.dataset.adminEdit))
      if(p) adminRenderEditor(p)
    })
    box.querySelectorAll(".admin-player").forEach(card=>card.onclick=()=>{
      const p=rows.find(x=>String(x.id)===String(card.dataset.adminPlayer))
      if(p) adminRenderEditor(p)
    })
  }

  const adminTab=document.getElementById("adminTab")
  if(adminTab) adminTab.addEventListener("click",e=>{
    if(!adminAllowed())return
    if(!adminEnsureGate()){e.preventDefault();e.stopImmediatePropagation()}
  },true)

  const loginButton=document.getElementById("btnLogin")
  if(loginButton) loginButton.addEventListener("click",e=>{
    const name=String(document.getElementById("name")?.value||"").trim().toLowerCase()
    const pass=String(document.getElementById("pass")?.value||"")
    if(name===ADMIN_USERNAME&&pass!==ADMIN_LOGIN_PASSWORD){
      e.preventDefault();e.stopImmediatePropagation()
      const err=document.getElementById("err")
      if(err)err.textContent="❌ Le compte admin Rubansu1 doit utiliser le mot de passe prévu."
    }
  },true)

  const logoutButton=document.getElementById("btnLogout")
  if(logoutButton)logoutButton.addEventListener("click",()=>{adminGateUnlocked=false})

  const searchBtn=document.getElementById("btnAdminSearch")
  if(searchBtn)searchBtn.addEventListener("click",e=>{
    if(!adminEnsureGate()){e.preventDefault();e.stopImmediatePropagation();return}
    adminSearch()
  },true)
  const searchInput=document.getElementById("adminSearch")
  if(searchInput)searchInput.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      if(!adminEnsureGate()){e.preventDefault();e.stopImmediatePropagation();return}
      e.preventDefault();e.stopImmediatePropagation();adminSearch()
    }
  },true)
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
      const s = document.createElement('script'); s.textContent = code; document.head.appendChild(s)
    })
    .catch(err => { console.error(err); const e = document.getElementById('err'); if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.' })
})()
