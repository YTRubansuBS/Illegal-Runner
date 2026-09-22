/* ILLEGAL RUNNER — FRIEND FIX 2.0
   Compatible with social-trade-duel-all.sql already installed in Supabase.
*/
(() => {
  'use strict'

  const $ = id => document.getElementById(id)
  const clean = v => String(v || '').trim().replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 20)
  const esc = v => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))
  let sb = null
  let me = null
  let busy = false

  function toast(t) {
    if (typeof window.toast === 'function') window.toast(t)
    else alert(t)
  }

  async function initClient() {
    if (!window.supabase || !window.IR_CONFIG?.SUPABASE_URL) return false
    if (!sb) sb = window.supabase.createClient(window.IR_CONFIG.SUPABASE_URL, window.IR_CONFIG.SUPABASE_ANON_KEY)
    const q = await sb.auth.getSession()
    me = q.data?.session?.user || null
    return !!me
  }

  async function rpc(name, args) {
    if (!sb) throw new Error('Supabase indisponible.')
    const r = await sb.rpc(name, args || {})
    if (r.error) throw r.error
    return r.data
  }

  function otherId(row) {
    if (!me || !row) return null
    return row.user_id === me.id ? row.friend_id : row.user_id
  }

  function otherName(row) {
    return row.friend_username || row.username || 'Joueur'
  }

  function rowHtml(row) {
    const other = otherId(row)
    const name = esc(otherName(row))
    const status = String(row.status || '')
    const distance = Number(row.friend_best_distance || 0)

    if (!other) return ''

    if (status === 'pending' && row.friend_id === me.id) {
      return '<div class="friend" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;border-color:#ffd84a">' +
        '<span style="flex:1;min-width:170px">👤 <b>' + name + '</b><small class="muted" style="display:block">📨 Demande reçue</small></span>' +
        '<button type="button" data-friend-accept="' + esc(row.id) + '" class="primary">✅ ACCEPTER</button>' +
        '<button type="button" data-friend-decline="' + esc(row.id) + '" class="danger">❌ REFUSER</button>' +
      '</div>'
    }

    if (status === 'pending') {
      return '<div class="friend" data-trade-friend-id="' + esc(other) + '" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;border-color:#4da6ff">' +
        '<span style="flex:1;min-width:170px">👤 <b>' + name + '</b><small class="muted" style="display:block">⏳ Demande envoyée</small></span>' +
        '<span class="muted">En attente…</span>' +
      '</div>'
    }

    if (status === 'accepted') {
      return '<div class="friend" data-trade-friend-id="' + esc(other) + '" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">' +
        '<span style="flex:1;min-width:170px">👤 <b>' + name + '</b></span>' +
        '<b>🏆 ' + distance.toLocaleString('fr-FR') + 'm</b>' +
        '<button type="button" data-friend-trade="' + esc(other) + '">🔄 ÉCHANGER</button>' +
        '<button type="button" data-friend-duel="' + esc(other) + '">⚔️ 1V1</button>' +
        '<button type="button" data-friend-remove="' + esc(row.id) + '" class="danger">🗑️</button>' +
      '</div>'
    }

    return '<div class="friend" data-trade-friend-id="' + esc(other) + '" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">' +
      '<span style="flex:1;min-width:170px">👤 <b>' + name + '</b></span>' +
      '<span class="muted">' + esc(status) + '</span>' +
    '</div>'
  }

  async function renderFriends() {
    const box = $('friendList')
    if (!box || !sb || !me) return
    try {
      const data = await rpc('get_my_friends')
      const rows = Array.isArray(data) ? data : []
      box.innerHTML = rows.length
        ? rows.map(rowHtml).join('')
        : '<div class="card">👥 Aucun ami pour le moment.</div>'
      window.dispatchEvent(new Event('ir:friendsRendered'))
    } catch (e) {
      console.error('[IR] friends render:', e)
      box.innerHTML = '<div class="card">⚠️ Impossible de charger tes amis pour le moment.</div>'
    }
  }

  async function sendFriend() {
    const btn = $('btnAddFriend')
    const input = $('friendName')
    const name = clean(input?.value)
    if (!name || busy) return
    busy = true
    if (btn) { btn.disabled = true; btn.textContent = 'ENVOI…' }
    try {
      const data = await rpc('friend_send_request', { p_username: name })
      input.value = ''
      toast('✅ Demande envoyée à ' + (data?.friend_username || name) + ' !')
      await renderFriends()
    } catch (e) {
      const msg = String(e?.message || e)
      const translated = {
        PLAYER_NOT_FOUND: '❌ Joueur introuvable.',
        SELF_FRIEND: '❌ Tu ne peux pas t’ajouter toi-même.',
        ALREADY_FRIENDS: '👥 Vous êtes déjà amis.',
        REQUEST_ALREADY_SENT: '📨 Demande déjà envoyée.',
        REQUEST_ALREADY_RECEIVED: '📨 Cette personne t’a déjà envoyé une demande.',
        BLOCKED: '🚫 Cette relation est bloquée.'
      }
      toast(translated[msg] || msg)
    } finally {
      busy = false
      if (btn) { btn.disabled = false; btn.textContent = 'AJOUTER' }
    }
  }

  async function respondRequest(id, accept) {
    try {
      await rpc('friend_respond', { p_request_id: Number(id), p_accept: !!accept })
      toast(accept ? '✅ Ami ajouté !' : '❌ Demande refusée.')
      await renderFriends()
    } catch (e) {
      toast('❌ ' + String(e?.message || e))
    }
  }

  async function removeFriend(id) {
    try {
      await rpc('friend_remove', { p_request_id: Number(id) })
      toast('🗑️ Ami supprimé.')
      await renderFriends()
    } catch (e) {
      toast('❌ ' + String(e?.message || e))
    }
  }

  function installEvents() {
    const box = $('friendList')
    const btn = $('btnAddFriend')

    if (btn && btn.dataset.irFriendFix2 !== '1') {
      btn.dataset.irFriendFix2 = '1'
      btn.addEventListener('click', e => { e.preventDefault(); sendFriend() })
    }

    if (box && box.dataset.irFriendEvents !== '1') {
      box.dataset.irFriendEvents = '1'
      box.addEventListener('click', async e => {
        const accept = e.target.closest('[data-friend-accept]')
        const decline = e.target.closest('[data-friend-decline]')
        const remove = e.target.closest('[data-friend-remove]')
        if (accept) { e.preventDefault(); await respondRequest(accept.dataset.friendAccept, true); return }
        if (decline) { e.preventDefault(); await respondRequest(decline.dataset.friendDecline, false); return }
        if (remove) { e.preventDefault(); await removeFriend(remove.dataset.friendRemove); return }
      })
    }
  }

  async function install() {
    if (!await initClient()) return
    installEvents()
    await renderFriends()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true })
  } else {
    install()
  }
  setTimeout(install, 700)
  setInterval(async () => {
    try {
      if (document.getElementById('friends')?.classList.contains('active')) await install()
    } catch (_) {}
  }, 2000)
})()
