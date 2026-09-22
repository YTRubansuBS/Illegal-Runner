(() => {
  'use strict'

  const C = {
    runner:{r:0,a:'#00e5ff',b:'#0b1220'}, ninja:{r:0,a:'#a78bfa',b:'#090b14'}, robot:{r:0,a:'#00e5ff',b:'#64748b'}, ghost:{r:0,a:'#7affd7',b:'#dffcff'}, cyber:{r:0,a:'#ff3cf2',b:'#131326'},
    pilot:{r:0,a:'#9fe8ff',b:'#263548'}, soldier:{r:0,a:'#b7d27a',b:'#30452d'}, wizard:{r:0,a:'#c58cff',b:'#312050'}, astronaut:{r:0,a:'#64d9ff',b:'#e8edf4'}, skater:{r:0,a:'#fff36b',b:'#ef4e85'},
    samurai:{r:1,a:'#ff5c7a',b:'#242936'}, pirate:{r:1,a:'#d9a441',b:'#20222b'}, detective:{r:1,a:'#e7cf9b',b:'#28323c'}, vampire:{r:1,a:'#ff315f',b:'#25122d'}, zombie:{r:1,a:'#a5e66d',b:'#3e613a'},
    alien:{r:1,a:'#e8ff77',b:'#4aaa84'}, king:{r:1,a:'#ffd166',b:'#553c86'}, queen:{r:1,a:'#ffd6f7',b:'#7b245f'}, knight:{r:1,a:'#a9e8ff',b:'#6d7786'}, racer:{r:1,a:'#ffffff',b:'#cf3e46'},
    dragon:{r:2,a:'#ff6b35',b:'#4f161d'}, phoenix:{r:2,a:'#ffd166',b:'#8b2a16'}, shadow:{r:2,a:'#8e5cff',b:'#07070d'}, thunder:{r:2,a:'#f8ff3f',b:'#24324c'}, ice:{r:2,a:'#58dfff',b:'#b9f4ff'}, flame:{r:2,a:'#ffb000',b:'#7a1309'},
    cosmic:{r:3,a:'#ff7bd5',b:'#171047'}, cyborg:{r:3,a:'#00f0ff',b:'#30363f'}, reaper:{r:3,a:'#b78cff',b:'#101018'}, angel:{r:3,a:'#fff2a6',b:'#f5f2ff'},
    demon:{r:4,a:'#ff4d7c',b:'#55111c'}, time:{r:4,a:'#ffd166',b:'#382d1c'}, void:{r:4,a:'#ff4bd8',b:'#030208'}, secret:{r:6,a:'#00f5ff',b:'#0a0712'}
  }
  let selected='runner', tick=0
  const q=v=>Math.max(0,Math.min(1,v))
  const rect=(c,x,y,w,h,col,a=1,r=0)=>{c.globalAlpha=a;c.fillStyle=col;if(r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}else c.fillRect(x,y,w,h);c.globalAlpha=1}
  const circ=(c,x,y,r,col,a=1)=>{c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.globalAlpha=1}
  const line=(c,x1,y1,x2,y2,col,w=2,a=1)=>{c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.globalAlpha=1}
  const poly=(c,p,col,a=1)=>{c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);c.closePath();c.fill();c.globalAlpha=1}

  function set(id){if(id&&C[id])selected=id}
  function aura(c,m){
    const r=m.r,p=.5+.5*Math.sin(tick*.08)
    if(r<1)return
    c.save();c.strokeStyle=m.a;c.globalAlpha=.16+r*.035;c.lineWidth=1+r*.35
    c.beginPath();c.arc(21,31,25+r*2+p*2,0,Math.PI*2);c.stroke()
    if(r>=2)for(let i=0;i<3+r;i++){const a=tick*.025+i*1.7,rr=25+r*2+(i%3)*5;circ(c,21+Math.cos(a)*rr,31+Math.sin(a)*rr,1.2+r*.25,m.a,.3+r*.035)}
    if(r>=3){c.globalAlpha=.2;c.beginPath();c.ellipse(21,31,28,12,tick*.006,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(21,31,35,16,-tick*.004,0,Math.PI*2);c.stroke()}
    if(r>=4)for(let i=0;i<4;i++)line(c,3,10+i*14,39,10+i*14+Math.sin(tick*.03+i)*4,m.a,1.5,.16)
    if(r===6){const z=['#00f5ff','#ff4bd8','#7affd7','#ffd166','#a78bfa'];c.globalAlpha=.8;c.lineWidth=2.5;c.strokeStyle=z[tick%z.length];c.beginPath();c.arc(21,31,29+p*3,0,Math.PI*2);c.stroke();c.strokeStyle=z[(tick+2)%z.length];c.beginPath();c.arc(21,31,23+p*2,.4,4.8);c.stroke()}
    c.restore()
  }

  function draw(c,m,p){
    const run=Math.sin(p.run*16)*(p.ground?7:3)
    circ(c,21,16,14,m.b)
    rect(c,8,29,26,30,m.b,.98,7)
    rect(c,12,12,18,5,m.a,.95,2)
    line(c,14,58,14-run,70,m.a,4,.95); line(c,28,58,28+run,70,m.a,4,.95)
    switch(selected){
      case 'ninja': rect(c,7,20,28,7,m.a,.95,4); poly(c,[[8,10],[1,14],[8,17]],'#ff4bd8',.75); break
      case 'robot': rect(c,8,5,26,21,'#788694',1,5);rect(c,12,11,18,6,m.a);line(c,21,5,21,0,m.a,2);circ(c,21,0,2,'#fff');break
      case 'ghost': poly(c,[[7,57],[7,26],[12,14],[21,8],[30,14],[35,26],[35,57],[30,52],[26,58],[21,52],[16,58],[12,52]],m.b,.72);circ(c,16,25,3,'#081019');circ(c,26,25,3,'#081019');break
      case 'cyber': line(c,8,35,34,29,m.a,3,.7);line(c,9,47,33,52,'#00e5ff',2,.6);break
      case 'pilot':circ(c,21,15,16,'#2d3b4e');rect(c,9,18,24,7,'#ffffff',.9,3);rect(c,12,19,8,4,'#6ed9ff');rect(c,22,19,8,4,'#6ed9ff');break
      case 'soldier':poly(c,[[6,15],[10,5],[31,5],[36,15]],'#415138');rect(c,11,8,20,5,'#b7d27a');break
      case 'wizard':poly(c,[[6,13],[21,0],[36,13],[31,14],[11,14]],'#ffd166');line(c,21,0,18,-3,m.a,2);break
      case 'astronaut':rect(c,8,5,26,22,'#eef3f8',1,10);rect(c,12,10,18,8,'#253448',1,3);rect(c,3,34,5,18,'#46566e',.8,2);rect(c,34,34,5,18,'#46566e',.8,2);break
      case 'skater':rect(c,8,7,27,9,'#2a3140',1,5);rect(c,9,56,24,4,'#60d8ff');circ(c,13,62,3,m.a);circ(c,29,62,3,m.a);break
      case 'samurai':rect(c,7,8,28,8,'#303949');poly(c,[[9,9],[13,2],[17,9],[25,9],[29,2],[33,9]],'#bfc8d8');rect(c,11,21,20,4,m.a);break
      case 'pirate':rect(c,5,7,31,9,'#17151a',1,4);rect(c,9,12,24,4,'#d9a441');rect(c,23,17,7,7,'#111');break
      case 'detective':poly(c,[[8,12],[13,5],[30,5],[35,12]],'#4b5663');rect(c,10,9,23,5,'#e7cf9b');break
      case 'vampire':poly(c,[[7,31],[21,22],[35,31],[33,59],[9,59]],m.b);poly(c,[[8,33],[4,25],[8,18],[13,27]],'#e7d4ff',.6);poly(c,[[34,33],[38,25],[34,18],[29,27]],'#e7d4ff',.6);break
      case 'zombie':circ(c,16,16,3,'#1e3022');circ(c,27,17,3,'#1e3022');line(c,14,31,31,29,m.a,2);break
      case 'alien':circ(c,21,15,16,'#56bf93');circ(c,15,16,4,'#142f2b');circ(c,27,16,4,'#142f2b');break
      case 'king':poly(c,[[8,12],[11,2],[17,9],[21,1],[25,9],[31,2],[34,12]],m.a);rect(c,14,22,14,4,'#f2d4ff');break
      case 'queen':poly(c,[[8,13],[11,1],[16,9],[21,0],[26,9],[32,1],[34,13]],m.a);line(c,13,31,29,31,'#7de8ff',3);break
      case 'knight':rect(c,9,7,24,21,'#8b96a6',1,7);rect(c,12,12,18,6,'#a9e8ff',.9,2);circ(c,5,45,7,'#5f7387',.9);break
      case 'racer':rect(c,8,8,26,10,'#151a25',1,6);rect(c,12,11,18,4,'#fff');line(c,10,36,32,43,m.a,3);break
      case 'dragon':poly(c,[[7,13],[12,2],[17,10],[25,10],[30,2],[35,13]],'#7affd7');poly(c,[[8,36],[1,27],[6,48]],m.a,.55);poly(c,[[34,36],[41,27],[36,48]],m.a,.55);break
      case 'phoenix':poly(c,[[8,43],[0,28],[9,32],[5,18],[17,28]],m.a,.6);poly(c,[[34,43],[42,28],[33,32],[37,18],[25,28]],'#ff4d9d',.5);poly(c,[[15,8],[21,-1],[27,8],[23,6],[21,11],[19,6]],'#ffd166');break
      case 'shadow':poly(c,[[8,58],[8,28],[13,13],[21,6],[29,13],[35,28],[35,58],[28,53],[21,59],[14,53]],'#07070d');circ(c,15,25,3,m.a);circ(c,27,25,3,'#ff4bd8');break
      case 'thunder':poly(c,[[9,8],[17,0],[19,7],[26,0],[33,9],[25,12],[29,18],[20,13],[15,20],[16,12],[8,14]],m.a,.9);break
      case 'ice':poly(c,[[8,58],[8,30],[12,16],[21,7],[30,16],[34,30],[34,58]],m.b,.9);line(c,8,30,21,7,m.a,2,.8);line(c,34,30,21,7,m.a,2,.8);break
      case 'flame':poly(c,[[9,58],[7,38],[13,27],[11,15],[21,3],[24,17],[32,10],[30,27],[36,38],[33,58]],m.b);poly(c,[[14,51],[13,39],[21,20],[29,39],[28,51]],'#fff1a1',.85);break
      case 'cosmic':for(let i=0;i<8;i++)circ(c,12+(i*11)%18,10+(i*7)%32,1,'#fff',.7);c.strokeStyle=m.a;c.lineWidth=2;c.globalAlpha=.65;c.beginPath();c.ellipse(21,31,25,9,-.2,0,Math.PI*2);c.stroke();c.globalAlpha=1;break
      case 'cyborg':rect(c,21,5,13,53,m.a,.14);line(c,21,12,21,56,'#ff4bd8',2);rect(c,22,12,10,5,m.a);break
      case 'reaper':poly(c,[[7,59],[7,24],[12,12],[21,5],[30,12],[35,24],[35,59]],m.b);circ(c,21,25,10,'#dad8e3');line(c,34,12,40,2,m.a,3,.8);break
      case 'angel':circ(c,21,1,7,'#fff2a6',.35);c.strokeStyle='#b7efff';c.lineWidth=2;c.globalAlpha=.8;c.beginPath();c.ellipse(21,2,10,3,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;poly(c,[[9,37],[0,27],[7,47],[13,43]],'#b7efff',.65);poly(c,[[33,37],[42,27],[35,47],[29,43]],'#b7efff',.65);break
      case 'demon':poly(c,[[8,12],[12,0],[18,10],[24,10],[30,0],[34,12]],m.a);circ(c,15,21,2,'#ffd166');circ(c,27,21,2,'#ffd166');poly(c,[[31,51],[40,55],[34,59]],'#ffb000',.7);break
      case 'time':circ(c,21,16,14,'#e9d6ad');circ(c,21,16,9,'#423a2c');line(c,21,16,21,10,m.a,2);line(c,21,16,26,19,'#8fe9ff',2);circ(c,21,16,2,m.a);break
      case 'void':circ(c,21,28,20,'#020106');circ(c,21,28,13,m.b);circ(c,15,23,2,m.a);circ(c,27,23,2,'#7a5cff');c.strokeStyle=m.a;c.lineWidth=2;c.beginPath();c.arc(21,28,21,0,Math.PI*2);c.stroke();break
      case 'secret':{const z=['#00f5ff','#ff4bd8','#7affd7','#ffd166','#a78bfa'],x=z[tick%z.length];circ(c,21,16,8,x,.7);circ(c,21,16,4,'#fff',.85);poly(c,[[7,7],[12,0],[17,7],[21,0],[25,7],[31,0],[35,9],[30,12],[12,12]],x,.92);c.strokeStyle=z[(tick+2)%z.length];c.lineWidth=2.5;c.beginPath();c.ellipse(21,31,27,10,tick*.01,0,Math.PI*2);c.stroke();break}
    }
  }

  function render(ctx,W,H,w,p,G){
    const m=C[selected]||C.runner
    ctx.save()
    if(G.dashT>0)for(let i=1;i<=5;i++){ctx.globalAlpha=.12*(6-i);ctx.fillStyle=m.a;ctx.fillRect(p.x-i*16,p.y+8,p.w,p.h-12)}
    ctx.globalAlpha=1
    ctx.save()
    ctx.translate(p.x+p.w/2,p.y+p.h)
    const sy=q(p.sy*.4+.6)
    ctx.scale(1/Math.sqrt(sy),sy)
    ctx.translate(-p.w/2,-p.h)
    ctx.scale(p.w/42,p.h/62)
    if(p.inv>0&&Math.floor(p.inv*12)%2)ctx.globalAlpha=.35
    aura(ctx,m)
    draw(ctx,m,p)
    if(G.shield){ctx.strokeStyle='#54ffc1';ctx.lineWidth=3;ctx.shadowBlur=18;ctx.shadowColor='#54ffc1';ctx.beginPath();ctx.arc(21,31,28,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0}
    ctx.restore();ctx.restore()
    if(G.level){const bar=document.getElementById('progressBar');if(bar)bar.style.width=q(G.dist/G.goal)*100+'%'}
    return true
  }

  window.IR_CHARACTER_DRAW=render
  window.IR_CHARACTER_DEFS=C
  try{const p=JSON.parse(localStorage.getItem('irGuest')||'{}');if(p.selected_character&&C[p.selected_character])selected=p.selected_character}catch(e){}
  window.addEventListener('ir:profileLoaded',e=>set(e?.detail?.selected_character))
  window.addEventListener('ir:customizationChanged',e=>set(e?.detail?.selected_character))
  setInterval(()=>tick++,50)
})()