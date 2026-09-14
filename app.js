(function(){
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload=()=>{const g=document.createElement('script');g.src='game.js';document.body.appendChild(g)};
  s.onerror=()=>{document.body.innerHTML='<div style="padding:30px;font-family:Arial">Impossible de charger le service de sauvegarde.</div>'};
  document.head.appendChild(s);
})();