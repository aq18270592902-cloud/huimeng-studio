const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV','content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 for(const id of ['910154955054180066','910154955960145554']){
  const d=await j(BASE+'/tasks/'+id);
  const dd=await j(BASE+'/tasks/'+id+'/detail');
  console.log('==',id,'status',d?.data?.status,'err',d?.data?.error_message,'points',d?.data?.points);
  console.log('OUT',JSON.stringify(d?.data?.output_data).slice(0,1200));
  console.log('IN',JSON.stringify(d?.data?.input_data).slice(0,600));
  console.log('DETAIL',JSON.stringify(dd?.data).slice(0,900));
  const bal=await j(BASE+'/billing/points');
  console.log('BAL',JSON.stringify(bal?.data).slice(0,300));
 }
})();