/* ILLEGAL RUNNER — duel transition + ghost fix v4 */
(()=> {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let busy=false,ghostCanvas=null,ghostCtx=null,lastAccepted=''

  async function pollTransition(){
    if(busy||window.IR_DUEL_ACTIVE)return
    const session=(await sb.auth.getSession()).data?.session
    if(!session?.user)return
    try{
      const {data,error}=await sb.rpc('duel_poll_requests')
      if(error||!Array.isArray(data))return

      // Do not require sender_id here. Either participant can be returned by
      // the RPC, and the session itself is the authoritative match identifier.
      const accepted=data.find(r=>
        r&&r.status==='accepted'&&r.session_id &&
        (String(r.sender_id)===String(session.user.id)||String(r.receiver_id)===String(session.user.id))
      )
      if(!accepted)return

      const sid=String(accepted.session_id)
      if(lastAccepted===sid)return
      lastAccepted=sid

      const layer=document.getElementById('irDuelLayer')
      const text=layer?.textContent||''
      const waiting=!!layer&&layer.style.display!=='none'&&(
        /1\s*\/\s*2/i.test(text)||
        /Demande envoyée/i.test(text)||
        /En attente/i.test(text)
      )

      // The first player must leave the 1/2 screen immediately when the
      // server has created the shared session. Reloading lets the normal
      // duel boot rebuild the GUI from the authoritative session.
      if(waiting){
        busy=true
        if(typeof window.IR_DUEL_JOIN_SESSION==='function'){
          window.IR_DUEL_JOIN_SESSION(String(sid))
        }else{
          window.dispatchEvent(new CustomEvent('ir:duelAccepted',{detail:{sessionId:String(sid)}}))
        }
        return
      }
    }catch(e){
      console.warn('[IR] duel transition',e)
    }
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
    const G=window.__IR_G,hud=document.getElementById('irDuelHud')
    if(!hud){ghostCanvas.style.display='none';return}
    const text=hud.textContent||''
    const m=text.match(/📏\s*([\d.,]+)m\s*\/\s*([\d.,]+)m/)
    if(!m){ghostCanvas.style.display='none';return}

    const my=Number(m[1].replace(',','.'))||0
    const opp=Number(m[2].replace(',','.'))||0
    const action=text.includes('⚡ DASH')?'dash':text.includes('⬆️ SAUT')?'jump':'run'

    const w=innerWidth,h=innerHeight,dpr=Math.min(2,devicePixelRatio||1)
    if(ghostCanvas.width!==Math.floor(w*dpr)||ghostCanvas.height!==Math.floor(h*dpr)){
      ghostCanvas.width=Math.floor(w*dpr);ghostCanvas.height=Math.floor(h*dpr)
    }
    ghostCanvas.style.display='block'
    ghostCtx.setTransform(dpr,0,0,dpr,0,0)
    ghostCtx.clearRect(0,0,w,h)

    const p=G.player||{}
    const px0=Number(p.x)
    const px=Number.isFinite(px0)?px0:w*.3
    const x=Math.max(45,Math.min(w-45,px+(opp-my)*.9))
    const gy=Number.isFinite(Number(G.groundY))?Number(G.groundY):h*.75
    let y=gy
    if(action==='jump')y-=Math.min(Number(G.H)||h*.22,90)
    if(action==='dash')y-=4

    const scale=Math.max(.7,Math.min(1.4,w/900))
    ghostCtx.save()
    ghostCtx.globalAlpha=.48
    ghostCtx.translate(x,y)
    ghostCtx.scale(scale,scale)
    ghostCtx.fillStyle='#ff4fa8'
    ghostCtx.fillRect(-15,-48,30,48)
    ghostCtx.fillStyle='#ffd5e9'
    ghostCtx.beginPath();ghostCtx.arc(0,-62,12,0,Math.PI*2);ghostCtx.fill()
    ghostCtx.font='18px sans-serif';ghostCtx.textAlign='center'
    if(action==='jump')ghostCtx.fillText('⬆️',0,-82)
    if(action==='dash')ghostCtx.fillText('⚡',0,-82)
    ghostCtx.restore()
  }

  function loop(){drawGhost();requestAnimationFrame(loop)}
  sb.auth.onAuthStateChange(ev=>{
    if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(pollTransition,400)
  })
  setInterval(pollTransition,500)
  loop()
})()
