(() => {
  const COOKIE='marcell_cookie_consent';
  const MAX_AGE=60*60*24*180;
  const defaults={necessary:true,analytics:false,marketing:false};
  const readCookie=()=>{
    const part=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));
    if(!part)return null;
    try{return {...defaults,...JSON.parse(decodeURIComponent(part.split('=').slice(1).join('=')))};}catch{return null;}
  };
  const save=(prefs)=>{
    const final={...defaults,...prefs,necessary:true,updatedAt:new Date().toISOString()};
    document.cookie=`${COOKIE}=${encodeURIComponent(JSON.stringify(final))}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
    window.MarcellConsent.state=final;
    window.dispatchEvent(new CustomEvent('marcell:consent',{detail:final}));
    closeUI();
  };
  window.MarcellConsent={state:readCookie()||defaults,allowed:(cat)=>cat==='necessary'||!!(window.MarcellConsent.state&&window.MarcellConsent.state[cat]),open:()=>openPrefs()};

  const wrap=document.createElement('div');
  wrap.id='cookieConsentRoot';
  wrap.innerHTML=`
    <section class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Preferências de cookies">
      <div class="cookie-copy"><strong>Privacidade do seu jeito.</strong><p>Usamos cookies necessários para login e segurança. Cookies de análise e marketing só serão ativados com sua autorização.</p><div class="cookie-links"><a href="cookies.html">Política de Cookies</a><a href="privacidade.html">Privacidade</a><a href="lgpd.html">LGPD</a></div></div>
      <div class="cookie-actions"><button class="btn btn-ghost" id="cookieNecessary" type="button">Somente necessários</button><button class="btn btn-ghost" id="cookieCustomize" type="button">Personalizar</button><button class="btn btn-primary" id="cookieAccept" type="button">Aceitar todos</button></div>
    </section>
    <div class="cookie-modal" id="cookieModal" aria-hidden="true"><div class="cookie-modal-card" role="dialog" aria-modal="true" aria-labelledby="cookieTitle"><div class="cookie-modal-head"><div><small>Preferências de privacidade</small><h2 id="cookieTitle">Controle de cookies</h2></div><button class="icon-btn" id="cookieClose" type="button" aria-label="Fechar">×</button></div>
      <div class="cookie-option"><div><strong>Necessários</strong><p>Essenciais para sessão, login, segurança e funcionamento do site.</p></div><label class="switch"><input type="checkbox" checked disabled><span></span></label></div>
      <div class="cookie-option"><div><strong>Análise</strong><p>Permitem entender uso e desempenho. Nenhuma ferramenta de análise está ativada nesta versão até consentimento/configuração.</p></div><label class="switch"><input id="consentAnalytics" type="checkbox"><span></span></label></div>
      <div class="cookie-option"><div><strong>Marketing</strong><p>Reservados para campanhas e personalização comercial. Permanecem desligados por padrão.</p></div><label class="switch"><input id="consentMarketing" type="checkbox"><span></span></label></div>
      <div class="cookie-modal-actions"><button class="btn btn-ghost" id="cookieSaveNecessary" type="button">Rejeitar opcionais</button><button class="btn btn-primary" id="cookieSave" type="button">Salvar preferências</button></div>
    </div></div>`;
  document.body.appendChild(wrap);
  const banner=document.querySelector('#cookieBanner'), modal=document.querySelector('#cookieModal');
  const closeUI=()=>{banner?.classList.remove('show');modal?.classList.remove('show');modal?.setAttribute('aria-hidden','true')};
  function openPrefs(){const s=readCookie()||defaults;document.querySelector('#consentAnalytics').checked=!!s.analytics;document.querySelector('#consentMarketing').checked=!!s.marketing;modal.classList.add('show');modal.setAttribute('aria-hidden','false')}
  document.querySelector('#cookieAccept').onclick=()=>save({analytics:true,marketing:true});
  document.querySelector('#cookieNecessary').onclick=()=>save({analytics:false,marketing:false});
  document.querySelector('#cookieCustomize').onclick=openPrefs;
  document.querySelector('#cookieClose').onclick=()=>modal.classList.remove('show');
  document.querySelector('#cookieSaveNecessary').onclick=()=>save({analytics:false,marketing:false});
  document.querySelector('#cookieSave').onclick=()=>save({analytics:document.querySelector('#consentAnalytics').checked,marketing:document.querySelector('#consentMarketing').checked});
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
  if(!readCookie()) requestAnimationFrame(()=>banner.classList.add('show'));
})();
