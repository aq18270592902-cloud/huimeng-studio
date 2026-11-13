import fs from 'node:fs';
const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||'')};
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
