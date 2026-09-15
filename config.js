/* ================= SUPABASE =================
   Configuration publique du jeu.
   IMPORTANT : une clé ANON peut être utilisée côté navigateur.
   Ne mets JAMAIS la clé service_role ici.

   Vercel : les variables doivent s'appeler exactement :
   SUPABASE_URL
   SUPABASE_ANON_KEY
*/
window.IR_CONFIG = {
  SUPABASE_URL: 'https://cgodpoxubzrggyezzvth.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZ29kcG94dWJ6cmdneWV6enZ0aCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg5Mzg4Mzc1LCJleHAiOjIxMDQ5NjQzNzV9.fkA5ih8xU3rIJe7u8p4c0dfiJmzmCmTzUo9md5L4wcU',
  ADMIN_USERNAME: 'Rubansu1'
};

/* Charge le pont UI après le chargement du document.
   Cela évite le conflit avec l'ancien scope isGuest et rend les boutons
   de connexion/local réellement cliquables. */
(() => {
  const load = () => {
    if (document.getElementById('ir-ui-fix')) return;
    const s = document.createElement('script');
    s.id = 'ir-ui-fix';
    s.src = 'ui.js?v=3';
    s.defer = true;
    document.head.appendChild(s);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();
