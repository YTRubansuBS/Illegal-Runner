(() => {
  'use strict'

  // Add-on isolated from the runner engine: only watches the existing end screen.
  const $ = (id) => document.getElementById(id)
  let handled = false
  let runStartCoins = 0

  function addStyle() {
    if ($('levelFinishAddonStyle')) return
    const s = document.createElement('style')
    s.id = 'levelFinishAddonStyle'
    s.textContent = `
      #levelFinishFlag { font-size:64px; line-height:1; margin:4px 0 8px; filter:drop-shadow(0 0 12px rgba(0,229,255,.55)); }
      #btnNextLevel { margin-top:10px; }
      #levelFinishReward { margin:10px 0 0; padding:9px 12px; border-radius:12px; background:rgba(0,229,255,.10); border:1px solid rgba(0,229,255,.25); }
    `
    document.head.appendChild(s)
  }

  function captureRunStart() {
    const game = $('game')
    if (game && getComputedStyle(game).display !== 'none') {
      const n = Number($('coins')?.textContent || 0)
      if (Number.isFinite(n)) runStartCoins = n
    }
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

  async function correctReward(level, finalCoins) {
    // The original engine already saved its reward. Replace only that reward
    // with the requested 100 + collected coins, leaving collected coins intact.
    const bonusLevel = await getBonusLevel()
    const oldReward = 150 + level * 12 + bonusLevel * 30
    const delta = 100 - oldReward
    if (!Number.isFinite(delta) || delta === 0) return

    try {
      const guest = (() => { try { return !!JSON.parse(localStorage.getItem('irGuest') || 'null') } catch (_) { return false } })()
      if (guest) {
        const p = JSON.parse(localStorage.getItem('irGuest') || '{}')
        p.coins = Math.max(0, Number(p.coins || 0) + delta)
        localStorage.setItem('irGuest', JSON.stringify(p))
        if ($('coins')) $('coins').textContent = p.coins
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

  function ensureFinishUI(level) {
    const card = document.querySelector('#over .over-card')
    if (!card) return
    addStyle()

    let flag = $('levelFinishFlag')
    if (!flag) {
      flag = document.createElement('div')
      flag.id = 'levelFinishFlag'
      flag.textContent = '🚩'
      const kicker = card.querySelector('.over-kicker')
      card.insertBefore(flag, kicker || card.firstChild)
    }

    let reward = $('levelFinishReward')
    if (!reward) {
      reward = document.createElement('div')
      reward.id = 'levelFinishReward'
      card.appendChild(reward)
    }
    const collected = Math.max(0, Number($('finalCoins')?.textContent || 0))
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
        else {
          const levels = document.querySelectorAll('#levelButtons button[data-level]')
          const fallback = Array.from(levels).find(b => Number(b.dataset.level) === nextLevel)
          if (fallback && !fallback.disabled) fallback.click()
        }
      }
      next.style.display = ''
    } else if (next) {
      next.style.display = 'none'
    }
  }

  async function inspectEnd() {
    const over = $('over')
    if (!over || getComputedStyle(over).display === 'none') return
    const level = getCurrentLevel()
    if (!level) { handled = false; return }
    if (handled) return
    handled = true

    const finalCoinsBefore = Number($('finalCoins')?.textContent || 0)
    await correctReward(level, finalCoinsBefore)
    ensureFinishUI(level)
  }

  function startObserver() {
    captureRunStart()
    const over = $('over')
    if (!over) return
    new MutationObserver(() => { setTimeout(inspectEnd, 0) }).observe(over, { attributes:true, childList:true, subtree:true })
    new MutationObserver(() => {
      const game = $('game')
      if (game && getComputedStyle(game).display !== 'none') captureRunStart()
    }).observe(document.body, { attributes:true, subtree:true, attributeFilter:['style','class'] })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver)
  else setTimeout(startObserver, 0)
})()
