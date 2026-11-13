const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 for(const u of ['/tasks/?page=1&size=20','/tasks/running/recent']){
  const d=await j(BASE+u); console.log('==',u,JSON.stringify(d).slice(0,900));
 }
})();
(async()=>{const d=await j(BASE+'/tasks/910152145659024140');console.log('== detail',JSON.stringify(d).slice(0,2500));const r2=await j(BASE+'/tasks/910152145659024140/request');console.log('== request',JSON.stringify(r2).slice(0,2000));const r3=await j(BASE+'/tasks/910152145659024140/detail');console.log('== detail2',JSON.stringify(r3).slice(0,1500));})();