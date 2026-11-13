import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
for(const a of ['auth-D52ozltO.js']){
  const r=await fetch('https://api-test.huimengi.com/assets/'+a,{headers:{'User-Agent':UA,'Referer':'https://api-test.huimengi.com/'}});
  const t=await r.text();
  fs.writeFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\asset_'+a,t,'utf8');
  console.log('==',a,t.length);
  const re=/[\"'\x60](\/[a-zA-Z0-9_\-./{}$:?=&]{2,70})[\"'\x60]/g;
  console.log('paths',[...new Set([...t.matchAll(re)].map(m=>m[1]))].join(' '));
  for(const k of ['verify-email','verify','verifyEmail','EMAIL_NOT_VERIFIED','token']){
    let i=-1,c=0;
    while((i=t.indexOf(k,i+1))>=0&&c<3){console.log('['+k+'] ...'+t.slice(Math.max(0,i-200),i+250).replace(/\s+/g,' ')+'...\n');c++;}
  }
}
