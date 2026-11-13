import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const targets=[['api-test.huimengi.com','https://api-test.huimengi.com/'],['data.muchcloud.com','https://data.muchcloud.com/'],['doc.muchcloud.com','https://doc.muchcloud.com/']];
for(const [name,url] of targets){
  try{
    const r=await fetch(url,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(12000)});
    const t=await r.text();
    fs.writeFileSync('C:\\Users\\aq\\Desktop\\rrea-projects\\huimeng\\host_'+name.replace(/[.:]/g,'_')+'.html',t,'utf8');
    console.log('===',name,r.status,t.length,'bytes ===');
    // extract scripts and api hints
    const scripts=[...t.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]);
    console.log('scripts:',scripts.slice(0,12).join(' '));
    const apis=[...new Set([...t.matchAll(/https?:\/\/[a-zA-Z0-9._-]+/g)].map(m=>m[0]))];
    console.log('urls:',apis.slice(0,15).join(' '));
    console.log('text:',t.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,300));
  }catch(e){console.log(name,'ERR',String(e).slice(0,80))}
}
