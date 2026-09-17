(() => {
  'use strict'

  // Isolated add-on: shows a real in-run finish marker ahead of the player.
  // It does not modify game.js or any gameplay controls.
  const $ = (id) => document.getElementById(id)
  let handled = false

  function addStyle() {
    if ($('levelFinishAddonStyle')) return
    const s = document.createElement('style')
    s.id = 'levelFinishAddonStyle'
    s.textContent = `
      #levelFinishCourseFlag { position:absolute; left:90vw; bottom:112px; width:54px; height:112px; z-index:6; pointer-events:none; display:none; filter:drop-shadow(0 0 10px rgba(0,229,255,.55)); transform:translateX(-50%); }
      #levelFinishCourseFlag .pole { position:absolute; left:25px; bottom:0; width:5px; height:100px; border-radius:4px; background:linear-gradient(#eafcff,#00e5ff 45%,#1677a0); box-shadow:0 0 9px rgba(0,229,255,.8); }
      #levelFinishCourseFlag .flag { position:absolute; left:29px; top:5px; width:48px; height:31px; border-radius:2px 8px 8px 2px; background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8); clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%); box-shadow:0 0 12px rgba(0,229,255,.8); }
      #levelFinishCourseFlag .flag:after { content:'IR'; position:absolute; inset:0; display:grid; place-items:center; color:#00141c; font:900 11px/1 Inter,Arial,sans-serif; }
      #levelFinishCourseFlag .base { position:absolute; left:14px; bottom:0; width:27px; height:7px; border-radius:50%; background:#00e5ff; box-shadow:0 0 12px rgba(0,229,255,.9); }
      #levelFinishReward { margin:10px 0 0; padding:9px 12px; border-radius:12px; background:rgba(0,229,255,.10); border:1px solid rgba(0,229,255,.25); }
      #btnNextLevel { margin-top:10px; }
    `
    document.head.appendChild(s)
  }

  function getRunLevel() {
    const text = String($('objective')?.textContent || '')
    const m = text.match(/NIVEAU\s+(\d+)/i)
    return m ? Number(m[1]) : 0
  }

  function getProgress() {
    const bar = $('progressBar')
    if (bar) {
      const w = parseFloat(bar.style.width)
      if (Number.isFinite(w)) return Math.max(0, Math.min(1, w / 100))
    }
    const dist = Number($('dist')?.textContent || 0)
    const objective = String($('objective')?.textContent || '')
    const nums = objective.match(/\d+(?:[.,]\d+)?/g)?.map(v => Number(v.replace(',', '.'))) || []
    const goal = nums.filter(v => v > 100).pop()
    return goal > 0 ? Math.max(0, Math.min(1, dist / goal)) : 0
  }

  function ensureCourseFlag() {
    addStyle()
    const game = $('game')
    if (!game) return
    let marker = $('levelFinishCourseFlag')
    if (!marker) {
      marker = document.createElement('div')
      marker.id = 'levelFinishCourseFlag'
      marker.innerHTML = '<div class="flag"></div><div class="pole"></div><div class="base"></div>'
      game.appendChild(marker)
    }

    const level = getRunLevel()
    const progress = getProgress()
    const running = getComputedStyle(game).display !== 'none' && getComputedStyle($('over') || game).display === 'none'
    if (!running || !level || progress < 0.72) {
      marker.style.display = 'none'
      return
    }

    // The closer the player gets to the end, the closer the finish flag appears,
    // exactly like an upcoming finish marker inside the course.
    const p = Math.max(0, Math.min(1, (progress - 0.72) / 0.28))
    const x = window.innerWidth * (0.94 - p * 0.40)
    marker.style.left = `${Math.max(110, x)}px`
    marker.style.bottom = `${Math.max(104, Math.min(145, window.innerHeight * 0.17))}px`
    marker.style.display = 'block'
  }

  function getCurrentLevel() {
    const title = String($('overTitle')?.textContent || '')
    const m = title.match(/NIVEAU\s+(\d+)/i)
    if (m) return Number(m[1])
    if (/CHAMPION/i.test(title)) return 300
    return 0
  }

  async function getBonusLevel() {
    try {
      const local = JSON.parse(localStorage.getItem('irGuest') || '{}')
      if (local && Number(local.bonus_level)) return Number(local.bonus_level)
    } catch (_) {}
    try {
      const cfg = window.IR_CONFIG || {}
      if (!window.supabase || !String(cfg.SUPABASE_URL || '').startsWith('http')) return 1
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
      const session = await client.auth.getSession()
      const id = session?.data?.session?.user?.id
      if (!id) return 1
      const r = await client.from('profiles').select('bonus_level').eq('id', id).single()
      return Number(r?.data?.bonus_level || 1)
    } catch (_) { return 1 }
  }

  async function correctReward(level) {
    const bonusLevel = await getBonusLevel()
    const oldReward = 150 + level * 12 + bonusLevel * 30
    const delta = 100 - oldReward
    if (!Number.isFinite(delta) || delta === 0) return
    try {
      let local = null
      try { local = JSON.parse(localStorage.getItem('irGuest') || 'null') } catch (_) {}
      if (local && typeof local === 'object') {
        local.coins = Math.max(0, Number(local.coins || 0) + delta)
        localStorage.setItem('irGuest', JSON.stringify(local))
        if ($('coins')) $('coins').textContent = local.coins
        return
      }
      const cfg = window.IR_CONFIG || {}
      if (!window.supabase || !String(cfg.SUPABASE_URL || '').startsWith('http')) return
      const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
      const session = await client.auth.getSession()
      const id = session?.data?.session?.user?.id
      if (!id) return
      const current = await client.from('profiles').select('coins').eq('id', id).single()
      if (current.error) return
      const next = Math.max(0, Number(current.data?.coins || 0) + delta)
      await client.from('profiles').update({ coins: next }).eq('id', id)
      if ($('coins')) $('coins').textContent = next
    } catch (_) {}
  }

  function ensureFinishUI(level, collected) {
    const card = document.querySelector('#over .over-card')
    if (!card) return
    addStyle()
    const oldFlag = $('levelFinishFlag')
    if (oldFlag) oldFlag.remove()

    let reward = $('levelFinishReward')
    if (!reward) {
      reward = document.createElement('div')
      reward.id = 'levelFinishReward'
      card.appendChild(reward)
    }
    reward.innerHTML = `🎉 Récompense de fin : <b>100 🪙 + ${Math.max(0, collected)} 🪙 ramassées</b>`

    let next = $('btnNextLevel')
    if (level < 300) {
      if (!next) {
        next = document.createElement('button')
        next.id = 'btnNextLevel'
        next.className = 'primary'
        next.type = 'button'
        next.textContent = '➡️ NIVEAU SUIVANT'
        const row = card.querySelector('.row')
        if (row) row.insertBefore(next, row.firstChild)
        else card.appendChild(next)
      }
      next.onclick = () => {
        const nextLevel = level + 1
        const btn = document.querySelector(`#levelButtons button[data-level="${nextLevel}"]`)
        if (btn && !btn.disabled) btn.click()
      }
      next.style.display = ''
    } else if (next) next.style.display = 'none'
  }

  async function inspectEnd() {
    const over = $('over')
    if (!over || getComputedStyle(over).display === 'none') return
    const level = getCurrentLevel()
    if (!level) { handled = false; return }
    if (handled) return
    handled = true
    const finalBefore = Number($('finalCoins')?.textContent || 0)
    const bonusLevel = await getBonusLevel()
    const oldReward = 150 + level * 12 + bonusLevel * 30
    const collected = Math.max(0, finalBefore - oldReward)
    if ($('finalCoins')) $('finalCoins').textContent = collected + 100
    await correctReward(level)
    ensureFinishUI(level, collected)
  }

  function startObserver() {
    addStyle()
    ensureCourseFlag()
    const over = $('over')
    if (over) new MutationObserver(() => { ensureCourseFlag(); setTimeout(inspectEnd, 0) }).observe(over, { attributes:true, childList:true, subtree:true })
    const game = $('game')
    if (game) new MutationObserver(ensureCourseFlag).observe(game, { attributes:true, childList:true, subtree:true })
    setInterval(ensureCourseFlag, 200)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver)
  else setTimeout(startObserver, 0)
})()
