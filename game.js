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
      code = code.replace('      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: rand(20, 70) })','      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: IR_WORLD_RANGE(20, 70) })
')
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

      // --- Bonus cooldowns: shown only under the PAUSE button during a run. ---
      const cooldownUI = `
      (() => {
        const style = document.createElement("style")
        style.textContent = "#irBoostCooldowns{display:flex;flex-direction:column;gap:5px;margin-top:7px;width:max-content;max-width:170px;pointer-events:none}#irBoostCooldowns .irBoost{display:flex;align-items:center;gap:7px;padding:5px 9px;border:1px solid #ffffff22;border-radius:9px;background:#050914d9;backdrop-filter:blur(8px);font:800 11px Inter,Arial,sans-serif;color:#fff;box-shadow:0 5px 18px #0006}#irBoostCooldowns .irBoost b{margin-left:auto;font-variant-numeric:tabular-nums;color:#fff}#irBoostCooldowns .irBoost .bar{display:block;width:42px;height:3px;border-radius:99px;background:#ffffff18;overflow:hidden}#irBoostCooldowns .irBoost .bar i{display:block;height:100%;border-radius:99px;background:currentColor}"
        document.head.appendChild(style)
        const pause = document.getElementById("btnPause")
        if (!pause || !pause.parentElement) return
        let box = document.getElementById("irBoostCooldowns")
        if (!box) { box = document.createElement("div"); box.id = "irBoostCooldowns"; pause.parentElement.appendChild(box) }
        const update = () => {
          if (typeof G === "undefined" || !G) return
          const level = Math.max(1, Number((typeof profile !== "undefined" && profile && profile.bonus_level) || 1))
          const megaMax = 6 + level
          const coinMax = 8 + level
          const items = []
          if (Number(G.jumpBoostT) > 0) items.push(["🚀","MÉGA-SAUT",Number(G.jumpBoostT),megaMax])
          if (Number(G.coinBoostT) > 0) items.push(["🪙","PIÈCES x2",Number(G.coinBoostT),coinMax])
          box.innerHTML = items.map(x => '<div class="irBoost"><span>'+x[0]+'</span><span>'+x[1]+'</span><b>'+x[2].toFixed(1)+'s</b><span class="bar"><i style="width:'+Math.max(0,Math.min(100,x[2]/x[3]*100))+'%"></i></span></div>').join("")
          box.style.display = items.length && G.running ? "flex" : "none"
        }
        update()
        if (!window.__IR_BOOST_COOLDOWN_TIMER) window.__IR_BOOST_COOLDOWN_TIMER = setInterval(update, 80)
      })()
      `
      code = code.replace('  const STEP = 1 / 120 // fixed physics step', cooldownUI + '\n  const STEP = 1 / 120 // fixed physics step')

      code = code.replace("    // coins\n    for (const c of G.coinsArr) {\n      if (c.got) continue\n      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = w.coin; ctx.fillStyle = w.coin\n      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill()\n      ctx.fillStyle = \"#ffffffaa\"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 3, c.r * 0.35, 0, 7); ctx.fill()\n      ctx.restore()\n    }", "    // coins\n    const getSelectedCoinId = () => {\n      try { return (profile && profile.selected_coin) || localStorage.getItem(\"irSelectedCoin_\" + (user?.id || \"guest\")) || \"gold\" }\n      catch (e) { return (profile && profile.selected_coin) || \"gold\" }\n    }\n    const drawSelectedCoin = (ctx,c,id,time) => {\n      const r=c.r, P={ gold:[\"#f7c948\",\"#fff4a3\"],silver:[\"#cbd5e1\",\"#fff\"],bronze:[\"#a85a24\",\"#e5a86a\"],blue:[\"#1d4ed8\",\"#60a5fa\"],green:[\"#15803d\",\"#86efac\"],red:[\"#b91c1c\",\"#f87171\"],pink:[\"#db2777\",\"#f9a8d4\"],orange:[\"#ea580c\",\"#fdba74\"],purple:[\"#7e22ce\",\"#c084fc\"],white:[\"#dbeafe\",\"#fff\"],diamond:[\"#67e8f9\",\"#fff\"],emerald:[\"#059669\",\"#86efac\"],ruby:[\"#be123c\",\"#fecdd3\"],sapphire:[\"#2563eb\",\"#bfdbfe\"],amethyst:[\"#9333ea\",\"#e9d5ff\"],topaz:[\"#d97706\",\"#fde68a\"],pearl:[\"#e5e7eb\",\"#fff\"],crystal:[\"#60a5fa\",\"#e0f2fe\"],neon:[\"#00f5ff\",\"#ff37c7\"],star:[\"#facc15\",\"#fff7ae\"],moon:[\"#64748b\",\"#dbeafe\"],sun:[\"#f59e0b\",\"#fff7ae\"],fire:[\"#ef4444\",\"#f97316\"],ice:[\"#38bdf8\",\"#dff6ff\"],thunder:[\"#f8ff3f\",\"#67e8f9\"],rainbow:[\"#ec4899\",\"#22d3ee\"],galaxy:[\"#7c3aed\",\"#ec4899\"],cosmic:[\"#06b6d4\",\"#f0abfc\"],void:[\"#05030a\",\"#ff4bd8\"],crown:[\"#f59e0b\",\"#fde68a\"],dragon:[\"#dc2626\",\"#fb923c\"],glitch:[\"#00f5ff\",\"#ff3cf2\"],infinite:[\"#7c3aed\",\"#fff\"],secret:[\"#00e5ff\",\"#fbbf24\"] };\n      const p=P[id]||P.gold; ctx.save();ctx.translate(c.x,c.y);const pulse=1+Math.sin(time*4+c.x*.02)*.04;ctx.scale(pulse,1);ctx.lineWidth=Math.max(2,r*.16);ctx.shadowBlur=id===\"secret\"?28:id===\"infinite\"?24:16;ctx.shadowColor=p[1];ctx.fillStyle=p[0];ctx.strokeStyle=p[1];ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();\n    }\n    const coinId=getSelectedCoinId();\n    for (const c of G.coinsArr) { if (c.got) continue; drawSelectedCoin(ctx,c,coinId,performance.now()/1000) }")

      code = code.replace('  function quit() {', '  function quit() {')

      // Keep the existing engine and all other systems untouched.
      window.__IR_LAST_GAME_CODE = code
      const s = document.createElement('script')
      s.textContent = code
      document.head.appendChild(s)
    })
    .catch(e => {
      console.error(e)
      const el = document.getElementById('err')
      if (el) el.textContent = e.message || 'Erreur de chargement du jeu.'
    })
})()
