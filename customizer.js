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
  let cloudUser=null,cloudInventory=null
  const localProfile=()=>{try{return JSON.parse(localStorage.getItem('irGuest')||'{}')}catch{return {}}}
  const saveLocal=p=>localStorage.setItem('irGuest',JSON.stringify(p))
  const guestMode=()=>($('userBadge')?.textContent||'').includes('local')
  const toast=t=>{const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
  async function getCloud(){if(!sb||guestMode())return false;const {data:{user}}=await sb.auth.getUser();cloudUser=user;if(!user)return false;const {data}=await sb.from('inventory').select('item_type,item_id').eq('user_id',user.id);cloudInventory=data||[];return true}
  const owned=(type,id,p)=>type==='world'?(p.owned_worlds||['city']).includes(id):type==='character'?(p.owned_characters||['runner']).includes(id):(p.owned_obstacles||['classic']).includes(id)
  const cloudOwned=(type,id)=>{const map={world:'background',character:'character',obstacle:'obstacle'};return !!cloudInventory?.some(x=>x.item_type===map[type]&&x.item_id===id)}
  async function isOwned(type,id){if(guestMode())return owned(type,id,localProfile());if(!cloudInventory)await getCloud();return cloudOwned(type,id)}
  async function equip(type,id){
    if(!(await isOwned(type,id)))return toast('🔒 Objet non débloqué. Ouvre un pack !')
    if(guestMode()){const p=localProfile();if(type==='world')p.selected_background=id;if(type==='character')p.selected_character=id;if(type==='obstacle')p.selected_obstacle_set=id;saveLocal(p)}
    else if(cloudUser){const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type];const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id);if(error)return toast('❌ Impossible d’équiper.')}
    toast('✅ '+(type==='world'?'Monde':type==='character'?'Personnage':'Obstacles')+' équipé !');renderCustomizer()
  }
  async function buyPack(type){
    const cost=COSTS[type]
    if(guestMode()){
      const p=localProfile();p.coins=p.coins|0;if(p.coins<cost)return toast('Pas assez de pièces.')
      if(type==='reward'){p.coins+=100+Math.floor(Math.random()*901);saveLocal(p);toast('💎 Récompense reçue !');location.reload();return}
      const list=type==='world'?Object.keys(WORLDS):type==='character'?Object.keys(CHARS):Object.keys(OBS);const key=type==='world'?'owned_worlds':type==='character'?'owned_characters':'owned_obstacles';const def=type==='world'?'city':type==='character'?'runner':'classic';const arr=p[key]||[def];const locked=list.filter(x=>!arr.includes(x));if(!locked.length)return toast('🎉 Tout est déjà débloqué !');const id=locked[Math.floor(Math.random()*locked.length)];p.coins-=cost;p[key]=[...new Set([...arr,id])];saveLocal(p);toast('🎁 Débloqué : '+(type==='world'?WORLDS[id].name:type==='character'?CHARS[id].name:OBS[id].name));location.reload();return
    }
    if(!sb)return toast('Cloud indisponible.')
    const {data:{user}}=await sb.auth.getUser();if(!user)return toast('Reconnecte-toi.')
    const {data:prof,error:e1}=await sb.from('profiles').select('coins').eq('id',user.id).single();if(e1)return toast('❌ Profil introuvable.');if((prof.coins|0)<cost)return toast('Pas assez de pièces.')
    if(type==='reward'){const r=100+Math.floor(Math.random()*901);const {error}=await sb.from('profiles').update({coins:(prof.coins|0)-cost+r}).eq('id',user.id);if(error)return toast('❌ Achat impossible.');toast('💎 +'+r+' pièces !');location.reload();return}
    const map={world:'background',character:'character',obstacle:'obstacle'};const {data:inv}=await sb.from('inventory').select('item_id').eq('user_id',user.id).eq('item_type',map[type]);const ownedIds=(inv||[]).map(x=>x.item_id);const list=type==='world'?Object.keys(WORLDS):type==='character'?Object.keys(CHARS):Object.keys(OBS);const locked=list.filter(x=>!ownedIds.includes(x));if(!locked.length)return toast('🎉 Tout est déjà débloqué !');const id=locked[Math.floor(Math.random()*locked.length)];const {error:e2}=await sb.from('profiles').update({coins:(prof.coins|0)-cost}).eq('id',user.id);if(e2)return toast('❌ Achat impossible.');const {error:e3}=await sb.from('inventory').insert({user_id:user.id,item_type:map[type],item_id:id});if(e3)return toast('❌ Déblocage impossible.');toast('🎁 Débloqué : '+(type==='world'?WORLDS[id].name:type==='character'?CHARS[id].name:OBS[id].name));location.reload()
  }
  const card=html=>`<div class="card">${html}</div>`
  function renderPacks(){
    const shop=$('shop');if(!shop)return
    let root=$('customPacks');if(!root){root=document.createElement('div');root.id='customPacks';shop.querySelector('.panel')?.appendChild(root)}
    root.innerHTML=`<div class="pack-shop-title"><h3>🎁 PACKS</h3><p class="muted">Ouvre des packs avec tes pièces et débloque de nouveaux éléments.</p></div><div class="grid">
      ${card('<div class="emoji">🌍</div><h3>PACK MONDE</h3><p class="muted">Débloque un monde aléatoire.</p><button class="primary" data-pack="world">🎁 250 🪙</button>')}
      ${card('<div class="emoji">🧑</div><h3>PACK PERSONNAGE</h3><p class="muted">Débloque un personnage aléatoire.</p><button class="primary" data-pack="character">🎁 200 🪙</button>')}
      ${card('<div class="emoji">🔺</div><h3>PACK OBSTACLES</h3><p class="muted">Débloque un set d’obstacles.</p><button class="primary" data-pack="obstacle">🎁 180 🪙</button>')}
      ${card('<div class="emoji">💎</div><h3>PACK RÉCOMPENSE</h3><p class="muted">Transforme tes pièces en une récompense aléatoire.</p><button data-pack="reward">🎁 300 🪙</button>')}
    </div>`
  }
  async function renderCustomizer(){
    const root=$('customizerRoot');if(!root)return;await getCloud();const p=localProfile();let selected={world:p.selected_background||'city',character:p.selected_character||'runner',obstacle:p.selected_obstacle_set||'classic'}
    if(!guestMode()&&cloudUser){const {data:prof}=await sb.from('profiles').select('selected_background,selected_character,selected_obstacle_set').eq('id',cloudUser.id).single();if(prof)selected={world:prof.selected_background||'city',character:prof.selected_character||'runner',obstacle:prof.selected_obstacle_set||'classic'}}
    const wc=Object.entries(WORLDS).map(([id,w])=>{const ok=guestMode()?owned('world',id,p):cloudOwned('world',id),eq=selected.world===id;return card(`<div class="emoji">${w.emoji}</div><div class="rarity">${w.name}</div><h3>${w.desc}</h3><p class="muted">${ok?'Débloqué':'🔒 À débloquer'}</p><button data-equip-type="world" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const cc=Object.entries(CHARS).map(([id,c])=>{const ok=guestMode()?owned('character',id,p):cloudOwned('character',id),eq=selected.character===id;return card(`<div class="emoji">${c.emoji}</div><h3>${c.name}</h3><p class="muted">${ok?'Débloqué':'🔒 À débloquer'}</p><button data-equip-type="character" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    const oc=Object.entries(OBS).map(([id,o])=>{const ok=guestMode()?owned('obstacle',id,p):cloudOwned('obstacle',id),eq=selected.obstacle===id;return card(`<div class="emoji">${o.emoji}</div><h3>${o.name}</h3><p class="muted">${ok?'Débloqué':'🔒 À débloquer'}</p><button data-equip-type="obstacle" data-equip-id="${id}" ${ok?'':'disabled'}>${eq?'✓ ÉQUIPÉ':ok?'ÉQUIPER':'🔒'}</button>`) }).join('')
    root.innerHTML=`<div class="custom-section"><h3>🌍 MONDES</h3><p class="muted">Équipe les mondes que tu possèdes.</p><div class="grid">${wc}</div></div><div class="custom-section"><h3>🧑 PERSONNAGES</h3><p class="muted">Équipe les personnages débloqués.</p><div class="grid">${cc}</div></div><div class="custom-section"><h3>☠️ OBSTACLES</h3><p class="muted">Équipe les sets d’obstacles débloqués.</p><div class="grid">${oc}</div></div>`
  }
  function setup(){
    document.querySelector('#tabs button[data-tab="pack"]')?.remove();$('pack')?.remove()
    const wt=document.querySelector('#tabs button[data-tab="world"]');if(wt)wt.textContent='🎨 Personnaliser'
    const wh=document.querySelector('#world h2');if(wh)wh.textContent='🎨 PERSONNALISER'
    $('worldGrid')?.style.setProperty('display','none')
    if(!$('customizerRoot')){const r=document.createElement('div');r.id='customizerRoot';$('world')?.querySelector('.panel')?.appendChild(r)}
    renderPacks();
    const r=$('customizerRoot');if(r&&!r.dataset.ready){r.dataset.ready='1';renderCustomizer()}
  }
  document.addEventListener('click',async e=>{
    const eq=e.target.closest('[data-equip-type]');if(eq){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await equip(eq.dataset.equipType,eq.dataset.equipId);return}
    const pack=e.target.closest('[data-pack]');if(pack){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await buyPack(pack.dataset.pack);return}
  },true)
  let scheduled=false;const mo=new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;setup()},80)});mo.observe(document.body,{childList:true,subtree:true})
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup()
})()
