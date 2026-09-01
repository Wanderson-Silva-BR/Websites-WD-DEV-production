import { animate, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm";

const products = [
  {id:'p1',name:'Camiseta M.Pollo Azul',category:'roupas',price:129.99,img:'assets/img/look-blue.jpg',badge:'12x sem juros'},
  {id:'p2',name:'Camiseta M.Pollo Branca',category:'roupas',price:129.99,img:'assets/img/look-white.jpg',badge:'Essencial'},
  {id:'p3',name:'Asad Lattafa',category:'perfumes',price:299.99,img:'assets/img/perfume-asad.jpg',badge:'Original'},
  {id:'p4',name:'Asad Elixir',category:'perfumes',price:314.99,img:'assets/img/perfume-elixir.jpg',badge:'Destaque'},
  {id:'p5',name:'Fakhar Lattafa',category:'perfumes',price:349.99,img:'assets/img/perfume-fakhar.jpg',badge:'Original'},
  {id:'p6',name:'Club de Nuit Intense',category:'perfumes',price:349.99,img:'assets/img/perfume-club.jpg',badge:'Importado'},
  {id:'p7',name:'Óculos PH Classic',category:'oculos',price:109.99,img:'assets/img/oculos-classic.jpg',badge:'PH Collection'},
  {id:'p8',name:'Óculos PH Aviador',category:'oculos',price:109.99,img:'assets/img/oculos-aviador.jpg',badge:'PH Collection'}
];

const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const grid = document.querySelector('#productGrid');
let currentFilter = 'all';
let searchTerm = '';
let cart = JSON.parse(localStorage.getItem('ph_cart') || '[]');

function renderProducts(){
  const list = products.filter(p => (currentFilter==='all'||p.category===currentFilter) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  grid.innerHTML = list.map(p => `
    <article class="product-card" data-category="${p.category}">
      <div class="product-media"><img src="${p.img}" alt="${p.name}" loading="lazy"><span class="product-badge">${p.badge}</span></div>
      <div class="product-info">
        <div class="product-meta"><span>${p.category}</span><span>PH STORE</span></div>
        <h3>${p.name}</h3>
        <div class="product-price"><div><strong>${money(p.price)}</strong><small>até 12x sem juros*</small></div><button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.name} à sacola">+</button></div>
      </div>
    </article>`).join('') || `<p style="color:#9f9b94">Nenhum produto encontrado.</p>`;
  document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>addToCart(btn.dataset.add)));
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    animate('.product-card', {opacity:[0,1], y:[14,0]}, {duration:.35, delay:stagger(.035), easing:'ease-out'});
  }
}

function addToCart(id){
  const item=products.find(p=>p.id===id); if(!item)return;
  const existing=cart.find(x=>x.id===id); existing?existing.qty++:cart.push({...item,qty:1});
  saveCart(); toast(`${item.name} adicionado à sacola.`);
}
function removeFromCart(id){cart=cart.filter(x=>x.id!==id);saveCart()}
function saveCart(){localStorage.setItem('ph_cart',JSON.stringify(cart));renderCart()}
function renderCart(){
  const count=cart.reduce((a,b)=>a+b.qty,0); document.querySelector('#cartCount').textContent=count;
  const wrap=document.querySelector('#cartItems');
  wrap.innerHTML=cart.length?cart.map(i=>`<div class="cart-line"><img src="${i.img}" alt=""><div><h4>${i.name}</h4><span>Qtd. ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div><button class="remove-item" data-remove="${i.id}">×</button></div>`).join(''):'<div class="cart-empty">Sua sacola está vazia.</div>';
  document.querySelector('#cartTotal').textContent=money(cart.reduce((a,b)=>a+b.price*b.qty,0));
  wrap.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeFromCart(b.dataset.remove)));
}

function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}

// filtros e pesquisa
renderProducts(); renderCart();
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.filter;renderProducts()}));
document.querySelectorAll('[data-filter-link]').forEach(a=>a.addEventListener('click',()=>{currentFilter=a.dataset.filterLink;setTimeout(()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===currentFilter));renderProducts()},200)}));
const searchPanel=document.querySelector('#searchPanel'), searchInput=document.querySelector('#searchInput');
document.querySelector('#searchToggle').onclick=()=>{searchPanel.classList.add('open');searchPanel.setAttribute('aria-hidden','false');setTimeout(()=>searchInput.focus(),150)};
document.querySelector('#closeSearch').onclick=()=>{searchPanel.classList.remove('open');searchPanel.setAttribute('aria-hidden','true')};
searchInput.addEventListener('input',e=>{searchTerm=e.target.value;currentFilter='all';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));renderProducts();if(searchTerm)document.querySelector('#novidades').scrollIntoView({behavior:'smooth',block:'start'})});

// carrinho
const drawer=document.querySelector('#cartDrawer'), backdrop=document.querySelector('#drawerBackdrop');
function openCart(){drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll')}
function closeCart(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}
document.querySelector('#cartToggle').onclick=openCart;document.querySelector('#closeCart').onclick=closeCart;backdrop.onclick=closeCart;
document.querySelector('#checkoutWhatsapp').onclick=()=>{if(!cart.length)return toast('Sua sacola está vazia.');const lines=cart.map(i=>`• ${i.name} x${i.qty} — ${money(i.price*i.qty)}`).join('\n');const total=money(cart.reduce((a,b)=>a+b.price*b.qty,0));window.open(`https://wa.me/558498583268?text=${encodeURIComponent('Olá PH STORE! Gostaria de finalizar este pedido:\n\n'+lines+'\n\nSubtotal: '+total)}`,'_blank')};

// menu mobile
const mobileNav=document.querySelector('#mobileNav');
function toggleMenu(open){mobileNav.classList.toggle('open',open);mobileNav.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('no-scroll',open)}
document.querySelector('#menuToggle').onclick=()=>toggleMenu(true);document.querySelector('#closeMenu').onclick=()=>toggleMenu(false);mobileNav.querySelectorAll('a').forEach(a=>a.onclick=()=>toggleMenu(false));

// modais LGPD/cookies
function openModal(id){const m=document.querySelector('#'+id);m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll')}
function closeModal(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}
document.querySelectorAll('[data-modal]').forEach(b=>b.onclick=()=>openModal(b.dataset.modal));
document.querySelectorAll('.modal').forEach(m=>{m.querySelector('.modal-close').onclick=()=>closeModal(m);m.addEventListener('click',e=>{if(e.target===m)closeModal(m)})});

// cookies: consentimento persistente e granular
const banner=document.querySelector('#cookieBanner');
const stored=JSON.parse(localStorage.getItem('ph_cookie_consent')||'null');
if(stored){banner.classList.add('hidden');document.querySelector('#analyticsConsent').checked=!!stored.analytics}
function saveConsent(analytics){localStorage.setItem('ph_cookie_consent',JSON.stringify({essential:true,analytics,updatedAt:new Date().toISOString()}));document.querySelector('#analyticsConsent').checked=analytics;banner.classList.add('hidden');toast('Preferências de privacidade salvas.')}
document.querySelector('#acceptCookies').onclick=()=>saveConsent(true);document.querySelector('#rejectCookies').onclick=()=>saveConsent(false);document.querySelector('#cookieDetails').onclick=()=>openModal('cookiesModal');document.querySelector('#saveCookiePrefs').onclick=()=>{saveConsent(document.querySelector('#analyticsConsent').checked);closeModal(document.querySelector('#cookiesModal'))};

// newsletter demonstrativa
document.querySelector('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();toast('Cadastro demonstrativo realizado.');e.currentTarget.reset()});

// Motion.js suave: entradas curtas, sem efeitos excessivos
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  inView('.reveal', el=>{animate(el,{opacity:[0,1],y:[18,0]},{duration:.55,easing:[.22,.75,.25,1]});return()=>{}},{margin:'-8% 0px -8% 0px'});
  animate('.hero-content > *',{opacity:[0,1],y:[12,0]},{duration:.55,delay:stagger(.06),easing:[.22,.75,.25,1]});
}
