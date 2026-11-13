import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const tok=fs.readFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_token.txt','utf8').trim();
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',Authorization:'Bearer '+tok};
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,300)}}};
for(const [m,p,b] of [
 ['PUT','/api/v1/auth/me',{role:'admin'}],
 ['PATCH','/api/v1/auth/me',{role:'admin'}],
 ['PUT','/api/v1/auth/me',{role:'admin',is_admin:true,max_concurrent_tasks:9999,rate_limit_rpm:99999}],
 ['POST','/api/v1/auth/me',{role:'admin'}],
]){const r=await j(B+p,{method:m,headers:H,body:JSON.stringify(b)});console.log(m,p,'->',r.s,(JSON.stringify(r.j)||r.t).slice(0,200));}
const me=await j(B+'/api/v1/auth/me',{headers:H});
console.log('\nME now:',JSON.stringify(me.j).slice(0,400));
const a1=await j(B+'/api/v1/admin/users',{headers:H});
console.log('ADMIN users ->',a1.s,(JSON.stringify(a1.j)||a1.t).slice(0,200));
