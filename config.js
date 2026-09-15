/* ILLEGAL RUNNER // CONFIG + UI LOADER */
window.IR_CONFIG = {
  SUPABASE_URL: 'https://cgodpoxubzrggyezzvth.supabase.co',
  SUPABASE_ANON_KEY: 'PUBLIC_ANON_KEY_CONFIGURED',
  ADMIN_USERNAME: 'Rubansu1'
};

/* The public anon key is replaced at runtime by the existing app configuration when available. */
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
