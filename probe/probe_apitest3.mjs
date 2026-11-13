const B='https://api-test.huimengi.com';
const H={'Content-Type':'application/json','Accept':'application/json','Origin':B,'Referer':B+'/','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'};
async function call(m,p,body,extra){
  try{
    const r=await fetch(B+p,{method:m,headers:{...H,...(extra||{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(12000)});
    const t=await r.text();
    return {s:r.status,t:t.slice(0,400)};
  }catch(e){return {s:0,t:'ERR '+String(e).slice(0,70)}}
}
const tests=[
 ['GET','/api/v1/openapi.json'],['GET','/api/v1/docs'],['GET','/api/v1/health'],
 ['GET','/v1/models'],['GET','/api/v1/models'],
 ['POST','/api/v1/auth/forgot-password',{email:'admin@huimengi.com'}],
 ['POST','/api/v1/auth/forgot-password',{email:'test@example.com'}],
 ['POST','/api/v1/auth/register',{email:'probe'+Date.now()+'@example.com',username:'probe'+Date.now()%100000,password:'Passw0rd!23'}],
 ['POST','/api/v1/auth/login',{email:'admin@huimengi.com',password:'x'}],
];
for(const [m,p,b] of tests){const r=await call(m,p,b);console.log(m,p,'->',r.s,r.t.replace(/\s+/g,' '));}
