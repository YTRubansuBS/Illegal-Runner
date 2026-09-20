/* Illegal Runner - finish flag */
(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  let finishShown = false
  let started = false

  function styles(){
    if($('irFinishStyle')) return
    const s=document.createElement('style');s.id='irFinishStyle'
    s.textContent=`#levelFinishCourseFlag{position:fixed!important;left:82vw;bottom:16vh;width:62px;height:130px;z-index:2147483647!important;pointer-events:none;display:none;transform:translateX(-50%)}#levelFinishCourseFlag .pole{position:absolute;left:28px;bottom:0;width:6px;height:116px;border-radius:5px;background:linear-gradient(#fff,#00e5ff 45%,#1677a0);box-shadow:0 0 10px rgba(0,229,255,.9)}#levelFinishCourseFlag .flag{position:absolute;left:33px;top:4px;width:50px;height:34px;border-radius:2px 8px 8px 2px;background:linear-gradient(135deg,#00e5ff,#7df8ff 48%,#008bb8);clip-path:polygon(0 0,100% 0,78% 50%,100% 100%,0 100%);box-shadow:0 0 14px rgba(0,229,255,.9);animation:irFlagWave .55s ease-in-out infinite alternate}#levelFinishCourseFlag .flag:after{content:'🏁';position:absolute;inset:0;display:grid;place-items:center;font-size:18px}#levelFinishCourseFlag .base{position:absolute;left:15px;bottom:0;width:32px;height:9px;border-radius:50%;background:#00e5ff;box-shadow:0 0 14px rgba(0,229,255,.9)}@keyframes irFlagWave{from{transform:skewY(-2deg)}to{transform:skewY(4deg)}}`
    document.head.appendChild(s)
  }
  function level(){const m=String($('objective')?.textContent||'').match(/NIVEAU\s+(\d+)/i);return m?Number(m[1]):0}
  function getFlag(){styles();let f=$('levelFinishCourseFlag');if(!f){f=document.createElement('div');f.id='levelFinishCourseFlag';f.innerHTML='<div class="flag"></div><div class="pole"></div><div class="base"></div>';document.body.appendChild(f)}return f}
  function hide(){const f=$('levelFinishCourseFlag');if(f)f.style.display='none'}
  function update(){
    const f=getFlag(),lv=level(),game=$('game'),over=$('over')
    const gameOn=!!game&&getComputedStyle(game).display!=='none'
    const overOff=!over||getComputedStyle(over).display==='none'
    const title=String($('overTitle')?.textContent||'')
    if(!lv||!gameOn||!overOff||/TU ES MORT|NIVEAU\s+\d+\s+TERMINÉ|CHAMPION/i.test(title)){hide();return}
    const d=Number(String($('dist')?.textContent||'').replace(/[^0-9.-]/g,''))
    const goal=400+lv*20
    const p=Number.isFinite(d)?Math.max(0,Math.min(1,d/goal)):0
    const t=Math.max(0,Math.min(1,(p-.60)/.40))
    const startX=Math.max(180,innerWidth*.88),targetX=Math.max(80,innerWidth*.20)+55
    f.style.left=(startX+(targetX-startX)*t)+'px'
    f.style.bottom=Math.max(88,Math.min(132,innerHeight*.16))+'px'
    f.style.display='block'
  }
  function start(){
    if(started)return;started=true;styles();getFlag()
    const restart=$('btnRestart');if(restart)restart.addEventListener('click',()=>{finishShown=false;hide();setTimeout(update,200)},true)
    const over=$('over');if(over)new MutationObserver(()=>{const t=String($('overTitle')?.textContent||'');if(/TU ES MORT|NIVEAU\s+\d+\s+TERMINÉ|CHAMPION/i.test(t)){finishShown=false;hide()}}).observe(over,{attributes:true,attributeFilter:['style','class']})
    setInterval(update,10)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()
})()
