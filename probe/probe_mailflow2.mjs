import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,300)}}};
const rnd=Math.random().toString(36).slice(2,10);
const addr='hv'+rnd+'@fldubai.com', mp='Mailpass'+rnd+'!9';
await j('https://api.mail.tm/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr,password:mp})});
const tk=(await j('https://api.mail.tm/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr,password:mp})})).j;
const mt=tk.token;
const stamp=Date.now(), username='cw'+String(stamp).slice(-8), password='Passw0rd!23';
const reg=await j(B+'/api/v1/auth/register',{method:'POST',headers:H,body:JSON.stringify({email:addr,username,password})});
console.log('reg',reg.s,reg.j?.id);
let token=null;
for(let i=0;i<12 && !token;i++){
  await new Promise(z=>setTimeout(z,4000));
  const msgs=await j('https://api.mail.tm/messages',{headers:{Authorization:'Bearer '+mt}});
  const list=msgs.j?.['hydra:member']||[];
  if(!list.length){console.log('poll',i);continue}
  const m=await j('https://api.mail.tm/messages/'+list[0].id,{headers:{Authorization:'Bearer '+mt}});
  const b=JSON.stringify(m.j);
  const hit=(b.match(/token=([A-Za-z0-9._-]{20,})/g)||[])[0];
  if(hit){token=hit.slice(6);console.log('got token',token.length);}
}
if(!token){console.log('no token');process.exit(0)}
const parts=token.split('.'); 
console.log('JWT header',Buffer.from(parts[0],'base64url').toString());
console.log('JWT payload',Buffer.from(parts[1],'base64url').toString());
const v1=await j(B+'/api/v1/auth/verify-email?token='+token,{headers:H});
console.log('verify1',v1.s,JSON.stringify(v1.j||v1.t).slice(0,200));
const v2=await j(B+'/api/v1/auth/verify-email?token='+encodeURIComponent(token),{headers:H});
console.log('verify2',v2.s,JSON.stringify(v2.j||v2.t).slice(0,200));
const v3=await j(B+'/api/v1/auth/verify-email/'+token,{headers:H});
console.log('verify3(path)',v3.s,JSON.stringify(v3.j||v3.t).slice(0,160));
const lg=await j(B+'/api/v1/auth/login',{method:'POST',headers:H,body:JSON.stringify({username,password})});
console.log('login',lg.s,JSON.stringify(lg.j||lg.t).slice(0,200));
fs.writeFileSync('./_data/apitest_acct.json',JSON.stringify({addr,mp,username,password,userId:reg.j?.id,token},null,2),'utf8');
