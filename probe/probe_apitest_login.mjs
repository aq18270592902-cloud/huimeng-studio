import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const stamp=Date.now();
const email='probe'+stamp+'@example.com';
const username='pr'+String(stamp).slice(-8);
import password from './lib_pwd.mjs';
let r=await fetch(B+'/api/v1/auth/register',{method:'POST',headers:H,body:JSON.stringify({email,username,password})});
const reg=await r.json();
console.log('REGISTER',r.status,JSON.stringify(reg).slice(0,300));
r=await fetch(B+'/api/v1/auth/login',{method:'POST',headers:H,body:JSON.stringify({username,password})});
const lg=await r.json();
console.log('LOGIN',r.status,JSON.stringify(lg).slice(0,400));
const tok=lg.access_token||lg.token;
if(!tok){console.log('no token');process.exit(0);}
fs.writeFileSync('./_data/apitest_session.json',JSON.stringify({email,username,password,...lg},null,2),'utf8');
const AH={...H,Authorization:'Bearer '+tok};
const g=async(p)=>{try{const x=await fetch(B+p,{headers:AH,signal:AbortSignal.timeout(12000)});const t=await x.text();return {s:x.status,t:t}}catch(e){return {s:0,t:'ERR'+String(e).slice(0,50)}}};
for(const p of ['/api/v1/auth/me','/api/v1/users/me','/api/v1/auth/profile','/api/v1/api-keys','/api/v1/keys','/api/v1/teams','/api/v1/dashboard/overview','/api/v1/usage','/api/v1/models','/api/v1/pricing','/api/v1/balance','/api/v1/wallet','/api/v1/promos','/api/v1/auth/session']){
  const x=await g(p); console.log('\nGET',p,'->',x.s,x.t.replace(/\s+/g,' ').slice(0,320));
}
