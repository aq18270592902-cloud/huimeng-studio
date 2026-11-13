import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const A=JSON.parse(fs.readFileSync('./_data/apitest_acct.json','utf8'));
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(15000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,200)}}};
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const lg=await j(B+'/api/v1/auth/login',{method:'POST',headers:H,body:JSON.stringify({username:A.username,password:A.password})});
console.log('login',lg.s);
const tok=lg.j.access_token;
fs.writeFileSync('./_data/apitest_token.txt',tok,'utf8');
console.log('payload',Buffer.from(tok.split('.')[1],'base64url').toString());
const AH={...H,Authorization:'Bearer '+tok};
const paths=['/api/v1/auth/me','/api/v1/api-keys','/api/v1/teams','/api/v1/dashboard/overview','/api/v1/profile','/api/v1/billing','/api/v1/points','/api/v1/orders','/api/v1/plans','/api/v1/tasks','/api/v1/chat-logs','/api/v1/announcements','/api/v1/dashboard/keys','/api/v1/dashboard/billing',
'/api/v1/admin/users','/api/v1/admin/billing','/api/v1/admin/orders','/api/v1/admin/tasks','/api/v1/admin/chat-logs','/api/v1/admin/models','/api/v1/admin/plans','/api/v1/admin/points','/api/v1/admin/teams','/api/v1/admin/providers','/api/v1/admin/aggregation','/api/v1/admin/api-debug','/api/v1/admin/announcements','/api/v1/admin/health','/api/v1/admin/settings'];
for(const p of paths){
  const x=await j(B+p,{headers:AH});
  const body=JSON.stringify(x.j||x.t);
  console.log('\nGET',p,'->',x.s,body.slice(0,260));
}
