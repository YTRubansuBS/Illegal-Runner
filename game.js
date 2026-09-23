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
      console.error('[IR] replacement marker not found:', startMarker)
      return source
    }
    return source.slice(0, a) + replacement + '\n' + source.slice(b)
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
      code = code.replace('G.coinT = 1.4 + Math.random() * 0.8','G.coinT = 1.4 + IR_WORLD_RANDOM() * 0.8')
      code = code.replace('G.bonusT = rand(9, 15) - (profile.bonus_level || 1)','G.bonusT = IR_WORLD_RANGE(9, 15) - (profile.bonus_level || 1)')
      code = code.replace('  const CFG = window.IR_CONFIG || {}', '  const IR_WORLD_RANDOM = () => (window.IR_DUEL_ACTIVE && window.__IR_DUEL_WORLD_RNG ? window.__IR_DUEL_WORLD_RNG() : globalThis.Math.random())\n  const IR_WORLD_RANGE = (a,b) => a + IR_WORLD_RANDOM() * (b-a)\n  const IR_WORLD_PICK = arr => arr[(IR_WORLD_RANDOM() * arr.length) | 0]\n  const CFG = window.IR_CONFIG || {}')
      code = code.replace('    G.baseSpeed = 360 + (profile.distance_level || 1) * 22','    G.baseSpeed = window.IR_DUEL_ACTIVE ? 420 : 360 + (profile.distance_level || 1) * 22')
      code = code.replace('    const d = G.dist','    const d = window.IR_DUEL_ACTIVE ? 0 : G.dist')
      code = code.replace('const minGap = clamp(1.05 - G.dist / 6000, 0.5, 1.05)','const minGap = window.IR_DUEL_ACTIVE ? 0.82 : clamp(1.05 - G.dist / 6000, 0.5, 1.05)')
      code = code.replace('    G.lives = G.maxLives', '    G.lives = G.maxLives\n    if (window.IR_DUEL_ACTIVE && window.IR_DUEL_CONFIG && Number.isFinite(Number(window.IR_DUEL_CONFIG.lives)) && Number(window.IR_DUEL_CONFIG.lives) > 0) { G.maxLives = Math.max(1, Math.floor(Number(window.IR_DUEL_CONFIG.lives))); G.lives = G.maxLives }')
      code = code.replace('        G.running = true\n        G.startTime = performance.now()', '        G.running = true\n        G.startTime = performance.now()\n        window.dispatchEvent(new CustomEvent("ir:duelStarted"))')
      code = code.replace('  async function end() {\n    if (!G.running) return', '  async function end() {\n    if (window.IR_DUEL_ACTIVE) { G.running = false; cancelAnimationFrame(G.raf); window.dispatchEvent(new CustomEvent("ir:duelPlayerLost", { detail: { distance: G.dist, lives: G.lives } })); return }\n    if (!G.running) return')
      code = code.replace('    drawPlayer(ctx, w)\n\n    ctx.restore()', '    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW) { try { window.IR_DUEL_GHOST_DRAW(ctx, W, H, w, G) } catch (e) {} }\n\n    ctx.restore()')
      code = code.replace('  function quit() {', '  window.addEventListener("ir:duelStartGame", () => { if (window.IR_DUEL_ACTIVE) start(0) })\n  window.addEventListener("ir:duelExitToMenu", () => { try { window.IR_DUEL_ACTIVE = false; window.IR_DUEL_CONFIG = null; window.__IR_DUEL_SEED = null; window.__IR_DUEL_WORLD_RNG = null; $("btnPause").style.display = ""; quit() } catch (e) {} })\n  function quit() {')
      code = code.replace('const cost = 100 * v','const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]')
      code = code.replace('${maxed ? "MAX" : "🪙 " + 100 * v}','${maxed ? "MAX" : "🪙 Acheter " + [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]}')
      code = code.replace('${maxed ? "MAX" : "🪙 " + 100 * v}</button></div>','${maxed ? "MAX" : "🪙 Acheter " + [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]}</button></div>')
      code = code.replace('const cost = 100 * v','const cost = id === "jump" ? 5000 : 100 * v')
      code = code.replace('const maxed = v >= max','const maxed = id === "jump" ? v >= 2 : v >= max')
      code = code.replace('${maxed ? "MAX" : "🪙 " + cost}','${maxed ? "MAX" : "🪙 Acheter " + cost}')
      code = replaceBetween(code, '  async function buyUpgrade(id) {', '  function freePack() {', `  async function buyUpgrade(id) {
    const entry = UPGRADES.find((u) => u[0] === id)
    if (!entry) return
    const max = entry[3]
    const key = id + "_level"
    let v = Math.max(1, Number(profile[key] || 1))
    if (v >= (id === "jump" ? 2 : max)) return toast("Niveau maximum !")
    const cost = [100, 500, 1000, 2500, 5000][Math.min(Math.max(0, v - 1), 4)]
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
        if (v >= max) { profile[key] = v; profile.coins = freshCoins; refreshTop(); renderAll(); return toast("Niveau maximum !") }
        if (freshCoins < cost) { profile.coins = freshCoins; profile[key] = v; refreshTop(); renderAll(); return toast("Pas assez de pièces.") }
        const nextCoins = freshCoins - cost
        const nextLevel = v + 1
        const saved = await sb.from("profiles").update({ coins: nextCoins, [key]: nextLevel }).eq("id", user.id)
        if (saved.error) throw saved.error
        profile.coins = nextCoins
        profile[key] = nextLevel
      } catch (e) { console.error("[IR] upgrade save:", e); return toast("❌ Impossible d'enregistrer l'amélioration.") }
    }
    SFX.bonus()
    refreshTop()
    renderAll()
    window.dispatchEvent(new CustomEvent("ir:profileChanged", { detail: { coins: profile.coins, [key]: profile[key] } }))
    toast("⚡ " + entry[2] + " amélioré ! Niveau " + profile[key] + "/" + max)
  }
`)
    })
    .catch(e => { console.error('[IR] loader:', e); document.body.innerHTML += '<div style="padding:30px;color:#fff">Erreur de chargement du jeu.</div>' })
})()
