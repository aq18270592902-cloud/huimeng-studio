import fs from 'node:fs';
const B='https://api-test.huimengi.com';
const tok=fs.readFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\apitest_token.txt','utf8').trim();
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',Authorization:'Bearer '+tok};
const j=async(u,o)=>{const r=await fetch(u,{...o,signal:AbortSignal.timeout(20000)});const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,300)}}};
const r=await j(B+'/api/v1/api-keys',{method:'POST',headers:H,body:JSON.stringify({name:'poc2'})});
console.log('FULL CREATE:',JSON.stringify(r.j,null,1));
