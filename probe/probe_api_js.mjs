import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const r=await fetch('https://api-test.huimengi.com/assets/api-DKv0C9qa.js',{headers:{'User-Agent':UA,'Referer':'https://api-test.huimengi.com/'}});
const t=await r.text();
fs.writeFileSync('./_data/apitest_api.js',t,'utf8');
console.log('len',t.length);
const re=/["\x60'](\/[a-zA-Z0-9_\-./{}$:]{2,70})["\x60']/g;
const paths=[...new Set([...t.matchAll(re)].map(m=>m[1]))];
console.log('PATHS('+paths.length+'):'); console.log(paths.join('\n'));
const i=t.indexOf('baseURL');
console.log('\n[baseURL]', i>=0? t.slice(Math.max(0,i-300),i+300).replace(/\s+/g,' ') : 'none');
for(const k of ['VITE_','import.meta.env','create(','localStorage','Bearer']){ let j=-1,c=0; while((j=t.indexOf(k,j+1))>=0&&c<2){console.log('['+k+'] ...'+t.slice(Math.max(0,j-200),j+250).replace(/\s+/g,' ')+'...\n');c++;} }