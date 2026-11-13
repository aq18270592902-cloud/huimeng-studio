const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 for(const u of ['/task/config/list','/task/permission/task-types','/billing/rules']){
  const d=await j(BASE+u); const s=JSON.stringify(d);
  console.log('==',u,s.slice(0,700));
 }
})();