/* ILLEGAL RUNNER — FRIEND / 1V1 UI FIX */
(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let cache=[]
  const load=async()=>{const session=(await sb.auth.getSession()).data?.session;if(!session?.user)return;window.__IR_AUTH_USER_ID=session.user.id;try{const {data,error}=await sb.rpc('get_my_friends');if(error)throw error;cache=Array.isArray(data)?data:[];inject()}catch(e){console.warn('[IR] friends:',e)}}
  function inject(){const box=document.getElementById('friendList');if(!box)return;for(const row of box.querySelectorAll('.friend')){if(row.dataset.irDuelButton==='1')continue;const id=row.getAttribute('data-trade-friend-id')||row.dataset.friendId;const name=(row.querySelector('b')?.textContent||'').trim().toLowerCase();const f=cache.find(x=>x.status==='accepted'&&(String(x.friend_id)===String(id)||String(x.friend_username||'').trim().toLowerCase()===name));if(!f)continue;const me=window.__IR_AUTH_USER_ID;const friendId=f.user_id===me?f.friend_id:f.user_id;if(!friendId)continue;const b=document.createElement('button');b.type='button';b.textContent='⚔️ 1V1';b.className='primary';b.style.marginLeft='6px';b.dataset.irDuelButton='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.IR_DUEL_CHALLENGE==='function')window.IR_DUEL_CHALLENGE(friendId);else alert('⚠️ Le système 1V1 est encore en chargement.')};row.appendChild(b);row.dataset.irDuelButton='1'}}
  function watch(){const box=document.getElementById('friendList');if(!box)return;new MutationObserver(()=>setTimeout(inject,0)).observe(box,{childList:true,subtree:true});inject()}
  sb.auth.onAuthStateChange((ev,s)=>{if(s?.user)window.__IR_AUTH_USER_ID=s.user.id;if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(load,100)})
  setTimeout(async()=>{await load();watch()},500)
  setInterval(()=>{if(document.getElementById('friends')?.classList.contains('active'))load()},2500)
})()
