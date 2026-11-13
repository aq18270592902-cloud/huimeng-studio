const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const P='https://platform.huimengi.com';
const H={'User-Agent':UA,'Accept':'application/json'};
const eps=['/api/auth/session','/api/auth/userinfo','/api/auth/users','/api/auth/users/1','/api/auth/tenant/list','/api/auth/tenants','/api/auth/identity/user/1','/api/auth/config','/api/auth/public-key','/api/auth/rsa/publicKey','/api/auth/captcha/config','/api/auth/email/send','/api/auth/oauth/providers','/api/auth/wechat/qrcode','/api/auth/third/oauth','/api/auth/check-phone','/api/auth/phone/exists','/api/auth/register/config','/api/auth/login/config','/api/auth/agreement','/api/auth/protocol','/api/auth/version','/api/auth/health','/api/auth/swagger','/api/auth/druid/index.html','/sso/getRedirectUrl','/sso/clients','/api/auth/clients'];
for(const p of eps){
  try{
    const r=await fetch(P+p,{headers:H,redirect:'manual',signal:AbortSignal.timeout(9000)});
    const t=await r.text();
    const short=t.length>100?t.replace(/\s+/g,' ').slice(0,100)+'…':t.replace(/\s+/g,' ');
    console.log(p.padEnd(32), r.status, short);
  }catch(e){console.log(p.padEnd(32),'ERR',e.name);}
}
