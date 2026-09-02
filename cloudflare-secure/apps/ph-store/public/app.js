/* WD DEV SECURE CLIENT — no credentials or authorization decisions belong here. */
const api=async(path,options={})=>{const csrf=document.cookie.split('; ').find(v=>v.startsWith('wd_csrf='))?.split('=')[1];const headers={...(options.body?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':decodeURIComponent(csrf)}:{}),...(options.headers||{})};const r=await fetch(path,{...options,headers,credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Não foi possível concluir.');return d};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export {api,esc};
