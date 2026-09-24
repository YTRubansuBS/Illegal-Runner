/* Admin: grant personalization items to the player currently opened in Admin. */
(() => {
  'use strict'

  const cfg = window.IR_CONFIG || {}
  const sb = window.supabase && cfg.SUPABASE_URL
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null

  const FALLBACK = {
    world: [
      ['city','🌃','CITY'],['forest','🌲','FOREST'],['desert','🏜️','DESERT'],['space','🚀','SPACE'],
      ['dark','🌑','DARK'],['volcano','🌋','VOLCANO'],['ice','❄️','ICE'],['neon','🌌','NEON'],
      ['ocean','🌊','OCEAN'],['sky','☁️','SKY'],['sunset','🌇','SUNSET'],['jungle','🌴','JUNGLE'],
      ['candy','🍬','CANDY'],['lava','🔥','LAVA'],['moon','🌙','MOON'],['storm','⛈️','STORM'],
      ['cyber','💻','CYBER'],['crystal','💎','CRYSTAL'],['toxic','☢️','TOXIC'],['void','🕳️','VOID'],
      ['aurora','🌌','AURORA'],['matrix','🟩','MATRIX'],['rainbow','🌈','RAINBOW'],['galaxy','🌠','GALAXY'],
      ['temple','🏛️','TEMPLE'],['castle','🏰','CASTLE'],['volcanic','🌋','VOLCANIC'],['quantum','⚛️','QUANTUM'],
      ['dream','💫','DREAM'],['glitch','👾','GLITCH'],['dragon','🐉','DRAGON'],['portal','🌀','PORTAL'],
      ['cosmic','☄️','COSMIC'],['secret','🗝️','SECRET']
    ],
    character: [
      ['runner','🧑','RUNNER'],['ninja','🥷','NINJA'],['robot','🤖','ROBOT'],['ghost','👻','GHOST'],
      ['cyber','🦾','CYBER'],['pilot','🧑‍✈️','PILOT'],['soldier','🪖','SOLDIER'],['wizard','🧙','WIZARD'],
      ['astronaut','🧑‍🚀','ASTRONAUT'],['skater','🛹','SKATER'],['samurai','👺','SAMURAI'],['pirate','🏴‍☠️','PIRATE'],
      ['detective','🕵️','DETECTIVE'],['vampire','🧛','VAMPIRE'],['zombie','🧟','ZOMBIE'],['alien','👽','ALIEN'],
      ['king','🤴','KING'],['queen','👸','QUEEN'],['knight','🛡️','KNIGHT'],['racer','🏎️','RACER'],
      ['dragon','🐉','DRAGON'],['phoenix','🔥','PHOENIX'],['shadow','🌑','SHADOW'],['thunder','⚡','THUNDER'],
      ['ice','❄️','ICE'],['flame','🔥','FLAME'],['cosmic','🌌','COSMIC'],['cyborg','🤖','CYBORG'],
      ['reaper','💀','REAPER'],['angel','😇','ANGEL'],['demon','😈','DEMON'],['time','⏳','TIME'],
      ['void','🕳️','VOID'],['secret','👁️','SECRET']
    ],
    coin: [
      ['gold','🪙','GOLD'],['silver','🥈','SILVER'],['bronze','🥉','BRONZE'],['blue','🔵','BLUE'],
      ['green','🟢','GREEN'],['red','🔴','RED'],['pink','🩷','PINK'],['orange','🟠','ORANGE'],
      ['purple','🟣','PURPLE'],['white','⚪','WHITE'],['diamond','💎','DIAMOND'],['emerald','💚','EMERALD'],
      ['ruby','❤️','RUBY'],['sapphire','🔷','SAPPHIRE'],['amethyst','🟪','AMETHYST'],['topaz','🔶','TOPAZ'],
      ['pearl','🦪','PEARL'],['crystal','🔮','CRYSTAL'],['neon','💠','NEON'],['star','⭐','STAR'],
      ['moon','🌙','MOON'],['sun','☀️','SUN'],['fire','🔥','FIRE'],['ice','❄️','ICE'],
      ['thunder','⚡','THUNDER'],['rainbow','🌈','RAINBOW'],['galaxy','🌌','GALAXY'],['cosmic','☄️','COSMIC'],
      ['void','🕳️','VOID'],['crown','👑','CROWN'],['dragon','🐉','DRAGON'],['glitch','👾','GLITCH'],
      ['infinite','♾️','INFINITE'],['secret','🔐','SECRET']
    ],
    obstacle: [
      ['classic','🔺','CLASSIC'],['tech','🧱','TECH'],['drone','🚁','DRONES'],['energy','⚡','ENERGY'],['chaos','☠️','CHAOS']
    ]
  }

  let selectedPlayerId = null
  let selectedPlayerName = null

  const getCatalog = () => {
    const live = window.IR_PACK_CATALOG || {}
    return {
      world: Array.isArray(live.world) && live.world.length ? live.world : FALLBACK.world,
      character: Array.isArray(live.character) && live.character.length ? live.character : FALLBACK.character,
      coin: Array.isArray(live.coin) && live.coin.length ? live.coin : FALLBACK.coin,
      obstacle: FALLBACK.obstacle
    }
  }

  const itemTypes = {
    world: 'background',
    character: 'character',
    coin: 'coin',
    obstacle: 'obstacle'
  }

  const esc = value => String(value ?? '').replace(/[&<>"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  }[c]))

  const toast = message => {
    const el = document.getElementById('toast')
    if (!el) return
    el.textContent = message
    el.classList.add('show')
    setTimeout(() => el.classList.remove('show'), 1900)
  }

  // The real security check is done by the Supabase RPC. On the client we only
  // use Admin's already-rendered editor as the signal that the user opened it.
  const isAdminEditorOpen = () => !!document.getElementById('adminEditor')

  function rememberPlayer(e) {
    const target = e.target
    const edit = target?.closest?.('[data-admin-edit]')
    if (edit?.dataset?.adminEdit) {
      selectedPlayerId = edit.dataset.adminEdit
      const card = edit.closest('[data-admin-player]')
      selectedPlayerName = card?.querySelector('b')?.textContent?.replace(/^👤\s*/, '') || null
      setTimeout(() => buildForCurrentEditor(), 0)
      return
    }

    const card = target?.closest?.('[data-admin-player]')
    if (card?.dataset?.adminPlayer) {
      selectedPlayerId = card.dataset.adminPlayer
      selectedPlayerName = card.querySelector('b')?.textContent?.replace(/^👤\s*/, '') || null
      setTimeout(() => buildForCurrentEditor(), 0)
    }
  }

  async function give(type, id, status) {
    if (!isAdminEditorOpen()) {
      status.textContent = '❌ Ouvre d’abord un joueur avec MODIFIER.'
      return
    }
    if (!sb) {
      status.textContent = '❌ Supabase indisponible.'
      return
    }
    if (!selectedPlayerId) {
      status.textContent = '❌ Joueur non sélectionné. Clique sur MODIFIER.'
      return
    }
    if (!id) {
      status.textContent = '❌ Objet invalide.'
      return
    }

    status.textContent = '⏳ Attribution...'

    const { data, error } = await sb.rpc('admin_grant_inventory', {
      p_target_user: selectedPlayerId,
      p_item_type: itemTypes[type],
      p_item_id: id
    })

    if (error) {
      const msg = String(error.message || error)
      status.textContent = '❌ ' + msg
      if (/admin_grant_inventory|function .* does not exist|schema cache/i.test(msg)) {
        status.textContent = '❌ RPC admin_grant_inventory manquante dans Supabase.'
        toast('⚠️ Exécute le SQL admin dans Supabase.')
      }
      return
    }

    if (data !== true) {
      status.textContent = '❌ Attribution refusée.'
      return
    }

    status.textContent = '✅ Objet donné à ' + (selectedPlayerName || 'ce joueur') + ' !'
    toast('🎁 ' + id + ' débloqué pour ' + (selectedPlayerName || 'le joueur') + ' !')
  }

  function buildPanel(editor) {
    if (!editor || editor.querySelector('#adminPersonalization')) return
    if (!isAdminEditorOpen()) return

    const catalog = getCatalog()
    const panel = document.createElement('div')
    panel.id = 'adminPersonalization'
    panel.className = 'card'
    panel.style.cssText = 'margin-top:14px;border:1px solid #00e5ff;box-shadow:0 0 18px rgba(0,229,255,.12)'

    const sections = Object.keys(catalog).map(type => {
      const title = {
        world: '🌍 MONDES',
        character: '🧑 PERSONNAGES',
        coin: '🪙 PIÈCES',
        obstacle: '💥 OBSTACLES'
      }[type]

      const options = catalog[type]
        .map(item => '<option value="' + esc(item[0]) + '">' + esc(item[1] + ' ' + item[2]) + '</option>')
        .join('')

      return '<div>' +
        '<label style="display:block;margin-bottom:6px;font-weight:800">' + title + '</label>' +
        '<select data-ap-type="' + type + '" style="width:100%;box-sizing:border-box">' + options + '</select>' +
        '<button type="button" data-ap-give="' + type + '" style="width:100%;margin-top:7px">🎁 DONNER</button>' +
        '</div>'
    }).join('')

    panel.innerHTML =
      '<h3>🎨 DONNER DE LA PERSONNALISATION</h3>' +
      '<p class="muted">Donne directement au joueur sélectionné des mondes, personnages, pièces ou styles d’obstacles.</p>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' + sections + '</div>' +
      '<div id="adminPersonalizationStatus" class="muted" style="margin-top:10px"></div>'

    const saveButton = editor.querySelector('#btnAdminSave') || editor.querySelector('#adminSaveEdit')
    if (saveButton?.parentElement) {
      saveButton.parentElement.before(panel)
    } else {
      editor.appendChild(panel)
    }

    const status = panel.querySelector('#adminPersonalizationStatus')
    panel.querySelectorAll('[data-ap-give]').forEach(button => {
      button.addEventListener('click', async e => {
        e.preventDefault()
        e.stopPropagation()
        const type = button.dataset.apGive
        const select = panel.querySelector('[data-ap-type="' + type + '"]')
        button.disabled = true
        await give(type, select?.value, status)
        button.disabled = false
      })
    })
  }

  function buildForCurrentEditor() {
    const editor = document.getElementById('adminEditor')
    if (!editor) return
    buildPanel(editor)
  }

  // Capture several pointer/mouse paths before the original Admin onclick runs.
  document.addEventListener('pointerdown', rememberPlayer, true)
  document.addEventListener('mousedown', rememberPlayer, true)
  document.addEventListener('click', rememberPlayer, true)
  document.addEventListener('touchstart', rememberPlayer, true)

  const observer = new MutationObserver(() => {
    buildForCurrentEditor()
  })

  const start = () => {
    if (!document.body) return
    observer.observe(document.body, {childList:true, subtree:true})
    buildForCurrentEditor()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true})
  } else {
    start()
  }
})()
