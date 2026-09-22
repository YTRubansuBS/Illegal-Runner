(()=>{
  'use strict'
  const RENDERER='https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/b9df72d4344ffb1f2cea497d3fb843194b498e89/character-effects.js'
  const ENGINE='https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  const nativeFetch=window.fetch.bind(window)
  window.fetch=function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||''
    if(url===ENGINE){
      return nativeFetch(input,init).then(async response=>{
        const source=await response.text()
        const marker='  function drawPlayer(ctx, w) {'
        const inject='  function drawPlayer(ctx, w) {\n    const p = G.player\n    if (window.IR_CHARACTER_SET && profile && profile.selected_character) window.IR_CHARACTER_SET(profile.selected_character)\n    if (window.IR_CHARACTER_DRAW) { try { if (window.IR_CHARACTER_DRAW(ctx, w, p, G)) return } catch (e) { console.warn("[IR] character renderer fallback", e) } }'
        const patched=source.includes(marker)?source.replace(marker,inject):source
        return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers})
      })
    }
    return nativeFetch(input,init)
  }
  nativeFetch(RENDERER,{cache:'no-store'}).then(r=>r.text()).then(code=>{new Function(code)()}).catch(e=>console.error('[IR] character renderer load:',e))
})()