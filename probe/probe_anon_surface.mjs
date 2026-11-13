import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const BASE='https://api.dimnx.com/api';
const list=fs.readFileSync('C:/Users/aq/Desktop/rrea-projects/huimeng/endpoints.txt','utf8').split('\n').filter(Boolean)
  .filter(p=>!/\.(png|svg)$/.test(p) && !p.startsWith('/api/auth'));
const out=[];
for(const p of list){
  const url=BASE+p.replace(/\/$/,'').replace(/\/$/, '');
  try{
    const r=await fetch(url,{headers:{'User-Agent':UA,'Accept':'application/json'},redirect:'manual',signal:AbortSignal.timeout(12000)});
    let body=await r.text(); let j=null; try{j=JSON.parse(body);}catch{}
    out.push({p, status:r.status, code:j?.code??null, msg:(j?.msg??body).slice(0,90)});
  }catch(e){ out.push({p, status:'ERR', code:null, msg:e.name}); }
  await new Promise(r=>setTimeout(r,50));
}
const groups={};
for(const o of out){ const k=o.status+' '+(o.code??'-')+' '+o.msg.slice(0,60); (groups[k]??=[]).push(o.p); }
for(const [k,v] of Object.entries(groups)) console.log('\n['+k+']  x'+v.length+'\n  '+v.join('  '));
fs.writeFileSync('C:/Users/aq/Desktop/rrea-projects/huimeng/probe_anon_surface.json', JSON.stringify(out,null,1));
