const H={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36','Accept':'*/*','Origin':'https://api-test.huimengi.com','Referer':'https://api-test.huimengi.com/'};
const probes=[
 ['GET','/openapi.json'],['GET','/docs'],['GET','/redoc'],['GET','/api/openapi.json'],['GET','/v1/openapi.json'],
 ['GET','/health'],['GET','/api/health'],['GET','/api/v1/health'],['GET','/healthz'],['GET','/'],
 ['POST','/auth/login'],['POST','/api/auth/login'],['POST','/v1/auth/login'],
 ['POST','/auth/forgot-password'],['POST','/api/auth/forgot-password'],
 ['POST','/auth/register'],['GET','/auth/me'],['GET','/api/auth/me'],
 ['GET','/models'],['GET','/v1/models'],['GET','/api/models'],
 ['GET','/api-keys'],['GET','/v1/api-keys'],['GET','/keys'],
];
for(const [m,p] of probes){
  try{
    const r=await fetch('https://api-test.huimengi.com'+p,{method:m,headers:{...H,'Content-Type':'application/json'},body:m==='POST'?JSON.stringify({}):undefined,redirect:'manual',signal:AbortSignal.timeout(10000)});
    const t=await r.text();
    console.log(m,p,'->',r.status,r.headers.get('content-type')?.split(';')[0],'len='+t.length,'|',t.replace(/\s+/g,' ').slice(0,180));
  }catch(e){console.log(m,p,'ERR',String(e).slice(0,60))}
}
