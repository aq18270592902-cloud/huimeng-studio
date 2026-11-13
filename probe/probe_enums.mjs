const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const d=await j(BASE+'/tasks/enums');
 const tt=d?.data?.task_types||[];
 console.log('total',tt.length);
 console.log('SAMPLE',JSON.stringify(tt[0]));
 const keys=Object.keys(tt[0]||{}); console.log('KEYS',keys.join(','));
 const s=JSON.stringify(tt);
 const vids=tt.filter(x=>/VIDEO/i.test(JSON.stringify(x)));
 console.log('video-ish',vids.length);
 console.log(JSON.stringify(vids.slice(0,6)).slice(0,2500));
})();