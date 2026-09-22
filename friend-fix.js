/* ILLEGAL RUNNER — FRIEND FIX
   Compatibility layer only.
   The main friend system is implemented in game.js and matches
   social-trade-duel-all.sql (friend_send_request/get_my_friends/
   friend_respond/friend_remove). This file intentionally does not
   register duplicate handlers or rewrite #friendList.
*/
(() => {
  'use strict'
  window.IR_FRIEND_FIX_READY = true
  window.dispatchEvent(new CustomEvent('ir:friendFixReady'))
})()
