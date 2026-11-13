import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const a='VerifyEmail-HVsgz15N.js';
const r=await fetch('https://api-test.huimengi.com/assets/'+a,{headers:{'User-Agent':UA,'Referer':'https://api-test.huimengi.com/verify-email'}});
const t=await r.text();
fs.writeFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\asset_verifyemail.js',t,'utf8');
console.log(t.length);
console.log(t.replace(/\s+/g,' ').slice(0,4000));
