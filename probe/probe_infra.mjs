const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36';
async function probe(url,method='GET'){
  try{
    const r=await fetch(url,{method,headers:{'User-Agent':UA,'Accept':'*/*'},redirect:'manual',signal:AbortSignal.timeout(9000)});
    const b=Buffer.from(await r.arrayBuffer());
    const txt=/text|json|html|xml/i.test(r.headers.get('content-type')||'')?b.toString('utf8').replace(/\s+/g,' ').slice(0,140):'[bin '+b.length+']';
    return r.status+' len='+b.length+' ct='+(r.headers.get('content-type')||'-').split(';')[0]+' | '+txt;
  }catch(e){return 'ERR '+e.name;}
}
const CHUNK='/_next/static/chunks/4bd1b696-50067311ab0225a6.js';
console.log('\n=== source map ===');
console.log(' map:', await probe('https://huimengi.com'+CHUNK+'.map'));
console.log('\n=== 内部/测试主机 ===');
for(const u of ['https://devdata.muchcloud.com:8080/','https://devdata.muchcloud.com:8080/analysis/extranet/validate','https://devdata.muchcloud.com:8082/','https://canvas-test-v3.muchcloud.com/','https://canvas-test.muchcloud.com/','https://asset-test.yunxiacn.com/','https://getip.muchcloud.com/','https://applogs.fachcloud.com/']){
  console.log(' '+(u).padEnd(64), await probe(u));
}
