const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const BASE='https://api.dimnx.com/api';
const H={'User-Agent':UA,'Accept':'application/json'};
const list=await (await fetch(BASE+'/website-creation',{headers:H})).json();
const ids=(list.data||[]).slice(0,4).map(x=>x.id);
console.log('sample ids', ids.join(','));
const probe=async(p)=>{try{const r=await fetch(BASE+p,{headers:H,redirect:'manual',signal:AbortSignal.timeout(12000)});const t=await r.text();return r.status+' '+(t.length>160?t.replace(/\s+/g,' ').slice(0,160)+'…':t.replace(/\s+/g,' '));}catch(e){return 'ERR '+e.name;}};
for(const id of ids.slice(0,2)){
  for(const p of ['/creations/'+id,'/scripts/'+id,'/tasks/'+id,'/creations/'+id+'/detail','/tasks/'+id+'/request','/article/'+id]){
    console.log(p.padEnd(48), await probe(p));
  }
}
console.log('\n=== 其它可能的匿名分享前缀 ===');
for(const p of ['/share/'+ids[0],'/creation/'+ids[0],'/public/creations/'+ids[0],'/creations/share/'+ids[0],'/website-creation/'+ids[0],'/creations/'+ids[0]+'/public']){
  console.log(p.padEnd(48), await probe(p));
}
