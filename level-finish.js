(() => {
  'use strict'
  let flag = null

  function createFlag() {
    if (flag && document.body.contains(flag)) return flag
    flag = document.createElement('div')
    flag.id = 'levelFinishCourseFlag'
    flag.innerHTML = '<div class="pole"></div><div class="flagShape">🏁</div><div class="base"></div>'
    const style = document.createElement('style')
    style.textContent = `
      #levelFinishCourseFlag{position:fixed!important;left:72%!important;top:45%!important;width:110px!important;height:155px!important;z-index:2147483647!important;pointer-events:none!important;display:none!important}
      #levelFinishCourseFlag .pole{position:absolute;left:38px;bottom:0;width:8px;height:145px;background:#fff;border-radius:5px;box-shadow:0 0 12px #00e5ff}
      #levelFinishCourseFlag .flagShape{position:absolute;left:46px;top:0;width:62px;height:45px;background:#00e5ff;clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 0 18px #00e5ff}
      #levelFinishCourseFlag .base{position:absolute;left:20px;bottom:0;width:45px;height:10px;border-radius:50%;background:#00e5ff;box-shadow:0 0 18px #00e5ff}
    `
    document.head.appendChild(style)
    document.body.appendChild(flag)
    return flag
  }

  function update() {
    const f = createFlag()
    const game = document.getElementById('game')
    const over = document.getElementById('over')
    const active = game && getComputedStyle(game).display !== 'none' && (!over || getComputedStyle(over).display === 'none')
    f.style.setProperty('display', active ? 'block' : 'none', 'important')
  }

  function init() {
    createFlag()
    update()
    setInterval(update, 10)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true})
  else init()
})()
