import PWD from './lib_pwd.mjs';
import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const stamp=Date.now();
const email='probe'+stamp+'@example.com', username='pr'+String(stamp).slice(-8), password=PWD;
async function call(m,p,body,hdr){
  try{
    const r=await fetch(B+p,{method:m,headers:{...H,...(hdr||{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});
    const t=await r.text(); return {s:r.status,t:t.replace(/\s+/g,' ')};
  }catch(e){return {s:0,t:'ERR'+String(e).slice(0,60)}}
}
const reg=await call('POST','/api/v1/auth/register',{email,username,password});
console.log('REG',reg.s,reg.t.slice(0,200));
fs.writeFileSync('./_data/apitest_acct.json',JSON.stringify({email,username,password},null,2),'utf8');
console.log('resend  ->',JSON.stringify(await call('POST','/api/v1/auth/resend-verification',{email})).slice(0,400));
console.log('verifyGET->',JSON.stringify(await call('GET','/api/v1/auth/verify-email')));
console.log('verifyPOST empty ->',JSON.stringify(await call('POST','/api/v1/auth/verify-email',{})));
console.log('verifyPOST uuid ->',JSON.stringify(await call('POST','/api/v1/auth/verify-email',{token:'11111111-1111-1111-1111-111111111111'})));
console.log('verifyGET tok ->',JSON.stringify(await call('GET','/api/v1/auth/verify-email?token=abc')));
console.log('login ->',JSON.stringify(await call('POST','/api/v1/auth/login',{username,password})).slice(0,300));
console.log('loginByEmail ->',JSON.stringify(await call('POST','/api/v1/auth/login',{email,password})).slice(0,300));
console.log('users/me anon ->',JSON.stringify(await call('GET','/api/v1/users/me')).slice(0,200));
console.log('users list anon ->',JSON.stringify(await call('GET','/api/v1/users')).slice(0,300));
console.log('openapi /api/v1/openapi.json ->',JSON.stringify(await call('GET','/api/v1/openapi.json')).slice(0,200));
console.log('GET /openapi.json (root) ->',JSON.stringify(await call('GET','/openapi.json')).slice(0,120));
