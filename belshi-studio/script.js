const topbar=document.getElementById('topbar');
const menuBtn=document.getElementById('menuBtn');
const mobileMenu=document.getElementById('mobileMenu');
const modal=document.getElementById('modal');
const modalContent=document.getElementById('modalContent');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('scroll',()=>topbar?.classList.toggle('scrolled',window.scrollY>50),{passive:true});
menuBtn?.addEventListener('click',()=>mobileMenu?.classList.toggle('open'));
document.querySelectorAll('.mobile-links a').forEach(a=>a.addEventListener('click',()=>mobileMenu?.classList.remove('open')));

const fallbackReveal=()=>{
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');observer.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
};

async function initMotion(){
  if(reduceMotion){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));return;}
  try{
    const {animate,inView,scroll}=await import('https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm');
    document.querySelectorAll('.reveal').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(26px)'});
    inView('.reveal',(el)=>{animate(el,{opacity:[0,1],transform:['translateY(26px)','translateY(0px)']},{duration:.85,easing:[.2,.8,.2,1]});el.classList.add('in')},{amount:.12});
    const heroMedia=document.querySelector('.hero-media');
    if(heroMedia)scroll(animate(heroMedia,{transform:['scale(1.035) translateY(0px)','scale(1.08) translateY(45px)']},{easing:'linear'}),{target:document.querySelector('.hero'),offset:['start start','end start']});
    const founderImage=document.querySelector('.founder-image');
    if(founderImage)scroll(animate(founderImage,{backgroundPositionY:['50%','62%']},{easing:'linear'}),{target:document.querySelector('.founder'),offset:['start end','end start']});
    const progress=document.getElementById('scrollProgress');
    if(progress)scroll(p=>{progress.style.width=`${Math.max(0,Math.min(100,p*100))}%`});
    document.querySelectorAll('.service-row').forEach((row,i)=>inView(row,()=>animate(row,{opacity:[0,1],transform:['translateX(-16px)','translateX(0px)']},{duration:.55,delay:i*.04}),{amount:.2}));
  }catch(err){fallbackReveal();const progress=document.getElementById('scrollProgress');if(progress)window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?(scrollY/max)*100:0)+'%'},{passive:true});}
}
initMotion();

const modalTemplates={
  client:`<span class="eyebrow">Conceito interativo</span><h3>Minha Belshi</h3><p>Na versão completa, cada cliente poderá acessar uma galeria privada com identidade da Belshi, visualizar o material, favoritar imagens, fazer sua seleção e baixar arquivos liberados.</p><div class="feature-chips"><span>Galeria privada</span><span>Favoritos</span><span>Seleção</span><span>Downloads</span><span>Status do trabalho</span></div><div class="login-demo"><label>E-mail</label><input placeholder="cliente@exemplo.com"><label>Senha</label><input type="password" placeholder="••••••••"><button type="button">Entrar na demonstração</button></div><p style="font-size:11px;margin-top:18px">Este login é apenas visual nesta primeira versão conceitual.</p>`,
  founder:`<span class="eyebrow">Perfil editorial</span><h3>Esdras Thiago</h3><p>Esta página será construída com a história verdadeira de Esdras e fotografias reais de arquivo. A proposta é mostrar não apenas o fundador da empresa, mas a visão criativa por trás da Belshi.</p><p>Podemos incluir primeiros trabalhos, equipamentos marcantes, bastidores, relatos pessoais, marcos da empresa e uma entrevista curta transformada em narrativa.</p><div class="feature-chips"><span>Linha do tempo</span><span>Bastidores</span><span>Filosofia</span><span>Arquivo histórico</span><span>Entrevista</span></div>`
};
function openModal(type){if(!modal||!modalContent)return;modalContent.innerHTML=modalTemplates[type]||modalTemplates.client;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeModal(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal));

// Consentimento e preferências — LGPD-ready. Nenhum analytics/pixel é carregado nesta demo.
const consentCookie='belshi_consent_v1';
const banner=document.getElementById('cookieBanner');
const settings=document.getElementById('cookieSettings');
const analyticsToggle=document.getElementById('consentAnalytics');
const marketingToggle=document.getElementById('consentMarketing');
function readConsent(){try{const raw=decodeURIComponent(document.cookie.split('; ').find(x=>x.startsWith(consentCookie+'='))?.split('=')[1]||'');return raw?JSON.parse(raw):null}catch{return null}}
function writeConsent(value){const payload=encodeURIComponent(JSON.stringify({...value,essential:true,updatedAt:new Date().toISOString()}));document.cookie=`${consentCookie}=${payload}; Max-Age=15552000; Path=/; SameSite=Lax`;applyConsent(value)}
function applyConsent(value){document.documentElement.dataset.analyticsConsent=value?.analytics?'granted':'denied';document.documentElement.dataset.marketingConsent=value?.marketing?'granted':'denied';/* Pontos de integração futuros: carregar Analytics/Pixel SOMENTE quando a categoria correspondente estiver granted. */}
function showBanner(){if(banner)banner.hidden=false}
function hideBanner(){if(banner)banner.hidden=true}
function openSettings(){const current=readConsent()||{analytics:false,marketing:false};if(analyticsToggle)analyticsToggle.checked=!!current.analytics;if(marketingToggle)marketingToggle.checked=!!current.marketing;if(settings){settings.classList.add('open');settings.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}}
function closeSettings(){if(settings){settings.classList.remove('open');settings.setAttribute('aria-hidden','true');document.body.style.overflow=''}}
function acceptAll(){writeConsent({analytics:true,marketing:true});hideBanner();closeSettings()}
function rejectOptional(){writeConsent({analytics:false,marketing:false});hideBanner();closeSettings()}
function savePreferences(){writeConsent({analytics:!!analyticsToggle?.checked,marketing:!!marketingToggle?.checked});hideBanner();closeSettings()}
const currentConsent=readConsent();if(currentConsent)applyConsent(currentConsent);else window.setTimeout(showBanner,550);
document.querySelectorAll('[data-cookie-accept]').forEach(b=>b.addEventListener('click',acceptAll));
document.querySelectorAll('[data-cookie-reject]').forEach(b=>b.addEventListener('click',rejectOptional));
document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.addEventListener('click',openSettings));
document.querySelectorAll('[data-cookie-close]').forEach(b=>b.addEventListener('click',closeSettings));
document.querySelectorAll('[data-cookie-save]').forEach(b=>b.addEventListener('click',savePreferences));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeSettings()}});
