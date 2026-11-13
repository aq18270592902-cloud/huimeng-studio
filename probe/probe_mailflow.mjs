import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
const rnd=Math.random().toString(36).slice(2,10);
const addr='hm'+rnd+'@fldubai.com', mp='Mailpass'+rnd+'!9';
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,200)}}};
let a=await j('https://api.mail.tm/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr,password:mp})});
console.log('mailacct',a.s,JSON.stringify(a.j||a.t).slice(0,200));
let tk=await j('https://api.mail.tm/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr,password:mp})});
console.log('mailtoken',tk.s, (tk.j?.token||'').slice(0,20));
const mt=tk.j?.token;
const stamp=Date.now(), username='vh'+String(stamp).slice(-8), password='Passw0rd!23';
let r=await fetch(B+'/api/v1/auth/register',{method:'POST',headers:H,body:JSON.stringify({email:addr,username,password})});
const reg=await r.json();
console.log('REG',r.status,JSON.stringify(reg).slice(0,160));
fs.writeFileSync('./_data/apitest_acct.json',JSON.stringify({addr,mp,username,password,userId:reg.id},null,2),'utf8');
// poll mail
let link=null,html=null;
for(let i=0;i<15;i++){
  await new Promise(z=>setTimeout(z,5000));
  const msgs=await j('https://api.mail.tm/messages',{headers:{Authorization:'Bearer '+mt}});
  const list=msgs.j?.['hydra:member']||[];
  if(list.length){
    console.log('mails',list.length, list.map(m=>m.subject).join(' | '));
    const m=await j('https://api.mail.tm/messages/'+list[0].id,{headers:{Authorization:'Bearer '+mt}});
    const body=JSON.stringify(m.j);
    const urls=[...body.matchAll(/https?:\/\/[^"\\\s<>]+/g)].map(x=>x[0]);
    const hit=urls.find(u=>/verify|token/i.test(u));
    if(hit){link=hit;html=m.j;break;}
    console.log('urls',urls.slice(0,5).join(' '));
  } else console.log('wait mail', i);
}
console.log('LINK',link);
if(link){
  const v=await j(link,{headers:{'User-Agent':H['User-Agent']}});
  console.log('VERIFY',v.s,JSON.stringify(v.j||v.t).slice(0,200));
  const lg=await j(B+'/api/v1/auth/login',{method:'POST',headers:H,body:JSON.stringify({username,password})});
  console.log('LOGIN',lg.s,JSON.stringify(lg.j).slice(0,300));
  if(lg.j?.access_token) fs.writeFileSync('./_data/apitest_token.json',JSON.stringify(lg.j,null,2),'utf8');
}
