const $=s=>document.querySelector(s);

const API = "/api";
function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  localStorage.setItem("marcell-theme",theme);
  const b=document.querySelector("#themeBtn");
  if(b)b.textContent=theme==="dark"?"☀️":"🌙";
}
setTheme(localStorage.getItem("marcell-theme")||"dark");
document.querySelector("#themeBtn")?.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
document.querySelector("#year")&&(document.querySelector("#year").textContent=new Date().getFullYear());

const DEMO_KEY="marcell_demo_v6";
const DEMO_SESSION="marcell_demo_session";
function demoSeed(){return {products:productFallback().map(normalizeProduct).map((p,i)=>({...p,wholesale_price:[2499,2599,1179,799,1179][i]||null,wholesale_min_qty:i<2?3:5,installments:i<2?12:10,warranty_days:p.condition==="Novo"?365:90,battery_health:p.condition==="Seminovo"?[86,91][i]:null,includes_box:1,includes_charger:p.condition==="Novo"?1:0,gallery:[p.image_url],low_stock_threshold:2})),users:[],addresses:[],favorites:[],orders:[],inventory:[]}}
function demoDb(){try{return JSON.parse(localStorage.getItem(DEMO_KEY))||demoSeed()}catch{return demoSeed()}}
function saveDemo(db){localStorage.setItem(DEMO_KEY,JSON.stringify(db))}
function demoUser(){const s=sessionStorage.getItem(DEMO_SESSION);if(!s)return null;if(s==="admin")return {id:0,username:"MarcellPDF",name:"Administrador Marcell",email:"admin@marcell.demo",phone:"",role:"admin"};const db=demoDb(),u=db.users.find(x=>String(x.id)===s);return u?{...u,password:undefined}:null}
async function api(path, options={}){
  const method=(options.method||"GET").toUpperCase(),body=options.body?JSON.parse(options.body):{};const db=demoDb();
  if(path==="/products"&&method==="GET")return {products:db.products.filter(p=>p.active!==0)};
  if(path==="/products"&&method==="POST"){if(demoUser()?.role!=="admin")throw new Error("Acesso não autorizado.");const item={id:`demo-${Date.now()}`,...body};db.products.unshift(item);if(item.stock)db.inventory.unshift({product_name:item.name,delta:item.stock,reason:"Estoque inicial",created_at:new Date().toISOString()});saveDemo(db);return {ok:true,id:item.id}}
  if(path.startsWith("/products/")){const id=decodeURIComponent(path.split("/").pop()),i=db.products.findIndex(p=>p.id===id);if(method==="GET"){if(i<0)throw new Error("Produto não encontrado.");return {product:db.products[i]}}if(demoUser()?.role!=="admin")throw new Error("Acesso não autorizado.");if(method==="PATCH"){const old=db.products[i],delta=(Number(body.stock)||0)-(Number(old.stock)||0);db.products[i]={...old,...body};if(delta)db.inventory.unshift({product_name:old.name,delta,reason:body.inventory_reason||"Ajuste pelo painel",created_at:new Date().toISOString()});saveDemo(db);return {ok:true}}if(method==="DELETE"){db.products.splice(i,1);saveDemo(db);return {ok:true}}}
  if(path==="/auth/login"&&method==="POST"){if(body.login==="MarcellPDF"&&body.password==="Testepanel@1"){sessionStorage.setItem(DEMO_SESSION,"admin");return {ok:true,user:demoUser()}}const u=db.users.find(x=>x.email.toLowerCase()===String(body.login||"").toLowerCase()&&x.password===body.password);if(!u)throw new Error("Credenciais inválidas.");sessionStorage.setItem(DEMO_SESSION,String(u.id));return {ok:true,user:u}}
  if(path==="/auth/register"&&method==="POST"){if(db.users.some(x=>x.email.toLowerCase()===String(body.email).toLowerCase()))throw new Error("Este e-mail já está cadastrado.");const u={id:Date.now(),name:body.name,email:String(body.email).toLowerCase(),phone:body.phone||"",password:body.password,role:"client"};db.users.push(u);saveDemo(db);sessionStorage.setItem(DEMO_SESSION,String(u.id));return {ok:true}}
  if(path==="/auth/me")return {user:demoUser()};
  if(path==="/auth/logout"){sessionStorage.removeItem(DEMO_SESSION);return {ok:true}}
  if(path==="/admin/dashboard"){if(demoUser()?.role!=="admin")throw new Error("Acesso não autorizado.");return {products:db.products,metrics:{products:db.products.length,stock:db.products.reduce((a,x)=>a+(Number(x.stock)||0),0),low_stock:db.products.filter(x=>x.stock>0&&x.stock<=(x.low_stock_threshold||2)).length,out_of_stock:db.products.filter(x=>!x.stock).length},inventory:db.inventory,customers:db.users.map(({password,...u})=>u)}}
  if(path==="/account"&&method==="GET"){const u=demoUser();if(!u||u.role!=="client")throw new Error("Acesso não autorizado.");return {addresses:db.addresses.filter(x=>x.user_id===u.id),favorites:db.favorites.filter(x=>x.user_id===u.id).map(f=>db.products.find(p=>p.id===f.product_id)).filter(Boolean),orders:db.orders.filter(x=>x.user_id===u.id)}}
  if(path==="/account/profile"&&method==="PATCH"){const u=demoUser(),idx=db.users.findIndex(x=>x.id===u?.id);if(idx<0)throw new Error("Acesso não autorizado.");db.users[idx]={...db.users[idx],name:body.name,phone:body.phone};saveDemo(db);return {ok:true}}
  if(path==="/account/addresses"&&method==="POST"){const u=demoUser();if(!u)throw new Error("Acesso não autorizado.");db.addresses.unshift({id:Date.now(),user_id:u.id,...body});saveDemo(db);return {ok:true}}
  if(path==="/account/favorites"&&method==="POST"){const u=demoUser();if(!u)throw new Error("Acesso não autorizado.");const i=db.favorites.findIndex(x=>x.user_id===u.id&&x.product_id===body.product_id);if(i>=0)db.favorites.splice(i,1);else db.favorites.push({user_id:u.id,product_id:body.product_id});saveDemo(db);return {ok:true}}
  if(path==="/shipping")throw new Error("Frete oficial será habilitado na versão conectada aos Correios.");
  throw new Error("Recurso disponível na versão full-stack.");
}
function brl(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function productFallback(){
  return [
    {id:"iphone-12-pro-max",brand:"Apple",name:"iPhone 12 Pro Max",storage:"128 GB",condition:"Seminovo",price:2699,old_price:2899,stock:3,image_url:"assets/iphone-azul-hd.jpg",color:"Azul-Pacífico",featured:1,active:1,specs:[["Tela","Super Retina XDR OLED 6,7”"],["Chip","Apple A14 Bionic"],["Câmeras","Tripla 12 MP + LiDAR"],["Recursos","5G · Face ID · MagSafe"]]},
    {id:"iphone-13",brand:"Apple",name:"iPhone 13",storage:"128 GB",condition:"Seminovo",price:2799,old_price:2999,stock:4,image_url:"assets/iphone-13-hd.jpg",color:"Estelar",featured:1,active:1,specs:[["Tela","Super Retina XDR OLED 6,1”"],["Chip","Apple A15 Bionic"],["Câmeras","Dupla 12 MP"],["Recursos","5G · Face ID · MagSafe"]]},
    {id:"redmi-note-13",brand:"Xiaomi",name:"Redmi Note 13",storage:"128 GB",condition:"Novo",price:1299,old_price:1399,stock:8,image_url:"assets/redmi-note-13-hd.jpg",color:"Variadas",featured:1,active:1,specs:[["Tela","AMOLED 6,67” · 120 Hz"],["Processador","Snapdragon 685"],["Câmera","108 MP"],["Bateria","5.000 mAh"]]},
    {id:"poco-c71",brand:"POCO",name:"POCO C71",storage:"128 GB",condition:"Novo",price:899,old_price:999,stock:7,image_url:"assets/poco-c71-hd.jpg",color:"Variadas",featured:0,active:1,specs:[["Tela","6,88” · 120 Hz"],["Câmera","32 MP"],["Bateria","5.200 mAh"],["Memória","128 GB"]]},
    {id:"moto-g17",brand:"Motorola",name:"Moto G17",storage:"128 GB",condition:"Novo",price:1299,old_price:null,stock:5,image_url:"assets/moto-g17-hd.jpg",color:"Variadas",featured:0,active:1,specs:[["Tela","FHD+ 6,7”"],["Câmera","50 MP"],["Bateria","5.200 mAh"],["Memória","128 GB"]]}
  ];
}

function normalizeProduct(p){return {installments:1,wholesale_price:null,wholesale_min_qty:1,warranty_days:0,battery_health:null,includes_box:0,includes_charger:0,gallery:[],low_stock_threshold:2,image_position_x:50,image_position_y:50,...p}}
