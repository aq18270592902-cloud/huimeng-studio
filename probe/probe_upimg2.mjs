import fs from 'node:fs';
const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV'};
const SID='910158211666990170';
const file=fs.readFileSync('free_gen_1.png');
const pre=await fetch(BASE+'/styles/image/prepare',{method:'POST',headers:{...H,'content-type':'application/json'},body:JSON.stringify({fileName:'first.png',contentType:'image/png'})});
const tt=await pre.text();
console.log('prepare',pre.status,tt.slice(0,500));
let url=null;
try{const o=JSON.parse(tt);url=typeof o.data==='string'?o.data:o.data?.url}catch{}
if(url){
 const put=await fetch(url,{method:'PUT',headers:{'Content-Type':'image/png'},body:file});
 console.log('put',put.status);
 const u2=new URL(url);u2.search='';u2.hash='';
 const pub=u2.toString();
 const chk=await fetch(pub,{method:'GET'});
 console.log('PUBLIC',pub,'GET',chk.status,chk.headers.get('content-length'));
}
