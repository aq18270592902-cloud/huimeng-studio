const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const ids=['910154955054180066','910154955960145554'];
 for(let i=0;i<40;i++){
  let done=0;
  for(const id of ids){
   const d=await j(BASE+'/tasks/'+id);
   const s=d?.data?.status;
   if(s==='COMPLETED'||s==='FAILED'||s==='CANCELED'){done++;continue}
  }
  await new Promise(r=>setTimeout(r,4000));
  if(i%3===0||done===ids.length){
   const out=[];
   for(const id of ids){const d=await j(BASE+'/tasks/'+id);out.push(id.slice(-6)+':'+(d?.data?.status||'?')+':'+(d?.data?.message||''))}
   console.log(i,out.join(' | '));
  }
  if(done===ids.length)break;
 }
})();