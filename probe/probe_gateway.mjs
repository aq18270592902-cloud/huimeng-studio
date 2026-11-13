import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const KEY='hm-NZTl3xP9UakL74TN4-SwpuSTsy9N5RbdBoh4rhmM4cU';
const tok=fs.readFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_token.txt','utf8').trim();
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(60000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,400)}}};
const KH={'Content-Type':'application/json','Authorization':'Bearer '+KEY,'User-Agent':'hm-poc/1.0'};
const m=await j(B+'/v1/models',{headers:KH});
const ids=(m.j?.data||[]).map(x=>x.id);
console.log('GATEWAY /v1/models',m.s,ids.length,ids.join(','));
// text models
const cand=ids.filter(x=>/glm|deepseek|gpt-|qwen|llama|text|chat/i.test(x));
console.log('text candidates',cand.join(','));
for(const model of cand.slice(0,3)){
  const r=await j(B+'/v1/chat/completions',{method:'POST',headers:KH,body:JSON.stringify({model,messages:[{role:'user',content:'ping, reply with OK only'}],max_tokens:8})});
  console.log('\nCHAT',model,'->',r.s,(JSON.stringify(r.j)||r.t).slice(0,400));
}
// balance-ish endpoints with JWT
const JH={'Content-Type':'application/json','Authorization':'Bearer '+tok,'User-Agent':'hm-poc/1.0','Origin':B,'Referer':B+'/'};
for(const p of ['/api/v1/points/balance','/api/v1/billing/balance','/api/v1/wallet/balance','/api/v1/me/points','/api/v1/usage','/api/v1/stats','/api/v1/api-keys/'+'','/api/v1/auth/me']){
  const x=await j(B+p,{headers:JH});
  console.log('GET',p,'->',x.s,(JSON.stringify(x.j)||x.t).slice(0,180));
}
