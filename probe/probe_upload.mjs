import fs from 'node:fs';
const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV'};
const file=fs.readFileSync('free_gen_1.png');
async function tryUpload(path,field='file'){
 const fd=new FormData();
 fd.append(field,new Blob([file],{type:'image/png'}),'test.png');
 try{
  const r=await fetch(BASE+path,{method:'POST',headers:H,body:fd});
  const t=await r.text();console.log(path,r.status,t.slice(0,300));
 }catch(e){console.log(path,'ERR',e.message)}
}
for(const p of ['/scripts/910141757349483091/upload-file','/files/upload','/upload','/files/image','/assets/upload']) await tryUpload(p);
