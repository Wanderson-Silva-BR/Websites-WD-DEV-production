import{webcrypto}from'node:crypto';
const{ADMIN_USERNAME='WD_DEV',ADMIN_EMAIL,ADMIN_PASSWORD,ADMIN_NAME='WD DEV Super User',PASSWORD_PEPPER}=process.env;
if(!ADMIN_EMAIL||!ADMIN_PASSWORD||!PASSWORD_PEPPER)throw new Error('Defina ADMIN_EMAIL, ADMIN_PASSWORD e PASSWORD_PEPPER apenas no ambiente.');
if(!/^[A-Za-z0-9_.-]{3,40}$/.test(ADMIN_USERNAME))throw new Error('ADMIN_USERNAME inválido.');
if(ADMIN_PASSWORD.length<12)throw new Error('A senha administrativa precisa ter pelo menos 12 caracteres.');
const enc=new TextEncoder(),bytes=n=>{const v=new Uint8Array(n);webcrypto.getRandomValues(v);return v},b64=v=>Buffer.from(v).toString('base64url'),salt=bytes(16),iterations=310000,key=await webcrypto.subtle.importKey('raw',enc.encode(ADMIN_PASSWORD+PASSWORD_PEPPER),'PBKDF2',false,['deriveBits']),hash=b64(new Uint8Array(await webcrypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256))),id=webcrypto.randomUUID(),now=Math.floor(Date.now()/1000),q=s=>`'${String(s).replaceAll("'","''")}'`;
process.stdout.write(`INSERT INTO users(id,username,email,display_name,password_hash,password_salt,password_iterations,role,status,must_change_password,created_at,updated_at) VALUES(${q(id)},${q(ADMIN_USERNAME)},${q(ADMIN_EMAIL.toLowerCase())},${q(ADMIN_NAME)},${q(hash)},${q(b64(salt))},${iterations},'admin','active',1,${now},${now});\n`);
