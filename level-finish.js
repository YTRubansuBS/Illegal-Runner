/* Illegal Runner - reliable finish flag, first-completion reward display and next-level flow */
(() => {
  'use strict'

  const $ = id => document.getElementById(id)
  let finishShown = false
  let lastCompletion = null
  let observerStarted = false
  let levelEnded = false
  let deathHideUntil = 0

  function ensureStyles() {
    if ($('irFinishStyle')) return
    const s = document.createElement('style')
    s.id = 'irFinishStyle'
    s.textContent = `
      #levelFinishCourseFlag {
        position:absolute !important;
        left:82vw;
        bottom:16vh;
        width:62px;
        height:130px;
        z-index:99999 !important;
        pointer-events:none;
        display:none;
        transform:translateX(-50%);
        filter:drop-shadow(0 0 12px rgba(0,229,255,.75));
      }
      #levelFinishCourseFlag .pole {
        position:absolute; left:28px; bottom:0; width:6px; height:116px;
        border-radius:5px; background:linear-gradient(#fff,#00e5ff 45%,#1677a0);
        box-shadow:0 0 10px rgba(0,229,255,.9);
      }
      #levelFinishCourseFlag .flag {
        position:absolute; left:33px; top:4px; width:50px; height:34px;
        border-radius:2px 8px 8px 2px;
        background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8);
        clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);
        box-shadow:0 0 14px rgba(0,229,255,.9);
        animation:irFlagWave .55s ease-in-out infinite alternate;
      }
      #levelFinishCourseFlag .flag:after {
        content:'🏁'; position:absolute; inset:0; display:grid; place-items:center; font-size:18px;
      }
      #levelFinishCourseFlag .base {
        position:absolute; left:15px; bottom:0; width:32px; height:9px;
        border-radius:50%; background:#00e5ff; box-shadow:0 0 14px rgba(0,229,255,.9);
      }
      @keyframes irFlagWave { from{transform:skewY(-2deg)} to{transform:skewY(4deg)} }
      #levelFinishReward {
        margin:10px 0 0; padding:10px 12px; border-radius:12px;
        background:rgba(0,229,255,.10); border:1px solid rgba(0,229,255,.28);
      }
      #btnNextLevel { margin-top:10px; width:100%; }
    `
    document.head.appendChild(s)
  }

  function getLevel() {
    const text = String($('objective')?.textContent || '')
    const m = text.match(/NIVEAU\s+(\d+)/i)
    return m ? Number(m[1]) : 0
  }

  function isInfinite() {
    return /\bINFINI\b/i.test(String($('objective')?.textContent || ''))
  }

  function getProgress() {
    const r = window.__IR_RUNTIME
    if (r && r.level && r.goal > 0) return Math.max(0, Math.min(1, Number(r.dist || 0) / Number(r.goal || 1)))
    const b = $('progressBar')
    if (!b) return 0
    const w = parseFloat(b.style.width)
    return Number.isFinite(w) ? Math.max(0, Math.min(1, w / 100)) : 0
  }
  function getFlag() {
    ensureStyles()
    const game = $('game')
    if (!game) return null
    let flag = $('levelFinishCourseFlag')
    if (!flag) {
      flag = document.createElement('div')
      flag.id = 'levelFinishCourseFlag'
      flag.innerHTML = '<div class="flag"></div><div class="pole"></div><div class="base"></div>'
      game.appendChild(flag)
    }
    return flag
  }

  function hideFlag() {
    const flag = $('levelFinishCourseFlag')
    if (flag) flag.style.setProperty('display', 'none', 'important')
  }

  function updateFlag() {
    const flag = getFlag()
    if (!flag) return

    const lv = getLevel()
    const over = $('over')
    const title = String($('overTitle')?.textContent || '')
    const game = $('game')
    const overVisible = !!over && getComputedStyle(over).display !== 'none'

    // Le drapeau doit être visible UNIQUEMENT pendant une vraie partie.
    // Mort ou niveau terminé = caché.
    if (!lv || isInfinite() || !game || getComputedStyle(game).display === 'none' ||
        overVisible || /TU ES MORT|TERMINÉ|CHAMPION/i.test(title)) {
      flag.style.setProperty('display', 'none', 'important')
      return
    }

    const progress = getProgress()

    // Il apparaît dans les derniers 5 % du niveau.
    if (progress < 0.95 || progress >= 1) {
      flag.style.setProperty('display', 'none', 'important')
      return
    }

    // De 95 % à 100 %, il avance vers le joueur.
    const t = Math.max(0, Math.min(1, (progress - 0.95) / 0.05))
    const startX = Math.max(180, innerWidth * 0.88)
    const playerX = Math.max(80, innerWidth * 0.20)
    const targetX = playerX + 55

    flag.style.left = (startX + (targetX - startX) * t) + 'px'
    flag.style.bottom = Math.max(88, Math.min(132, innerHeight * 0.16)) + 'px'
    flag.style.setProperty('display', 'block', 'important')
  }

  function rewardForLevel(lv) {
    return 100 * Math.ceil(lv / 10)
  }

  function showFinish() {
    const over = $('over')
    const title = String($('overTitle')?.textContent || '')
    const lv = getLevel()
    if (!over || !lv || isInfinite()) return
    if (finishShown) return

    const visible = getComputedStyle(over).display !== 'none'
    const completed = lastCompletion && Number(lastCompletion.level) === lv
    if (!completed && !visible) return
    if (!completed && getProgress() < 0.995) return

    finishShown = true
    levelEnded = true
    // Le drapeau disparaît immédiatement dès que le niveau est terminé.
    hideFlag()
    const collected = completed && Number.isFinite(Number(lastCompletion.collected)) ? Math.max(0, Math.floor(Number(lastCompletion.collected))) : 0
    const reward = completed && lastCompletion.firstCompletion ? Math.max(0, Number(lastCompletion.reward || 0)) : 0

    if ($('overTitle')) $('overTitle').textContent = lv >= 300 ? '👑 CHAMPION !' : `🏁 NIVEAU ${lv} TERMINÉ`
    if ($('finalCoins')) $('finalCoins').textContent = collected + reward
    if ($('finalTime')) $('finalTime').textContent = '—'
    over.style.display = 'grid'

    const card = document.querySelector('#over .over-card')
    if (!card) return

    let box = $('levelFinishReward')
    if (!box) {
      box = document.createElement('div')
      box.id = 'levelFinishReward'
      card.appendChild(box)
    }
    if (reward > 0) {
      box.style.display = ''
      box.innerHTML = `🎉 PREMIÈRE RÉUSSITE : <b>+${reward} 🪙</b><br>🪙 Pièces ramassées : <b>${collected}</b><br>💰 Total gagné ce niveau : <b>${collected + reward} 🪙</b>`
    } else {
      box.style.display = ''
      box.innerHTML = `🪙 Pièces ramassées : <b>${collected}</b>`
    }

    if (lv >= 300) return

    let next = $('btnNextLevel')
    if (!next) {
      next = document.createElement('button')
      next.id = 'btnNextLevel'
      next.className = 'primary'
      next.type = 'button'
      const row = card.querySelector('.row')
      if (row) row.parentNode.insertBefore(next, row)
      else card.appendChild(next)
    }
    next.textContent = `➡️ NIVEAU ${lv + 1}`
    next.disabled = false
    next.style.display = 'block'

    next.onclick = e => {
      e.preventDefault()
      e.stopPropagation()
      const target = lv + 1
      finishShown = false
      lastCompletion = null
      levelEnded = false
      hideFlag()
      over.style.display = 'none'
      const progress = $('progressBar')
      if (progress) progress.style.width = '0%'
      const button = document.querySelector(`#levelButtons button[data-level="${target}"]`)
      if (!button || button.disabled) {
        if (typeof window.toast === 'function') window.toast('🔒 Le niveau suivant n’est pas encore débloqué.')
        return
      }
      setTimeout(() => button.click(), 80)
    }
  }

  function resetAfterDeathOrMenu() {
    const over = $('over')
    if (!over) return
    const title = String($('overTitle')?.textContent || '')
    const hidden = getComputedStyle(over).display === 'none'
    if (hidden || /TU ES MORT/i.test(title)) {
      finishShown = false
      if (hidden || /TU ES MORT/i.test(title)) hideFlag()
    }
  }

  function start() {
    if (observerStarted) return
    observerStarted = true
    ensureStyles()
    getFlag()

    window.addEventListener('ir:levelCompletion', e => {
      lastCompletion = e.detail || null
      levelEnded = true
      // Fin du niveau : le drapeau ne doit plus rester affiché.
      hideFlag()
      updateFlag()
      hideFlag()
      setTimeout(showFinish, 0)
      setTimeout(showFinish, 100)
      setTimeout(showFinish, 300)
    })

    const over = $('over')
    if (over) {
      new MutationObserver(() => {
        const title = String($('overTitle')?.textContent || '')
        if (/TU ES MORT/i.test(title)) {
          finishShown = false
          levelEnded = true
          deathHideUntil = Date.now() + 3000
          hideFlag()
        }
      }).observe(over, { attributes:true, attributeFilter:['style','class'] })
    }

    setInterval(() => {
      // Si la progression revient au début, c'est un nouveau niveau/une nouvelle partie.
      if (getProgress() < 0.90 && !/TU ES MORT/i.test(String($('overTitle')?.textContent || ''))) { levelEnded = false; deathHideUntil = 0 }
      resetAfterDeathOrMenu()
      updateFlag()
      showFinish()
    }, 100)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true })
  } else {
    start()
  }
})()
