/* ================= SUPABASE =================
   Configuration publique du jeu.
   IMPORTANT : une clé ANON peut être utilisée côté navigateur.
   Ne mets JAMAIS la clé service_role ici.

   Vercel : les variables doivent s'appeler exactement :
   SUPABASE_URL
   SUPABASE_ANON_KEY

   Comme le jeu est une page HTML statique, on garde aussi les valeurs
   publiques directement ici afin que le jeu fonctionne sur GitHub/Vercel.
*/
window.IR_CONFIG = {
  SUPABASE_URL: 'https://cgodpoxubzrggyezzvth.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZ29kcG94dWJ6cmdneWV6enZ0aCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg5Mzg4Mzc1LCJleHAiOjIxMDQ5NjQzNzV9.fkA5ih8xU3rIJe7u8p4c0dfiJmzmCmTzUo9md5L4wcU',
  ADMIN_USERNAME: 'Rubansu1'
};

/*
   NE PAS intercepter les clics de la page ici.
   Le jeu définit lui-même guest(), auth() et boot().
   L'ancien système de secours appelait guest() depuis un autre scope
   et pouvait provoquer : "Cannot access 'isGuest' before initialization".
*/
