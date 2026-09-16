(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  const WORLDS = {
    city:{emoji:'🌃',name:'CITY',desc:'Ville cyberpunk'}, forest:{emoji:'🌲',name:'FOREST',desc:'Forêt néon'}, desert:{emoji:'🏜️',name:'DESERT',desc:'Désert synthwave'}, space:{emoji:'🚀',name:'SPACE',desc:'Station spatiale'}, dark:{emoji:'🌑',name:'DARK',desc:'Dimension sombre'}, volcano:{emoji:'🌋',name:'VOLCANO',desc:'Coeur du volcan'}, ice:{emoji:'❄️',name:'ICE',desc:'Banquise glacée'}
  }
  const CHARS = {runner:{emoji:'🧑',name:'RUNNER'},ninja:{emoji:'🥷',name:'NINJA'},robot:{emoji:'🤖',name:'ROBOT'},ghost:{emoji:'👻',name:'GHOST'},cyber:{emoji:'🦾',name:'CYBER'}}
  const OBS = {classic:{emoji:'🔺',name:'CLASSIC'},tech:{emoji:'🧱',name:'TECH'},drone:{emoji:'🚁',name:'DRONES'},energy:{emoji:'⚡',name:'ENERGY'},chaos:{emoji:'☠️',name:'CHAOS'}}
  const COSTS={world:250,character:200,obstacle:180,reward:300}
  const cfg=window.IR_CONFIG||{}
  const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
  let cloudUser=null,cloudInventory=null,buying=false
  const localProfile=()=>{try{return JSON.parse(localStorage.getItem('irGuest')||'{}')}catch{return {}}}
  const saveLocal=p=>localStorage.setItem('irGuest',JSON.stringify(p))
  const guestMode=()=>($('userBadge')?.textContent||'').includes('local')
  const toast=t=>{const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
  const refreshCoins=n=>{if(n!==undefined&&$('coins'))$('coins').textContent=String(n)}
  const notifyProfile=p=>window.dispatchEvent(new CustomEvent('ir:profileChanged',{detail:p}))
  const notifyCustomization=(type,id)=>window.dispatchEvent(new CustomEvent('ir:customizationChanged',{detail:type==='world'?{selected_background:id}:type==='character'?{selected_character:id}:{selected_obstacle_set:id}}))
  async function getCloud(){if(!sb||guestMode()){cloudUser=null;cloudInventory=null;return false}const {data:{user}}=await sb.auth.getUser();cloudUser=user;if(!user){cloudInventory=[];return false}const {data}=await sb.from('inventory').select('item_type,item_id').eq('user_id',user.id);cloudInventory=data||[];return true}
  const owned=(type,id,p)=>type==='world'?(p.owned_worlds||['city']).includes(id):type==='character'?(p.owned_characters||['runner']).includes(id):(p.owned_obstacles||['classic']).includes(id)
  const cloudOwned=(type,id)=>{const map={world:'background',character:'character',obstacle:'obstacle'};return !!cloudInventory?.some(x=>x.item_type===map[type]&&x.item_id===id)}
  async function isOwned(type,id){if(guestMode())return owned(type,id,localProfile());if(!cloudInventory)await getCloud();return cloudOwned(type,id)}
  async function equip(type,id){
    if(!(await isOwned(type,id)))return toast('🔒 Objet non débloqué. Ouvre un pack !')
    if(guestMode()){
      const p=localProfile();
      if(type==='world')p.selected_background=id;
      if(type==='character')p.selected_character=id;
      if(type==='obstacle')p.selected_obstacle_set=id;
      saveLocal(p);notifyCustomization(type,id);notifyProfile(p)
    } else if(cloudUser){
      const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type]
      const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
      if(error)return toast('❌ Impossible d’équiper.')
      notifyCustomization(type,id)
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
      saveLocal(p)
      notifyCustomization(type,id)
      notifyProfile(p)
      return
    }
    if(cloudUser){
      const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type]
      const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
      if(!error)notifyCustomization(type,id)
    }
  }
  async function buyPack(type){
    if(buying)return
    buying=true
    try{
      const cost=COSTS[type]
      if(guestMode()){
        const p=localProfile();p.coins=p.coins|0
        if(p.coins<cost)return toast('Pas assez de pièces.')
        if(type==='reward'){
          const r=100+Math.floor(Math.random()*651);p.coins-=cost;p.coins+=r;saveLocal(p);refreshCoins(p.coins);notifyProfile(p);toast('💎 Récompense reçue : +'+r+' pièces !');await renderCustomizer();return
        }
        const list=type==='world'?Object.keys(WORLDS):type==='character'?Object.keys(CHARS):Object.keys(OBS)
        const key=type==='world'?'owned_worlds':type==='character'?'owned_characters':'owned_obstacles'
        const def=type==='world'?'city':type==='character'?'runner':'classic'
        const arr=p[key]||[def]
        const locked=list.filter(x=>!arr.includes(x))
        if(!locked.length)return toast('🎉 Tout est déjà débloqué !')
        const id=locked[Math.floor(Math.random()*locked.length)]
        p.coins-=cost;p[key]=[...new Set([...arr,id])]
        if(type==='world')p.selected_background=id
        if(type==='character')p.selected_character=id
        if(type==='obstacle')p.selected_obstacle_set=id
        saveLocal(p);refreshCoins(p.coins);notifyProfile(p);notifyCustomization(type,id)
        toast('🎁 '+(type==='world'?'Monde':type==='character'?'Personnage':'Obstacles')+' débloqué et équipé : '+(type==='world'?WORLDS[id].name:type==='character'?CHARS[id].name:OBS[id].name))
        await renderCustomizer();return
      }
      if(!sb)return toast('Cloud indisponible.')
      const {data:{user}}=await sb.auth.getUser();if(!user)return toast('Reconnecte-toi.')
      const {data,error}=await sb.rpc('buy_pack',{p_type:type})
      if(error)return toast(error.message.includes('Not enough')?'Pas assez de pièces.':error.message.includes('Everything')?'🎉 Tout est déjà débloqué !':'❌ Achat impossible.')
      const reward=Number(data?.reward||0)
      const id=data?.item_id||null
      if(reward)toast('💎 Récompense reçue : +'+reward+' pièces !')
      else if(id){
        const label=type==='world'?WORLDS[id].name:type==='character'?CHARS[id].name:OBS[id].name
        await getCloud()
        await autoEquip(type,id,{})
        toast('🎁 '+(type==='world'?'Monde':type==='character'?'Personnage':'Obstacles')+' débloqué et équipé : '+label)
      }
      const {data:prof}=await sb.from('profiles').select('coins').eq('id',user.id).single()
      if(prof){refreshCoins(prof.coins);notifyProfile({coins:prof.coins})}
      await getCloud();await renderCustomizer();return
    }finally{buying=false}
  }
  const card=html=>`<div class="card">${html}</div>`
  function renderPacks(){
    const shop=$('shop');if(!shop)return
    let root=$('customPacks');if(!root){root=document.createElement('div');root.id='customPacks';shop.querySelector('.panel')?.appendChild(root)}
    $('shopGrid')?.style.setProperty('display','none')
    root.innerHTML=`<div class="pack-shop-title"><h3>🎁 PACKS</h3><p class="muted">Ouvre un pack avec tes pièces : l'objet gagné est automatiquement équipé.</p></div><div class="grid pack-grid-fixed">
      ${card('<div class="emoji">🌍</div><h3>PACK MONDE</h3><p class="muted">Débloque un monde aléatoire.</p><button class="primary pack-buy" data-pack="world" type="button">🎁 250 🪙</button>')}
      ${card('<div class="emoji">🧑</div><h3>PACK PERSONNAGE</h3><p class="muted">Débloque un personnage aléatoire.</p><button class="primary pack-buy" data-pack="character" type="button">🎁 200 🪙</button>')}
      ${card('<div class="emoji">🔺</div><h3>PACK OBSTACLES</h3><p class="muted">Débloque un style d’obstacles aléatoire.</p><button class="primary pack-buy" data-pack="obstacle" type="button">🎁 180 🪙</button>')}
      ${card('<div class="emoji">💎</div><h3>PACK RÉCOMPENSE</h3><p class="muted">Récompense aléatoire : <b>100 à 750 🪙</b>.</p><button class="pack-buy" data-pack="reward" type="button">🎁 300 🪙</button>')}
    </div>`
    root.querySelectorAll('.pack-buy').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();buyPack(btn.dataset.pack)}))
    root.querySelectorAll('.card').forEach(c=>{c.style.animation='none';c.style.transition='none'})
  }
  async function renderCustomizer(){
    const root=$('customizerRoot');if(!root)return
    await getCloud()
    const p=localProfile();let selected={world:p.selected_background||'city',character:p.selected_character||'runner',obstacle:p.selected_obstacle_set||'classic'}
    if(!guestMode()&&cloudUser){const {data:prof}=await sb.from('profiles').select('selected_background,selected_character,selected_obstacle_set').eq('id',cloudUser.id).single();if(prof)selected={world:prof.selected_background||'city',character:prof.selected_character||'runner',obstacle:prof.selected_obstacle_set||'classic'}}
    const wc=Object.entries(WORLDS).map(([id,w])=>{const ok=guestMode()?owned('world',id,p):cloudOwned('world',id),eq=selected.world===id;return card(`<div class="emoji">${w.emoji}</div><div class="rarity">${w.name}</div><h3>${w.desc}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="world" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const cc=Object.entries(CHARS).map(([id,c])=>{const ok=guestMode()?owned('character',id,p):cloudOwned('character',id),eq=selected.character===id;return card(`<div class="emoji">${c.emoji}</div><h3>${c.name}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="character" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const oc=Object.entries(OBS).map(([id,o])=>{const ok=guestMode()?owned('obstacle',id,p):cloudOwned('obstacle',id),eq=selected.obstacle===id;return card(`<div class="emoji">${o.emoji}</div><h3>${o.name}</h3><p class="muted">${ok?'Débloqué':'🔒 Verrouillé'}</p><button data-equip-type="obstacle" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    root.innerHTML=`<div class="custom-section"><h3>🌍 MONDES</h3><p class="muted">Tous les styles de monde disponibles dans les packs.</p><div class="grid">${wc}</div></div><div class="custom-section"><h3>🧑 PERSONNAGES</h3><p class="muted">Tous les personnages disponibles dans les packs.</p><div class="grid">${cc}</div></div><div class="custom-section"><h3>☠️ STYLES D'OBSTACLES</h3><p class="muted">Tous les styles d’obstacles disponibles dans les packs.</p><div class="grid">${oc}</div></div>`
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
