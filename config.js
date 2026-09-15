/* ILLEGAL RUNNER // CONFIG + UI LOADER */
window.IR_CONFIG = {
  SUPABASE_URL: 'https://cgodpoxubzrggyezzvth.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjZ29kcG94dWJ6cmdneWV6enZ0aCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg5Mzg4Mzc1LCJleHAiOjIxMDQ5NjQzNzV9.fkA5ih8xU3rIJe7u8p4c0dfiJmzmCmTzUo9md5L4wcU',
  ADMIN_USERNAME: 'Rubansu1'
};

(() => {
  const load = () => {
    if (!document.getElementById('ir-neon-overhaul')) {
      const css = document.createElement('link');
      css.id = 'ir-neon-overhaul';
      css.rel = 'stylesheet';
      css.href = 'neon-overhaul.css?v=2';
      document.head.appendChild(css);
    }
    if (!document.getElementById('ir-ui-fix')) {
      const s = document.createElement('script');
      s.id = 'ir-ui-fix';
      s.src = 'ui.js?v=4';
      s.defer = true;
      document.head.appendChild(s);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();
