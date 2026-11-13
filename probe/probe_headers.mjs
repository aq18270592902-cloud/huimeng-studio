
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const targets=['https://huimengi.com/','https://platform.huimengi.com/login/','https://api.dimnx.com/api/users/me','https://ai-assets.dimnx.com/','https://zy-dimnx.oss-cn-shenzhen.aliyuncs.com/'];
for(const u of targets){
  try{
    const r=await fetch(u,{headers:{'User-Agent':UA},redirect:'manual'});
    const h={};
    for(const k of ['server','strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','access-control-allow-origin','access-control-allow-credentials','x-powered-by','set-cookie']){
      if(r.headers.get(k)) h[k]=r.headers.get(k).slice(0,160);
    }
    console.log('\n===',u,r.status);
    console.log(JSON.stringify(h,null,1));
  }catch(e){console.log('\n===',u,'ERR',e.message);}
}
// CORS with credentials check on platform + api
for(const u of ['https://platform.huimengi.com/api/auth/session','https://api.dimnx.com/api/vip/plans']){
  const r=await fetch(u,{headers:{Origin:'https://evil.example','User-Agent':UA}});
  console.log('\nCORS',u,r.status,'ACAO=',r.headers.get('access-control-allow-origin'),'ACAC=',r.headers.get('access-control-allow-credentials'));
}
// OSS bucket listing attempt
const b=await fetch('https://zy-dimnx.oss-cn-shenzhen.aliyuncs.com/?list-type=2&max-keys=5',{headers:{'User-Agent':UA}});
console.log('\nOSS list status',b.status,(await b.text()).slice(0,300));
