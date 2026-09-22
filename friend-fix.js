/* ILLEGAL RUNNER — FRIEND / 1V1 UI FIX v3 */
(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let cache=[]
  let observer=null

  const rpc=async(name,args={})=>{
    const r=await sb.rpc(name,args)
    if(r.error)throw r.error
    return r.data
  }

  const load=async()=>{
    const session=(await sb.auth.getSession()).data?.session
    if(!session?.user)return
    window.__IR_AUTH_USER_ID=session.user.id
    try{
      const {data,error}=await sb.rpc('get_my_friends')
      if(error)throw error
      cache=Array.isArray(data)?data:[]
      inject()
    }catch(e){console.warn('[IR] friends:',e)}
  }

  const acceptedFriendId=(row)=>{
    const id=row.getAttribute('data-trade-friend-id')||row.dataset.friendId||row.dataset.friendIdValue
    const name=(row.querySelector('b,strong')?.textContent||'').trim().toLowerCase()
    const f=cache.find(x=>{
      if(x.status!=='accepted')return false
      const fid=x.user_id===window.__IR_AUTH_USER_ID?x.friend_id:x.user_id
      return String(fid)===String(id)||String(x.friend_username||'').trim().toLowerCase()===name
    })
    if(!f)return null
    return f.user_id===window.__IR_AUTH_USER_ID?f.friend_id:f.user_id
  }

  async function duelClick(friendId,button){
    button.disabled=true
    const old=button.textContent
    button.textContent='⏳ 1V1...'
    try{
      // Si l'autre joueur a déjà cliqué sur 1V1, sa demande est maintenant
      // entrante chez nous. Notre deuxième clic accepte directement cette
      // demande : le lobby passe alors à 2/2 sans écran intermédiaire.
      const rows=await rpc('duel_poll_requests')
      const list=Array.isArray(rows)?rows:[]
      const incoming=list.find(r=>
        r.status==='pending' &&
        String(r.receiver_id)===String(window.__IR_AUTH_USER_ID) &&
        String(r.sender_id)===String(friendId)
      )
      if(incoming && typeof window.IR_DUEL_ACCEPT_REQUEST==='function'){
        await window.IR_DUEL_ACCEPT_REQUEST(String(incoming.id))
        return
      }

      // Si une demande sortante existe déjà, ne crée pas de doublon.
      const outgoing=list.find(r=>
        r.status==='pending' &&
        String(r.sender_id)===String(window.__IR_AUTH_USER_ID) &&
        String(r.receiver_id)===String(friendId)
      )
      if(outgoing){
        if(typeof window.IR_DUEL_SHOW_REQUEST==='function')window.IR_DUEL_SHOW_REQUEST(outgoing)
        return
      }

      const challenge=window.IR_DUEL_CHALLENGE
      if(typeof challenge==='function')await challenge(String(friendId))
      else throw new Error('Le système 1V1 est encore en chargement.')
    }catch(e){
      console.error('[IR] duel friend click:',e)
      alert('❌ '+(e.message||'Impossible de lancer le 1V1'))
    }finally{
      button.disabled=false
      button.textContent=old
    }
  }

  function inject(){
    const box=document.getElementById('friendList')
    if(!box)return
    const rows=[...box.querySelectorAll('.friend,[data-trade-friend-id],[data-friend-id]')]
    for(const row of rows){
      if(row.dataset.irDuelButton==='1'||row.querySelector('[data-ir-duel-button="1"]'))continue
      const friendId=acceptedFriendId(row)
      if(!friendId)continue

      const b=document.createElement('button')
      b.type='button'
      b.textContent='⚔️ 1V1'
      b.className='primary'
      b.dataset.irDuelButton='1'
      b.style.cssText='margin-left:6px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;'
      b.onclick=e=>{
        e.preventDefault()
        e.stopPropagation()
        duelClick(String(friendId),b)
      }
      row.appendChild(b)
      row.dataset.irDuelButton='1'
    }
  }

  function watch(){
    const box=document.getElementById('friendList')
    if(!box)return
    if(observer)observer.disconnect()
    observer=new MutationObserver(()=>setTimeout(inject,20))
    observer.observe(box,{childList:true,subtree:true})
    inject()
  }

  sb.auth.onAuthStateChange((ev,s)=>{
    if(s?.user)window.__IR_AUTH_USER_ID=s.user.id
    if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(load,100)
  })

  setTimeout(async()=>{await load();watch()},500)
  setInterval(()=>{
    if(document.getElementById('friends')?.classList.contains('active'))load()
  },2500)
})()
