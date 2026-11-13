import fs from 'node:fs';
const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||'')};
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
