(() => {
  'use strict'

  /* ILLEGAL RUNNER — finish marker/UI only. It never replaces the game engine. */
  const $ = (id) => document.getElementById(id)
  let finishShown = false

  function styles() {
    if ($('irFinishStyle')) return
    const s = document.createElement('style')
    s.id = 'irFinishStyle'
    s.textContent = `
      #levelFinishCourseFlag{position:absolute;left:92vw;bottom:96px;width:54px;height:122px;z-index:6;pointer-events:none;display:none;transform:translateX(-50%);filter:drop-shadow(0 0 10px rgba(0,229,255,.65));transition:left .08s linear}
      #levelFinishCourseFlag .pole{position:absolute;left:25px;bottom:0;width:5px;height:110px;border-radius:4px;background:linear-gradient(#fff,#00e5ff 45%,#1677a0);box-shadow:0 0 9px rgba(0,229,255,.8)}
      #levelFinishCourseFlag .flag{position:absolute;left:29px;top:4px;width:48px;height:31px;border-radius:2px 8px 8px 2px;background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8);clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);box-shadow:0 0 12px rgba(0,229,255,.8)}
      #levelFinishCourseFlag .flag:after{content:'🏁';position:absolute;inset:0;display:grid;place-items:center;font-size:17px}
      #levelFinishCourseFlag .base{position:absolute;left:13px;bottom:0;width:29px;height:8px;border-radius:50%;background:#00e5ff;box-shadow:0 0 12px rgba(0,229,255,.9)}
      #levelFinishCourseFlag.near .flag{animation:irFinishWave .45s ease-in-out infinite alternate}
      @keyframes irFinishWave{from{transform:skewY(-2deg)}to{transform:skewY(4deg)}}
      #levelFinishReward{margin:10px 0 0;padding:9px 12px;border-radius:12px;background:rgba(0,229,255,.10);border:1px solid rgba(0,229,255,.25)}
      #btnNextLevel{margin-top:10px}
    `
    document.head.appendChild(s)
  }

  function getLevel() {
    const text = String($('objective')?.textContent || '')
    const m = text.match(/NIVEAU\s+(\d+)/i)
    return m ? Number(m[1]) : 0
  }

  function getProgress() {
    const bar = $('progressBar')
    if (!bar) return 0
    const w = parseFloat(bar.style.width)
    return Number.isFinite(w) ? Math.max(0, Math.min(1, w / 100)) : 0
  }

  function updateFlag() {
    styles()
    const game = $('game')
    if (!game) return
    let flag = $('levelFinishCourseFlag')
    if (!flag) {
      flag = document.createElement('div')
      flag.id = 'levelFinishCourseFlag'
      flag.innerHTML = '<div class="flag"></div><div class="pole"></div><div class="base"></div>'
      game.appendChild(flag)
    }

    const lv = getLevel()
    const p = getProgress()
    const over = $('over')
    const ended = over && getComputedStyle(over).display !== 'none'
    if (!lv || ended || p >= 1 || p < 0.45) {
      flag.style.display = 'none'
      return
    }

    const t = Math.max(0, Math.min(1, (p - 0.45) / 0.55))
    const farX = window.innerWidth * 0.92
    const playerX = Math.max(80, window.innerWidth * 0.20)
    flag.style.left = `${farX + (playerX - farX) * Math.pow(t, 1.65)}px`
    flag.style.bottom = `${Math.max(88, Math.min(132, window.innerHeight * 0.16))}px`
    flag.style.display = 'block'
    flag.classList.toggle('near', t > 0.8)
  }

  function showFinishAtFlag() {
    if (finishShown) return
    const lv = getLevel()
    if (!lv || getProgress() < 0.995) return

    const over = $('over')
    const card = document.querySelector('#over .over-card')
    if (!over || !card) return

    finishShown = true

    const dist = Math.floor(Number(String($('dist')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0)
    const collected = Math.max(0, Math.floor(Number(String($('runCoins')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0))

    $('overTitle').textContent = lv >= 300 ? '👑 CHAMPION !' : `NIVEAU ${lv} TERMINÉ`
    $('finalDist').textContent = dist
    $('finalCoins').textContent = collected + 100
    $('finalTime').textContent = '—'
    over.style.display = 'grid'

    let reward = $('levelFinishReward')
    if (!reward) {
      reward = document.createElement('div')
      reward.id = 'levelFinishReward'
      card.appendChild(reward)
    }
    reward.innerHTML = `🎉 Récompense de fin : <b>100 🪙</b><br>🪙 Pièces ramassées : <b>${collected}</b>`

    if (lv < 300) {
      let next = $('btnNextLevel')
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
      next.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const b = document.querySelector(`#levelButtons button[data-level="${lv + 1}"]`)
        if (b && !b.disabled) b.click()
      }
    }
  }

  function reset() {
    const over = $('over')
    if (over && getComputedStyle(over).display === 'none') finishShown = false
  }

  function start() {
    styles()
    setInterval(() => {
      reset()
      updateFlag()
      showFinishAtFlag()
    }, 50)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true })
  else start()
})()
