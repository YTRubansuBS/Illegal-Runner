/* Illegal Runner - finish flag, independent of cloud/local mode */
(() => {
  'use strict'

  let flag = null
  let observerStarted = false
  let lastGameState = false

  const $ = id => document.getElementById(id)

  function ensureFlag() {
    if (flag && document.body.contains(flag)) return flag

    const style = document.getElementById('irFinishFlagStyle') || document.createElement('style')
    style.id = 'irFinishFlagStyle'
    style.textContent = `
      #levelFinishCourseFlag{
        position:fixed!important;
        left:82vw!important;
        bottom:15vh!important;
        width:70px!important;
        height:145px!important;
        z-index:2147483647!important;
        pointer-events:none!important;
        display:none;
      }
      #levelFinishCourseFlag .pole{
        position:absolute;left:31px;bottom:0;width:7px;height:128px;
        border-radius:5px;background:linear-gradient(#fff,#00e5ff 45%,#1677a0);
        box-shadow:0 0 10px rgba(0,229,255,.9)
      }
      #levelFinishCourseFlag .flag{
        position:absolute;left:37px;top:4px;width:55px;height:38px;
        border-radius:2px 8px 8px 2px;background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8);
        clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);
        box-shadow:0 0 14px rgba(0,229,255,.9);
        animation:irFlagWave .55s ease-in-out infinite alternate
      }
      #levelFinishCourseFlag .flag:after{
        content:'🏁';position:absolute;inset:0;display:grid;place-items:center;font-size:20px
      }
      #levelFinishCourseFlag .base{
        position:absolute;left:15px;bottom:0;width:38px;height:10px;border-radius:50%;
        background:#00e5ff;box-shadow:0 0 14px rgba(0,229,255,.9)
      }
      @keyframes irFlagWave{from{transform:skewY(-2deg)}to{transform:skewY(4deg)}}
    `
    if (!style.parentNode) document.head.appendChild(style)

    flag = document.getElementById('levelFinishCourseFlag')
    if (!flag) {
      flag = document.createElement('div')
      flag.id = 'levelFinishCourseFlag'
      flag.innerHTML = '<div class="flag"></div><div class="pole"></div><div class="base"></div>'
      document.body.appendChild(flag)
    }
    return flag
  }

  function hideFlag() {
    const f = ensureFlag()
    f.style.display = 'none'
  }

  function isGameRunning() {
    const game = $('game')
    const over = $('over')
    if (!game) return false

    const gameVisible = getComputedStyle(game).display !== 'none' && game.getBoundingClientRect().width > 0
    const overVisible = over && getComputedStyle(over).display !== 'none'
    if (!gameVisible || overVisible) return false

    const runtime = window.__IR_RUNTIME
    if (runtime && runtime.running === false) return false

    const title = String($('overTitle')?.textContent || '')
    if (/TU ES MORT|NIVEAU\s+\d+\s+TERMINÉ|CHAMPION/i.test(title)) return false

    return true
  }

  function updateFlag() {
    const f = ensureFlag()
    const running = isGameRunning()

    if (!running) {
      f.style.display = 'none'
      lastGameState = false
      return
    }

    // IMPORTANT : le drapeau ne dépend volontairement ni de Supabase,
    // ni du mode compte/local, ni de la barre de progression.
    // Dès qu'une vraie partie est affichée, il est visible.
    f.style.left = Math.round(window.innerWidth * 0.82) + 'px'
    f.style.bottom = Math.max(90, Math.round(window.innerHeight * 0.15)) + 'px'
    f.style.display = 'block'
    lastGameState = true
  }

  function start() {
    if (observerStarted) return
    observerStarted = true
    ensureFlag()

    // Rejouer : on ne garde aucun état de la partie précédente.
    const restart = $('btnRestart')
    if (restart) restart.addEventListener('click', () => {
      hideFlag()
      setTimeout(updateFlag, 50)
      setTimeout(updateFlag, 250)
    }, true)

    // Menu / écrans de fin : updateFlag() détecte automatiquement leur état.
    const over = $('over')
    if (over) {
      new MutationObserver(() => updateFlag()).observe(over, {
        attributes:true,
        attributeFilter:['style','class']
      })
    }

    window.addEventListener('resize', updateFlag)
    setInterval(updateFlag, 10)
    updateFlag()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true})
  } else {
    start()
  }
})()
