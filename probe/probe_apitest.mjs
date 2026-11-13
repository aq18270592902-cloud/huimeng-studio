import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const u='https://api-test.huimengi.com/assets/index-h1JdR1OC.js';
const r=await fetch(u,{headers:{'User-Agent':UA,'Referer':'https://api-test.huimengi.com/'},signal:AbortSignal.timeout(20000)});
const t=await r.text();
fs.writeFileSync('./_data/apitest_index.js',t,'utf8');
console.log('len',t.length);
const urls=[...new Set([...t.matchAll(/["'\x60](https?:\/\/[a-zA-Z0-9._:\/-]+)["'\x60]/g)].map(m=>m[1]))];
console.log('URLS:',urls.join('\n'));
const paths=[...new Set([...t.matchAll(/["'\x60](\/api\/[a-zA-Z0-9_\/{}.-]+)["'\x60]/g)].map(m=>m[1]))];
console.log('APIPATHS('+paths.length+'):',paths.slice(0,60).join(' '));
const keys=['token','Bearer','apiKey','api_key','secret','Authorization','X-Api','appId','app_id'];
for(const k of keys){const i=t.indexOf(k); if(i>=0) console.log('['+k+']',t.slice(Math.max(0,i-120),i+160).replace(/\s+/g,' '));}
