import {appConfig} from "./config";
import {assertSameOrigin, cleanText, clearSessionCookies, csrfCookie, parseCookies, passwordHash, randomToken, readJson, securityHeaders, sessionCookie, sha256, secureEqual, validEmail, validatePassword} from "./security";

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_NAME: string;
  APP_KIND: string;
  ALLOW_REGISTRATION: string;
  SESSION_TTL_SECONDS: string;
  PASSWORD_PEPPER: string;
  IP_HASH_KEY: string;
}
type User = {id:string;username:string|null;email:string;display_name:string;password_hash:string;password_salt:string;password_iterations:number;role:"client"|"editor"|"admin";status:string;failed_attempts:number;locked_until:number|null;must_change_password:number};
type Auth = {user: Pick<User,"id"|"email"|"display_name"|"role"> & {must_change_password:boolean}; sessionId:string; csrfHash:string};

const json = (data: unknown, status=200, extra?: HeadersInit) => new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8",...extra}});
const now = () => Math.floor(Date.now()/1000);
const uuid = () => crypto.randomUUID();

async function ipHash(req: Request, env: Env): Promise<string> {
  return sha256(`${req.headers.get("CF-Connecting-IP") || "unknown"}:${env.IP_HASH_KEY}`);
}
async function uaHash(req: Request): Promise<string> { return sha256(req.headers.get("User-Agent") || "unknown"); }

async function rateLimit(req:Request, env:Env, bucket:string, max:number, seconds:number):Promise<void>{
  const subject=await ipHash(req,env),windowStart=Math.floor(now()/seconds)*seconds;
  await env.DB.prepare(`INSERT INTO rate_limits(bucket,subject_hash,window_start,hits) VALUES(?,?,?,1) ON CONFLICT(bucket,subject_hash,window_start) DO UPDATE SET hits=hits+1`).bind(bucket,subject,windowStart).run();
  const row=await env.DB.prepare(`SELECT hits FROM rate_limits WHERE bucket=? AND subject_hash=? AND window_start=?`).bind(bucket,subject,windowStart).first<{hits:number}>();
  if((row?.hits||0)>max) throw new Error("RATE_LIMIT");
}

async function audit(req:Request,env:Env,action:string,userId:string|null,targetType?:string,targetId?:string,metadata:Record<string,unknown>={}):Promise<void>{
  await env.DB.prepare(`INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,ip_hash,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)`).bind(uuid(),userId,action,targetType||null,targetId||null,await ipHash(req,env),JSON.stringify(metadata).slice(0,4000),now()).run();
}

async function authenticate(req:Request,env:Env):Promise<Auth|null>{
  const token=parseCookies(req).wd_session;if(!token)return null;
  const row=await env.DB.prepare(`SELECT s.id session_id,s.csrf_hash,s.expires_at,u.id,u.email,u.display_name,u.role,u.status,u.must_change_password FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? LIMIT 1`).bind(await sha256(token)).first<Record<string,unknown>>();
  if(!row||Number(row.expires_at)<=now()||row.status!=="active")return null;
  return {sessionId:String(row.session_id),csrfHash:String(row.csrf_hash),user:{id:String(row.id),email:String(row.email),display_name:String(row.display_name),role:row.role as Auth["user"]["role"],must_change_password:Boolean(row.must_change_password)}};
}
function requireRole(auth:Auth|null,roles:Auth["user"]["role"][]):Auth{if(!auth)throw new Error("AUTH_REQUIRED");if(auth.user.must_change_password)throw new Error("PASSWORD_CHANGE_REQUIRED");if(!roles.includes(auth.user.role))throw new Error("FORBIDDEN");return auth}
function requireAuth(auth:Auth|null):Auth{if(!auth)throw new Error("AUTH_REQUIRED");return auth}
async function requireCsrf(req:Request,auth:Auth):Promise<void>{
  assertSameOrigin(req);const cookies=parseCookies(req),header=req.headers.get("X-CSRF-Token")||"";
  if(!cookies.wd_csrf||!header||!(await secureEqual(cookies.wd_csrf,header))||!(await secureEqual(await sha256(header),auth.csrfHash)))throw new Error("CSRF");
}

async function register(req:Request,env:Env):Promise<Response>{
  const cfg=appConfig(env as unknown as Record<string,string>);if(!cfg.allowRegistration)throw new Error("DISABLED");
  assertSameOrigin(req);await rateLimit(req,env,"register",5,3600);const body=await readJson(req);
  const email=validEmail(body.email),name=cleanText(body.name,2,80),password=validatePassword(body.password),salt=randomToken(16),iterations=310000,id=uuid(),ts=now();
  const exists=await env.DB.prepare(`SELECT 1 FROM users WHERE email=?`).bind(email).first();if(exists)throw new Error("EMAIL_EXISTS");
  await env.DB.prepare(`INSERT INTO users(id,email,display_name,password_hash,password_salt,password_iterations,role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'client','active',?,?)`).bind(id,email,name,await passwordHash(password,salt,env.PASSWORD_PEPPER,iterations),salt,iterations,ts,ts).run();
  await audit(req,env,"auth.register",id,"user",id);return createSession(req,env,{id,email,display_name:name,role:"client",must_change_password:false},cfg.sessionTtlSeconds,201);
}

async function login(req:Request,env:Env):Promise<Response>{
  assertSameOrigin(req);await rateLimit(req,env,"login",10,900);const body=await readJson(req);const identifier=cleanText(body.identifier??body.email,3,254).toLowerCase(),password=String(body.password??"");
  if(!/^[a-z0-9_.@+-]+$/.test(identifier))throw new Error("CREDENTIALS");
  const user=await env.DB.prepare(`SELECT * FROM users WHERE username=? OR email=? LIMIT 1`).bind(identifier,identifier).first<User>();
  const dummySalt="AAAAAAAAAAAAAAAAAAAAAA",dummyHash=await passwordHash(password,dummySalt,env.PASSWORD_PEPPER,310000);
  const ok=!!user&&user.status==="active"&&(!user.locked_until||user.locked_until<=now())&&await secureEqual(await passwordHash(password,user.password_salt,env.PASSWORD_PEPPER,user.password_iterations),user.password_hash);
  void dummyHash;
  if(!ok){if(user){const attempts=user.failed_attempts+1,lock=attempts>=5?now()+900:null;await env.DB.prepare(`UPDATE users SET failed_attempts=?,locked_until=?,updated_at=? WHERE id=?`).bind(attempts,lock,now(),user.id).run();}await audit(req,env,"auth.login.failed",user?.id||null,"user",user?.id,{identifierHash:await sha256(identifier)});throw new Error("CREDENTIALS");}
  await env.DB.prepare(`UPDATE users SET failed_attempts=0,locked_until=NULL,updated_at=? WHERE id=?`).bind(now(),user.id).run();
  await audit(req,env,"auth.login.success",user.id,"user",user.id);return createSession(req,env,{id:user.id,email:user.email,display_name:user.display_name,role:user.role,must_change_password:Boolean(user.must_change_password)},appConfig(env as unknown as Record<string,string>).sessionTtlSeconds);
}

async function createSession(req:Request,env:Env,user:Auth["user"],ttl:number,status=200):Promise<Response>{
  const token=randomToken(),csrf=randomToken(),ts=now();
  await env.DB.prepare(`INSERT INTO sessions(id,user_id,token_hash,csrf_hash,expires_at,created_at,last_seen_at,ip_hash,user_agent_hash) VALUES(?,?,?,?,?,?,?,?,?)`).bind(uuid(),user.id,await sha256(token),await sha256(csrf),ts+ttl,ts,ts,await ipHash(req,env),await uaHash(req)).run();
  const h=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});h.append("Set-Cookie",sessionCookie(token,ttl));h.append("Set-Cookie",csrfCookie(csrf,ttl));return new Response(JSON.stringify({user}),{status,headers:h});
}

async function logout(req:Request,env:Env,auth:Auth|null):Promise<Response>{
  if(auth){await requireCsrf(req,auth);await env.DB.prepare(`DELETE FROM sessions WHERE id=?`).bind(auth.sessionId).run();await audit(req,env,"auth.logout",auth.user.id,"session",auth.sessionId)}
  const h=new Headers({"Content-Type":"application/json"});for(const c of clearSessionCookies)h.append("Set-Cookie",c);return new Response('{"ok":true}',{headers:h});
}

async function changePassword(req:Request,env:Env,auth:Auth):Promise<Response>{
  await requireCsrf(req,auth);await rateLimit(req,env,"password-change",5,3600);const b=await readJson(req);
  const current=String(b.current_password??""),next=validatePassword(b.new_password);
  if(current===next)throw new Error("PASSWORD_REUSE");
  const user=await env.DB.prepare(`SELECT * FROM users WHERE id=? LIMIT 1`).bind(auth.user.id).first<User>();
  if(!user||!(await secureEqual(await passwordHash(current,user.password_salt,env.PASSWORD_PEPPER,user.password_iterations),user.password_hash)))throw new Error("CREDENTIALS");
  const salt=randomToken(16),iterations=310000;
  await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,must_change_password=0,failed_attempts=0,locked_until=NULL,updated_at=? WHERE id=?`).bind(await passwordHash(next,salt,env.PASSWORD_PEPPER,iterations),salt,iterations,now(),user.id).run();
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id=? AND id<>?`).bind(user.id,auth.sessionId).run();
  await audit(req,env,"auth.password.changed",user.id,"user",user.id);return json({ok:true});
}

async function listProducts(env:Env):Promise<Response>{const rows=await env.DB.prepare(`SELECT id,slug,name,description,category,price_cents,stock,image_key,version,updated_at FROM products WHERE active=1 ORDER BY updated_at DESC LIMIT 200`).all();return json({products:rows.results})}
async function saveProduct(req:Request,env:Env,auth:Auth):Promise<Response>{
  await requireCsrf(req,auth);const b=await readJson(req);const id=typeof b.id==="string"&&/^[a-f0-9-]{36}$/.test(b.id)?b.id:uuid(),name=cleanText(b.name,2,120),slug=cleanText(b.slug,2,120).toLowerCase();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error("SLUG");const description=cleanText(b.description??"",0,2000),category=cleanText(b.category??"geral",1,60),price=Math.round(Number(b.price_cents)),stock=Math.round(Number(b.stock));if(!Number.isSafeInteger(price)||price<0||price>100000000||!Number.isSafeInteger(stock)||stock<0||stock>1000000)throw new Error("NUMBER");
  const ts=now();await env.DB.prepare(`INSERT INTO products(id,slug,name,description,category,price_cents,stock,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,description=excluded.description,category=excluded.category,price_cents=excluded.price_cents,stock=excluded.stock,version=products.version+1,updated_at=excluded.updated_at`).bind(id,slug,name,description,category,price,stock,ts,ts).run();await audit(req,env,"product.save",auth.user.id,"product",id);return json({ok:true,id});
}
async function deleteProduct(req:Request,env:Env,auth:Auth,id:string):Promise<Response>{await requireCsrf(req,auth);if(!/^[a-f0-9-]{36}$/.test(id))throw new Error("ID");await env.DB.prepare(`UPDATE products SET active=0,version=version+1,updated_at=? WHERE id=?`).bind(now(),id).run();await audit(req,env,"product.archive",auth.user.id,"product",id);return json({ok:true})}

async function contact(req:Request,env:Env):Promise<Response>{assertSameOrigin(req);await rateLimit(req,env,"contact",5,3600);const b=await readJson(req,16384),id=uuid();await env.DB.prepare(`INSERT INTO leads(id,name,email,phone,message,ip_hash,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id,cleanText(b.name,2,100),validEmail(b.email),b.phone?cleanText(b.phone,8,30):null,cleanText(b.message,10,3000),await ipHash(req,env),now()).run();await audit(req,env,"lead.create",null,"lead",id);return json({ok:true},201)}

function errorResponse(err:unknown):Response{
  const code=err instanceof Error?err.message:"INTERNAL";const map:Record<string,[number,string]>={ORIGIN:[403,"Origem inválida."],CSRF:[403,"Sessão inválida."],AUTH_REQUIRED:[401,"Autenticação necessária."],PASSWORD_CHANGE_REQUIRED:[403,"Troque a senha provisória antes de continuar."],PASSWORD_REUSE:[400,"A nova senha deve ser diferente."],FORBIDDEN:[403,"Acesso negado."],CREDENTIALS:[401,"Credenciais inválidas."],RATE_LIMIT:[429,"Muitas tentativas. Aguarde."],EMAIL_EXISTS:[409,"E-mail indisponível."],DISABLED:[403,"Cadastro indisponível."],TOO_LARGE:[413,"Conteúdo muito grande."],CONTENT_TYPE:[415,"Formato inválido."]};const [status,message]=map[code]||([400,"Solicitação inválida."] as [number,string]);return json({error:message},status)}

export default {async fetch(req:Request,env:Env,ctx:ExecutionContext):Promise<Response>{
  const url=new URL(req.url),method=req.method.toUpperCase();let response:Response;
  try{
    if(!url.pathname.startsWith("/api/")){response=await env.ASSETS.fetch(req);}
    else if(url.pathname==="/api/health"&&method==="GET"){const cfg=appConfig(env as unknown as Record<string,string>);response=json({ok:true,app:cfg.name,kind:cfg.kind,registration:cfg.allowRegistration});}
    else if(url.pathname==="/api/auth/register"&&method==="POST")response=await register(req,env);
    else if(url.pathname==="/api/auth/login"&&method==="POST")response=await login(req,env);
    else {const auth=await authenticate(req,env);
      if(url.pathname==="/api/auth/me"&&method==="GET")response=json({user:auth?.user||null});
      else if(url.pathname==="/api/auth/logout"&&method==="POST")response=await logout(req,env,auth);
      else if(url.pathname==="/api/auth/change-password"&&method==="POST")response=await changePassword(req,env,requireAuth(auth));
      else if(url.pathname==="/api/products"&&method==="GET")response=await listProducts(env);
      else if(url.pathname==="/api/admin/products"&&method==="POST")response=await saveProduct(req,env,requireRole(auth,["admin","editor"]));
      else if(url.pathname.startsWith("/api/admin/products/")&&method==="DELETE")response=await deleteProduct(req,env,requireRole(auth,["admin"]),url.pathname.split("/").pop()||"");
      else if(url.pathname==="/api/contact"&&method==="POST")response=await contact(req,env);
      else if(url.pathname==="/api/admin/leads"&&method==="GET"){requireRole(auth,["admin","editor"]);const rows=await env.DB.prepare(`SELECT id,name,email,phone,message,status,created_at FROM leads ORDER BY created_at DESC LIMIT 200`).all();response=json({leads:rows.results});}
      else response=json({error:"Não encontrado."},404);
    }
  }catch(e){response=errorResponse(e)}
  const h=new Headers(response.headers);securityHeaders(req).forEach((v,k)=>{if(!h.has(k))h.set(k,v)});h.set("X-WD-Security","1");
  if(Math.random()<0.01)ctx.waitUntil(Promise.all([env.DB.prepare(`DELETE FROM sessions WHERE expires_at<?`).bind(now()).run(),env.DB.prepare(`DELETE FROM rate_limits WHERE window_start<?`).bind(now()-86400).run()]).then(()=>undefined).catch(()=>undefined));
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}};
