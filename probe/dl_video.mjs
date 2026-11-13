import fs from 'node:fs';
const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
const ids={'910154955054180066':'video_test_480p.mp4','910154955960145554':'video_test_720p.mp4'};
for(const [id,name] of Object.entries(ids)){
 const d=await j(BASE+'/tasks/'+id);
 const u=d?.data?.output_data?.result_response?.result?.video_url;
 if(!u){console.log('NOURL',id);continue}
 const r=await fetch(u); const b=Buffer.from(await r.arrayBuffer());
 fs.writeFileSync(name,b); console.log(name,r.status,b.length,'bytes');
}