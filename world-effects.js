(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  const defs = {
    city:{emoji:'🌃',name:'CITY',rarity:0,sky:['#08213f','#03060f'],accent:'#00e5ff',ground:'#04070c',coin:'#ffd84a',far:'#0b2c4e',mid:'#123f6e',theme:'city'},
    forest:{emoji:'🌲',name:'FOREST',rarity:0,sky:['#062e2b','#02100e'],accent:'#54ffc1',ground:'#03110d',coin:'#b6ff5a',far:'#0d3a34',mid:'#155248',theme:'forest'},
    desert:{emoji:'🏜️',name:'DESERT',rarity:1,sky:['#4b1f45','#0c0716'],accent:'#ff8a3d',ground:'#160a12',coin:'#ffd84a',far:'#5a2748',mid:'#7a3355',theme:'desert'},
    space:{emoji:'🚀',name:'SPACE',rarity:1,sky:['#180a3a','#02020c'],accent:'#a14dff',ground:'#05030f',coin:'#7fd8ff',far:'#241155',mid:'#331a6e',theme:'space'},
    dark:{emoji:'🌑',name:'DARK',rarity:2,sky:['#0a0a14','#000000'],accent:'#ff2f7d',ground:'#050509',coin:'#ff5aa0',far:'#141425',mid:'#1e1e38',theme:'dark'},
    volcano:{emoji:'🌋',name:'VOLCANO',rarity:2,sky:['#4a120c','#0f0303'],accent:'#ff6a2c',ground:'#160604',coin:'#ffcf4a',far:'#5c1a10',mid:'#7d2515',theme:'volcano'},
    ice:{emoji:'❄️',name:'ICE',rarity:2,sky:['#123c56','#020b13'],accent:'#8fe9ff',ground:'#04121b',coin:'#eafcff',far:'#17516e',mid:'#216f92',theme:'ice'},
    neon:{emoji:'🌌',name:'NEON',rarity:1,sky:['#18052e','#03000a'],accent:'#ff3cf2',ground:'#08020d',coin:'#ffeb3b',far:'#2a0d4a',mid:'#55127d',theme:'neon'},
    ocean:{emoji:'🌊',name:'OCEAN',rarity:1,sky:['#032f5e','#020814'],accent:'#25d9ff',ground:'#02101b',coin:'#6fffe9',far:'#06456b',mid:'#0878a8',theme:'ocean'},
    sky:{emoji:'☁️',name:'SKY',rarity:1,sky:['#3978b9','#101b3d'],accent:'#e9f7ff',ground:'#111a2c',coin:'#fff2a6',far:'#4c8fc2',mid:'#6ab0e0',theme:'sky'},
    sunset:{emoji:'🌇',name:'SUNSET',rarity:1,sky:['#ff6b35','#28102d'],accent:'#ffd166',ground:'#180914',coin:'#ffe066',far:'#7c3046',mid:'#b34a52',theme:'sunset'},
    jungle:{emoji:'🌴',name:'JUNGLE',rarity:1,sky:['#0a4b35','#02140e'],accent:'#7dff6a',ground:'#06140b',coin:'#d7ff5c',far:'#116044',mid:'#198457',theme:'jungle'},
    candy:{emoji:'🍬',name:'CANDY',rarity:1,sky:['#ff74c8','#35145c'],accent:'#7df9ff',ground:'#1c0b26',coin:'#fff',far:'#7b3d82',mid:'#b75a9c',theme:'candy'},
    lava:{emoji:'🔥',name:'LAVA',rarity:2,sky:['#7b160d','#190203'],accent:'#ffb000',ground:'#120303',coin:'#ffe66d',far:'#4a100c',mid:'#8a2314',theme:'lava'},
    moon:{emoji:'🌙',name:'MOON',rarity:2,sky:['#18224d','#03030d'],accent:'#c9d6ff',ground:'#070914',coin:'#f8f1a9',far:'#222d5f',mid:'#35458c',theme:'moon'},
    storm:{emoji:'⛈️',name:'STORM',rarity:2,sky:['#18233b','#05060d'],accent:'#a78bfa',ground:'#080a12',coin:'#d8e6ff',far:'#26395b',mid:'#405b82',theme:'storm'},
    cyber:{emoji:'💻',name:'CYBER',rarity:3,sky:['#071f2b','#02070a'],accent:'#00ff9d',ground:'#030b0b',coin:'#00ffcc',far:'#0c3944',mid:'#12606d',theme:'cyber'},
    crystal:{emoji:'💎',name:'CRYSTAL',rarity:3,sky:['#24135c','#060318'],accent:'#d8a7ff',ground:'#09051b',coin:'#bff8ff',far:'#38217a',mid:'#5939a4',theme:'crystal'},
    toxic:{emoji:'☢️',name:'TOXIC',rarity:3,sky:['#244f14','#071006'],accent:'#b6ff00',ground:'#071006',coin:'#d4ff3f',far:'#315c1a',mid:'#4e8a25',theme:'toxic'},
    void:{emoji:'🕳️',name:'VOID',rarity:4,sky:['#16091f','#000000'],accent:'#ff4bd8',ground:'#030105',coin:'#ff7ae8',far:'#251033',mid:'#42185a',theme:'void'},
    aurora:{emoji:'🌌',name:'AURORA',rarity:4,sky:['#073b4c','#120b35'],accent:'#7affd7',ground:'#041019',coin:'#c4fff0',far:'#0a5662',mid:'#14847c',theme:'aurora'},
    matrix:{emoji:'🟩',name:'MATRIX',rarity:3,sky:['#001b0a','#000501'],accent:'#39ff14',ground:'#020b03',coin:'#39ff14',far:'#063a13',mid:'#087022',theme:'matrix'},
    rainbow:{emoji:'🌈',name:'RAINBOW',rarity:3,sky:['#54218c','#082b55'],accent:'#ffffff',ground:'#090714',coin:'#fff',far:'#743ca0',mid:'#9b5bc2',theme:'rainbow'},
    galaxy:{emoji:'🌠',name:'GALAXY',rarity:5,sky:['#26105a','#02020c'],accent:'#b98cff',ground:'#05030f',coin:'#f0cfff',far:'#38207b',mid:'#5d36a6',theme:'galaxy'},
    temple:{emoji:'🏛️',name:'TEMPLE',rarity:3,sky:['#4a3515','#100b05'],accent:'#ffd166',ground:'#120c05',coin:'#ffe29a',far:'#6a4c1e',mid:'#936b2b',theme:'temple'},
    castle:{emoji:'🏰',name:'CASTLE',rarity:4,sky:['#241d4d','#070510'],accent:'#ff5ca8',ground:'#080611',coin:'#ffd1e7',far:'#3c2e6b',mid:'#59459a',theme:'castle'},
    volcanic:{emoji:'🌋',name:'VOLCANIC',rarity:4,sky:['#5b1608','#110201'],accent:'#ff6b35',ground:'#100302',coin:'#ffd166',far:'#731d0b',mid:'#a72b0e',theme:'volcano'},
    quantum:{emoji:'⚛️',name:'QUANTUM',rarity:5,sky:['#0b3150','#100b3d'],accent:'#5ee7ff',ground:'#050914',coin:'#9ffff0',far:'#124c70',mid:'#1d75a0',theme:'quantum'},
    dream:{emoji:'💫',name:'DREAM',rarity:5,sky:['#5b2d73','#101d4d'],accent:'#ffb7ff',ground:'#0d0716',coin:'#ffe1ff',far:'#76458b',mid:'#a65db8',theme:'dream'},
    glitch:{emoji:'👾',name:'GLITCH',rarity:5,sky:['#21114a','#050510'],accent:'#ff00ff',ground:'#07050d',coin:'#00ffff',far:'#3d1d69',mid:'#7135a8',theme:'glitch'},
    dragon:{emoji:'🐉',name:'DRAGON',rarity:5,sky:['#4a160f','#100307'],accent:'#ff3b30',ground:'#0e0303',coin:'#ffcf4a',far:'#641e17',mid:'#912a1f',theme:'dragon'},
    portal:{emoji:'🌀',name:'PORTAL',rarity:5,sky:['#0b3761','#25063e'],accent:'#00f5ff',ground:'#050713',coin:'#b5ffff',far:'#12527d',mid:'#1d76a1',theme:'portal'},
    cosmic:{emoji:'☄️',name:'COSMIC',rarity:6,sky:['#30104e','#03030d'],accent:'#ff7bd5',ground:'#08030e',coin:'#ffd0f3',far:'#481a6d',mid:'#6d2998',theme:'cosmic'},
    secret:{emoji:'🗝️',name:'SECRET',rarity:6,sky:['#050505','#000000'],accent:'#00ffff',ground:'#020204',coin:'#ff00ff',far:'#111122',mid:'#202040',theme:'secret'}
  }
  let current = 'city'
  let stars = []
  let shots = []
  let last = 0
  const game = () => $('game')
  const canvas = () => $('c')
  const rand = (a,b) => a + Math.random()*(b-a)
  function setWorld(id) {
    if (!defs[id]) id='city'
    current=id
    const w=defs[id]
    const g=window.__IR_G
    if(g && g.world) g.world={...g.world,...w}
    if(!stars.length || stars[0].world!==id){stars=[];shots=[]}
    const count=18+w.rarity*14
    while(stars.length<count) stars.push({x:Math.random(),y:Math.random()*0.48,s:rand(1,2.8),a:rand(.25,.85),world:id})
  }
  function event(e){const id=e?.detail?.selected_background||'city';setWorld(id);setTimeout(()=>{const g=window.__IR_G;if(g){g.world={...(g.world||{}),...defs[id]}}},0)}
  window.addEventListener('ir:customizationChanged',event)
  function shoot(){const w=defs[current];if(w.rarity<2||Math.random()>0.035+w.rarity*.01)return;shots.push({x:rand(.45,.95),y:rand(.05,.35),vx:-rand(.45,.9),vy:rand(.18,.42),life:0,max:rand(.35,.7),w})}
  function draw(t){
    const c=canvas(),g=game(); if(!c||!g||getComputedStyle(g).display==='none'){requestAnimationFrame(draw);return}
    const ctx=c.getContext('2d'); if(!ctx){requestAnimationFrame(draw);return}
    const now=t||performance.now(),dt=Math.min(.05,(now-last)/1000||.016);last=now
    const w=defs[current];shoot()
    ctx.save();ctx.globalCompositeOperation='screen'
    for(const s of stars){s.a += Math.sin(now*.002+s.x*30)*.0015;ctx.globalAlpha=Math.max(.08,Math.min(.9,s.a));ctx.fillStyle=w.accent;ctx.beginPath();ctx.arc(s.x*c.width,s.y*c.height,s.s,0,Math.PI*2);ctx.fill()}
    for(let i=shots.length-1;i>=0;i--){const q=shots[i];q.life+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;const a=1-q.life/q.max;if(a<=0){shots.splice(i,1);continue}ctx.globalAlpha=a;ctx.strokeStyle=w.accent;ctx.lineWidth=2+ w.rarity*.35;ctx.shadowBlur=10+w.rarity*3;ctx.shadowColor=w.accent;ctx.beginPath();ctx.moveTo(q.x*c.width,q.y*c.height);ctx.lineTo((q.x-q.vx*.13)*c.width,(q.y-q.vy*.13)*c.height);ctx.stroke()}
    ctx.restore();requestAnimationFrame(draw)
  }
  window.addEventListener('DOMContentLoaded',()=>{setWorld('city');requestAnimationFrame(draw)})
})()
