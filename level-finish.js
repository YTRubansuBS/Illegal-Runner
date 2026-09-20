/* Illegal Runner - reliable finish flag */
(() => {
  'use strict'
  let flag = null
  let started = false
  const $ = id => document.getElementById(id)

  function ensureFlag(){
    if(flag && document.body.contains(flag)) return flag
    let style = $('irFinishFlagStyle')
    if(!style){
      style=document.createElement('style'); style.id='irFinishFlagStyle'
      style.textContent=`
        #levelFinishCourseFlag{position:fixed!important;right:8vw!important;top:32%!important;width:90px!important;height:150px!important;z-index:2147483647!important;pointer-events:none!important;display:none!important}
        #levelFinishCourseFlag .pole{position:absolute;left:40px;bottom:0;width:8px;height:140px;background:#fff;border-radius:5px;box-shadow:0 0 12px #00e5ff}
        #levelFinishCourseFlag .flag{position:absolute;left:47px;top:3px;width:55px;height:40px;background:#00e5ff;clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);box-shadow:0 0 18px #00e5ff;animation:irFlag .5s ease-in-out infinite alternate}
        #levelFinishCourseFlag .flag:after{content:'🏁';font-size:22px;position:absolute;inset:0;display:grid;place-items:center}
        #levelFinishCourseFlag .base{position:absolute;left:23px;bottom:0;width:42px;height:11px;border-radius:50%;background:#00e5ff;box-shadow:0 0 18px #00e5ff}
        @keyframes irFlag{from{transform:skewY(-3deg)}to{transform:skewY(4deg)}}`
      document.head.appendChild(style)
    }
    flag=document.createElement('div'); flag.id='levelFinishCourseFlag'
    flag.innerHTML='<div class="flag"></div><div class="pole"></div><div class="base"></div>'
    document.body.appendChild(flag)
    return flag
  }
  function hide(){const f=ensureFlag();f.style.setProperty('display','none','important')}
  function gameActive(){
    const g=$('game'), over=$('over')
    if(!g || getComputedStyle(g).display==='none') return false
    if(over && getComputedStyle(over).display!=='none') return false
    const title=String($('overTitle')?.textContent||'')
    if(/TU ES MORT|NIVEAU\s+\d+\s+TERMINÉ|CHAMPION/i.test(title)) return false
    return true
  }
  function show(){
    const f=ensureFlag()
    if(!gameActive()){hide();return}
    f.style.setProperty('display','block','important')
  }
  function start(){
    if(started)return; started=true; ensureFlag(); hide()
    const restart=$('btnRestart')
    if(restart) restart.addEventListener('click',()=>{hide();setTimeout(show,100);setTimeout(show,400)},true)
    const menu=$('btnOverMenu')
    if(menu) menu.addEventListener('click',hide,true)
    const quit=$('btnQuit')
    if(quit) quit.addEventListener('click',hide,true)
    setInterval(show,10)
    show()
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true})
  else start()
})()
