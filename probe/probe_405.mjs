import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const BASE='https://api.dimnx.com/api';
const H={'User-Agent':UA,'Accept':'application/json','Content-Type':'application/json'};
const eps=['/billing/batch-task-points','/billing/batch-task-points-with-config','/billing/task-points','/daily-visit/sign-in','/dashboard/points/available/batches/export','/dashboard/points/consumptions/export','/dashboard/points/consumptions/rank/export','/dashboard/points/draw-analysis/rank/export','/dashboard/points/records/export','/point/recharge','/scripts','/styles/image/prepare','/tenant/update-name','/users/cancel','/vip/order'];
console.log('=== POST {} -> 401 还是 400？（400/500 = 过了鉴权）===');
for(const p of eps){
  try{
    const r=await fetch(BASE+p,{method:'POST',headers:H,body:'{}',redirect:'manual',signal:AbortSignal.timeout(12000)});
    const t=await r.text(); let j=null; try{j=JSON.parse(t);}catch{}
    console.log(p.padEnd(52), r.status, JSON.stringify({code:j?.code,msg:(j?.msg||t).slice(0,70)}));
  }catch(e){console.log(p.padEnd(52),'ERR',e.name);}
  await new Promise(r=>setTimeout(r,60));
}
console.log('\n=== 7 个匿名 200 的内容 ===');
for(const p of ['/operation/resource/float-global','/operation/resource/popup-gen','/operation/resource/website-banner','/operation/resource/website-creation-selection','/operation/resource/website-featured-capability','/operation/resource/website-featured-module','/website-creation']){
  const r=await fetch(BASE+p,{headers:H,redirect:'manual',signal:AbortSignal.timeout(12000)});
  const t=await r.text();
  console.log('\n## '+p+' ('+t.length+' bytes)\n'+t.slice(0,320));
}
