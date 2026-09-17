(() => {
  'use strict'

  /*
   * ILLEGAL RUNNER — Level Finish Add-on
   *
   * IMPORTANT:
   * - This file does NOT replace or modify the runner engine.
   * - It never waits for Supabase before showing the finish screen.
   * - It uses the already loaded game/profile state when available.
   * - It safely resets itself between runs so every level can finish normally.
   */

  const $ = (id) => document.getElementById(id)
  let handledRun = false
  let lastOverState = false

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
      #levelFinishCourseFlag.near .flag {
        animation:irFinishWave .45s ease-in-out infinite alternate;
      }
      @keyframes irFinishWave {
        from { transform:skewY(-2deg) }
        to { transform:skewY(4deg) }
      }
      #levelFinishReward {
        margin:10px 0 0;
        padding:9px 12px;
        border-radius:12px;
        background:rgba(0,229,255,.10);
        border:1px solid rgba(0,229,255,.25);
      }
      #btnNextLevel { margin-top:10px; }
    `
    document.head.appendChild(s)
  }

  function getRunLevel() {
    const objective = String($('objective')?.textContent || '')
    const m = objective.match(/NIVEAU\s+(\d+)/i)
    return m ? Number(m[1]) : 0
  }

  function getCurrentLevel() {
    const title = String($('overTitle')?.textContent || '')
    const titleMatch = title.match(/NIVEAU\s+(\d+)/i)
    if (titleMatch) return Number(titleMatch[1])

    const objectiveLevel = getRunLevel()
    if (objectiveLevel) return objectiveLevel

    if (/CHAMPION/i.test(title)) return 300
    return 0
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

  function isGameRunning() {
    const game = $('game')
    const over = $('over')
    if (!game) return false

    const gameVisible = getComputedStyle(game).display !== 'none'
    const overVisible = over && getComputedStyle(over).display !== 'none'
    return gameVisible && !overVisible
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

    if (!isGameRunning() || !level || progress < 0.50 || progress >= 1) {
      marker.style.display = 'none'
      marker.classList.remove('near')
      return
    }

    const p = Math.max(0, Math.min(1, (progress - 0.50) / 0.50))
    const startX = window.innerWidth * 0.92
    const playerX = Math.max(80, window.innerWidth * 0.20)
    const x = startX + (playerX - startX) * Math.pow(p, 1.7)

    marker.style.left = `${x}px`
    marker.style.bottom = `${Math.max(88, Math.min(132, window.innerHeight * 0.16))}px`
    marker.style.display = 'block'
    marker.classList.toggle('near', p > 0.82)
  }

  function getCollectedCoins() {
    const finalText = String($('finalCoins')?.textContent || '')
    const finalCoins = Number(finalText.replace(/[^0-9.-]/g, '')) || 0

    /*
     * The main engine owns the real reward/save system. We therefore never
     * rewrite profile.coins or call Supabase here. The finish add-on only
     * displays the collected amount and the fixed level reward.
     */
    return Math.max(0, Math.floor(finalCoins))
  }

  function ensureFinishUI(level, collected) {
    const over = $('over')
    const card = document.querySelector('#over .over-card')
    if (!over || !card || getComputedStyle(over).display === 'none') return

    addStyle()

    let reward = $('levelFinishReward')
    if (!reward) {
      reward = document.createElement('div')
      reward.id = 'levelFinishReward'
      card.appendChild(reward)
    }

    reward.innerHTML = `🎉 Récompense du niveau : <b>100 🪙</b><br>🪙 Pièces ramassées : <b>${Math.max(0, collected)}</b>`

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

      next.style.display = ''
      next.onclick = (event) => {
        event.preventDefault()
        event.stopPropagation()

        const nextLevel = level + 1
        const btn = document.querySelector(`#levelButtons button[data-level="${nextLevel}"]`)

        if (!btn || btn.disabled) {
          console.warn('[IR] Niveau suivant indisponible:', nextLevel)
          return
        }

        // Let the existing engine handle level loading/startup.
        btn.click()
      }
    } else if (next) {
      next.style.display = 'none'
    }
  }

  function resetFinishStateIfNeeded() {
    const over = $('over')
    const visible = !!over && getComputedStyle(over).display !== 'none'

    if (!visible && lastOverState) {
      handledRun = false

      const reward = $('levelFinishReward')
      if (reward) reward.remove()

      const next = $('btnNextLevel')
      if (next) next.remove()
    }

    lastOverState = visible
  }

  function inspectEnd() {
    const over = $('over')
    if (!over || getComputedStyle(over).display === 'none') {
      resetFinishStateIfNeeded()
      return
    }

    if (handledRun) return

    const level = getCurrentLevel()
    if (!level) return

    /* Mark handled BEFORE changing the DOM to avoid MutationObserver loops. */
    handledRun = true
    lastOverState = true

    const collected = getCollectedCoins()

    // IMPORTANT: show the finish UI immediately. No network request can freeze it.
    ensureFinishUI(level, collected)
  }

  function startObserver() {
    addStyle()
    ensureCourseFlag()
    inspectEnd()

    const over = $('over')
    if (over) {
      new MutationObserver(() => {
        resetFinishStateIfNeeded()
        ensureCourseFlag()
        setTimeout(inspectEnd, 0)
      }).observe(over, {
        attributes: true,
        childList: true,
        subtree: true
      })
    }

    const game = $('game')
    if (game) {
      new MutationObserver(() => {
        resetFinishStateIfNeeded()
        ensureCourseFlag()
      }).observe(game, {
        attributes: true,
        childList: true,
        subtree: true
      })
    }

    // Lightweight safety check. It never changes the engine state.
    setInterval(() => {
      resetFinishStateIfNeeded()
      ensureCourseFlag()
      inspectEnd()
    }, 250)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true })
  } else {
    setTimeout(startObserver, 0)
  }
})()
