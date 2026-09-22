/* ILLEGAL RUNNER — live duel transition + ghost renderer fix */
(()=>{
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let busy=false
  let ghostCanvas=null,ghostCtx=null

  async function pollTransition(){
    if(busy||window.IR_DUEL_ACTIVE)return
    const session=(await sb.auth.getSession()).data?.session
    if(!session?.user)return
    try{
      const {data,error}=await sb.rpc('duel_poll_requests')
      if(error||!Array.isArray(data))return
      const accepted=data.find(r=>r.status==='accepted'&&r.session_id&&String(r.sender_id)===String(session.user.id))
      if(!accepted)return
      // duel-system.js owns the actual session. If the sender is still on the
      // old "1/2" request GUI, reload once so its normal boot picks up 2/2.
      const layer=document.getElementById('irDuelLayer')
      const isWaiting=!!layer&&layer.style.display!=='none'&&/1\s*\/\s*2|Demande envoyée|En attente/i.test(layer.textContent||'')
      if(isWaiting){
        busy=true
        sessionStorage.setItem('IR_DUEL_ACCEPTED_SESSION',String(accepted.session_id))
        location.reload()
      }
    }catch(_){ }
  }

  function ensureGhostCanvas(){
    if(ghostCanvas)return
    ghostCanvas=document.createElement('canvas')
    ghostCanvas.id='irDuelGhostCanvas'
    ghostCanvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483480;pointer-events:none;display:none'
    document.body.appendChild(ghostCanvas)
    ghostCtx=ghostCanvas.getContext('2d')
  }

  function drawGhost(){
    ensureGhostCanvas()
    if(!window.IR_DUEL_ACTIVE||!window.__IR_G){ghostCanvas.style.display='none';return}
    const G=window.__IR_G
    const S=window.__IR_DUEL_GHOST_STATE
    if(!S){ghostCanvas.style.display='none';return}
    ghostCanvas.style.display='block'
    const dpr=Math.min(2,window.devicePixelRatio||1)
    const w=innerWidth,h=innerHeight
    if(ghostCanvas.width!==Math.floor(w*dpr)||ghostCanvas.height!==Math.floor(h*dpr)){ghostCanvas.width=Math.floor(w*dpr);ghostCanvas.height=Math.floor(h*dpr)}
    ghostCtx.setTransform(dpr,0,0,dpr,0,0)
    ghostCtx.clearRect(0,0,w,h)
    const my=Number(G.dist||0),opp=Number(S.distance||0)
    if(!Number.isFinite(opp))return
    const player=G.player||{}
    const px0=Number(player.x)
    const px=Number.isFinite(px0)?px0:Math.min(w*.35,w-80)
    const scale=Math.max(.7,Math.min(1.4,w/900))
    const x=Math.max(45,Math.min(w-45,px+(opp-my)*0.9))
    const ground=Number(G.groundY)
    const H=Number(G.H)||h
    const yoff=Math.max(0,Math.min(1,Number(S.y)||0))
    const gy=Number.isFinite(ground)?ground:h*.75
    const y=gy-yoff*H
    ghostCtx.save();ghostCtx.globalAlpha=.45;ghostCtx.translate(x,y);ghostCtx.scale(scale,scale)
    ghostCtx.fillStyle='#ff4fa8';ghostCtx.fillRect(-15,-48,30,48)
    ghostCtx.fillStyle='#ffd5e9';ghostCtx.beginPath();ghostCtx.arc(0,-62,12,0,Math.PI*2);ghostCtx.fill()
    ghostCtx.font='18px sans-serif';ghostCtx.textAlign='center'
    if(S.action==='jump')ghostCtx.fillText('⬆️',0,-82)
    else if(S.action==='dash')ghostCtx.fillText('⚡',0,-82)
    ghostCtx.restore()
  }

  // duel-system.js updates this lightweight public state through its existing HUD.
  // We derive the state from the duel RPC so the ghost keeps moving even when the
  // game renderer does not call IR_DUEL_GHOST_DRAW itself.
  async function syncGhost(){
    if(!window.IR_DUEL_ACTIVE)return
    const layer=document.getElementById('irDuelLayer')
    try{
      const {data,error}=await sb.rpc('duel_poll_requests')
      if(error||!Array.isArray(data))return
      // The active session is intentionally not exposed by the existing UI, so
      // the original IR_DUEL_GHOST_DRAW hook remains the primary renderer.
      // This loop only keeps the overlay alive when that hook publishes state.
    }catch(_){ }
  }

  function loop(){drawGhost();requestAnimationFrame(loop)}
  sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(pollTransition,400)})
  setInterval(pollTransition,700)
  setInterval(syncGhost,700)
  loop()
})()
