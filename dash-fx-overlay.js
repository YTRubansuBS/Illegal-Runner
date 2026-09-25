/* ILLEGAL RUNNER — Dash visual amplifier
   Visual only: runs while G.dashT > 0 and never changes physics, hitboxes or controls. */
(() => {
  'use strict'
  const NAMES=['classic','flame','ice','thunder','toxic','neon','rainbow','galaxy','cosmic','void','shadow','plasma','electric','inferno','frost','aqua','nature','wind','star','moon','sun','crystal','golden','royal','dragon','phoenix','cyber','glitch','portal','matrix','pink','quantum','infinite','secret']
  const palettes={
    classic:['#fff','#d9d9d9'],flame:['#ff3b1f','#ffb347'],ice:['#bff8ff','#42bfff'],thunder:['#fff21f','#9b5cff'],toxic:['#7dff00','#21ff9d'],neon:['#00f5ff','#ff29d9'],rainbow:['#ff3b3b','#7c3aed'],galaxy:['#8b5cf6','#38bdf8'],cosmic:['#22d3ee','#f0abfc'],void:['#090012','#ff37d7'],shadow:['#111827','#64748b'],plasma:['#a855f7','#22d3ee'],electric:['#f8ff3f','#38bdf8'],inferno:['#ff1f00','#ffd166'],frost:['#dffcff','#60a5fa'],aqua:['#06b6d4','#67e8f9'],nature:['#22c55e','#bef264'],wind:['#f8fafc','#93c5fd'],star:['#fff','#facc15'],moon:['#64748b','#dbeafe'],sun:['#f59e0b','#fff7ae'],crystal:['#67e8f9','#c4b5fd'],golden:['#f59e0b','#fde68a'],royal:['#a855f7','#facc15'],dragon:['#dc2626','#fb923c'],phoenix:['#f97316','#fde047'],cyber:['#00e5ff','#ff3cf2'],glitch:['#00f5ff','#ff3cf2'],portal:['#8b5cf6','#22d3ee'],matrix:['#22c55e','#86efac'],pink:['#ec4899','#f9a8d4'],quantum:['#22d3ee','#f472b6'],infinite:['#22d3ee','#facc15'],secret:['#00e5ff','#fbbf24']
  }
  const $=id=>document.getElementById(id)
  let canvas,ctx,last=0
  function selected(){
    const keys=['irSelectedDash','ir_selected_dash','selectedDash','selected_dash','irDashSelected']
    for(const k of keys){try{const v=localStorage.getItem(k);if(v&&NAMES.includes(String(v).toLowerCase()))return String(v).toLowerCase()}catch(e){}}
    try{const p=JSON.parse(localStorage.getItem('irGuest')||'{}');if(p.selected_dash&&NAMES.includes(String(p.selected_dash).toLowerCase()))return String(p.selected_dash).toLowerCase()}catch(e){}
    const el=document.querySelector('[data-selected-dash="true"],[data-dash-selected="true"].active,.dash-card.selected,.dash-item.selected')
    const v=el?.dataset?.dash||el?.dataset?.id
    return v&&NAMES.includes(v.toLowerCase())?v.toLowerCase():'classic'
  }
  function fit(){if(!canvas)return;const c=$('c');if(!c)return;const r=c.getBoundingClientRect();const d=devicePixelRatio||1;canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0)}
  function setup(){
    const c=$('c');if(!c)return setTimeout(setup,250)
    if(canvas)return
    canvas=document.createElement('canvas');canvas.id='dashFxOverlay';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;'
    c.parentElement.appendChild(canvas);ctx=canvas.getContext('2d');fit();addEventListener('resize',fit)
    requestAnimationFrame(loop)
  }
  function dot(x,y,r,c,a=1){ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  function ring(x,y,r,c,w=3,a=.9){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}
  function line(x1,y1,x2,y2,c,w=3,a=.9){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function burst(x,y,c1,c2,t,count=30,size=4){for(let i=0;i<count;i++){const a=i*2.399+t*(.8+(i%5)*.07),d=(i%9)*7+Math.abs(Math.sin(t*2+i))*25;dot(x-Math.cos(a)*d,y+Math.sin(a)*d,size+(i%4)*1.2,i%2?c1:c2,.65)}}
  function trail(x,y,c1,c2,t,count=42,spread=28){for(let i=0;i<count;i++){const d=8+i*7,a=t*(1+(i%4)*.13)+i*1.9;dot(x-18-i*8+Math.sin(a)*spread,y+Math.cos(a*1.2+i)*spread*.55,(i%5)+2,i%2?c1:c2,.72-(i/count)*.3)}}
  function draw(id,x,y,t){
    const [c1,c2]=palettes[id]||palettes.classic
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowBlur=18;ctx.shadowColor=c2
    trail(x,y,c1,c2,t,56,34)
    switch(id){
      case'classic': burst(x,y,c1,c2,t,42,4); ring(x,y,28+Math.sin(t*8)*5,c1,4); break
      case'flame': for(let i=0;i<28;i++){const a=i*.7+t*3;dot(x-12-i%8*8,y+Math.sin(a)*24-20,5+(i%4)*2,i%2?c1:c2,.9)} break
      case'ice': for(let i=0;i<14;i++){const a=i*.45+t;const px=x-Math.abs(Math.sin(i))*55-10,py=y+Math.sin(a)*45;ctx.fillStyle=i%2?c1:c2;ctx.beginPath();ctx.moveTo(px,py-12);ctx.lineTo(px+8,py);ctx.lineTo(px,py+12);ctx.lineTo(px-8,py);ctx.closePath();ctx.fill()} break
      case'thunder': for(let i=0;i<7;i++){const ox=Math.sin(t*9+i)*35,oy=Math.cos(t*7+i)*35;line(x+ox,y+oy,x+ox+Math.sin(i+t)*18,y+oy+45,c1,5,.9)} break
      case'toxic': for(let i=0;i<20;i++){const r=4+(i%5)*2;dot(x-i*8,y+Math.sin(t+i)*35,r,c1,.65);ring(x-i*8,y+Math.sin(t+i)*35,r,c2,2,.7)} break
      case'neon': ring(x,y,34+Math.sin(t*6)*8,c1,8);ring(x,y,48+Math.sin(t*4)*10,c2,3);break
      case'rainbow': {const cs=['#ef4444','#f97316','#facc15','#22c55e','#22d3ee','#3b82f6','#a855f7'];for(let i=0;i<35;i++)dot(x-i*9,y+Math.sin(t*4+i*.5)*28,5,cs[i%cs.length],.9);break}
      case'galaxy': ring(x,y,42,c2,3);for(let i=0;i<22;i++){const a=t*(.7+i*.02)+i*.8;dot(x+Math.cos(a)*35,y+Math.sin(a)*35,3+(i%3),i%2?c1:c2,.9)}break
      case'cosmic': for(let i=0;i<9;i++){const a=t*1.5+i*.8;line(x+Math.cos(a)*20,y+Math.sin(a)*20,x+Math.cos(a)*55,y+Math.sin(a)*55,c1,4);dot(x+Math.cos(a)*58,y+Math.sin(a)*58,4,c2)}break
      case'void': ring(x,y,40,c2,6);dot(x,y,27,'#000',1);ring(x,y,30,c1,3);break
      case'shadow': for(let i=0;i<7;i++){ctx.globalAlpha=.25;ctx.fillStyle=c1;ctx.beginPath();ctx.arc(x-i*15,y+Math.sin(t+i)*20,18+i*2,0,Math.PI*2);ctx.fill()}break
      case'plasma': for(let i=0;i<8;i++){const a=t*2+i*.8;const px=x+Math.cos(a)*35,py=y+Math.sin(a)*35;dot(px,py,9,c1,.8);line(px,py,x+Math.cos(a+.7)*35,y+Math.sin(a+.7)*35,c2,3)}break
      case'electric': for(let i=0;i<11;i++){const a=i*.57+t*3;line(x,y,x+Math.cos(a)*60,y+Math.sin(a)*60,i%2?c1:c2,4,.9)}break
      case'inferno': burst(x,y,c1,c2,t,65,5);ring(x,y,45,c1,7);break
      case'frost': for(let i=0;i<12;i++){const px=x-i*10,py=y+Math.sin(t*2+i)*38;ring(px,py,7,c1,3);line(px-8,py,px+8,py,c2,2)}break
      case'aqua': for(let i=0;i<24;i++){const px=x-i*10,py=y+Math.sin(t*2+i)*40;ring(px,py,4+(i%5),c1,2,.8)}ring(x,y,45,c2,5);break
      case'nature': for(let i=0;i<28;i++){const px=x-i*8,py=y+Math.sin(t+i)*35;dot(px,py,4,i%2?c1:c2,.8);line(px,py,px-7,py-12,c1,2)}break
      case'wind': for(let i=0;i<8;i++){ctx.globalAlpha=.7;ctx.strokeStyle=c1;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x-25-i*8,y,i*5+18,-.8,.8);ctx.stroke()}break
      case'star': for(let i=0;i<24;i++){const a=t*1.5+i*.9,px=x+Math.cos(a)*(25+i%4*6),py=y+Math.sin(a)*(25+i%4*6);dot(px,py,5,c1,.95)}break
      case'moon': ring(x,y,46,c1,4);for(let i=0;i<10;i++){const a=t+i;dot(x+Math.cos(a)*40,y+Math.sin(a)*40,3,c2)}break
      case'sun': ring(x,y,38,c1,8);for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.4;line(x+Math.cos(a)*42,y+Math.sin(a)*42,x+Math.cos(a)*70,y+Math.sin(a)*70,c2,5)}break
      case'crystal': for(let i=0;i<9;i++){const px=x-i*14,py=y+Math.sin(t+i)*35;ctx.fillStyle=i%2?c1:c2;ctx.beginPath();ctx.moveTo(px,py-16);ctx.lineTo(px+11,py);ctx.lineTo(px,py+16);ctx.lineTo(px-11,py);ctx.closePath();ctx.fill()}break
      case'golden': burst(x,y,c1,c2,t,40,4);for(let i=0;i<14;i++)ring(x-i*11,y+Math.sin(t+i)*25,5,c1,2);break
      case'royal': ring(x,y,48,c1,6);ring(x,y,34,c2,3);for(let i=0;i<12;i++)dot(x+Math.cos(t+i)*50,y+Math.sin(t+i)*50,5,c1);break
      case'dragon': {ctx.strokeStyle=c1;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x+20,y);ctx.bezierCurveTo(x-20,y-55,x-90,y+40,x-125,y);ctx.stroke();burst(x-100,y,c1,c2,t,30,5);break}
      case'phoenix': for(let s=-1;s<=1;s+=2){ctx.strokeStyle=c1;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+s*55,y-70,x+s*85,y);ctx.stroke()}burst(x,y,c1,c2,t,45,5);break
      case'cyber': for(let i=0;i<12;i++){const px=x-i*13,py=y+Math.sin(t*4+i)*35;ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=3;ctx.strokeRect(px-10,py-10,20,20);line(px-10,py+10,px+10,py-10,c1,2)}break
      case'glitch': for(let i=0;i<18;i++){const px=x-i*10+(i%3)*8,py=y+(i%2?1:-1)*(20+Math.sin(t*9+i)*30);ctx.fillStyle=i%2?c1:c2;ctx.fillRect(px,py,18+(i%4)*8,5+(i%3)*4)}break
      case'portal': for(let i=0;i<3;i++){ring(x-45-i*30,y,26+i*8,i%2?c1:c2,5);for(let k=0;k<8;k++){const a=t*2+k;dot(x-45-i*30+Math.cos(a)*22,y+Math.sin(a)*22,3,c2)}}break
      case'matrix': for(let i=0;i<15;i++){const px=x-i*10,py=y-40+((t*80+i*17)%100);line(px,py,px,py+20,c1,3,.8)}break
      case'pink': for(let i=0;i<45;i++){const px=x-i*7,py=y+Math.sin(t*3+i)*38;dot(px,py,5,i%2?c1:c2,.85)}break
      case'quantum': ring(x,y,32,c1,4);ring(x,y,54,c2,3);for(let i=0;i<20;i++){const a=t*3+i;dot(x+Math.cos(a)*55,y+Math.sin(a)*55,4,i%2?c1:c2,.9)}break
      case'infinite': for(let k=0;k<7;k++){const pp=Object.keys(palettes)[(k+Math.floor(t*2))%Object.keys(palettes).length];burst(x-k*14,y,palettes[pp][0],palettes[pp][1],t+k,14,4)}ring(x,y,58,c1,6);break
      case'secret': {const all=['flame','ice','thunder','galaxy','portal','glitch','crystal','cosmic','matrix'];for(let k=0;k<all.length;k++){const pp=palettes[all[(k+Math.floor(t*3))%all.length]];burst(x-k*15,y,pp[0],pp[1],t+k,12,4)}ring(x,y,70,c1,7);ring(x,y,46,c2,3);break}
    }
    ctx.restore();ctx.globalAlpha=1
  }
  function loop(now){
    requestAnimationFrame(loop);if(!ctx||!canvas)return
    const G=window.__IR_G;if(!G||!G.running||!(G.dashT>0)){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);return}
    const p=G.player;if(!p){return}
    const d=devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
    // The engine keeps the player in canvas coordinates; use its live position so the FX follows exactly.
    const x=p.x+p.w*.42,y=p.y+p.h*.5
    draw(selected(),x,y,now/1000)
    last=now
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup()
})()
