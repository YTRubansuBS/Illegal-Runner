/* ILLEGAL RUNNER — friend invite/RLS fix */
(() => {
  const $ = id => document.getElementById(id)
  const clean = v => String(v || '').trim().replace(/[^a-zA-Z0-9_ -]/g,'').slice(0,20)
  function install(){
    const btn=$('btnAddFriend'), input=$('friendName')
    if(!btn || !input || !window.supabase || !window.IR_CONFIG) return
    if(btn.dataset.irFriendFix==='1') return
    btn.dataset.irFriendFix='1'
    const sb=window.supabase.createClient(window.IR_CONFIG.SUPABASE_URL,window.IR_CONFIG.SUPABASE_ANON_KEY)
    const fresh=btn.cloneNode(true)
    btn.replaceWith(fresh)
    fresh.addEventListener('click',async()=>{
      const name=clean(input.value)
      if(!name) return
      fresh.disabled=true
      fresh.textContent='RECHERCHE…'
      try{
        const {data,error}=await sb.rpc('add_friend_by_username',{p_username:name})
        if(error) throw error
        input.value=''
        if(typeof window.toast==='function') window.toast(data?.already?'Déjà dans tes amis.':'Ami ajouté !')
        else alert(data?.already?'Déjà dans tes amis.':'Ami ajouté !')
        const evt=new Event('ir:friendsRefresh');window.dispatchEvent(evt)
        if(typeof window.loadFriends==='function') window.loadFriends()
      }catch(e){
        const msg=String(e?.message||e)
        if(typeof window.toast==='function') window.toast(msg.includes('add_friend_by_username')?'⚠️ Exécute friend-fix.sql dans Supabase.':msg)
        else alert(msg)
      }finally{fresh.disabled=false;fresh.textContent='AJOUTER'}
    })
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install)
  else install()
  setTimeout(install,500)
})()
