(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    const $ = id => document.getElementById(id);
    const login = $('login'), app = $('app'), nameInput = $('name'), passInput = $('pass'), err = $('err');

    const style = document.createElement('style');
    style.textContent = `
      body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.18;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,229,255,.035) 4px)}
      .login{background:radial-gradient(circle at 10% 10%,#00e5ff22,transparent 25%),radial-gradient(circle at 90% 20%,#a14dff25,transparent 30%),radial-gradient(circle at 50% 100%,#ff2f7d18,transparent 35%),#02040a!important}
      .login:after{content:"ILLEGAL RUNNER // NETWORK ONLINE";position:absolute;top:18px;left:24px;color:#00e5ff99;font:900 10px/1 monospace;letter-spacing:3px}
      .loginbox{position:relative;overflow:hidden!important;width:min(560px,94vw)!important;padding:38px!important;border:1px solid #00e5ff55!important;background:linear-gradient(145deg,#071426f5,#030814f5)!important;box-shadow:0 0 60px #00e5ff12,0 30px 120px #000!important}
      .loginbox:before{content:"";position:absolute;inset:-2px;background:linear-gradient(120deg,transparent 15%,#00e5ff22 35%,transparent 50%,#a14dff18 70%,transparent 85%);transform:translateX(-60%);animation:irSweep 5s linear infinite;pointer-events:none}
      @keyframes irSweep{to{transform:translateX(60%)}}
      .logo{position:relative;letter-spacing:-3px;text-shadow:0 0 8px #00e5ff88,0 0 35px #00e5ff33!important}
      .logo:after{content:"// RUN WITHOUT LIMITS";display:block;font:900 9px/1 monospace;letter-spacing:3px;color:#8da6c7;margin-top:17px}
      .loginbox input{position:relative;border-color:#24517a!important;background:#020914!important;box-shadow:0 0 20px #00e5ff05!important}
      .loginbox input:focus{border-color:#00e5ff!important;box-shadow:0 0 0 1px #00e5ff55,0 0 24px #00e5ff18!important}
      .loginbox button{position:relative;min-height:52px;border:1px solid #2b638d!important}
      .loginbox button.primary{box-shadow:0 0 25px #00e5ff22!important}
      .mode button{min-height:112px!important;text-align:left;padding:17px!important;background:linear-gradient(145deg,#081c31,#050c18)!important}
      .mode button.pink{background:linear-gradient(145deg,#29123e,#12091e)!important}
      .mode button:hover{border-color:#00e5ff!important;box-shadow:0 0 28px #00e5ff18!important}
      .mode small{line-height:1.5}
      .app{background:radial-gradient(circle at 50% -15%,#15588a55,transparent 38%),radial-gradient(circle at 100% 100%,#8f2cff18,transparent 35%),#02040a!important}
      .top{backdrop-filter:blur(18px);box-shadow:0 5px 35px #0008}
      .tabs button{background:#071526cc;border-color:#1e466a!important}
      .tabs button:hover{border-color:#00e5ff!important;box-shadow:0 0 18px #00e5ff12}
      .panel{background:linear-gradient(145deg,#07182bd9,#030914df)!important;box-shadow:0 20px 90px #0009,0 0 0 1px #ffffff04 inset!important}
      .card{transition:.2s;border-color:#204a70!important}
      .card:hover{transform:translateY(-3px);border-color:#00e5ff77!important;box-shadow:0 12px 35px #00e5ff0d}
    `;
    document.head.appendChild(style);

    const msg = (text, ok=false) => { if(err){err.textContent=text||'';err.style.color=ok?'#54ffc1':'#ff668d';} };
    const clean = v => String(v||'').trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20);
    const emailFor = p => `${p.toLowerCase()}@illegal-runner.local`;

    function showApp(pseudo, guest){
      window.IR_USER={pseudo,guest:!!guest};
      try{localStorage.setItem('ir_last_user',pseudo);localStorage.setItem('ir_guest',guest?'1':'0');}catch(e){}
      if(login) login.style.display='none';
      if(app) app.style.display='flex';
      const title=document.querySelector('.top b');
      if(title){let badge=$('userBadge');if(!badge){badge=document.createElement('span');badge.id='userBadge';title.appendChild(badge);}badge.textContent=` ${pseudo}`;badge.style.cssText='font-size:11px;color:#8da6c7;font-style:normal;margin-left:7px';}
      try{if(typeof window.tab==='function')window.tab('home');}catch(e){}
      try{if(typeof window.boot==='function')window.boot();}catch(e){}
      msg('',true);
    }

    window.focusAccount=()=>{nameInput?.focus();msg('Entre ton pseudo et ton mot de passe, puis clique sur CRÉER ou SE CONNECTER.',true)};
    window.guest=()=>showApp(clean(nameInput?.value)||'Runner',true);

    window.auth=async create=>{
      const pseudo=clean(nameInput?.value), password=String(passInput?.value||'');
      if(!pseudo)return msg('Entre un pseudo.');
      if(password.length<6)return msg('Le mot de passe doit contenir au moins 6 caractères.');
      const cfg=window.IR_CONFIG||{};
      if(!window.supabase?.createClient||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return msg('Supabase n’est pas chargé. Le mode local fonctionne toujours.');
      const client=window.IR_SUPABASE_CLIENT||(window.IR_SUPABASE_CLIENT=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY));
      msg(create?'Création du compte…':'Connexion…',true);
      try{
        if(create){
          const {data,error}=await client.auth.signUp({email:emailFor(pseudo),password,options:{data:{username:pseudo}}});
          if(error)throw error;
          if(!data.session)return msg('Compte créé. Si la confirmation e-mail est activée dans Supabase, désactive-la pour te connecter immédiatement.');
          showApp(pseudo,false);
        }else{
          const {data,error}=await client.auth.signInWithPassword({email:emailFor(pseudo),password});
          if(error)throw error;
          showApp(data.user?.user_metadata?.username||pseudo,false);
        }
      }catch(e){msg(e?.message||'Connexion impossible. Vérifie le pseudo et le mot de passe.');}
    };

    window.logout=async()=>{try{if(window.IR_SUPABASE_CLIENT)await window.IR_SUPABASE_CLIENT.auth.signOut();}catch(e){}if(app)app.style.display='none';if(login)login.style.display='grid';msg('',true)};

    const bs=[...document.querySelectorAll('.loginbox button')];
    const connect=bs.find(b=>/SE CONNECTER/i.test(b.textContent)), create=bs.find(b=>/^CRÉER/i.test(b.textContent)), local=bs.find(b=>/JOUER EN LOCAL/i.test(b.textContent)), account=bs.find(b=>/MODE COMPTE/i.test(b.textContent));
    if(connect){connect.removeAttribute('onclick');connect.addEventListener('click',()=>window.auth(false));}
    if(create){create.removeAttribute('onclick');create.addEventListener('click',()=>window.auth(true));}
    if(local){local.removeAttribute('onclick');local.addEventListener('click',()=>window.guest());}
    if(account){account.removeAttribute('onclick');account.addEventListener('click',()=>window.focusAccount());}
    [nameInput,passInput].forEach(i=>i?.addEventListener('keydown',e=>{if(e.key==='Enter')window.auth(false)}));
  });
})();
