/* ILLEGAL RUNNER — Dash FX v4
   34 visual identities matching the Dash descriptions.
   Visual only: never changes physics, hitboxes, controls or progression. */
(() => {
  'use strict'

  const NAMES = [
    'classic','flame','ice','thunder','toxic','neon','rainbow','galaxy','cosmic','void',
    'shadow','plasma','electric','inferno','frost','aqua','nature','wind',
    'star','moon','sun','crystal','golden','royal',
    'dragon','phoenix','cyber','glitch',
    'portal','matrix','pink',
    'quantum','infinite','secret'
  ]

  const P = {
    classic:['#ffffff','#dbeafe'], flame:['#ff3b1f','#ffd166'], ice:['#bff8ff','#4db8ff'],
    thunder:['#fff21f','#9b5cff'], toxic:['#7dff00','#21ff9d'], neon:['#00f5ff','#ff29d9'],
    rainbow:['#ff3b30','#7c3aed'], galaxy:['#a78bfa','#38bdf8'], cosmic:['#22d3ee','#f0abfc'],
    void:['#08030d','#d946ef'], shadow:['#111827','#64748b'], plasma:['#a855f7','#22d3ee'],
    electric:['#f8ff3f','#38bdf8'], inferno:['#ff1f00','#ffd166'], frost:['#dffcff','#60a5fa'],
    aqua:['#06b6d4','#67e8f9'], nature:['#22c55e','#bef264'], wind:['#f8fafc','#93c5fd'],
    star:['#ffffff','#facc15'], moon:['#64748b','#dbeafe'], sun:['#f59e0b','#fff7ae'],
    crystal:['#67e8f9','#c4b5fd'], golden:['#f59e0b','#fde68a'], royal:['#a855f7','#facc15'],
    dragon:['#dc2626','#fb923c'], phoenix:['#f97316','#fde047'], cyber:['#00e5ff','#ff3cf2'],
    glitch:['#00f5ff','#ff3cf2'], portal:['#8b5cf6','#22d3ee'], matrix:['#22c55e','#86efac'],
    pink:['#ec4899','#f9a8d4'], quantum:['#22d3ee','#f472b6'],
    infinite:['#22d3ee','#facc15'], secret:['#00e5ff','#ff3cf2']
  }

  let canvas = null
  let ctx = null
  let selectedDashId = 'classic'
  let dashWasActive = false
  let dashStartedAt = 0

  const $ = id => document.getElementById(id)
  const valid = id => NAMES.includes(String(id || '').toLowerCase())
  const pickDash = () => {
    if (valid(selectedDashId)) return selectedDashId
    try {
      const uid = (() => {
        try {
          const p = JSON.parse(localStorage.getItem('irGuest') || '{}')
          return p.username || 'guest'
        } catch { return 'guest' }
      })()
      const keys = ['irSelectedDash_' + uid, 'irSelectedDash_guest', 'irSelectedDash']
      for (const k of keys) {
        const v = String(localStorage.getItem(k) || '').toLowerCase()
        if (valid(v)) return v
      }
      const p = JSON.parse(localStorage.getItem('irGuest') || '{}')
      if (valid(p.selected_dash)) return String(p.selected_dash).toLowerCase()
    } catch {}
    return 'classic'
  }

  window.addEventListener('ir:customizationChanged', e => {
    const id = String(e.detail?.selected_dash || '').toLowerCase()
    if (valid(id)) selectedDashId = id
  })
  window.addEventListener('ir:profileLoaded', e => {
    const id = String(e.detail?.selected_dash || '').toLowerCase()
    if (valid(id)) selectedDashId = id
  })

  function fit() {
    if (!canvas) return
    const c = $('c')
    if (!c) return
    const r = c.getBoundingClientRect()
    const d = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(r.width * d))
    canvas.height = Math.max(1, Math.round(r.height * d))
    canvas.style.width = r.width + 'px'
    canvas.style.height = r.height + 'px'
    ctx.setTransform(d, 0, 0, d, 0, 0)
  }

  function setup() {
    const c = $('c')
    if (!c) return setTimeout(setup, 250)
    if (canvas) return
    canvas = document.createElement('canvas')
    canvas.id = 'dashFxOverlay'
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;'
    c.parentElement.appendChild(canvas)
    ctx = canvas.getContext('2d')
    fit()
    window.addEventListener('resize', fit)
    requestAnimationFrame(loop)
  }

  function alpha(a) { ctx.globalAlpha = Math.max(0, Math.min(1, a)) }
  function dot(x,y,r,c,a=1,glow=0) {
    ctx.save()
    ctx.globalAlpha = a
    ctx.fillStyle = c
    if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = c }
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
    ctx.restore()
  }
  function line(x1,y1,x2,y2,c,w=2,a=.8,glow=0) {
    ctx.save()
    ctx.globalAlpha = a
    ctx.strokeStyle = c
    ctx.lineWidth = w
    ctx.lineCap = 'round'
    if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = c }
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
    ctx.restore()
  }
  function ring(x,y,r,c,w=3,a=.7,rot=0,arc=Math.PI*2) {
    ctx.save()
    ctx.globalAlpha = a
    ctx.strokeStyle = c
    ctx.lineWidth = w
    ctx.shadowBlur = 14
    ctx.shadowColor = c
    ctx.beginPath(); ctx.arc(x,y,r,rot,rot+arc); ctx.stroke()
    ctx.restore()
  }
  function poly(points, fill, stroke=fill, a=.8, sw=2) {
    ctx.save()
    ctx.globalAlpha = a
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = sw
    ctx.beginPath()
    points.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]))
    ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.restore()
  }
  function aura(x,y,r,c1,c2,a=.3) {
    ctx.save()
    const g=ctx.createRadialGradient(x,y,2,x,y,r)
    g.addColorStop(0,c2+'cc')
    g.addColorStop(.28,c1+'88')
    g.addColorStop(.72,c1+'22')
    g.addColorStop(1,'transparent')
    ctx.globalAlpha=a
    ctx.fillStyle=g
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
    ctx.restore()
  }
  function star(x,y,r,c,a=.8,rot=0) {
    ctx.save()
    ctx.globalAlpha=a
    ctx.fillStyle=c
    ctx.shadowBlur=14;ctx.shadowColor=c
    ctx.translate(x,y);ctx.rotate(rot)
    ctx.beginPath()
    for(let i=0;i<10;i++){const q=i*Math.PI/5-Math.PI/2,rr=i%2?r*.42:r;const px=Math.cos(q)*rr,py=Math.sin(q)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
    ctx.closePath();ctx.fill();ctx.restore()
  }
  function heart(x,y,s,c,a=.7) {
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowBlur=14;ctx.shadowColor=c
    ctx.translate(x,y);ctx.scale(s,s)
    ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-20,-5,-16,-18,-7,-18);ctx.bezierCurveTo(0,-18,0,-10,0,-10);ctx.bezierCurveTo(0,-10,0,-18,7,-18);ctx.bezierCurveTo(16,-18,20,-5,0,8);ctx.fill()
    ctx.restore()
  }
  function crescent(x,y,r,c,a=.8) {
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.shadowBlur=12;ctx.shadowColor=c
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
    ctx.globalCompositeOperation='destination-out'
    ctx.beginPath();ctx.arc(x+r*.35,y-r*.08,r*.82,0,Math.PI*2);ctx.fill()
    ctx.restore()
  }
  function flame(x,y,s,c1,c2,a=.8,rot=0) {
    ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s)
    const g=ctx.createLinearGradient(0,-28,0,10);g.addColorStop(0,c2);g.addColorStop(1,c1)
    ctx.fillStyle=g;ctx.shadowBlur=18;ctx.shadowColor=c1
    ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-14,0,-12,-12,-3,-24);ctx.bezierCurveTo(-4,-11,4,-14,7,-29);ctx.bezierCurveTo(18,-12,16,1,0,10);ctx.fill()
    ctx.restore()
  }
  function lightning(x,y,len,c,w=3,a=.9) {
    ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.shadowBlur=18;ctx.shadowColor=c
    ctx.beginPath();ctx.moveTo(x,y)
    let px=x,py=y
    for(let i=0;i<4;i++){px+=(i%2?-1:1)*(8+((i*7)%11));py+=len/4}
    ctx.moveTo(x,y);px=x;py=y
    for(let i=0;i<4;i++){px+=(i%2?-1:1)*(8+((i*7)%11));py+=len/4;ctx.lineTo(px,py)}
    ctx.stroke();ctx.restore()
  }
  function trail(x,y,c1,c2,t,count=22,spread=26) {
    for(let i=0;i<count;i++){
      const d=10+i*7
      const q=t*(1.2+(i%4)*.13)+i*1.77
      const yy=y+Math.sin(q)*spread*(.35+(i%7)/7)
      line(x-d,yy,x-d-12-(i%5)*5,yy+Math.cos(q)*3,i%2?c1:c2,2+(i%3)*.8,.32-(i/count)*.12,10)
    }
  }
  function burst(x,y,c1,c2,t,count=45,size=3.2) {
    for(let i=0;i<count;i++){
      const q=i*2.399+t*(.7+(i%5)*.11)
      const d=8+((i*17)%55)
      const px=x-Math.cos(q)*d,py=y+Math.sin(q)*d
      dot(px,py,size+(i%4)*.9,i%2?c1:c2,.58,12)
    }
  }
  function shards(x,y,c1,c2,t,count=14) {
    for(let i=0;i<count;i++){
      const q=t*.8+i*1.7,d=18+(i%7)*10
      const px=x-d-Math.abs(Math.sin(i))*30,py=y+Math.sin(q)*35
      line(px-4,py-4,px+5,py+4,i%2?c1:c2,2,.42,8)
    }
  }
  function sparkleField(x,y,c1,c2,t,count=30,spread=70) {
    for(let i=0;i<count;i++){
      const q=t*(.7+(i%5)*.06)+i*1.31
      const rr=spread*(.35+(i%9)/10)
      dot(x+Math.cos(q)*rr*.75,y+Math.sin(q)*rr*.55,1.6+(i%3),i%2?c1:c2,.55,9)
    }
  }
  function afterimages(x,y,c1,c2) {
    for(let i=1;i<=4;i++){
      ctx.save();ctx.globalAlpha=.15-.02*i;ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=5-i;ctx.shadowBlur=16
      ctx.beginPath();ctx.arc(x-i*18,y,12+i*2,0,Math.PI*2);ctx.stroke();ctx.restore()
    }
  }
  function planet(x,y,r,c) {
    ctx.save();ctx.fillStyle=c;ctx.shadowBlur=18;ctx.shadowColor=c
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
    ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r*1.5,r*.35,-.2,0,Math.PI*2);ctx.stroke()
    ctx.restore()
  }
  function codeGlyph(x,y,s,c,a=.7) {
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.font='bold '+s+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle'
    ctx.fillText(['0','1','+','<','>','/','#','%'][Math.abs(Math.floor(x+y))%8],x,y);ctx.restore()
  }
  function portal(x,y,r,c1,c2,t,scale=1) {
    ring(x,y,r,c1,4,.72,t*1.7,Math.PI*1.55)
    ring(x,y,r*.72,c2,2,.9,-t*2.2,Math.PI*1.7)
    for(let i=0;i<8;i++){const q=t*1.8+i*.78;dot(x+Math.cos(q)*r*.8,y+Math.sin(q)*r*.8,2.5*scale,i%2?c1:c2,.8,10)}
  }

  function draw(id,x,y,t,age=0) {
    const pal=P[id]||P.classic, c1=pal[0], c2=pal[1]
    ctx.save()
    ctx.globalCompositeOperation='lighter'

    aura(x,y,72,c1,c2,.30)
    trail(x,y,c1,c2,t,24,26)
    afterimages(x,y,c1,c2)

    switch(id){
      case 'classic':
        ring(x,y,30+Math.sin(t*8)*5,c1,4,.95)
        burst(x,y,c1,c2,t,52,4.2)
        shards(x,y,c1,c2,t,18)
        break

      case 'flame':
        for(let i=0;i<14;i++){const q=t*3+i*1.17;flame(x-12-i*12,y+18+Math.sin(q)*15,1.05-(i*.025),c1,c2,.72,Math.sin(q)*.38)}
        burst(x-40,y,c1,c2,t,30,3.5)
        break

      case 'ice':
        for(let i=0;i<11;i++){const q=t*1.5+i*1.9,px=x-24-i*15,py=y+Math.sin(q)*28
          poly([[px,py-13],[px+9,py],[px,py+13],[px-9,py]],i%2?c1:c2,'#fff',.65,1.5)}
        for(let i=0;i<18;i++)dot(x-i*9,y+Math.sin(t*2+i)*34,2+(i%3),c1,.45,8)
        break

      case 'thunder':
        ring(x,y,38+Math.sin(t*7)*5,c1,3,.55)
        for(let i=0;i<5;i++){const ox=Math.sin(t*7+i)*34;lightning(x+ox,y-34,80,c1,4,.9)}
        for(let i=0;i<18;i++){const q=t*4+i;dot(x+Math.cos(q)*50,y+Math.sin(q)*45,2,c1,.8,10)}
        break

      case 'toxic':
        for(let i=0;i<18;i++){const q=t*.8+i*1.41,px=x-10-i*11,py=y+Math.sin(q)*34,r=5+(i%5)*1.5;dot(px,py,r,c1,.25,9);ring(px,py,r,c2,2,.45)}
        for(let i=0;i<15;i++)dot(x-20-i*12,y+Math.cos(t*1.6+i)*42,2,c2,.55,8)
        break

      case 'neon':
        ring(x,y,39+Math.sin(t*6)*7,c1,9,.65)
        ring(x,y,54+Math.sin(t*4)*9,c2,3,.9)
        ctx.save();ctx.lineWidth=8;ctx.strokeStyle=c1;ctx.shadowBlur=28;ctx.shadowColor=c1;ctx.globalAlpha=.35
        ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-55,y-20,x-115,y+28,x-200,y);ctx.stroke();ctx.restore()
        break

      case 'rainbow': {
        const cs=['#ff3b30','#ff9500','#ffd60a','#30d158','#0a84ff','#5e5ce6','#bf5af2']
        for(let j=0;j<7;j++){ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle=cs[j];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-8,y-30+j*10);ctx.bezierCurveTo(x-75,y-45+j*10,x-150,y+45+j*6,x-245,y-5+j*10);ctx.stroke();ctx.restore()}
        sparkleField(x,y,cs[Math.floor(t*2)%7],cs[(Math.floor(t*2)+3)%7],t,45,85)
        break
      }

      case 'galaxy':
        ring(x,y,42,c2,3,.75,t,Math.PI*2)
        ring(x,y,26,c1,2,.55,-t*1.5,Math.PI*2)
        for(let i=0;i<16;i++){const q=t*(.55+i*.01)+i*.95;dot(x+Math.cos(q)*(28+(i%4)*7),y+Math.sin(q)*(28+(i%4)*7),2+(i%3),i%2?c1:c2,.8,9)}
        planet(x-46+Math.sin(t)*8,y+16,9,c2);planet(x-78,y-26,5,c1)
        break

      case 'cosmic':
        for(let i=0;i<6;i++){const q=t*1.4+i*1.02,px=x-25-i*25,py=y+Math.sin(q)*32;line(px,py,px-40,py+Math.cos(q)*10,c1,3,.6,10);dot(px-43,py+Math.cos(q)*10,4,c2,.9,12)}
        sparkleField(x,y,c1,c2,t,38,90)
        break

      case 'void':
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.92;ctx.fillStyle='#000';ctx.shadowBlur=35;ctx.shadowColor=c1;ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.fill();ctx.restore()
        ring(x,y,46,c2,5,.7);ring(x,y,30,c1,2,.8,t,Math.PI*1.65)
        for(let i=0;i<9;i++){const q=t*.5+i;dot(x-28-i*17,y+Math.sin(q)*22,2,c2,.5,7)}
        break

      case 'shadow':
        for(let i=0;i<10;i++){const q=t*.7+i*1.2,px=x-20-i*15,py=y+Math.sin(q)*24
          aura(px,py,24,c1,c2,.18)
          ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(px,py,15,23,0,0,Math.PI*2);ctx.fill();ctx.restore()
        }
        ring(x,y,43,c2,4,.35)
        break

      case 'plasma':
        for(let i=0;i<8;i++){const q=t*2+i*Math.PI/4,px=x+Math.cos(q)*36,py=y+Math.sin(q)*28;dot(px,py,8,i%2?c1:c2,.9,15)}
        for(let i=0;i<8;i++){const q=t*2+i*Math.PI/4,q2=q+.78;line(x+Math.cos(q)*36,y+Math.sin(q)*28,x+Math.cos(q2)*36,y+Math.sin(q2)*28,c2,2,.65,10)}
        break

      case 'electric':
        for(let i=0;i<6;i++){const q=t*3.6+i*.95;line(x+Math.cos(q)*16,y+Math.sin(q)*18,x+Math.cos(q+.7)*54,y+Math.sin(q+.7)*45,i%2?c1:c2,3,.8,14)}
        for(let i=0;i<3;i++)lightning(x-45-i*35,y-10,95,c1,3.5,.78)
        break

      case 'inferno':
        for(let i=0;i<20;i++){const q=t*3+i*1.19;flame(x-18-i*10,y+12+Math.sin(q)*28,1.25-(i*.022),c1,c2,.72,.3*Math.sin(q))}
        burst(x-55,y,c1,c2,t,60,4.6)
        break

      case 'frost':
        aura(x,y,92,c1,c2,.22)
        for(let i=0;i<10;i++){const q=t*1.2+i*1.7,px=x-25-i*17,py=y+Math.sin(q)*32;poly([[px,py-14],[px+10,py],[px,py+14],[px-10,py]],c1,c2,.62,2)}
        for(let i=0;i<26;i++)dot(x-20-i*9,y+Math.cos(t+i)*35,1.8+(i%3),c2,.42,7)
        break

      case 'aqua':
        for(let i=0;i<4;i++){ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle=c1;ctx.lineWidth=9;ctx.beginPath();ctx.arc(x-30-i*35,y+10,48+i*7,-.9,.85);ctx.stroke();ctx.restore()}
        for(let i=0;i<24;i++){const q=t*1.2+i,px=x-10-(i%10)*15,py=y+Math.sin(q)*42;dot(px,py,3+(i%4),c2,.5,8);ring(px,py,4,c1,1,.35)}
        break

      case 'nature':
        for(let i=0;i<18;i++){const q=t*.7+i*1.2,px=x-10-i*13,py=y+Math.sin(q)*34
          ctx.save();ctx.translate(px,py);ctx.rotate(q);ctx.globalAlpha=.65;ctx.fillStyle=i%3?c1:c2;ctx.beginPath();ctx.ellipse(0,0,7,3,0,0,Math.PI*2);ctx.fill();ctx.restore()
        }
        for(let i=0;i<5;i++){const px=x-30-i*35,py=y+Math.sin(t+i)*30;dot(px,py,4,c2,.5,6);line(px,py+4,px,py+18,c1,2,.5)}
        break

      case 'wind':
        for(let i=0;i<7;i++){const q=t*1.8+i*.75;ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-5-i*12,y+Math.sin(q)*25);ctx.bezierCurveTo(x-45-i*18,y+Math.sin(q+.8)*20,x-90-i*22,y+Math.cos(q)*30,x-150-i*25,y);ctx.stroke();ctx.restore()}
        for(let i=0;i<14;i++)dot(x-20-i*11,y+Math.sin(t*2+i)*30,2,c1,.35)
        break

      case 'star':
        for(let i=0;i<22;i++){const q=t*1.4+i*.72,px=x+Math.cos(q)*(30+(i%5)*8),py=y+Math.sin(q)*(25+(i%5)*6);star(px,py,4+(i%3)*2,i%2?c1:c2,.9,q)}
        burst(x-70,y,c1,c2,t,20,3)
        break

      case 'moon':
        ring(x,y,49,c1,3,.7)
        for(let i=0;i<5;i++)crescent(x-22-i*27,y+Math.sin(t*.7+i)*25,7+i%3,c2,.65)
        for(let i=0;i<20;i++)dot(x-15-i*11,y+Math.sin(t+i)*34,1.5+(i%2),c1,.55)
        break

      case 'sun':
        ring(x,y,38,c1,6,.65)
        for(let i=0;i<16;i++){const q=i*Math.PI/8+t*.35;line(x+Math.cos(q)*38,y+Math.sin(q)*38,x+Math.cos(q)*72,y+Math.sin(q)*72,c2,4,.7,14)}
        for(let i=0;i<8;i++){const q=t+i;dot(x+Math.cos(q)*48,y+Math.sin(q)*32,6,c1,.7,16)}
        break

      case 'crystal':
        for(let i=0;i<8;i++){const q=t*.65+i*1.3,px=x-35-i*19,py=y+Math.sin(q)*28,s=13+(i%4)*3;poly([[px,py-s],[px+s*.65,py],[px,py+s],[px-s*.65,py]],i%2?c1:c2,'#fff',.62,2)}
        shards(x,y,c1,c2,t,28)
        break

      case 'golden':
        for(let i=0;i<16;i++){const q=t*1.2+i*.85,px=x-12-i*14,py=y+Math.sin(q)*30;ctx.save();ctx.translate(px,py);ctx.rotate(q);ctx.fillStyle=c1;ctx.strokeStyle=c2;ctx.lineWidth=2;ctx.shadowBlur=13;ctx.shadowColor=c1;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff8';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('G',0,1);ctx.restore()}
        burst(x-55,y,c1,c2,t,28,3.2)
        break

      case 'royal':
        ring(x,y,48,c2,5,.45)
        for(let i=0;i<8;i++){const q=t+i*.8;ctx.save();ctx.globalAlpha=.72;ctx.fillStyle=c1;ctx.font='bold 22px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=15;ctx.shadowColor=c1;ctx.fillText('♛',x-22-i*22,y+Math.sin(q)*24);ctx.restore()}
        for(let i=0;i<18;i++)dot(x-10-i*13,y+Math.cos(t+i)*35,2,c2,.45,8)
        break

      case 'dragon': {
        ctx.save();ctx.strokeStyle=c1;ctx.lineWidth=8;ctx.shadowBlur=22;ctx.shadowColor=c1;ctx.globalAlpha=.75;ctx.beginPath();ctx.moveTo(x+18,y)
        for(let i=1;i<9;i++){ctx.lineTo(x+18-i*18,y+Math.sin(t*2-i*.8)*26)}ctx.stroke();ctx.restore()
        flame(x-92,y-5,1.3,c1,c2,.8,-.2)
        burst(x-105,y,c1,c2,t,36,4.2)
        ring(x-105,y,18,c2,3,.6)
        break
      }

      case 'phoenix':
        for(const side of [-1,1]){
          ctx.save();ctx.strokeStyle=c1;ctx.lineWidth=9;ctx.shadowBlur=24;ctx.shadowColor=c1;ctx.globalAlpha=.72
          ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+side*35,y-55,x+side*78,y-72,x+side*98,y-18);ctx.bezierCurveTo(x+side*63,y-42,x+side*32,y-25,x+side*18,y+8);ctx.stroke();ctx.restore()
        }
        for(let i=0;i<12;i++)flame(x-10-i*16,y+Math.sin(t*2+i)*32,1.05,c1,c2,.68,.4*Math.sin(t+i))
        burst(x-45,y,c1,c2,t,44,3.6)
        break

      case 'cyber':
        for(let i=0;i<12;i++){const px=x-12-i*15,py=y+Math.sin(t*3+i)*35;ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=2;ctx.strokeRect(px-12,py-12,24,24);line(px-12,py+12,px+12,py-12,c1,1.5,.45);ctx.restore()}
        for(let i=0;i<18;i++)codeGlyph(x-20-i*13,y+Math.sin(t*2+i)*50,10+(i%6),i%2?c1:c2,.5)
        break

      case 'glitch':
        for(let i=0;i<30;i++){const q=t*7+i*.77,px=x-10-(i%16)*15+(Math.sin(q)*18),py=y+(i%2?1:-1)*(20+Math.sin(q*1.7)*34);ctx.save();ctx.globalAlpha=.35+(i%4)*.08;ctx.fillStyle=i%2?c1:c2;ctx.shadowBlur=10;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(px,py,8+(i%5)*7,3+(i%3)*3);ctx.restore()}
        ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle=c1;ctx.lineWidth=4;ctx.setLineDash([8,5]);ctx.strokeRect(x-38,y-42,76,84);ctx.setLineDash([]);ctx.restore()
        break

      case 'portal':
        for(let i=0;i<3;i++)portal(x-65-i*42,y+Math.sin(t+i)*18,30+i*4,c1,c2,t+i)
        break

      case 'matrix':
        for(let i=0;i<20;i++){const px=x-15-(i%10)*19,py=y-70+((t*(45+(i%4)*15)+i*17)%150);codeGlyph(px,py,12+(i%5),c1,.72)}
        for(let i=0;i<7;i++)line(x-i*35,y+40,x-i*35,y+95,c1,1,.25)
        break

      case 'pink':
        aura(x,y,90,c1,c2,.23)
        for(let i=0;i<35;i++){const q=t*1.1+i*.62,px=x-5-i*10,py=y+Math.sin(q)*42;heart(px,py,0.34+(i%3)*.08,i%2?c1:c2,.58)}
        for(let i=0;i<14;i++)star(x-10-i*17,y+Math.cos(t+i)*35,3,c2,.62)
        break

      case 'quantum':
        for(let i=0;i<5;i++)ring(x,y,25+i*11,i%2?c1:c2,2+i*.5,.55,t*(1+i*.17)+i,Math.PI*1.65)
        for(let i=0;i<12;i++){const q=t*2+i*.55,rr=25+((i*11)%45);dot(x+Math.cos(q)*rr,y+Math.sin(q*1.3)*rr*.62,2+(i%2),i%2?c1:c2,.72,12)}
        for(let i=0;i<6;i++){const px=x-25-i*24,py=y+Math.sin(t*4+i)*30;line(px-8,py-12,px,py, c2,2,.65,8);line(px,py,px+9,py+12,c1,2,.65,8)}
        break

      case 'infinite': {
        const ids=['flame','thunder','galaxy','portal','crystal','rainbow','cosmic']
        for(let i=0;i<ids.length;i++){const q=i+Math.floor(t*1.4);drawMini(ids[q%ids.length],x-i*18,y+Math.sin(t*2+i)*14,t+i)}
        ring(x,y,62,c1,5,.62);ring(x,y,46,c2,3,.7,-t*1.5)
        sparkleField(x,y,c1,c2,t,55,105)
        break
      }

      case 'secret': {
        const ids=['flame','ice','thunder','galaxy','portal','glitch','matrix','cosmic','quantum']
        for(let i=0;i<ids.length;i++){const idx=(i+Math.floor(t*2.2))%ids.length;drawMini(ids[idx],x-i*14,y+Math.sin(t*1.7+i)*20,t+i)}
        for(let i=0;i<9;i++){const q=t*.8+i*1.2;portal(x-70-Math.cos(q)*18,y+Math.sin(q)*40,18+(i%3)*4,c1,c2,t+i,.8)}
        for(let i=0;i<7;i++){const q=t*1.4+i;ctx.save();ctx.globalAlpha=.65;ctx.fillStyle=i%2?c1:c2;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText(['?','#','∆','∞','∎','Ø','§'][i],x-20-i*25,y+Math.sin(q)*55);ctx.restore()}
        ring(x,y,78,c1,5,.38,t,Math.PI*1.5)
        break
      }
    }

    ctx.restore()
    ctx.globalAlpha=1
  }

  // Compact versions used only inside the two top rarity effects.
  function drawMini(id,x,y,t){
    const [c1,c2]=P[id]||P.classic
    if(id==='flame'){for(let i=0;i<4;i++)flame(x-i*18,y+Math.sin(t+i)*12,1,c1,c2,.5);return}
    if(id==='thunder'){for(let i=0;i<2;i++)lightning(x-i*22,y-18,48,c1,2,.65);return}
    if(id==='galaxy'){ring(x,y,24,c2,2,.45,t);for(let i=0;i<5;i++){const q=t+i;dot(x+Math.cos(q)*20,y+Math.sin(q)*15,2,c1,.65);};return}
    if(id==='portal'){portal(x,y,20,c1,c2,t);return}
    if(id==='crystal'){for(let i=0;i<3;i++)poly([[x-12-i*8,y],[x-i*8,y-10],[x+12-i*8,y],[x-i*8,y+10]],c1,c2,.45,1);return}
    if(id==='rainbow'){for(let i=0;i<4;i++)line(x-i*14,y-8+i*5,x-i*14-34,y+10+i*5,['#ff3b30','#ffd60a','#30d158','#8b5cf6'][i],2,.4);return}
    if(id==='cosmic'){line(x,y,x-32,y+Math.sin(t)*8,c1,2,.55);dot(x-35,y+Math.sin(t)*8,3,c2,.7);return}
    if(id==='glitch'){ctx.save();ctx.globalAlpha=.4;ctx.fillStyle=c1;ctx.fillRect(x-15,y-8,25,5);ctx.fillStyle=c2;ctx.fillRect(x-8,y+2,31,4);ctx.restore();return}
    if(id==='matrix'){for(let i=0;i<4;i++)codeGlyph(x-i*9,y-14+i*9,8,c1,.6);return}
    if(id==='quantum'){ring(x,y,18,c1,2,.4,t);dot(x+Math.cos(t)*20,y+Math.sin(t)*12,2,c2,.7);return}
    if(id==='ice'){poly([[x,y-9],[x+6,y],[x,y+9],[x-6,y]],c1,c2,.45,1);return}
  }

  function loop(now){
    requestAnimationFrame(loop)
    if(!ctx||!canvas)return
    const G=window.__IR_G
    if(!G||!G.running||!(G.dashT>0)){
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
      dashWasActive=false
      return
    }
    const p=G.player
    if(!p)return
    const d=window.devicePixelRatio||1
    ctx.setTransform(d,0,0,d,0,0)
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
    const x=p.x+p.w*.42,y=p.y+p.h*.5
    if(G.dashT>0&&!dashWasActive){dashWasActive=true;dashStartedAt=now}
    if(G.dashT<=0)dashWasActive=false
    selectedDashId=pickDash()
    draw(selectedDashId,x,y,now/1000,Math.max(0,(now-dashStartedAt)/1000))
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup)
  else setup()
})()
