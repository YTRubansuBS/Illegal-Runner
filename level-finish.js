/* Illegal Runner - finish screen + truly one-time level reward */
(() => {
  'use strict'

  const $ = id => document.getElementById(id)
  let finishShown = false
  let rewardBusy = false
  let transitionToken = 0

  function styles(){
    if($('irFinishStyle')) return
    const s=document.createElement('style')
    s.id='irFinishStyle'
    s.textContent=`
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

  function getLevel(){
    const m=String($('objective')?.textContent||'').match(/NIVEAU\s+(\d+)/i)
    return m?Number(m[1]):0
  }

  function isInfinite(){
    return /\bINFINI\b/i.test(String($('objective')?.textContent||''))
  }

  function getProgress(){
    const b=$('progressBar')
    if(!b)return 0
    const w=parseFloat(b.style.width)
    return Number.isFinite(w)?Math.max(0,Math.min(1,w/100)):0
  }

  function rewardForLevel(lv){ return Math.max(0,100*Math.ceil(lv/10)) }
  function rewardKey(identity){ return `illegalRunner.finishRewards.v4:${identity}` }

  async function getIdentity(){
    try{
      const cfg=window.IR_CONFIG||{}
      const sup=window.supabase
      if(sup&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
        const client=sup.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
        const {data:{user}}=await client.auth.getUser()
        if(user?.id)return {type:'account',id:'user:'+user.id,user}
      }
    }catch(e){}
    return {type:'local',id:'local',user:null}
  }

  function readPaid(identity){
    const all=new Set()
    for(const key of [rewardKey(identity.id),`illegalRunner.finishRewards.v3:${identity.id}`]){
      try{const list=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(list))list.forEach(v=>all.add(Number(v)))}catch(e){}
    }
    return all
  }
  function writePaid(identity,set){localStorage.setItem(rewardKey(identity.id),JSON.stringify([...set].sort((a,b)=>a-b)))}
  async function alreadyPaid(lv,identity){return readPaid(identity).has(Number(lv))}

  async function progressionSaysCompleted(lv,identity){
    try{
      if(identity.type==='local'){
        const p=JSON.parse(localStorage.getItem('irGuest')||'{}')
        return Number(p.highest_level||1)>Number(lv)
      }
      const cfg=window.IR_CONFIG||{},sup=window.supabase
      if(!sup||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY||!identity.user?.id)return false
      const client=sup.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
      const {data,error}=await client.from('profiles').select('highest_level').eq('id',identity.user.id).single()
      return !error&&data&&Number(data.highest_level||1)>Number(lv)
    }catch(e){return false}
  }

  async function markPaid(identity,lv){const set=readPaid(identity);set.add(Number(lv));writePaid(identity,set)}
  async function unmarkPaid(identity,lv){const set=readPaid(identity);set.delete(Number(lv));writePaid(identity,set)}

  async function grantRewardOnce(lv,reward,identity){
    if(rewardBusy||await alreadyPaid(lv,identity))return false
    rewardBusy=true
    await markPaid(identity,lv)
    try{
      if(identity.type==='local'){
        let p={};try{p=JSON.parse(localStorage.getItem('irGuest')||'{}')}catch(e){}
        p.coins=Math.max(0,Number(p.coins||0))+reward
        localStorage.setItem('irGuest',JSON.stringify(p))
        window.dispatchEvent(new CustomEvent('ir:profileChanged',{detail:{coins:p.coins}}))
        return true
      }
      const cfg=window.IR_CONFIG||{},sup=window.supabase
      if(sup&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&identity.user?.id){
        const client=sup.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
        const {data:prof,error}=await client.from('profiles').select('coins').eq('id',identity.user.id).single()
        if(!error&&prof){
          const next=Math.max(0,Number(prof.coins||0))+reward
          const upd=await client.from('profiles').update({coins:next}).eq('id',identity.user.id)
          if(!upd.error){window.dispatchEvent(new CustomEvent('ir:profileChanged',{detail:{coins:next}}));return true}
        }
      }
      await unmarkPaid(identity,lv);return false
    }catch(e){await unmarkPaid(identity,lv);return false}finally{rewardBusy=false}
  }

  function updateFlag(){
    styles();const game=$('game');if(!game)return
    let flag=$('levelFinishCourseFlag')
    if(!flag){flag=document.createElement('div');flag.id='levelFinishCourseFlag';flag.innerHTML='<div class="flag"></div><div class="pole"></div><div class="base"></div>';game.appendChild(flag)}
    const lv=getLevel(),p=getProgress(),over=$('over'),ended=over&&getComputedStyle(over).display!=='none'
    if(!lv||isInfinite()||ended||p<0.45){flag.style.display='none';return}
    const t=Math.max(0,Math.min(1,(p-0.45)/0.55)),farX=innerWidth*.92,playerX=Math.max(80,innerWidth*.20)
    flag.style.left=`${farX+(playerX-farX)*Math.pow(t,1.65)}px`;flag.style.bottom=`${Math.max(88,Math.min(132,innerHeight*.16))}px`;flag.style.display='block';flag.classList.toggle('near',t>.8)
  }

  function hideNextInInfinite(){
    document.querySelectorAll('#btnNextLevel,#nextLevel,#btnNext').forEach(b=>{b.style.display='none';b.disabled=true})
    document.querySelectorAll('button').forEach(b=>{if(/niveau\s*suivant|next\s*level/i.test(b.textContent||'')){b.style.display='none';b.disabled=true}})
  }

  async function showFinishAtFlag(){
    const over=$('over'),card=document.querySelector('#over .over-card');if(!over||!card)return
    if(isInfinite()){hideNextInInfinite();return}
    if(finishShown||getLevel()<1||getProgress()<0.995)return

    const lv=getLevel()
    const token=transitionToken
    const reward=rewardForLevel(lv)
    const identity=await getIdentity()

    // The user may have clicked "Niveau suivant" while the async checks above
    // were running. Never allow the old level's callback to reopen the screen.
    if(token!==transitionToken||getLevel()!==lv||getComputedStyle(over).display==='none')return

    const paid=await alreadyPaid(lv,identity)
    const progressed=await progressionSaysCompleted(lv,identity)
    if(token!==transitionToken||getLevel()!==lv||getComputedStyle(over).display==='none')return
    const alreadyCompleted=paid||progressed

    finishShown=true
    const dist=Math.floor(Number(String($('dist')?.textContent||'0').replace(/[^0-9.]/g,''))||0)
    const collected=Math.max(0,Math.floor(Number(String($('runCoins')?.textContent||'0').replace(/[^0-9.]/g,''))||0))
    $('overTitle').textContent=lv>=300?'👑 CHAMPION !':`NIVEAU ${lv} TERMINÉ`
    $('finalDist').textContent=dist
    $('finalCoins').textContent=collected+(alreadyCompleted?0:reward)
    $('finalTime').textContent='—'
    over.style.display='grid'

    let box=$('levelFinishReward')
    if(!box){box=document.createElement('div');box.id='levelFinishReward';card.appendChild(box)}
    if(alreadyCompleted){box.style.display='none'}else{
      box.style.display='';box.innerHTML=`🎉 Récompense de réussite : <b>+${reward} 🪙</b><br>🪙 Pièces ramassées : <b>${collected}</b>`
      const granted=await grantRewardOnce(lv,reward,identity)
      if(token!==transitionToken)return
      if(!granted){box.style.display='none';$('finalCoins').textContent=collected}
    }

    if(lv<300){
      let next=$('btnNextLevel')
      if(!next){next=document.createElement('button');next.id='btnNextLevel';next.className='primary';next.type='button';next.textContent='➡️ NIVEAU SUIVANT';const row=card.querySelector('.row');if(row)row.insertBefore(next,row.firstChild);else card.appendChild(next)}
      next.style.display='';next.disabled=false
      next.onclick=e=>{
        e.preventDefault();e.stopPropagation()
        // Invalidate every pending finish callback from the old level FIRST.
        transitionToken++
        finishShown=false;rewardBusy=false
        const nextLevel=lv+1
        const overNow=$('over');if(overNow)overNow.style.display='none'
        const flagNow=$('levelFinishCourseFlag');if(flagNow)flagNow.style.display='none'
        const progressNow=$('progressBar');if(progressNow){progressNow.style.width='0%';progressNow.setAttribute('aria-valuenow','0')}
        // Clear the old result values so the new level can never inherit them.
        if($('finalDist'))$('finalDist').textContent='0'
        if($('finalCoins'))$('finalCoins').textContent='0'
        if($('finalTime'))$('finalTime').textContent='0'
        if($('overTitle'))$('overTitle').textContent='NIVEAU '+nextLevel
        // Use the real game's level button. Do not manually declare the new
        // level finished; the real engine must start it from its own handler.
        const b=document.querySelector(`#levelButtons button[data-level="${nextLevel}"]`)
        if(b&&!b.disabled){setTimeout(()=>{if(transitionToken===transitionToken)b.click()},60)}
      }
    }
  }

  function reset(){
    const over=$('over')
    if(over&&getComputedStyle(over).display==='none'){finishShown=false;rewardBusy=false}
  }
  function start(){styles();setInterval(()=>{reset();updateFlag();showFinishAtFlag()},50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()
})()
