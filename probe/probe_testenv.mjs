import PWD from './lib_pwd.mjs';

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36';
async function call(base, path, body, method='POST'){
  try{
    const r=await fetch(base+path,{method,headers:{'User-Agent':UA,'Content-Type':'application/json','Accept':'application/json'},body:method==='GET'?undefined:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(7000)});
    const t=await r.text();
    return r.status+' '+(t.length>180?t.slice(0,180)+'…':t).replace(/\s+/g,' ');
  }catch(e){return 'ERR '+e.name+' '+e.message;}
}
for(const h of ['https://platform.yunxiacn.com','https://app-test.yunxiacn.com']){
  console.log('\n########', h);
  console.log(' session         ', await call(h,'/api/auth/session',null,'GET'));
  console.log(' register 123456 ', await call(h,'/api/auth/register',{phone:'19900000002',code:'123456',password:PWD}));
  console.log(' smsLogin 123456 ', await call(h,'/api/auth/sso/doLogin/sms',{phone:'19900000002',code:'123456'}));
}
