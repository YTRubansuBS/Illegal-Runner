(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  const WORLDS = {
    city:{emoji:'🌃',name:'CITY',desc:'Ville cyberpunk'}, forest:{emoji:'🌲',name:'FOREST',desc:'Forêt néon'}, desert:{emoji:'🏜️',name:'DESERT',desc:'Désert synthwave'}, space:{emoji:'🚀',name:'SPACE',desc:'Station spatiale'}, dark:{emoji:'🌑',name:'DARK',desc:'Dimension sombre'}, volcano:{emoji:'🌋',name:'VOLCANO',desc:'Coeur du volcan'}, ice:{emoji:'❄️',name:'ICE',desc:'Banquise glacée'}
  }
  const CHARS = {runner:{emoji:'🧑',name:'RUNNER'},ninja:{emoji:'🥷',name:'NINJA'},robot:{emoji:'🤖',name:'ROBOT'},ghost:{emoji:'👻',name:'GHOST'},cyber:{emoji:'🦾',name:'CYBER'}}
  const OBS = {classic:{emoji:'🔺',name:'CLASSIC'},tech:{emoji:'🧱',name:'TECH'},drone:{emoji:'🚁',name:'DRONES'},energy:{emoji:'⚡',name:'ENERGY'},chaos:{emoji:'☠️',name:'CHAOS'}}
  const COINS = {gold:{emoji:'🪙',name:'GOLD'},diamond:{emoji:'💎',name:'DIAMOND'},ruby:{emoji:'🔴',name:'RUBY'},emerald:{emoji:'🟢',name:'EMERALD'},neon:{emoji:'💠',name:'NEON'}}
  const COSTS={world:1000,character:1000,coin:1000,reward:500}
  const REWARD_MIN=200, REWARD_MAX=850
  const cfg=window.IR_CONFIG||{}
  const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
  let cloudUser=null,cloudInventory=null,buying=false
  const localProfile=()=>{try{const p=JSON.parse(localStorage.getItem('irGuest')||'{}');if(!Array.isArray(p.owned_coins)||!p.owned_coins.length)p.owned_coins=['gold'];if(!p.selected_coin)p.selected_coin='gold';return p}catch{return {owned_coins:['gold'],selected_coin:'gold'}}}
  const saveLocal=p=>localStorage.setItem('irGuest',JSON.stringify(p))
  const guestMode=()=>($('userBadge')?.textContent||'').includes('local')
  const toast=t=>{const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
  const refreshCoins=n=>{if(n!==undefined&&$('coins'))$('coins').textContent=String(n)}
  const notifyProfile=p=>window.dispatchEvent(new CustomEvent('ir:profileChanged',{detail:p}))
  const coinStorageKey=uid=>'irSelectedCoin_'+uid
  const getSelectedCloudCoin=uid=>{try{return localStorage.getItem(coinStorageKey(uid))||'gold'}catch{return 'gold'}}
  const setSelectedCloudCoin=(uid,id)=>{try{localStorage.setItem(coinStorageKey(uid),id)}catch{}}
  const notifyCustomization=(type,id)=>window.dispatchEvent(new CustomEvent('ir:customizationChanged',{detail:type==='world'?{selected_background:id}:type==='character'?{selected_character:id}:type==='coin'?{selected_coin:id}:{selected_obstacle_set:id}}))
  async function getCloud(){if(!sb||guestMode()){cloudUser=null;cloudInventory=null;return false}const {data:{user}}=await sb.auth.getUser();cloudUser=user;if(!user){cloudInventory=[];return false}const {data}=await sb.from('inventory').select('item_type,item_id').eq('user_id',user.id);cloudInventory=data||[];return true}
  const owned=(type,id,p)=>type==='world'?(p.owned_worlds||['city']).includes(id):type==='character'?(p.owned_characters||['runner']).includes(id):type==='coin'?(p.owned_coins||['gold']).includes(id):(p.owned_obstacles||['classic']).includes(id)
  const cloudOwned=(type,id)=>{const map={world:'background',character:'character',coin:'obstacle',obstacle:'obstacle'};return !!cloudInventory?.some(x=>x.item_type===map[type]&&x.item_id===id)}
  async function isOwned(type,id){if(guestMode())return owned(type,id,localProfile());if(!cloudInventory)await getCloud();return cloudOwned(type,id)}
  async function equip(type,id){
    if(!(await isOwned(type,id)))return toast('🔒 Objet non débloqué. Ouvre un pack !')
    if(guestMode()){
      const p=localProfile();
      if(type==='world')p.selected_background=id;
      if(type==='character')p.selected_character=id;
      if(type==='obstacle')p.selected_obstacle_set=id;
      if(type==='coin')p.selected_coin=id;
      saveLocal(p);notifyCustomization(type,id);notifyProfile(p)
    } else if(cloudUser){
      if(type==='coin'){setSelectedCloudCoin(cloudUser.id,id);notifyCustomization(type,id)}
      else {const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type]
      const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
      if(error)return toast('❌ Impossible d’équiper.')
      notifyCustomization(type,id)}
    }
    toast('✅ '+(type==='world'?'Monde':type==='character'?'Personnage':'Obstacles')+' équipé !')
    await renderCustomizer()
  }
  async function autoEquip(type,id,p){
    if(!id)return
    if(guestMode()){
      if(type==='world')p.selected_background=id
      if(type==='character')p.selected_character=id
      if(type==='obstacle')p.selected_obstacle_set=id
      if(type==='coin')p.selected_coin=id
      saveLocal(p)
      notifyCustomization(type,id)
      notifyProfile(p)
      return
    }
    if(cloudUser){
      if(type==='coin'){setSelectedCloudCoin(cloudUser.id,id);notifyCustomization(type,id)}
      else {const field={world:'selected_background',character:'selected_obstacle_set',obstacle:'selected_obstacle_set'}[type]
      const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
      if(!error)notifyCustomization(type,id)}
    }
  }
  function showPackResult(html,good=true){
    const root=$('customPacks');if(!root)return
    let box=$('packResult')
    if(!box){box=document.createElement('div');box.id='packResult';root.appendChild(box)}
    box.style.display='block'
    box.style.marginTop='14px'
    box.style.padding='18px'
    box.style.border='1px solid #00e5ff'
    box.style.borderRadius='14px'
    box.style.background='linear-gradient(135deg, rgba(0,229,255,.16), rgba(4,7,12,.92))'
    box.style.boxShadow='0 0 24px rgba(0,229,255,.22)'
    box.style.textAlign='center'
    box.innerHTML=`<div style="font-size:12px;letter-spacing:1px;color:#8fe9ff;margin-bottom:8px">${good?'PACK OUVERT':'ACHAT IMPOSSIBLE'}</div>${html}`
    box.scrollIntoView({behavior:'smooth',block:'nearest'})
  }
  function packName(type){return type==='world'?'PACK MONDE':type==='character'?'PACK PERSONNAGE':type==='coin'?'PACK PIÈCES':'PACK RÉCOMPENSE'}
  async function buyPack(type){
    if(buying)return
    buying=true
    try{
      const cost=COSTS[type]
      if(guestMode()){
        const p=localProfile();p.coins=p.coins|0
        if(p.coins<cost){showPackResult(`<b>${packName(type)}</b><br><span class="muted">Il te faut <b>${cost.toLocaleString('fr-FR')} 🪙</b>.</span>`,false);return toast('Pas assez de pièces.')}
        if(type==='reward'){
          const r=REWARD_MIN+Math.floor(Math.random()*(REWARD_MAX-REWARD_MIN+1))
          p.coins-=cost;p.coins+=r;saveLocal(p);refreshCoins(p.coins);notifyProfile(p)
          showPackResult(`<div style="font-size:25px">💎</div><h3>+${r.toLocaleString('fr-FR')} 🪙</h3><span class="muted">Tu as gagné entre 200 et 850 pièces.</span>`)
          toast('💎 Récompense reçue : +'+r+' pièces !');return
        }
        if(type==='coin'){
          const list=Object.keys(COINS), arr=p.owned_coins||['gold'], locked=list.filter(x=>!arr.includes(x))
          if(!locked.length){showPackResult(`<b>PACK PIÈCES</b><br><span class="muted">Toutes les pièces sont déjà débloquées !</span>`,false);return toast('🎉 Toutes les pièces sont déjà débloquées !')}
          const id=locked[Math.floor(Math.random()*locked.length)]
          p.coins-=cost;p.owned_coins=[...new Set([...arr,id])];p.selected_coin=id
          saveLocal(p);refreshCoins(p.coins);notifyProfile(p);notifyCustomization(type,id)
          const label=COINS[id]
          showPackResult(`<div style="font-size:25px">${label.emoji}</div><h3>${label.name}</h3><span class="muted">Pièce débloquée et équipée !</span>`)
          toast('🪙 '+label.name+' obtenu !')
          await renderCustomizer();return
        }
        const list=type==='world'?Object.keys(WORLDS):Object.keys(CHARS)
        const key=type==='world'?'owned_worlds':'owned_characters'
        const def=type==='world'?'city':'runner'
        const arr=p[key]||[def]
        const locked=list.filter(x=>!arr.includes(x))
        if(!locked.length){showPackResult(`<b>${packName(type)}</b><br><span class="muted">Tout est déjà débloqué !</span>`,false);return toast('🎉 Tout est déjà débloqué !')}
        const id=locked[Math.floor(Math.random()*locked.length)]
        p.coins-=cost;p[key]=[...new Set([...arr,id])]
        if(type==='world')p.selected_background=id
        if(type==='character')p.selected_character=id
        saveLocal(p);refreshCoins(p.coins);notifyProfile(p);notifyCustomization(type,id)
        const label=type==='world'?WORLDS[id]:CHARS[id]
        showPackResult(`<div style="font-size:25px">${label.emoji}</div><h3>${label.name}</h3><span class="muted">Débloqué et équipé !</span>`)
        toast('🎁 '+(type==='world'?'Monde':'Personnage')+' obtenu : '+label.name)
        await renderCustomizer();return
      }
      if(!sb)return showPackResult(`<b>Cloud indisponible.</b><br><span class="muted">Utilise le mode local ou reconnecte ton compte.</span>`,false)
      const {data:{user}}=await sb.auth.getUser();if(!user)return showPackResult(`<b>Reconnecte-toi pour acheter un pack.</b>`,false)
      const profQ=await sb.from('profiles').select('coins').eq('id',user.id).single()
      if(profQ.error||!profQ.data)return showPackResult(`<b>Impossible de lire tes pièces.</b>`,false)
      const currentCoins=Number(profQ.data.coins||0)
      if(currentCoins<cost){showPackResult(`<b>${packName(type)}</b><br><span class="muted">Il te faut <b>${cost.toLocaleString('fr-FR')} 🪙</b>.</span>`,false);return toast('Pas assez de pièces.')}
      if(type==='reward'){
        const r=REWARD_MIN+Math.floor(Math.random()*(REWARD_MAX-REWARD_MIN+1))
        const nextCoins=currentCoins-cost+r
        const {error}=await sb.from('profiles').update({coins:nextCoins}).eq('id',user.id)
        if(error){showPackResult(`<b>Achat impossible.</b><br><span class="muted">${error.message||'Erreur Supabase.'}</span>`,false);return toast('❌ Achat impossible.')}
        refreshCoins(nextCoins);notifyProfile({coins:nextCoins})
        showPackResult(`<div style="font-size:25px">💎</div><h3>+${r.toLocaleString('fr-FR')} 🪙</h3><span class="muted">Récompense obtenue !</span>`)
        toast('💎 Récompense reçue : +'+r+' pièces !');return
      }
      if(type==='coin'){
        const list=Object.keys(COINS), locked=list.filter(id=>!cloudOwned(type,id))
        if(!locked.length){showPackResult(`<b>PACK PIÈCES</b><br><span class="muted">Toutes les pièces sont déjà débloquées !</span>`,false);return toast('🎉 Toutes les pièces sont déjà débloquées !')}
        const id=locked[Math.floor(Math.random()*locked.length)]
        const nextCoins=currentCoins-cost
        const {error:coinError}=await sb.from('profiles').update({coins:nextCoins}).eq('id',user.id)
        if(coinError){showPackResult(`<b>Achat impossible.</b><br><span class="muted">${coinError.message||'Impossible de modifier tes pièces.'}</span>`,false);return toast('❌ Achat impossible.')}
        const {error:invError}=await sb.from('inventory').insert({user_id:user.id,item_type:'obstacle',item_id:id})
        if(invError){await sb.from('profiles').update({coins:currentCoins}).eq('id',user.id);showPackResult(`<b>Achat impossible.</b><br><span class="muted">${invError.message||'Impossible d’enregistrer le gain.'}</span>`,false);return toast('❌ Achat impossible.')}
        refreshCoins(nextCoins);notifyProfile({coins:nextCoins})
        await getCloud();await autoEquip(type,id,{})
        const label=COINS[id]
        showPackResult(`<div style="font-size:25px">${label.emoji}</div><h3>${label.name}</h3><span class="muted">Pièce débloquée et équipée !</span>`)
        toast('🪙 '+label.name+' obtenu !')
        await renderCustomizer();return
      }
      await getCloud()
      const list=type==='world'?Object.keys(WORLDS):Object.keys(CHARS)
      const map={world:'background',character:'character'}
      const key=type==='world'?'world':'character'
      const locked=list.filter(id=>!cloudOwned(type,id))
      if(!locked.length){showPackResult(`<b>${packName(type)}</b><br><span class="muted">Tout est déjà débloqué !</span>`,false);return toast('🎉 Tout est déjà débloqué !')}
      const id=locked[Math.floor(Math.random()*locked.length)]
      const nextCoins=currentCoins-cost
      const {error:coinError}=await sb.from('profiles').update({coins:nextCoins}).eq('id',user.id)
      if(coinError){showPackResult(`<b>Achat impossible.</b><br><span class="muted">${coinError.message||'Impossible de modifier tes pièces.'}</span>`,false);return toast('❌ Achat impossible.')}
      const {error:invError}=await sb.from('inventory').insert({user_id:user.id,item_type:map[type],item_id:id})
      if(invError){await sb.from('profiles').update({coins:currentCoins}).eq('id',user.id);showPackResult(`<b>Achat impossible.</b><br><span class="muted">${invError.message||'Impossible d’enregistrer le gain.'}</span>`,false);return toast('❌ Achat impossible.')}
      refreshCoins(nextCoins);notifyProfile({coins:nextCoins})
      await getCloud();await autoEquip(type,id,{})
      const label=type==='world'?WORLDS[id]:CHARS[id]
      showPackResult(`<div style="font-size:25px">${label.emoji}</div><h3>${label.name}</h3><span class="muted">Débloqué et équipé !</span>`)
      toast('🎁 '+(type==='world'?'Monde':'Personnage')+' obtenu : '+label.name)
      await renderCustomizer();return
    }finally{buying=false}
  }
  const card=html=>`<div class="card">${html}</div>`
  function renderPacks(){
    const shop=$('shop');if(!shop)return
    let root=$('customPacks');if(!root){root=document.createElement('div');root.id='customPacks';shop.querySelector('.panel')?.appendChild(root)}
    $('shopGrid')?.style.setProperty('display','none')
    const standard=$('btnFreePack')?.closest('.card');if(standard)standard.style.display='none'
    root.innerHTML=`<div class="pack-shop-title"><h3>🎁 PACKS</h3><p class="muted">Choisis un pack et achète-le avec tes pièces.</p></div><div class="grid pack-grid-fixed">
      ${card('<div class="emoji">🌍</div><h3>PACK MONDE</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="world" type="button">ACHETER</button>')}
      ${card('<div class="emoji">🧑</div><h3>PACK PERSONNAGE</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="character" type="button">ACHETER</button>')}
      ${card('<div class="emoji">🪙</div><h3>PACK PIÈCES</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="coin" type="button">ACHETER</button>')}
      ${card('<div class="emoji">💎</div><h3>PACK RÉCOMPENSE</h3><p><b>🪙 500</b></p><button class="pack-buy" data-pack="reward" type="button">ACHETER</button>')}
    </div><div id="packResult" class="card" style="display:none"></div>`
    root.querySelectorAll('.pack-buy').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();buyPack(btn.dataset.pack)}))
    root.querySelectorAll('.card').forEach(c=>{c.style.animation='none';c.style.transition='none'})
  }
  async function renderCustomizer(){
    const root=$('customizerRoot');if(!root)return
    await getCloud()
    const p=localProfile();let selected={world:p.selected_background||'city',character:p.selected_character||'runner',coin:p.selected_coin||'gold'}
    if(!guestMode()&&cloudUser){const {data:prof}=await sb.from('profiles').select('selected_background,selected_character,selected_obstacle_set').eq('id',cloudUser.id).single();if(prof)selected={world:prof.selected_background||'city',character:prof.selected_character||'runner',coin:getSelectedCloudCoin(cloudUser.id)}}
    const wc=Object.entries(WORLDS).map(([id,w])=>{const ok=guestMode()?owned('world',id,p):cloudOwned('world',id),eq=selected.world===id;return card(`<div class="emoji">${w.emoji}</div><div class="rarity">${w.name}</div><h3>${w.desc}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="world" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const cc=Object.entries(CHARS).map(([id,c])=>{const ok=guestMode()?owned('character',id,p):cloudOwned('character',id),eq=selected.character===id;return card(`<div class="emoji">${c.emoji}</div><h3>${c.name}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="character" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const coinCards=Object.entries(COINS).map(([id,o])=>{const ok=guestMode()?owned('coin',id,p):cloudOwned('coin',id),eq=selected.coin===id;return card(`<div class="emoji">${o.emoji}</div><h3>${o.name}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="coin" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    root.innerHTML=`<div class="custom-section"><h3>🌍 MONDES</h3><p class="muted">Tous les styles de monde disponibles dans les packs.</p><div class="grid">${wc}</div></div><div class="custom-section"><h3>🧑 PERSONNAGES</h3><p class="muted">Tous les personnages disponibles dans les packs.</p><div class="grid">${cc}</div></div><div class="custom-section"><h3>🪙 PIÈCES</h3><p class="muted">Tous les styles de pièces disponibles dans le pack pièces.</p><div class="grid">${coinCards}</div></div>`
  }
  function setup(){
    document.querySelector('#tabs button[data-tab="pack"]')?.remove();$('pack')?.remove()
    const wt=document.querySelector('#tabs button[data-tab="world"]');if(wt)wt.textContent='🎨 Personnaliser'
    const wh=$('#world h2');if(wh)wh.textContent='🎨 PERSONNALISER'
    $('worldGrid')?.style.setProperty('display','none')
    if(!$('customizerRoot')){const r=document.createElement('div');r.id='customizerRoot';$('#world')?.querySelector('.panel')?.appendChild(r)}
    renderPacks()
    const r=$('customizerRoot');if(r&&!r.dataset.ready){r.dataset.ready='1';renderCustomizer()}
  }
  document.addEventListener('click',async e=>{
    const eq=e.target.closest('[data-equip-type]');if(eq){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await equip(eq.dataset.equipType,eq.dataset.equipId);return}
    const pack=e.target.closest('#customPacks .pack-buy');if(pack){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!buying)await buyPack(pack.dataset.pack);return}
  },true)
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setTimeout(setup,0)
})()
