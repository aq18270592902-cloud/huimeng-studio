import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const a='router-C9SZTJYi.js';
const r=await fetch('https://api-test.huimengi.com/assets/'+a,{headers:{'User-Agent':UA}});
const t=await r.text();
fs.writeFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\asset_router.js',t,'utf8');
console.log('len',t.length);
const re=/path:\s*[\"'\x60]([^\"'\x60]+)[\"'\x60]/g;
console.log('ROUTES:',[...t.matchAll(re)].map(m=>m[1]).join(' '));
const re2=/[\"'\x60](\/[a-z][a-zA-Z0-9_\-./]{2,40})[\"'\x60]/g;
console.log('PATHLIKE:',[...new Set([...t.matchAll(re2)].map(m=>m[1]))].join(' '));
console.log('--- verify ctx ---');
let i=t.indexOf('verify');
while(i>=0&&i<t.length){console.log('...'+t.slice(Math.max(0,i-150),i+200).replace(/\s+/g,' ')+'...\n');i=t.indexOf('verify',i+6);if(i>0&&i>200000)break;}
