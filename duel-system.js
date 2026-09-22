(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
  const S={user:null,requestId:null,sessionId:null,session:null,nameMap:{},timer:null,poll:null,sync:null,shown:null,ghost:0,ghostTarget:0,ghostFrom:0,ghostStart:0,opponentAction:'run',opponentY:0,opponentCharacter:'runner'}
  const layer=document.createElement('div');layer.id='irDuelLayer';document.body.appendChild(layer)
  const hud=document.createElement('div');hud.id='irDuelHud';hud.className='duelHud';document.body.appendChild(hud)
  const style=document.createElement('style');style.textContent=`#irDuelLayer{position:fixed;inset:0;z-index:2147483590;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(2,5,12,.9);backdrop-filter:blur(10px);font-family:Inter,system-ui,sans-serif}#irDuelLayer .dm{width:min(820px,96vw);max-height:94vh;overflow:auto;background:#050b14;color:#fff;border:1px solid #00e5ff66;border-radius:22px;box-shadow:0 0 60px #00e5ff22}#irDuelLayer .dh{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #ffffff14}#irDuelLayer .db{padding:18px}#irDuelLayer button{border:1px solid #274765;background:#0d1929;color:#fff;border-radius:9px;padding:10px 13px;font-weight:900;cursor:pointer}#irDuelLayer button.primary{background:linear-gradient(90deg,#00a7cf,#d72583);border:0}#irDuelLayer button.danger{color:#ff9bb0;border-color:#633244;background:#1a0d15}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.duelGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.duelCard{padding:14px;border:1px solid #ffffff14;border-radius:15px}.duelTimer,.duelCount,.duelResult{text-align:center;font-weight:900}.duelTimer{font-size:30px;color:#ffd45c;margin:12px}.duelCount{font-size:42px;color:#00e5ff;margin:10px}.duelResult{font-size:28px;margin:18px}.muted{color:#93a0b6}.duelHud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483500;display:none;padding:9px 14px;border:1px solid #00e5ff66;border-radius:13px;background:#02050cdc;color:#fff;font:900 14px Inter,sans-serif;box-shadow:0 0 18px #00e5ff26;text-align:center}@media(max-width:700px){.duelGrid{grid-template-columns:1fr}}`;document.head.appendChild(style)
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))
  const show=h=>{layer.innerHTML=h;layer.style.display='flex'}
  const hide=()=>{layer.style.display='none';clearTimers()}
  const clearTimers=()=>{if(S.timer)clearInterval(S.timer);if(S.poll)clearInterval(S.poll);if(S.sync)clearInterval(S.sync);S.timer=S.poll=S.sync=null}
  const rpc=async(name,args)=>{if(!sb)throw Error('Supabase indisponible');const r=await sb.rpc(name,args||{});if(r.error)throw r.error;return r.data}
  const meA=s=>s&&s.user_a===S.user.id
  const otherId=s=>meA(s)?s.user_b:s.user_a
  const otherName=s=>esc(S.nameMap[otherId(s)]||'Ton ami')
  const otherCharacter=s=>(meA(s)?s.character_b:s.character_a)||'runner'
  const remaining=d=>d?Math.max(0,(new Date(d).getTime()-Date.now())/1000):0

  async function refreshUser(){if(!sb)return;S.user=(await sb.auth.getSession()).data?.session?.user||null}
  async function requests(){
    if(!S.user)return []
    try{const rows=await rpc('duel_poll_requests');return Array.isArray(rows)?rows:[]}catch(_){return []}
  }
  function requestGui(r){
    const id=String(r?.id||'');if(!id||!S.user)return
    S.requestId=id
    const incoming=r.receiver_id===S.user.id
    const who=esc(incoming?(r.sender_username||'Ton ami'):(r.receiver_username||'Ton ami'))
    show(incoming?`<div class="dm"><div class="dh"><h2>⚔️ Demande de 1V1</h2><button id="dx">✕</button></div><div class="db"><h3>👤 ${who} veut faire un 1V1 avec toi.</h3><div id="rt" class="duelTimer"></div><p class="muted">Tu as 30 secondes pour répondre.</p><div class="actions"><button id="da" class="primary">✅ ACCEPTER</button><button id="dr" class="danger">❌ REFUSER</button></div></div></div>`:`<div class="dm"><div class="dh"><h2>⚔️ 1V1 contre ${who}</h2><button id="dx">✕</button></div><div class="db"><div class="duelCount">1 / 2</div><h3 style="text-align:center">⏳ En attente de ${who}</h3><div id="rt" class="duelTimer"></div><p class="muted" style="text-align:center">Demande envoyée.</p><div class="actions"><button id="dc" class="danger">❌ ANNULER</button></div></div></div>`)
    const da=document.getElementById('da'),dr=document.getElementById('dr'),dx=document.getElementById('dx'),dc=document.getElementById('dc')
    if(da)da.onclick=()=>respond(id,true);if(dr)dr.onclick=()=>respond(id,false);if(dx)dx.onclick=()=>respond(id,false);if(dc)dc.onclick=()=>cancel(id)
    const until=r.expires_at?new Date(r.expires_at).getTime():Date.now()+30000
    clearTimers();S.timer=setInterval(()=>{const e=document.getElementById('rt');const n=Math.ceil(Math.max(0,(until-Date.now())/1000));if(e)e.textContent=n+' s';if(n<=0)cancel(id,true)},200)
  }
  async function cancel(id,silent=false){try{await rpc('duel_cancel_request',{p_request_id:String(id)})}catch(_){}if(String(S.requestId)===String(id))S.requestId=null;if(!silent)hide()}
  async function respond(id,ok){
    try{const sid=await rpc('duel_respond_request',{p_request_id:String(id),p_accept:!!ok});S.requestId=null;if(!ok){hide();return}if(!sid)throw Error('La session 1V1 n’a pas été créée.');startSession(String(sid))}catch(e){alert('❌ '+(e.message||'Demande impossible'))}
  }
  async function challenge(friendId){
    await refreshUser();if(!S.user)return alert('❌ Connecte-toi pour faire un 1V1.');
    try{S.requestId=String(await rpc('duel_create_request',{p_friend_id:friendId}));const rows=await requests();const r=rows.find(x=>String(x.id)===S.requestId);requestGui(r||{id:S.requestId,sender_id:S.user.id,receiver_id:friendId,status:'pending',expires_at:new Date(Date.now()+30000).toISOString()})}catch(e){alert('❌ '+(e.message||'Impossible de lancer le 1V1'))}
  }
  window.IR_DUEL_CHALLENGE=challenge
  window.IR_DUEL_CANCEL=()=>{if(S.requestId)cancel(S.requestId)}

  async function startSession(id){
    clearTimers();S.sessionId=id;S.session=null;S.shown=null;S.ghost=0;S.ghostTarget=0;S.opponentAction='run';
    await sync();showLobby();
    S.sync=setInterval(sync,350)
  }
  async function sync(){
    if(!S.sessionId)return
    try{const G=window.__IR_G;const d=Math.max(0,Math.floor(Number(G?.dist||0)));const l=Math.max(0,Math.floor(Number(G?.lives||0)));const p=G?.player;const y=Number.isFinite(Number(p?.y))&&Number.isFinite(Number(G?.groundY))&&Number.isFinite(Number(G?.H))?Math.max(0,Math.min(1,(G.groundY-p.y)/G.H)):0;const action=G?.dashT>0?'dash':(p&&!p.ground?'jump':'run');const s=await rpc('duel_tick',{p_session_id:S.sessionId,p_distance:d,p_lives:l,p_y:y,p_action:action});if(s)renderSession(s)}catch(e){console.warn('[IR] duel sync',e)}}
  function showLobby(){show(`<div class="dm"><div class="dh"><h2>⚔️ 1V1</h2><button id="leave">✕</button></div><div class="db"><div class="duelCount">2 / 2</div><div class="duelGrid"><div class="duelCard"><h3>👤 Toi</h3><p id="mine">⏳ Pas prêt</p></div><div class="duelCard"><h3>👤 ${otherName(S.session||{})}</h3><p id="opp">⏳ Pas prêt</p></div></div><p class="muted" style="margin-top:14px">Le 1V1 utilise le parcours commun. Prépare-toi puis le duel démarre automatiquement.</p><div class="actions"><button id="ready" class="primary">✅ PRÊT</button><button id="leave2" class="danger">QUITTER</button></div></div></div>`);document.getElementById('ready').onclick=async()=>{try{await rpc('duel_set_choice',{p_session_id:S.sessionId,p_choice:'ready'})}catch(e){alert('❌ '+e.message)}};document.getElementById('leave').onclick=leave;document.getElementById('leave2').onclick=leave}
  async function leave(){try{if(S.sessionId)await rpc('duel_leave',{p_session_id:S.sessionId})}catch(_){}finishToMenu()}
  function renderSession(s){S.session=s;if(s.status==='lobby'){if(S.shown!=='lobby'){S.shown='lobby';showLobby()}const a=document.getElementById('mine'),b=document.getElementById('opp');if(a)a.textContent=(meA(s)?s.choice_a:s.choice_b)==='ready'?'✅ PRÊT':'⏳ Pas prêt';if(b)b.textContent=(meA(s)?s.choice_b:s.choice_a)==='ready'?'✅ PRÊT':'⏳ Pas prêt';return}if(s.status==='countdown'){if(S.shown!=='countdown'){S.shown='countdown';show(`<div class="dm"><div class="db"><div class="duelCount" id="go">3</div><p class="muted" style="text-align:center">⚔️ Le duel va commencer !</p></div></div>`)}const e=document.getElementById('go');if(e)e.textContent=Math.max(1,Math.ceil(remaining(s.phase_deadline)));return}if(s.status==='playing'){if(S.shown!=='playing'){S.shown='playing';layer.style.display='none';window.IR_DUEL_ACTIVE=true;window.IR_DUEL_CONFIG={lives:2,character:otherCharacter(s),seed:Number(s.random_seed)||1};window.IR_DUEL_SET_WORLD_RNG?.(Number(s.random_seed)||1);hud.style.display='block';window.dispatchEvent(new CustomEvent('ir:duelStartGame'))}updateGhost(s);updateHud(s);return}if(s.status==='completed'||s.status==='cancelled'){showResult(s);return}}
  function updateGhost(s){const target=Number(meA(s)?s.distance_b:s.distance_a);if(Number.isFinite(target)){S.ghostFrom=S.ghostTarget;S.ghostTarget=target;S.ghostStart=performance.now();S.ghost=target}S.opponentAction=meA(s)?s.action_b:s.action_a;S.opponentY=Number(meA(s)?s.y_b:s.y_a)||0;S.opponentCharacter=otherCharacter(s)}
  function updateHud(s){const myL=meA(s)?s.lives_a:s.lives_b,opL=meA(s)?s.lives_b:s.lives_a,myD=meA(s)?s.distance_a:s.distance_b,opD=meA(s)?s.distance_b:s.distance_a;hud.innerHTML=`⚔️ ${esc(S.nameMap[otherId(s)]||'Adversaire')} · ❤️ ${myL} / ${opL} · 📏 ${Math.floor(myD)}m / ${Math.floor(opD)}m <span style="opacity:.7">${S.opponentAction==='dash'?'⚡ DASH':S.opponentAction==='jump'?'⬆️ SAUT':'🏃'}</span>`}
  function showResult(s){if(S.shown==='result'&&layer.style.display!=='none')return;S.shown='result';window.IR_DUEL_ACTIVE=false;hud.style.display='none';const mine=meA(s),winner=s.winner_id,win=winner===S.user.id;show(`<div class="dm"><div class="dh"><h2>⚔️ FIN DU 1V1</h2></div><div class="db"><div class="duelResult">${win?'🏆 TU AS GAGNÉ !':winner?'💥 '+otherName(s)+' A GAGNÉ':'🤝 DUEL TERMINÉ'}</div><div class="duelGrid"><div class="duelCard"><b>Toi</b><div>❤️ ${mine?s.lives_a:s.lives_b}</div><div>📏 ${Math.floor(mine?s.distance_a:s.distance_b)} m</div></div><div class="duelCard"><b>${otherName(s)}</b><div>❤️ ${mine?s.lives_b:s.lives_a}</div><div>📏 ${Math.floor(mine?s.distance_b:s.distance_a)} m</div></div></div><p class="muted" style="text-align:center">${esc(s.result_reason||'Partie terminée')}</p><div class="actions"><button class="primary" id="back">RETOUR AUX AMIS</button></div></div></div>`);document.getElementById('back').onclick=finishToMenu}
  function finishToMenu(){clearTimers();S.requestId=null;S.sessionId=null;S.session=null;S.shown=null;window.IR_DUEL_ACTIVE=false;window.IR_DUEL_CONFIG=null;window.__IR_DUEL_SEED=null;window.__IR_DUEL_WORLD_RNG=null;hud.style.display='none';hide();window.dispatchEvent(new CustomEvent('ir:duelExitToMenu'))}
  window.IR_DUEL_GHOST_DRAW=(ctx,W,H,w,G)=>{if(!window.IR_DUEL_ACTIVE||!S.session)return;const d=Number(S.ghostTarget||0);const my=Number(G.dist||0);const px=Math.max(70,Math.min(W-80,w.x+(d-my)*1.1));const gy=G.groundY||H*.75;const yy=gy-(S.opponentY||0)*(G.H||H);ctx.save();ctx.globalAlpha=.55;ctx.translate(px,yy);ctx.fillStyle='#ff3ca6';ctx.fillRect(-14,-45,28,45);ctx.fillStyle='#ffd1e8';ctx.beginPath();ctx.arc(0,-58,11,0,Math.PI*2);ctx.fill();if(S.opponentAction==='jump')ctx.fillText('⬆️',-10,-75);if(S.opponentAction==='dash')ctx.fillText('⚡',-10,-75);ctx.restore()}
  async function poll(){if(!S.user)return;const rows=await requests();if(S.sessionId)return;const incoming=rows.find(r=>r.status==='pending'&&r.receiver_id===S.user.id);if(incoming){requestGui(incoming);return}const outgoing=rows.find(r=>r.status==='accepted'&&r.session_id);if(outgoing)startSession(String(outgoing.session_id))}
  async function boot(){await refreshUser();if(!S.user)return;clearTimers();S.poll=setInterval(poll,700);poll()}
  sb?.auth.onAuthStateChange((ev,session)=>{S.user=session?.user||null;if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION'){setTimeout(boot,100)}})
  boot()
})()
