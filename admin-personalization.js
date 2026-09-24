/* Admin: grant personalization items without touching the core Admin editor. */
(() => {
  'use strict'
  const cfg = window.IR_CONFIG || {}
  const sb = window.supabase && cfg.SUPABASE_URL
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null

  const catalog = {
    world: (window.IR_PACK_CATALOG?.world || [['city','🌃','CITY'],['forest','🌲','FOREST'],['desert','🏜️','DESERT'],['space','🚀','SPACE'],['dark','🌑','DARK'],['volcano','🌋','VOLCANO'],['ice','❄️','ICE']]),
    character: (window.IR_PACK_CATALOG?.character || [['runner','🧑','RUNNER'],['ninja','🥷','NINJA'],['robot','🤖','ROBOT'],['ghost','👻','GHOST'],['cyber','🦾','CYBER']]),
    coin: (window.IR_PACK_CATALOG?.coin || [['gold','🪙','GOLD'],['silver','🥈','SILVER'],['bronze','🥉','BRONZE'],['blue','🔵','BLUE'],['green','🟢','GREEN'],['red','🔴','RED'],['pink','🩷','PINK'],['orange','🟠','ORANGE'],['purple','🟣','PURPLE'],['white','⚪','WHITE']]),
    obstacle: [['classic','🔺','CLASSIC'],['tech','🧱','TECH'],['drone','🚁','DRONES'],['energy','⚡','ENERGY'],['chaos','☠️','CHAOS']]
  }
  const itemTypes = { world:'background', character:'character', coin:'coin', obstacle:'obstacle' }
  let selectedPlayerId = null

  const isAdmin = () => {
    try {
      const wanted = String(cfg.ADMIN_USERNAME || 'Rubansu1').trim().toLowerCase()
      return String(window.profile?.username || '').trim().toLowerCase() === wanted
    } catch { return false }
  }

  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
  const toast = msg => {
    const el = document.getElementById('toast')
    if (!el) return
    el.textContent = msg
    el.classList.add('show')
    setTimeout(() => el.classList.remove('show'), 1900)
  }

  function rememberPlayer(e) {
    const btn = e.target?.closest?.('[data-admin-edit]')
    if (!btn) return
    selectedPlayerId = btn.dataset.adminEdit || null
  }

  async function give(type, id, status) {
    if (!isAdmin()) return toast('⛔ Accès admin refusé.')
    if (!sb || !selectedPlayerId || !id) return
    const itemType = itemTypes[type]
    status.textContent = '⏳ Attribution...'
    const { data: existing, error: findError } = await sb.from('inventory')
      .select('id')
      .eq('user_id', selectedPlayerId)
      .eq('item_type', itemType)
      .eq('item_id', id)
      .maybeSingle()
    if (findError) { status.textContent = '❌ ' + findError.message; return }
    if (!existing) {
      const { error } = await sb.from('inventory').insert({ user_id:selectedPlayerId, item_type:itemType, item_id:id })
      if (error) { status.textContent = '❌ ' + error.message; return }
    }
    status.textContent = '✅ Objet donné !'
    toast('🎁 ' + id + ' débloqué pour le joueur !')
  }

  function buildPanel(editor) {
    if (!isAdmin() || !selectedPlayerId || !editor || editor.querySelector('#adminPersonalization')) return
    const panel = document.createElement('div')
    panel.id = 'adminPersonalization'
    panel.className = 'card'
    panel.style.cssText = 'margin-top:14px;border-color:#00e5ff'
    panel.innerHTML = '<h3>🎨 Donner de la personnalisation</h3>' +
      '<p class="muted">Débloque directement des éléments de la personnalisation pour ce joueur.</p>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
      Object.keys(catalog).map(type => {
        const title = type === 'world' ? '🌍 Monde' : type === 'character' ? '🧑 Personnage' : type === 'coin' ? '🪙 Pièce' : '💥 Obstacles'
        const options = catalog[type].map(x => '<option value="' + esc(x[0]) + '">' + esc(x[1] + ' ' + x[2]) + '</option>').join('')
        return '<div><label style="display:block;margin-bottom:6px">' + title + '</label>' +
          '<select data-ap-type="' + type + '" style="width:100%">' + options + '</select>' +
          '<button type="button" data-ap-give="' + type + '" style="width:100%;margin-top:7px">🎁 DONNER</button></div>'
      }).join('') +
      '</div><div id="adminPersonalizationStatus" class="muted" style="margin-top:8px"></div>'

    const saveRow = editor.querySelector('#btnAdminSave')?.parentElement
    if (saveRow) saveRow.before(panel)
    else editor.appendChild(panel)

    const status = panel.querySelector('#adminPersonalizationStatus')
    panel.querySelectorAll('[data-ap-give]').forEach(btn => btn.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation()
      const type = btn.dataset.apGive
      const select = panel.querySelector('[data-ap-type="' + type + '"]')
      await give(type, select?.value, status)
    }))
  }

  document.addEventListener('click', rememberPlayer, true)
  const observer = new MutationObserver(() => {
    const editor = document.getElementById('adminEditor')
    if (editor) buildPanel(editor)
  })
  observer.observe(document.body, { childList:true, subtree:true })
})()
