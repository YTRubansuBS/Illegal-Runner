/* ================= SUPABASE =================
   Clé ANON publique uniquement. Ne mets JAMAIS la service_role ici.
*/
window.IR_CONFIG = {
  SUPABASE_URL: 'https://cgodpoxubzrggyezzvth.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnb2Rwb3h1YnpyZ2d5ZXp6dnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODgzNzUsImV4cCI6MjEwNDk2NDM3NX0.fkA5ih8xU3rIJe7u8p4c0dfiJmzmCmTzUo9md5L4wcU',
  ADMIN_USERNAME: 'Rubansu1'
};

/* Petit filet de sécurité : si le script principal a eu une erreur,
   les boutons de connexion restent quand même utilisables. */
window.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);
  const email = n => n.toLowerCase().replace(/[^a-z0-9._-]/g, '') + '@illegal-runner.local';
  const error = msg => { const e = $('err'); if (e) e.textContent = msg; };

  const localButton = document.querySelector('.mode button:first-child');
  if (localButton) localButton.addEventListener('click', function (ev) {
    ev.preventDefault(); ev.stopImmediatePropagation();
    try {
      if (typeof window.guest === 'function') return window.guest();
      const profile = JSON.parse(localStorage.getItem('irGuest') || '{"username":"Invité","coins":0,"best_distance":0,"highest_level":1,"lives_level":1,"distance_level":1,"dash_level":1,"jump_level":1,"coin_level":1,"bonus_level":1}');
      localStorage.setItem('irGuest', JSON.stringify(profile));
      const login = $('login'), app = $('app');
      if (login) login.style.display = 'none';
      if (app) app.style.display = 'flex';
    } catch (e) { error('Impossible de lancer le mode local : ' + e.message); }
  }, true);

  const buttons = document.querySelectorAll('.loginbox .row button');
  if (buttons.length >= 2) {
    buttons[0].addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (typeof window.auth === 'function') return window.auth(false);
      fallbackAuth(false);
    }, true);
    buttons[1].addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (typeof window.auth === 'function') return window.auth(true);
      fallbackAuth(true);
    }, true);
  }

  async function fallbackAuth(create) {
    try {
      const n = ($('name')?.value || '').trim();
      const p = $('pass')?.value || '';
      if (!n || p.length < 6) return error('Entre un pseudo et un mot de passe de 6 caractères minimum.');
      if (!window.supabase) return error('Le module Supabase ne se charge pas. Recharge la page.');
      const client = window.supabase.createClient(window.IR_CONFIG.SUPABASE_URL, window.IR_CONFIG.SUPABASE_ANON_KEY);
      const r = create
        ? await client.auth.signUp({ email: email(n), password: p, options: { data: { username: n } } })
        : await client.auth.signInWithPassword({ email: email(n), password: p });
      if (r.error) throw r.error;
      if (create && !r.data.session) return error('Compte créé : confirme le compte dans Supabase puis connecte-toi.');
      location.reload();
    } catch (e) { error(e.message || 'Erreur de connexion.'); }
  }
});
