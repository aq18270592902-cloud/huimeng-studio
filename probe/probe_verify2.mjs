import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const A=JSON.parse(fs.readFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_acct.json','utf8'));
// re-fetch last mail token from mail.tm
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,300)}}};
let tk=await j('https://api.mail.tm/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:A.addr,password:A.mp})});
const mt=tk.j?.token;
const msgs=await j('https://api.mail.tm/messages',{headers:{Authorization:'Bearer '+mt}});
const list=msgs.j?.['hydra:member']||[];
const m=await j('https://api.mail.tm/messages/'+list[0].id,{headers:{Authorization:'Bearer '+mt}});
const body=JSON.stringify(m.j);
const link=(body.match(/https?:\/\/[^"\\\s<>]*verify-email[^"\\\s<>]*/g)||[])[0];
console.log('link',link?.slice(0,120));
const token=new URL(link).searchParams.get('token');
console.log('token len',token?.length);
const v=await j(B+'/api/v1/auth/verify-email?token='+encodeURIComponent(token),{headers:H});
console.log('VERIFY-API',v.s,JSON.stringify(v.j||v.t).slice(0,300));
const lg=await j(B+'/api/v1/auth/login',{method:'POST',headers:H,body:JSON.stringify({username:A.username,password:A.password})});
console.log('LOGIN',lg.s,JSON.stringify(lg.j).slice(0,300));
if(lg.j?.access_token){
  fs.writeFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_token.json',JSON.stringify(lg.j,null,2),'utf8');
  const AH={...H,Authorization:'Bearer '+lg.j.access_token};
  for(const p of ['/api/v1/auth/me','/api/v1/api-keys','/api/v1/teams','/api/v1/dashboard/overview','/api/v1/models']){
    const x=await j(B+p,{headers:AH});
    console.log('\nGET',p,'->',x.s,(JSON.stringify(x.j)||x.t).slice(0,300));
  }
}
