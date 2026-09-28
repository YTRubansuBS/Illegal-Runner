/* ILLEGAL RUNNER loader: original engine + live customization + persistent Supabase progression. */
(() => {
  const ORIGINAL = 'https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  let __duelRngState = 1
  window.IR_DUEL_SET_WORLD_RNG = (seed) => {
    let s = (Number(seed) >>> 0) || 1
    __duelRngState = s
    window.__IR_DUEL_WORLD_RNG = () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296 }
    __duelRngState = s
  }
  function replaceBetween(source, startMarker, endMarker, replacement) {
    const a = source.indexOf(startMarker), b = source.indexOf(endMarker, a)
    if (a < 0 || b < 0) { console.error('[IR] replacement marker not found:', startMarker); return source }
    return source.slice(0, a) + replacement + '\n' + source.slice(b)
  }
  fetch(ORIGINAL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Impossible de charger le moteur du jeu'); return r.text() })
    .then(code => {
      code = code.replace('const G = {', 'const G = window.__IR_G = {')
      code = code.replace('    // far parallax skyline\n    drawSkyline(ctx, W, H, w.far, 0.12, 80, 150, 46)\n    drawSkyline(ctx, W, H, w.mid, 0.26, 55, 210, 64)', '    // Shared skyline disabled: keep the world view clear.\n')
      code = code.replace('      const r = Math.random()', '      const r = IR_WORLD_RANDOM()').replace('const r = Math.random()', 'const r = IR_WORLD_RANDOM()')
      code = code.replace('      const h = rand(46, Math.min(120, 60 + d * 0.02))', '      const h = IR_WORLD_RANGE(46, Math.min(120, 60 + d * 0.02))')
      code = code.replace('      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: rand(20, 70) })', '      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: IR_WORLD_RANGE(20, 70) })')
      code = code.replace('gy - rand(150, 200), w: 48, h: 34, destructible: true, bob: rand(0, 6.28)', 'gy - IR_WORLD_RANGE(150, 200), w: 48, h: 34, destructible: true, bob: IR_WORLD_RANGE(0, 6.28)').replace('gy - rand(50, 95), w: 28, h: 18, destructible: true, vx: rand(180, 260)', 'gy - IR_WORLD_RANGE(50, 95), w: 28, h: 18, destructible: true, vx: IR_WORLD_RANGE(180, 260)')
      code = code.replace('const w = rand(90, Math.min(160, 100 + d * 0.02))', 'const w = IR_WORLD_RANGE(90, Math.min(160, 100 + d * 0.02))').replace('const py = gy - rand(90, 150)', 'const py = gy - IR_WORLD_RANGE(90, 150)')
      code = code.replace('if (Math.random() < 0.4) G.obs.push({ type: "spike"', 'if (IR_WORLD_RANDOM() < 0.4) G.obs.push({ type: "spike"').replace('const n = 4 + ((Math.random() * 3) | 0)', 'const n = 4 + ((IR_WORLD_RANDOM() * 3) | 0)')
      code = code.replace('const baseY = G.groundY - rand(60, 230)', 'const baseY = G.groundY - IR_WORLD_RANGE(60, 230)').replace('const arc = Math.random() < 0.5', 'const arc = IR_WORLD_RANDOM() < 0.5').replace('const t = pick(types)', 'const t = IR_WORLD_PICK(types)').replace('G.groundY - rand(80, 200)', 'G.groundY - IR_WORLD_RANGE(80, 200)').replace('G.spawnT = minGap + Math.random() * 0.35', 'G.spawnT = minGap + IR_WORLD_RANDOM() * 0.35')
      code = code.replace('    G.baseSpeed = 360 + (profile.distance_level || 1) * 22', '    G.baseSpeed = window.IR_DUEL_ACTIVE ? 420 : 360 + (profile.distance_level || 1) * 22').replace('    const d = G.dist', '    const d = window.IR_DUEL_ACTIVE ? 0 : G.dist').replace('const minGap = clamp(1.05 - G.dist / 6000, 0.5, 1.05)', 'const minGap = window.IR_DUEL_ACTIVE ? 0.82 : clamp(1.05 - G.dist / 6000, 0.5, 1.05)').replace('G.coinT = 1.4 + Math.random() * 0.8', 'G.coinT = 1.4 + IR_WORLD_RANDOM() * 0.8').replace('G.bonusT = rand(9, 15) - (profile.bonus_level || 1)', 'G.bonusT = IR_WORLD_RANGE(9, 15) - (profile.bonus_level || 1)')
      code = code.replace('  const CFG = window.IR_CONFIG || {}', '  const IR_WORLD_RANDOM = () => (window.IR_DUEL_ACTIVE && window.__IR_DUEL_WORLD_RNG ? window.__IR_DUEL_WORLD_RNG() : globalThis.Math.random())\n  const IR_WORLD_RANGE = (a,b) => a + IR_WORLD_RANDOM() * (b-a)\n  const IR_WORLD_PICK = arr => arr[(IR_WORLD_RANDOM() * arr.length) | 0]\n  const CFG = window.IR_CONFIG || {}')
      code = code.replace('    G.lives = G.maxLives', '    G.lives = G.maxLives\n    if (window.IR_DUEL_ACTIVE && window.IR_DUEL_CONFIG && Number.isFinite(Number(window.IR_DUEL_CONFIG.lives)) && Number(window.IR_DUEL_CONFIG.lives) > 0) { G.maxLives = Math.max(1, Math.floor(Number(window.IR_DUEL_CONFIG.lives))); G.lives = G.maxLives }')
      code = code.replace('        G.running = true\n        G.startTime = performance.now()', '        G.running = true\n        G.startTime = performance.now()\n        window.dispatchEvent(new CustomEvent("ir:duelStarted"))')
      code = code.replace('  async function end() {\n    if (!G.running) return', '  async function end() {\n    if (window.IR_DUEL_ACTIVE) { G.running = false; cancelAnimationFrame(G.raf); window.dispatchEvent(new CustomEvent("ir:duelPlayerLost", { detail: { distance: G.dist, lives: G.lives } })); return }\n    if (!G.running) return')
      // IMPORTANT: do not call the removed/undefined drawSelectedDashEffect hook.
      code = code.replace('    if (G.dashT > 0) drawSelectedDashEffect(ctx, w)\n    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW) { try { window.IR_DUEL_GHOST_DRAW(ctx, W, H, w, G) } catch (e) {} }\n\n    ctx.restore()', '    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW) { try { window.IR_DUEL_GHOST_DRAW(ctx, W, H, w, G) } catch (e) {} }\n\n    ctx.restore()')
      code = code.replace('  function quit() {', '  window.addEventListener("ir:duelStartGame", () => { if (window.IR_DUEL_ACTIVE) start(0) })\n  window.addEventListener("ir:duelExitToMenu", () => { try { window.IR_DUEL_ACTIVE = false; window.IR_DUEL_CONFIG = null; window.__IR_DUEL_SEED = null; window.__IR_DUEL_WORLD_RNG = null; $("btnPause").style.display = ""; quit() } catch (e) {} })\n  function quit() {')
      const marker='    // coins\n    for (const c of G.coinsArr) {'
      if (code.includes(marker)) code = code.replace(marker, '    // coins\n    for (const c of G.coinsArr) {')
      code = code.replace('    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW)', '    drawPlayer(ctx, w)\n    if (window.IR_DUEL_GHOST_DRAW)')
      new Function(code)
      const s=document.createElement('script'); s.textContent=code; document.body.appendChild(s)
    })
    .catch(e => { console.error(e); const el=document.getElementById('loading'); if(el) el.textContent='Erreur de chargement du jeu' })
})()
