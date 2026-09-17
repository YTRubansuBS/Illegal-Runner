(() => {
  'use strict'

  // Isolated finish-marker add-on. The runner engine and controls stay untouched.
  const $ = (id) => document.getElementById(id)
  let handled = false

  function addStyle() {
    if ($('levelFinishAddonStyle')) return
    const s = document.createElement('style')
    s.id = 'levelFinishAddonStyle'
    s.textContent = `
      #levelFinishCourseFlag {
        position:absolute; left:92vw; bottom:96px; width:54px; height:122px;
        z-index:6; pointer-events:none; display:none;
        transform:translateX(-50%); filter:drop-shadow(0 0 10px rgba(0,229,255,.65));
        transition:left .08s linear, opacity .12s linear;
      }
      #levelFinishCourseFlag .pole {
        position:absolute; left:25px; bottom:0; width:5px; height:110px;
        border-radius:4px; background:linear-gradient(#fff,#00e5ff 45%,#1677a0);
        box-shadow:0 0 9px rgba(0,229,255,.8);
      }
      #levelFinishCourseFlag .flag {
        position:absolute; left:29px; top:4px; width:48px; height:31px;
        border-radius:2px 8px 8px 2px;
        background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8);
        clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);
        box-shadow:0 0 12px rgba(0,229,255,.8);
      }
      #levelFinishCourseFlag .flag:after {
        content:'🏁'; position:absolute; inset:0; display:grid; place-items:center;
        font-size:17px; line-height:1;
      }
      #levelFinishCourseFlag .base {
        position:absolute; left:13px; bottom:0; width:29px; height:8px;
        border-radius:50%; background:#00e5ff; box-shadow:0 0 12px rgba(0,229,255,.9);
      }
      #levelFinishCourseFlag.near .flag { animation: irFinishWave .45s ease-in-out infinite alternate; }
      @keyframes irFinishWave { from { transform:skewY(-2deg) } to { transform:skewY(4deg) } }
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
      const inline = parseFloat(bar.style.width)
      if (Number.isFinite(inline)) return Math.max(0, Math.min(1, inline / 100))
      const computed = parseFloat(getComputedStyle(bar).width)
      const parent = parseFloat(getComputedStyle(bar.parentElement || bar).width)
      if (Number.isFinite(computed) && Number.isFinite(parent) && parent > 0) {
        return Math.max(0, Math.min(1, computed / parent))
      }
    }
    const dist = Number(String($('dist')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0
    const objective = String($('objective')?.textContent || '')
    const m = objective.match(/(?:\/|de|sur)?\s*(\d+(?:[.,]\d+)?)\s*m\b/i)
    const goal = m ? Number(m[1].replace(',', '.')) : 0
    return goal > 0 ? Math.max(0, Math.min(1, dist / goal)) : 0
  }

  function ensureCourseFlag() {
    addStyle()
    const game = $('game')
    const over = $('over')
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
    const running = getComputedStyle(game).display !== 'none' && (!over || getComputedStyle(over).display === 'none')

    // It is an actual in-course finish marker: it starts far ahead and travels
    // toward the player's position as the player approaches the end.
    if (!running || !level || progress < 0.50 || progress >= 1) {
      marker.style.display = 'none'
      marker.classList.remove('near')
      return
    }

    const p = Math.max(0, Math.min(1, (progress - 0.50) / 0.50))
    // Player is roughly on the left side of the course. At 100% the flag reaches
    // the player's lane, so the player visibly passes it when the level completes.
    const xPercent = 92 - (p * 73)
    marker.style.left = `${Math.max(18, xPercent)}vw`
    marker.style.bottom = `${Math.max(88, Math.min(132, window.innerHeight * 0.16))}px`
    marker.style.display = 'block'
    marker.classList.toggle('near', p > 0.82)
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
    setInterval(ensureCourseFlag, 100)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver)
  else setTimeout(startObserver, 0)
})()
