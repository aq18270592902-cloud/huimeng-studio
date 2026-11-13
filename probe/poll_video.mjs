const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV','content-type':'application/json'};
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