/* ILLEGAL RUNNER loader: keeps the original game engine and loads the customization/shop extension. */
(() => {
  const ORIGINAL = 'https://raw.githubusercontent.com/YTRubansuBS/Illegal-Runner/de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  fetch(ORIGINAL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Impossible de charger le moteur du jeu'); return r.text() })
    .then(code => {
      const s = document.createElement('script')
      s.textContent = code
      document.head.appendChild(s)
      const ext = document.createElement('script')
      ext.src = 'customizer.js?v=3'
      document.body.appendChild(ext)
    })
    .catch(err => {
      console.error(err)
      const e = document.getElementById('err')
      if (e) e.textContent = 'Erreur de chargement du jeu. Recharge la page.'
    })
})()
