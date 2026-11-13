const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV','content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 for(const u of ['/tasks/?page=1&size=20','/tasks/running/recent']){
  const d=await j(BASE+u); console.log('==',u,JSON.stringify(d).slice(0,900));
 }
})();
(async()=>{const d=await j(BASE+'/tasks/910152145659024140');console.log('== detail',JSON.stringify(d).slice(0,2500));const r2=await j(BASE+'/tasks/910152145659024140/request');console.log('== request',JSON.stringify(r2).slice(0,2000));const r3=await j(BASE+'/tasks/910152145659024140/detail');console.log('== detail2',JSON.stringify(r3).slice(0,1500));})();