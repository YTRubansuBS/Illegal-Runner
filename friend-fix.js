/* ILLEGAL RUNNER — friends / RLS / exchange bridge */
(() => {
  const $=id=>document.getElementById(id)
  const clean=v=>String(v||'').trim().replace(/[^a-zA-Z0-9_ -]/g,'').slice(0,20)
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))
  let sb
  function toast(t){if(typeof window.toast==='function')window.toast(t);else alert(t)}
  async function renderFriends(){
    const box=$('friendList');if(!box||!sb)return
    const {data,error}=await sb.rpc('get_my_friends')
    if(error){box.innerHTML='<div class="card">⚠️ Exécute <b>friend-fix.sql</b> dans Supabase pour activer les amis.</div>';return}
    if(!data?.length){box.innerHTML='<div class="card">👥 Aucun ami pour le moment.</div>';return}
    box.innerHTML=data.map(f=>`<div class="friend" data-trade-friend-id="${f.friend_id}" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><span style="flex:1;min-width:160px">👤 ${esc(f.username)}</span><b>🏆 ${Number(f.best_distance||0)}m</b><span class="muted">${esc(f.status)}</span><button type="button" data-ir-trade="${f.friend_id}" data-ir-name="${esc(f.username)}">🔄 ÉCHANGE</button></div>`).join('')
  }
  function install(){
    const btn=$('btnAddFriend'),input=$('friendName')
    if(!btn||!input||!window.supabase||!window.IR_CONFIG)return
    sb=window.supabase.createClient(window.IR_CONFIG.SUPABASE_URL,window.IR_CONFIG.SUPABASE_ANON_KEY)
    if(btn.dataset.irFriendFix!=='1'){
      btn.dataset.irFriendFix='1';const fresh=btn.cloneNode(true);btn.replaceWith(fresh)
      fresh.addEventListener('click',async()=>{
        const name=clean(input.value);if(!name)return
        fresh.disabled=true;fresh.textContent='RECHERCHE…'
        try{const {data,error}=await sb.rpc('add_friend_by_username',{p_username:name});if(error)throw error;input.value='';toast(data?.already?'👥 Déjà dans tes amis.':'✅ Ami ajouté !');await renderFriends()}
        catch(e){const msg=String(e?.message||e);toast(msg.includes('add_friend_by_username')?'⚠️ Exécute friend-fix.sql dans Supabase.':msg)}
        finally{fresh.disabled=false;fresh.textContent='AJOUTER'}
      })
    }
    document.addEventListener('click',e=>{const b=e.target.closest('[data-ir-trade]');if(!b)return;window.dispatchEvent(new CustomEvent('ir:friendTradeClick',{detail:{friendId:b.dataset.irTrade,name:b.dataset.irName}}))})
    window.addEventListener('ir:friendsRefresh',renderFriends)
    renderFriends()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install()
  setTimeout(install,700)
})()
