let adminProducts=[];
let cropImage=null;
let galleryUrls=[];
let pendingGalleryFiles=[];

const $=s=>document.querySelector(s);
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const money=brl;

async function checkAdmin(){
  try{
    const d=await api('/auth/me');
    if(!d.user||d.user.role!=='admin')throw 0;
    $('#adminLogin').style.display='none';$('#adminApp').style.display='block';await loadAdmin();
  }catch{$('#adminLogin').style.display='block';$('#adminApp').style.display='none'}
}

$('#adminLoginForm').onsubmit=async e=>{e.preventDefault();try{await api('/auth/login',{method:'POST',body:JSON.stringify({login:$('#adminUser').value,password:$('#adminPassword').value})});checkAdmin()}catch(err){$('#adminMsg').textContent=err.message;$('#adminMsg').className='msg error'}};
$('#adminLogout').onclick=async()=>{await api('/auth/logout',{method:'POST',body:'{}'});location.reload()};
document.querySelectorAll('.tab-btn[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')}));

async function loadAdmin(){
  const d=await api('/admin/dashboard');adminProducts=d.products||[];
  $('#mProducts').textContent=d.metrics.products;$('#mStock').textContent=d.metrics.stock;$('#mLow').textContent=d.metrics.low_stock;$('#mOut').textContent=d.metrics.out_of_stock;
  $('#adminProducts').innerHTML=adminProducts.map(p=>`<tr><td><img src="${esc(p.image_url)}" alt=""></td><td><strong>${esc(p.name)}</strong><br><small class="msg">${esc(p.brand)} · ${esc(p.storage||'')}</small></td><td>${brl(p.price)}<br><small class="msg">${p.installments>1?`até ${p.installments}x`:''}</small></td><td>${p.wholesale_price?`${brl(p.wholesale_price)}<br><small class="msg">mín. ${p.wholesale_min_qty}</small>`:'—'}</td><td>${p.stock}${p.stock<=p.low_stock_threshold?'<br><small class="error">atenção</small>':''}</td><td>${p.active?'Ativo':'Oculto'}</td><td><div class="row-actions"><button class="btn btn-ghost" data-edit="${p.id}">Editar</button><button class="btn btn-danger" data-delete="${p.id}">Excluir</button></div></td></tr>`).join('');
  $('#inventoryLog').innerHTML=(d.inventory||[]).map(i=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><strong>${esc(i.product_name||'Produto removido')}</strong> · ${i.delta>0?'+':''}${i.delta}<br><small>${esc(i.reason||'Ajuste')} · ${new Date(i.created_at).toLocaleString('pt-BR')}</small></div>`).join('')||'Sem movimentações.';
  $('#customerList').innerHTML=(d.customers||[]).map(c=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><strong>${esc(c.name)}</strong><br><small>${esc(c.email)} ${c.phone?`· ${esc(c.phone)}`:''}</small></div>`).join('')||'Sem clientes cadastrados.';
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProduct(b.dataset.edit));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeProduct(b.dataset.delete));
}

function specsToText(specs){return (specs||[]).map(s=>`${s[0]} = ${s[1]}`).join('\n')}
function textToSpecs(text){return String(text||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const i=l.indexOf('=');return i>0?[l.slice(0,i).trim(),l.slice(i+1).trim()]:[l,'']})}

function openProduct(id){
  const p=id?adminProducts.find(x=>x.id===id):null;cropImage=null;pendingGalleryFiles=[];galleryUrls=[...(p?.gallery||[])];
  $('#productModalTitle').textContent=p?'Editar produto':'Novo produto';$('#pId').value=p?.id||'';$('#pBrand').value=p?.brand||'';$('#pName').value=p?.name||'';$('#pStorage').value=p?.storage||'';$('#pColor').value=p?.color||'';$('#pCondition').value=p?.condition||'Novo';$('#pWarranty').value=p?.warranty_days??90;$('#pPrice').value=p?.price??'';$('#pOldPrice').value=p?.old_price??'';$('#pInstallments').value=p?.installments??10;$('#pWholesale').value=p?.wholesale_price??'';$('#pWholesaleMin').value=p?.wholesale_min_qty??5;$('#pStock').value=p?.stock??0;$('#pLowStock').value=p?.low_stock_threshold??2;$('#pInventoryReason').value='';$('#pBattery').value=p?.battery_health??'';$('#pBox').checked=!!p?.includes_box;$('#pCharger').checked=!!p?.includes_charger;$('#pImage').value=p?.image_url||'';$('#pSpecsText').value=specsToText(p?.specs);$('#pActive').value=String(p?.active??1);$('#pFeatured').value=String(p?.featured??0);$('#pUpload').value='';$('#pGalleryUpload').value='';$('#pZoom').value='1';$('#pPosX').value=String(p?.image_position_x??50);$('#pPosY').value=String(p?.image_position_y??50);
  if(p?.image_url)loadCropSource(p.image_url);else drawEmptyCrop();renderGallery();refreshPreview();$('#productModal').classList.add('open');
}

$('#newProduct').onclick=()=>openProduct();$('#closeProduct').onclick=()=>$('#productModal').classList.remove('open');$('#productModal').onclick=e=>{if(e.target.id==='productModal')e.currentTarget.classList.remove('open')};

function drawEmptyCrop(){const c=$('#cropCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#667085';ctx.font='28px Inter, sans-serif';ctx.textAlign='center';ctx.fillText('Selecione uma imagem',c.width/2,c.height/2)}
function loadCropSource(src){const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{cropImage=img;drawCrop()};img.onerror=()=>{cropImage=null;drawEmptyCrop()};img.src=src}
function drawCrop(){
  const c=$('#cropCanvas'),ctx=c.getContext('2d'),aspect=num($('#pAspect').value,1);const w=800,h=Math.round(800/aspect);c.width=w;c.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);if(!cropImage)return drawEmptyCrop();
  const zoom=num($('#pZoom').value,1),px=num($('#pPosX').value,50)/100,py=num($('#pPosY').value,50)/100;
  const scale=Math.max(w/cropImage.width,h/cropImage.height)*zoom;const dw=cropImage.width*scale,dh=cropImage.height*scale;const overflowX=Math.max(0,dw-w),overflowY=Math.max(0,dh-h);const dx=-overflowX*px,dy=-overflowY*py;ctx.drawImage(cropImage,dx,dy,dw,dh);refreshPreviewFromCanvas();
}
function refreshPreviewFromCanvas(){if(!cropImage)return;try{$('#previewImage').src=$('#cropCanvas').toDataURL('image/webp',.82)}catch{}}
['pAspect','pZoom','pPosX','pPosY'].forEach(id=>$('#'+id).addEventListener(id==='pAspect'?'change':'input',drawCrop));
$('#pUpload').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/'))return alert('Selecione uma imagem válida.');if(f.size>12*1024*1024)return alert('A imagem deve ter no máximo 12 MB.');const r=new FileReader();r.onload=()=>loadCropSource(r.result);r.readAsDataURL(f)});

function canvasBlob(){return new Promise(resolve=>$('#cropCanvas').toBlob(resolve,'image/webp',.86))}
async function uploadBlob(blob,name='produto.webp'){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Falha ao processar imagem.'));r.readAsDataURL(blob)})}
async function uploadMainIfNeeded(){if(!$('#pUpload').files[0])return $('#pImage').value.trim();const blob=await canvasBlob();if(!blob)throw new Error('Não foi possível processar a imagem.');return uploadBlob(blob,`${($('#pName').value||'produto').replace(/\s+/g,'-').toLowerCase()}.webp`)}

$('#pGalleryUpload').addEventListener('change',e=>{pendingGalleryFiles=[...e.target.files].slice(0,8-galleryUrls.length);for(const f of pendingGalleryFiles){galleryUrls.push(URL.createObjectURL(f))}renderGallery()});
function renderGallery(){$('#galleryPreview').innerHTML=galleryUrls.map((url,i)=>`<div class="gitem"><img src="${esc(url)}" alt=""><button type="button" data-rm-gallery="${i}">×</button></div>`).join('');document.querySelectorAll('[data-rm-gallery]').forEach(b=>b.onclick=()=>{galleryUrls.splice(Number(b.dataset.rmGallery),1);renderGallery()})}
async function materializeGallery(){const out=[];for(const url of galleryUrls.slice(0,8)){if(url.startsWith('blob:')){const blob=await (await fetch(url)).blob();out.push(await uploadBlob(blob,'galeria.webp'))}else out.push(url)}return out}

function refreshPreview(){const price=num($('#pPrice').value),inst=Math.max(1,num($('#pInstallments').value,1)),wh=num($('#pWholesale').value),min=Math.max(1,num($('#pWholesaleMin').value,1)),stock=Math.max(0,num($('#pStock').value));$('#previewBrand').textContent=$('#pBrand').value||'Marca';$('#previewName').textContent=$('#pName').value||'Modelo do aparelho';$('#previewCondition').textContent=`${$('#pCondition').value||'Condição'} · ${$('#pStorage').value||''}`;$('#previewPrice').innerHTML=`${money(price)} ${$('#pOldPrice').value?`<small><s>${money($('#pOldPrice').value)}</s></small>`:''}`;$('#previewInstallments').textContent=inst>1?`ou até ${inst}x de ${money(price/inst)}`:'';$('#previewWholesale').textContent=wh?`Atacado: ${money(wh)} a partir de ${min} un.`:'';$('#previewStock').textContent=stock>0?`${stock} em estoque`:'Indisponível';if(!cropImage&&$('#pImage').value)$('#previewImage').src=$('#pImage').value}
['pBrand','pName','pStorage','pCondition','pPrice','pOldPrice','pInstallments','pWholesale','pWholesaleMin','pStock','pImage'].forEach(id=>$('#'+id).addEventListener('input',refreshPreview));

$('#productForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    const image_url=await uploadMainIfNeeded();const gallery=await materializeGallery();const body={brand:$('#pBrand').value,name:$('#pName').value,storage:$('#pStorage').value,color:$('#pColor').value,condition:$('#pCondition').value,warranty_days:num($('#pWarranty').value),price:num($('#pPrice').value),old_price:$('#pOldPrice').value?num($('#pOldPrice').value):null,installments:num($('#pInstallments').value,1),wholesale_price:$('#pWholesale').value?num($('#pWholesale').value):null,wholesale_min_qty:num($('#pWholesaleMin').value,1),stock:num($('#pStock').value),low_stock_threshold:num($('#pLowStock').value),inventory_reason:$('#pInventoryReason').value,battery_health:$('#pBattery').value?num($('#pBattery').value):null,includes_box:$('#pBox').checked,includes_charger:$('#pCharger').checked,image_url,gallery,image_fit:'cover',image_position_x:num($('#pPosX').value,50),image_position_y:num($('#pPosY').value,50),specs:textToSpecs($('#pSpecsText').value),active:Number($('#pActive').value),featured:Number($('#pFeatured').value)};
    const id=$('#pId').value;await api(id?`/products/${encodeURIComponent(id)}`:'/products',{method:id?'PATCH':'POST',body:JSON.stringify(body)});$('#productModal').classList.remove('open');await loadAdmin();
  }catch(err){alert(err.message)}
};
async function removeProduct(id){if(!confirm('Excluir este produto?'))return;await api(`/products/${encodeURIComponent(id)}`,{method:'DELETE',body:'{}'});await loadAdmin()}

drawEmptyCrop();checkAdmin();
