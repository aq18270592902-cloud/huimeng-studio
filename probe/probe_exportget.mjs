const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const BASE='https://api.dimnx.com/api';
const H={'User-Agent':UA,'Accept':'*/*'};
async function get(p){
  try{
    const r=await fetch(BASE+p,{headers:H,redirect:'manual',signal:AbortSignal.timeout(15000)});
    const ct=r.headers.get('content-type')||'';
    const buf=Buffer.from(await r.arrayBuffer());
    const isXls=/sheet|excel|octet/i.test(ct) || (buf[0]===0x50&&buf[1]===0x4b);
    let head='';
    if(!isXls) head=buf.toString('utf8').slice(0,120).replace(/\s+/g,' ');
    return r.status+' len='+buf.length+' ct='+ct.split(';')[0]+(isXls?' [BINARY/OOXML]':' '+head);
  }catch(e){return 'ERR '+e.name;}
}
console.log('=== GET 各 export ===');
for(const p of ['/team/members/export','/scripts/export','/creations/export','/tasks/export','/article/export','/styles/export','/dashboard/points/records/export','/team/members/export?pageNum=1&pageSize=10']){
  console.log('  '+p.padEnd(44), await get(p));
}
console.log('\n=== /website-creation 分页与字段 ===');
for(const q of ['','?pageNum=1&pageSize=5','?pageNum=1&pageSize=100','?pageSize=100&current=1']){
  const r=await fetch(BASE+'/website-creation'+q,{headers:H,signal:AbortSignal.timeout(15000)});
  const j=await r.json().catch(()=>null);
  const d=j?.data;
  console.log('  '+q.padEnd(28),'type='+(Array.isArray(d)?'array':'obj'),'len='+(Array.isArray(d)?d.length:'-'),'keys='+(Array.isArray(d)&&d[0]?Object.keys(d[0]).join(','):(d&&typeof d==='object'?Object.keys(d).join(','):'')));
}
