const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const d=await j(BASE+'/tasks/enums');
 const tt=d?.data?.task_types||[];
 const i2v=tt.filter(x=>String(x.value).startsWith('IMAGE_TO_VIDEO'));
 console.log('i2v',i2v.length);
 i2v.forEach(x=>console.log(x.value,'|',x.label,'|',x.generate_type));
})();