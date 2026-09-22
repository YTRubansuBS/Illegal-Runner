(() => {
'use strict'
const cfg=window.IR_CONFIG||{}
const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
const S={
  user:null,requestId:null,sessionId:null,requestExpires:0,session:null,
  timer:null,pollTimer:null,syncTimer:null,nameMap:{},closed:false,
  opponentId:null,opponentCharacter:'runner',ghostFrom:0,ghostTo:0,ghostStart:0,ghostDuration:450,ghostInitialized:false
}
const layer=document.createElement('div');layer.id='irDuelLayer';document.body.appendChild(layer)
const style=document.createElement('style')
style.textContent='#irDuelLayer{position:fixed;inset:0;z-index:2147483590;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(2,5,12,.9);backdrop-filter:blur(10px);font-family:Inter,system-ui,sans-serif}#irDuelLayer .dm{width:min(820px,96vw);max-height:94vh;overflow:auto;background:linear-gradient(145deg,#07101d,#030710);color:#f6fbff;border:1px solid rgba(0,229,255,.42);border-radius:22px;box-shadow:0 0 60px rgba(0,229,255,.14)}#irDuelLayer .dh{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08)}#irDuelLayer h2,#irDuelLayer h3{margin:0}#irDuelLayer .db{padding:18px}.duelCount{font-size:44px;font-weight:900;text-align:center;margin:10px 0;color:#00e5ff}.duelTimer{font-size:30px;font-weight:900;text-align:center;color:#ffd45c;margin:10px 0}.duelGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.duelCard{padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.025)}#irDuelLayer .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#irDuelLayer button{border:1px solid #274765;background:#0d1929;color:#fff;border-radius:9px;padding:10px 13px;font-weight:900;cursor:pointer}#irDuelLayer button.primary{background:linear-gradient(90deg,#00a7cf,#d72583);border:0}#irDuelLayer button.danger{color:#ff9bb0;border-color:#633244;background:#1a0d15}.duelInfo{color:#93a0b6;font-size:13px}.duelVote{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.duelBetGrid{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.duelBetBtn{min-width:58px}.duelBetBtn.selected{background:linear-gradient(90deg,#007e9e,#81245b);border-color:#00e5ff}.duelResult{font-size:28px;font-weight:900;text-align:center;margin:18px 0}.duelHud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483500;display:none;padding:9px 14px;border:1px solid rgba(0,229,255,.4);border-radius:13px;background:rgba(2,5,12,.86);color:#fff;font:900 14px Inter,sans-serif;box-shadow:0 0 18px rgba(0,229,255,.15);text-align:center}.duelHud .muted{opacity:.72}.duelHud button{margin-left:8px;border:1px solid #633244;background:#1a0d15;color:#ff9bb0;border-radius:7px;padding:5px 8px;font-weight:900}@media(max-width:700px){.duelGrid{grid-template-columns:1fr}.duelVote{grid-template-columns:1fr}.duelCount{font-size:36px}}'
document.head.appendChild(style)
const hud=document.createElement('div');hud.className='duelHud';hud.id='irDuelHud';document.body.appendChild(hud)

function esc(v){return String(v??'').replace(/[&<>"']/g,function(x){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[x]})}
function show(html){layer.innerHTML=html;layer.style.display='flex'}
function hide(){layer.style.display='none';clearTimers()}
function clearTimers(){if(S.timer){clearInterval(S.timer);S.timer=null}}
function toast(t){if(typeof window.toast==='function')window.toast(t);else alert(t)}
async function rpc(name,args){const r=await sb.rpc(name,args||{});if(r.error)throw r.error;return r.data}
function meA(s){return s&&s.user_a===S.user.id}
function myField(s,a,b){return meA(s)?s[a]:s[b]}
function otherId(s){return s?(meA(s)?s.user_b:s.user_a):null}
function otherName(s){return esc((S.nameMap[otherId(s)]||'ton adversaire'))}
function otherCharacter(s){return (meA(s)?s.character_b:s.character_a)||S.opponentCharacter||'runner'}
function ghostNow(){if(!S.ghostInitialized)return 0;const p=Math.max(0,Math.min(1,(performance.now()-S.ghostStart)/S.ghostDuration));return S.ghostFrom+(S.ghostTo-S.ghostFrom)*p}
function syncGhost(s){const target=Number(meA(s)?s.distance_b:s.distance_a);if(!Number.isFinite(target))return;const now=performance.now();if(!S.ghostInitialized){S.ghostFrom=target;S.ghostTo=target;S.ghostStart=now;S.ghostDuration=0;S.ghostInitialized=true;return}const cur=ghostNow();if(Math.abs(target-S.ghostTo)>=1){S.ghostFrom=cur;S.ghostTo=target;S.ghostStart=now;S.ghostDuration=450}}
function remaining(until){if(!until)return 0;return Math.max(0,(new Date(until).getTime()-Date.now())/1000)}
function goMenu(){hud.style.display='none';window.dispatchEvent(new CustomEvent('ir:duelExitToMenu'))}
function stopGame(){const G=window.__IR_G;if(G){G.running=false;cancelAnimationFrame(G.raf)}}

async function refreshUser(){
  if(!sb)return
  const q=await sb.auth.getSession()
  S.user=q.data?.session?.user||null
}
async function getRequests(){
  try{
    const data=await rpc('duel_poll_requests')
    const rows=Array.isArray(data)?data:[]
    rows.forEach(function(r){
      if(r.sender_id&&r.sender_username)S.nameMap[r.sender_id]=r.sender_username
      if(r.receiver_id&&r.receiver_username)S.nameMap[r.receiver_id]=r.receiver_username
    })
    return rows
  }catch(_){
    if(!S.user) return []
    const q=await sb.from('duel_requests').select('id,sender_id,receiver_id,status,created_at,expires_at').or('sender_id.eq.'+S.user.id+',receiver_id.eq.'+S.user.id).order('created_at',{ascending:false}).limit(20)
    return q.error?[]:(q.data||[])
  }
}
async function getSession(){
  if(!S.sessionId)return null
  try{
    const G=window.__IR_G
    const distance=Math.max(0,Math.floor(Number(G?.dist||0)))
    const lives=Math.max(0,Math.floor(Number(G?.lives||0)))
    const player=G?.player
    const action=G?.dashT>0?'dash':(player&&!player.ground?'jump':'run')
    const y=Number(player?.y)
    const data=await rpc('duel_tick',{p_session_id:S.sessionId,p_distance:distance,p_lives:lives,p_y:Number.isFinite(y)?y:null,p_action:action})
    S.session=data||null
    return S.session
  }catch(e){
    const q=await sb.from('duel_sessions').select('*').eq('id',S.sessionId).maybeSingle()
    if(!q.error&&q.data){S.session=q.data;return q.data}
    return S.session
  }
}
function requestGui(r){
  S.requestId=r.id
  S.requestExpires=r.expires_at?new Date(r.expires_at).getTime():Date.now()+30000
  const incoming=r.receiver_id===S.user.id
  const who=esc(incoming?(r.sender_username||'Ton ami'):(r.receiver_username||'Ton ami'))
  if(incoming){
    show('<div class="dm"><div class="dh"><h2>⚔️ Demande de 1V1</h2><button id="dx">✕</button></div><div class="db"><h3>👤 '+who+' veut faire un 1V1 avec toi.</h3><div class="duelTimer" id="rt"></div><p class="duelInfo">Tu as 30 secondes pour accepter.</p><div class="actions"><button class="primary" id="da">✅ ACCEPTER</button><button class="danger" id="dr">❌ REFUSER</button></div></div></div>')
    document.getElementById('da').onclick=function(){respondRequest(true)}
    document.getElementById('dr').onclick=function(){respondRequest(false)}
    document.getElementById('dx').onclick=function(){respondRequest(false)}
  }else{
    show('<div class="dm"><div class="dh"><h2>⚔️ 1V1 contre '+who+'</h2><button id="dx">✕</button></div><div class="db"><div class="duelCount">1 / 2</div><h3 style="text-align:center">⏳ En attente de '+who+'</h3><div class="duelTimer" id="rt"></div><p class="duelInfo" style="text-align:center">La demande a été envoyée.</p><div class="actions"><button class="danger" id="dc">❌ ANNULER</button></div></div></div>')
    document.getElementById('dc').onclick=function(){cancelRequest()}
    document.getElementById('dx').onclick=function(){cancelRequest()}
  }
  startRequestTimer()
}
function startRequestTimer(){
  clearTimers()
  S.timer=setInterval(async function(){
    const e=document.getElementById('rt');const left=Math.ceil(Math.max(0,(S.requestExpires-Date.now())/1000));if(e)e.textContent=left+' s'
    if(left<=0){clearTimers();await cancelRequest(true)}
  },200)
}
async function cancelRequest(silent){
  try{if(S.requestId)await rpc('duel_cancel_request',{p_request_id:S.requestId})}catch(_){}
  if(!silent)toast('❌ Demande 1V1 annulée.')
  S.requestId=null;hide()
}
async function respondRequest(ok){
  const requestId=S.requestId
  const acceptBtn=document.getElementById('da')
  const rejectBtn=document.getElementById('dr')
  const closeBtn=document.getElementById('dx')
  if(acceptBtn)acceptBtn.disabled=true
  if(rejectBtn)rejectBtn.disabled=true
  if(closeBtn)closeBtn.disabled=true
  try{
    const sid=await rpc('duel_respond_request',{p_request_id:requestId,p_accept:ok})
    if(!ok){S.requestId=null;hide();return}
    let resolvedSid=sid
    if(!resolvedSid){
      const q=await sb.from('duel_sessions').select('id').eq('request_id',requestId).maybeSingle()
      resolvedSid=q.data?.id||null
    }
    if(!resolvedSid)throw new Error('La session 1V1 n’a pas pu être créée. Réessaie.')
    S.sessionId=resolvedSid
    const data=await getSession()
    S.requestId=null
    sessionGui(data)
  }catch(e){
    if(acceptBtn)acceptBtn.disabled=false
    if(rejectBtn)rejectBtn.disabled=false
    if(closeBtn)closeBtn.disabled=false
    alert('❌ '+(e.message||'Demande impossible'))
  }
}
function sessionGui(s){
  if(!s)return
  const who=otherName(s), count=(s.user_a&&s.user_b)?2:1, mineA=meA(s)
  if(s.status==='cancelled'){
    show('<div class="dm"><div class="dh"><h2>⚔️ 1V1 terminé</h2></div><div class="db"><div class="duelResult">❌ Le 1V1 est fermé.</div><p class="duelInfo" style="text-align:center">'+esc(s.result_reason||'')+'</p><div class="actions"><button class="primary" id="back">RETOUR</button></div></div></div>')
    document.getElementById('back').onclick=function(){S.sessionId=null;hide();goMenu()}
    return
  }
  if(s.status==='lobby'){
    const my=meA(s)?s.choice_a:s.choice_b, other=meA(s)?s.choice_b:s.choice_a
    show('<div class="dm"><div class="dh"><h2>⚔️ 1V1 contre '+who+'</h2><button id="qx">✕</button></div><div class="db"><div class="duelCount">2 / 2</div><div class="duelTimer" id="rt"></div><div class="duelGrid"><div class="duelCard"><h3>👤 '+esc('Moi')+'</h3><p class="duelInfo">'+(my==='ready'?'✅ PRÊT':my==='bet'?'💰 PARIER':'⏳ Pas encore choisi')+'</p></div><div class="duelCard"><h3>👤 '+who+'</h3><p class="duelInfo">'+(other==='ready'?'✅ PRÊT':other==='bet'?'💰 PARIER':'⏳ Pas encore choisi')+'</p></div></div><div class="actions"><button class="primary" id="ready">✅ PRÊT</button><button id="bet">💰 PARIER</button><button class="danger" id="leave">❌ SORTIR</button></div></div></div>')
    document.getElementById('ready').onclick=function(){setChoice('ready')}
    document.getElementById('bet').onclick=function(){setChoice('bet')}
    document.getElementById('leave').onclick=function(){leaveDuel()}
    document.getElementById('qx').onclick=function(){leaveDuel()}
    startPhaseTimer(s.phase_deadline,'rt',function(){})
    return
  }
  if(s.status==='bet_amount'){
    const current=meA(s)?s.bet_a:s.bet_b
    const balance=Math.max(0,Number(window.__IR_PROFILE_COINS||document.getElementById('coins')?.textContent?.replace(/\D/g,'')||0))
    const vals=[1,5,10,25,50,100,250,500,1000,2500,5000].filter(function(v){return v<=balance})
    if(balance>0&&!vals.includes(balance))vals.push(balance)
    show('<div class="dm"><div class="dh"><h2>💰 Choisis ta mise</h2><button id="qx">✕</button></div><div class="db"><div class="duelTimer" id="rt"></div><p class="duelInfo">Les deux joueurs doivent mettre <b>exactement la même somme</b>.</p><div class="duelBetGrid">'+vals.map(function(v){return '<button class="duelBetBtn '+(Number(current||0)===v?'selected':'')+'" data-bet="'+v+'">'+v.toLocaleString('fr-FR')+' 🪙</button>'}).join('')+'</div><div class="duelCard" style="margin-top:12px"><b>Ta mise : '+Number(current||0).toLocaleString('fr-FR')+' 🪙</b><br><span class="duelInfo">Mise adverse : '+Number(meA(s)?s.bet_b:s.bet_a).toLocaleString('fr-FR')+' 🪙</span></div><div class="actions"><button class="danger" id="leave">❌ SORTIR</button></div></div></div>')
    document.querySelectorAll('[data-bet]').forEach(function(b){b.onclick=function(){setBet(Number(b.dataset.bet))}})
    document.getElementById('leave').onclick=function(){leaveDuel()}
    document.getElementById('qx').onclick=function(){leaveDuel()}
    startPhaseTimer(s.phase_deadline,'rt',function(){})
    return
  }
  if(s.status==='final_vote'){
    const mine=meA(s)?s.final_vote_a:s.final_vote_b, other=meA(s)?s.final_vote_b:s.final_vote_a
    const amount=Number(s.bet_a||0)
    show('<div class="dm"><div class="dh"><h2>⚔️ Décision finale</h2><button id="qx">✕</button></div><div class="db"><div class="duelTimer" id="rt"></div><div class="duelCount">'+amount.toLocaleString('fr-FR')+' 🪙 / joueur</div><p class="duelInfo" style="text-align:center">Le choix final doit être le même chez les deux.</p><div class="duelVote"><button class="primary" id="vbet">💰 PARIER</button><button id="vnobet">▶ SANS PARIER</button><button class="danger" id="vexit">❌ SORTIR</button></div><div class="duelGrid" style="margin-top:12px"><div class="duelCard"><b>Toi</b><div class="duelInfo">'+(mine?esc(mine):'⏳')+'</div></div><div class="duelCard"><b>'+who+'</b><div class="duelInfo">'+(other?esc(other):'⏳')+'</div></div></div></div></div>')
    document.getElementById('vbet').onclick=function(){setFinalVote('bet')}
    document.getElementById('vnobet').onclick=function(){setFinalVote('nobet')}
    document.getElementById('vexit').onclick=function(){setFinalVote('exit')}
    document.getElementById('qx').onclick=function(){setFinalVote('exit')}
    startPhaseTimer(s.phase_deadline,'rt',function(){})
    return
  }
  if(s.status==='randomizing'){
    show('<div class="dm"><div class="dh"><h2>🎲 Vote différent</h2></div><div class="db"><div class="duelTimer" id="rt"></div><div class="duelResult">🎲 Tirage au sort…</div><p class="duelInfo" style="text-align:center">Les choix sont différents. Le résultat sera choisi au hasard.</p></div></div>')
    startPhaseTimer(s.phase_deadline,'rt',function(){})
    return
  }
  if(s.status==='countdown'){
    show('<div class="dm"><div class="dh"><h2>⚔️ 1V1</h2></div><div class="db"><div class="duelTimer" id="rt"></div><div class="duelResult">'+(s.bet_mode?'💰 Partie avec pari':'▶ Partie sans pari')+'</div></div></div>')
    startPhaseTimer(s.phase_deadline,'rt',function(){})
    return
  }
  if(s.status==='playing'){
    layer.style.display='none'
    hud.style.display='block'
    updateHud(s)
    if(!window.IR_DUEL_ACTIVE){
      window.IR_DUEL_ACTIVE=true
      window.IR_DUEL_CONFIG={active:true,lives:Math.max(1,Number(meA(s)?s.lives_a:s.lives_b)||1)}
      document.getElementById('btnPause').style.display='none'
      window.dispatchEvent(new CustomEvent('ir:duelStartGame'))
    }
    return
  }
  if(s.status==='completed'){
    stopGame();hud.style.display='none'
    const win=s.winner_id===S.user.id
    const winnerName=esc(s.winner_id===S.user.id?(S.nameMap[S.user.id]||S.user.user_metadata?.username||'Moi'):(S.nameMap[s.winner_id]||'Ton adversaire'))
    const prize=((s.payout||0)>0?Number(s.payout).toLocaleString('fr-FR')+' 🪙 gagnées':'Aucune mise')
    show('<div class="dm"><div class="dh"><h2>⚔️ FIN DU 1V1</h2></div><div class="db"><div class="duelResult">🏆 '+winnerName+' a gagné !</div><p style="text-align:center;font-size:20px"><b>'+prize+'</b></p><p class="duelInfo" style="text-align:center">'+(s.result_reason==='forfeit'?'L’adversaire a quitté le 1V1 et a donné une récompense ×2.':s.result_reason==='disconnect'?'L’adversaire a quitté la partie et a donné une récompense ×2.':'La partie est terminée.')+'</p><div class="actions"><button class="primary" id="done">RETOUR AU MENU</button></div></div></div>')
    document.getElementById('done').onclick=function(){S.sessionId=null;S.session=null;layer.style.display='none';window.IR_DUEL_ACTIVE=false;window.IR_DUEL_CONFIG=null;goMenu()}
    return
  }
}
function startPhaseTimer(until,id,callback){
  clearTimers()
  if(!until)return
  S.timer=setInterval(function(){
    const sec=Math.max(0,remaining(until));const el=id?document.getElementById(id):null
    if(el)el.textContent=sec.toFixed(1)+' s'
    if(sec<=0){clearTimers();if(callback)callback()}
  },100)
}
function updateHud(s){
  if(!s)return
  const a=meA(s);const myLives=a?s.lives_a:s.lives_b;const opLives=a?s.lives_b:s.lives_a
  const who=otherName(s)
  const myDist=Math.max(0,Math.floor(Number(a?s.distance_a:s.distance_b)||0)); const opDist=Math.max(0,Math.floor(Number(a?s.distance_b:s.distance_a)||0))
  hud.innerHTML='<div>⚔️ '+who+' · ❤️ '+myLives+' / '+opLives+'<div class="muted" style="margin-top:3px;font-size:11px">'+myDist+' m · adversaire '+opDist+' m</div></div>'+(s.bet_mode?' · 💰 '+Number(s.bet_a+s.bet_b).toLocaleString('fr-FR'):'')+' <button id="dq">✕ QUITTER</button>'
  document.getElementById('dq').onclick=function(){leaveDuel()}
}
async function setChoice(c){try{if(c==='bet'){const q=await sb.from('profiles').select('coins').eq('id',S.user.id).maybeSingle();const balance=Number(q.data?.coins||0);window.__IR_PROFILE_COINS=balance;if(balance<1)throw new Error('Il te faut au moins 1 🪙 pour choisir le pari.')}await rpc('duel_set_choice',{p_session_id:S.sessionId,p_choice:c});await pollSession(true)}catch(e){alert('❌ '+(e.message||'Impossible'))}}
async function setBet(v){try{if(!Number.isFinite(v)||v<1)throw new Error('La mise minimale est de 1 🪙.');await rpc('duel_set_bet',{p_session_id:S.sessionId,p_amount:v});await pollSession(true)}catch(e){alert('❌ '+(e.message||'Mise impossible'))}}
async function setFinalVote(v){try{await rpc('duel_set_final_vote',{p_session_id:S.sessionId,p_vote:v});await pollSession(true)}catch(e){alert('❌ '+(e.message||'Vote impossible'))}}
async function leaveDuel(){try{if(S.sessionId)await rpc('duel_leave',{p_session_id:S.sessionId})}catch(_){}stopGame();window.IR_DUEL_ACTIVE=false;window.IR_DUEL_CONFIG=null;hud.style.display='none';S.sessionId=null;S.session=null;S.opponentId=null;S.opponentCharacter='runner';S.ghostInitialized=false;window.__IR_DUEL_GHOST=null;hide();goMenu()}
async function startRequest(friendId){try{const id=await rpc('duel_create_request',{p_friend_id:friendId});S.requestId=id;const rows=await getRequests();const r=rows.find(function(x){return x.id===id});requestGui(r||{id:id,sender_id:S.user.id,receiver_id:friendId,status:'pending',expires_at:new Date(Date.now()+30000).toISOString()})}catch(e){alert('❌ '+(e.message||'Demande 1V1 impossible'))}}
async function pollSession(force){
  if(!S.sessionId)return null
  const previous=S.session
  const s=await getSession()
  if(s){
    const oid=otherId(s)
    if(oid&&S.opponentId!==oid){S.opponentId=oid}
    S.opponentCharacter=otherCharacter(s)
    if(s.status==='playing'||s.status==='completed')syncGhost(s)
    if(s.status==='bet_amount'){
      const q=await sb.from('profiles').select('coins').eq('id',S.user.id).maybeSingle()
      window.__IR_PROFILE_COINS=Number(q.data?.coins||0)
    }
    if(previous&&s.status==='lobby'){
      const otherReadyBefore=meA(previous)?previous.choice_b:previous.choice_a
      const otherReadyNow=meA(s)?s.choice_b:s.choice_a
      if(otherReadyBefore!=='ready'&&otherReadyNow==='ready')toast('✅ '+otherName(s)+' est prêt !')
    }
    if(previous&&previous.status==='randomizing'&&s.status!=='randomizing'){
      if(s.status==='bet_amount') toast('🎲 Vote : PARIER')
      else if(s.status==='countdown'&&s.bet_mode) toast('🎲 Vote : PARIER')
      else if(s.status==='countdown'&&!s.bet_mode) toast('🎲 Vote : SANS PARIER')
    }
    sessionGui(s)
    if(s.status==='playing'||s.status==='completed')window.__IR_DUEL_GHOST=s
  }
  return s
}

async function mainPoll(){
  await refreshUser();if(!S.user)return
  const rows=await getRequests().catch(function(){return[]})
  const incoming=rows.find(function(r){return r.status==='pending'&&r.receiver_id===S.user.id})
  if(incoming&&!S.sessionId&&!layer.matches(':visible'))requestGui(incoming)
  if(S.requestId&&!S.sessionId){
    const r=rows.find(function(x){return x.id===S.requestId})
    if(r&&r.status==='accepted'){
      let sid=r.session_id
      if(!sid){
        const q=await sb.from('duel_sessions').select('id').eq('request_id',S.requestId).maybeSingle()
        sid=q.data&&q.data.id?q.data.id:null
      }
      if(sid){S.sessionId=sid;S.requestId=null;await pollSession(true)}
    }else if(r&&['declined','cancelled'].includes(r.status)){S.requestId=null;hide()}
  }
  if(S.sessionId)await pollSession(false)
}

function decorateFriends(){
  document.querySelectorAll('#friendList .friend[data-trade-friend-id]').forEach(function(el){
    const id=el.dataset.tradeFriendId;if(!id)return
    const sp=el.querySelector('span');const nm=(sp?.innerText||'').split('\n')[0].replace(/^👤\s*/,'').trim();if(nm)S.nameMap[id]=nm
    if(!el.querySelector('[data-duel-open]')){const b=document.createElement('button');b.type='button';b.dataset.duelOpen=id;b.textContent='⚔️ 1V1';el.appendChild(b)}
  })
}
window.IR_DUEL_GHOST_DRAW=function(ctx,W,H,w,G){
  if(!window.IR_DUEL_ACTIVE||!window.__IR_DUEL_GHOST||!G||!G.player)return
  const s=window.__IR_DUEL_GHOST
  const mine=Number(meA(s)?s.distance_a:s.distance_b)||0
  const opp=ghostNow()
  const rel=opp-mine
  const x=Math.max(45,Math.min(W-95,G.player.x+118+rel*.36))
  const y=G.groundY-62
  const skin=S.opponentCharacter||otherCharacter(s)||'runner'
  const opAction=meA(s)?s.action_b:s.action_a
  const rawY=Number(meA(s)?s.y_b:s.y_a)
  const localBase=G.groundY-62
  const remoteDelta=Number.isFinite(rawY)?(rawY-localBase):0
  const remoteY=localBase+remoteDelta
  const fake={x:x-21,y:remoteY,w:42,h:62,run:performance.now()/100,ground:opAction!=='jump',sy:1,inv:0}
  const ghostG={dashT:opAction==='dash'?.55:0,shield:false,level:G.level||1,dist:opp,goal:G.goal||1}
  ctx.save()
  ctx.globalAlpha=.92
  ctx.shadowBlur=18
  ctx.shadowColor='#ff37c7'
  try{
    if(window.IR_CHARACTER_DRAW_SKIN){
      window.IR_CHARACTER_DRAW_SKIN(ctx,42,fake,ghostG,skin)
    }else{
      ctx.fillStyle='#dbeafe';ctx.fillRect(x-14,y+30,28,30)
      ctx.beginPath();ctx.arc(x,y+15,15,0,Math.PI*2);ctx.fill()
    }
  }catch(_){
    ctx.fillStyle='#dbeafe';ctx.fillRect(x-14,y+30,28,30)
  }
  ctx.globalAlpha=.98
  ctx.fillStyle='#fff'
  ctx.font='900 12px Inter,sans-serif'
  ctx.textAlign='center'
  ctx.shadowBlur=8
  ctx.fillText(S.nameMap[otherId(s)]||'ADVERSAIRE',x,y-12)
  ctx.font='800 10px Inter,sans-serif'
  ctx.fillStyle=opAction==='dash'?'#ffd166':opAction==='jump'?'#7affd7':'#8fe9ff'
  ctx.fillText((opAction==='dash'?'⚡ DASH':opAction==='jump'?'⬆️ SAUT':'🏃 RUN')+' · '+Math.max(0,Math.floor(opp))+' m',x,y-1)
  ctx.restore()
}
document.addEventListener('click',function(e){
  const b=e.target.closest('[data-duel-open]');if(!b)return
  e.preventDefault();e.stopPropagation();startRequest(b.dataset.duelOpen)
},true)
const obs=new MutationObserver(decorateFriends)
async function init(){const box=document.getElementById('friendList');if(box)obs.observe(box,{childList:true,subtree:true});decorateFriends();await refreshUser();if(S.pollTimer)clearInterval(S.pollTimer);S.pollTimer=setInterval(mainPoll,200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();