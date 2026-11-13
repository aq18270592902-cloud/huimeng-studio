import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const tok=fs.readFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_token.txt','utf8').trim();
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',Authorization:'Bearer '+tok};
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,300)}}};
for(const body of [{name:'poc'},{},{name:'poc',expires_in:30},{label:'poc'}]){
  const r=await j(B+'/api/v1/api-keys',{method:'POST',headers:H,body:JSON.stringify(body)});
  console.log('POST api-keys',JSON.stringify(body),'->',r.s,(JSON.stringify(r.j)||r.t).slice(0,300));
  if(r.s===200||r.s===201) break;
}
const list=await j(B+'/api/v1/api-keys',{headers:H});
console.log('LIST',list.s,JSON.stringify(list.j).slice(0,500));
const models=await j(B+'/api/v1/models',{headers:H});
const arr=Array.isArray(models.j)?models.j:[];
console.log('MODELS',arr.length);
for(const m of arr) console.log(' -',m.id,m.name,m.category, JSON.stringify(m.pricing||m.price||'').slice(0,80));
