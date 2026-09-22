(() => {
  'use strict'

  function install() {
    const original = window.IR_WORLD_BG_DRAW
    if (typeof original !== 'function' || window.__IR_CLEAN_WORLD_INSTALLED) return
    window.__IR_CLEAN_WORLD_INSTALLED = true

    const circle = (c,x,y,r,fill,a=1) => { c.globalAlpha=a; c.fillStyle=fill; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); c.globalAlpha=1 }
    const line = (c,x1,y1,x2,y2,stroke,w=2,a=1) => { c.globalAlpha=a; c.strokeStyle=stroke; c.lineWidth=w; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.globalAlpha=1 }
    const rect = (c,x,y,w,h,fill,a=1) => { c.globalAlpha=a; c.fillStyle=fill; c.fillRect(x,y,w,h); c.globalAlpha=1 }

    window.IR_WORLD_BG_DRAW = function(ctx,W,H,w){
      const id = w?.theme || 'city'
      const gy = H - 118

      // CITY : on garde l'identité de la ville, mais on retire les gros immeubles.
      // Le ciel, les néons, la route et les lumières restent visibles.
      if(id === 'city'){
        ctx.save()
        const grd=ctx.createLinearGradient(0,0,0,gy)
        grd.addColorStop(0,'#08213f')
        grd.addColorStop(1,'#03060f')
        ctx.fillStyle=grd
        ctx.fillRect(0,0,W,gy)
        for(let i=0;i<55;i++){
          const x=(i*113+performance.now()*.012)%W
          const y=25+(i*47)%(gy-55)
          circle(ctx,x,y,1.2,'#9ceaff',.35)
        }
        // silhouettes basses uniquement, pour donner l'impression d'une ville sans cacher le monde
        for(let i=0;i<7;i++){
          const x=i*190-((performance.now()*.035)%190)
          rect(ctx,x,gy-42,118,42,'#0b2944',.55)
          for(let j=0;j<4;j++) rect(ctx,x+15+j*24,gy-29,10,5,i%2?'#00e5ff':'#ff3cf2',.5)
        }
        for(let i=0;i<8;i++){
          const x=(i*150-(performance.now()*.05%150))
          line(ctx,x,gy-95,x,gy-55,'#00e5ff',2,.22)
        }
        ctx.restore()
        return
      }

      // CYBER : plus de façades massives ; uniquement circuits, hologrammes et ciel.
      if(id === 'cyber'){
        ctx.save()
        const grd=ctx.createLinearGradient(0,0,0,gy)
        grd.addColorStop(0,'#071f2b'); grd.addColorStop(1,'#02070a')
        ctx.fillStyle=grd; ctx.fillRect(0,0,W,gy)
        for(let i=0;i<18;i++){
          const x=(i*91+performance.now()*.025)%W
          const y=45+(i*37)%(gy-80)
          line(ctx,x,y,x+38,y,'#00ff9d',1.5,.45)
          line(ctx,x+19,y-19,x+19,y+19,'#00ff9d',1.5,.25)
        }
        for(let i=0;i<9;i++){
          const x=(i*170-performance.now()*.04)%W
          const y=100+(i%3)*75
          rect(ctx,x,y,76,34,'#00ff9d',.05)
          line(ctx,x,y,x+76,y,'#00ff9d',2,.45)
          line(ctx,x+76,y,x+76,y+34,'#00ff9d',2,.45)
          line(ctx,x+76,y+34,x,y+34,'#00ff9d',2,.45)
          line(ctx,x,y+34,x,y,'#00ff9d',2,.45)
        }
        ctx.restore()
        return
      }

      // Tous les autres mondes gardent leur décor actuel intact.
      original(ctx,W,H,w)
    }
  }

  install()
  setTimeout(install,0)
  setTimeout(install,50)
})()
