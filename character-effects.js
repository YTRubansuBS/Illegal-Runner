(()=>{
  const SRC='https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/b9df72d4344ffb1f2cea497d3fb843194b498e89/character-effects.js'
  fetch(SRC,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('character renderer load failed');return r.text()}).then(code=>{
    new Function(code)()
    const originalSet=window.IR_CHARACTER_SET
    window.IR_CHARACTER_SET=function(id){if(originalSet)originalSet(id)}
    const sync=e=>{const id=e&&e.detail&&e.detail.selected_character;if(id&&window.IR_CHARACTER_SET)window.IR_CHARACTER_SET(id)}
    window.addEventListener('ir:profileLoaded',sync)
    window.addEventListener('ir:customizationChanged',sync)
    window.IR_CHARACTER_RENDER_READY=true
  }).catch(e=>console.error('[IR] character renderer:',e))
})()