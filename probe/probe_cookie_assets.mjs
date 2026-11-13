
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
// cookie flags
let r=await fetch('https://platform.huimengi.com/api/auth/captcha/behavior?captchaType=blockPuzzle&clientUid=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&ts='+Date.now(),{headers:{'User-Agent':UA}});
console.log('captcha status',r.status);
console.log('set-cookie:', JSON.stringify(r.headers.getSetCookie?.() ?? r.headers.get('set-cookie')));
// asset public read
for (const u of ['https://zy-dimnx.oss-cn-shenzhen.aliyuncs.com/posters/user-source-bg.png','https://ai-assets.dimnx.com/posters/user-source-bg.png']){
  try{ const g=await fetch(u,{headers:{'User-Agent':UA}}); console.log(u, g.status, g.headers.get('content-type'), g.headers.get('content-length'), 'cors=',g.headers.get('access-control-allow-origin')); }catch(e){console.log(u,'ERR',e.message);}
}
// OPTIONS preflight on api.dimnx.com for a POST with auth header
r=await fetch('https://api.dimnx.com/api/aigc/text-to-image/seedream-4-5',{method:'OPTIONS',headers:{Origin:'https://evil.example','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type,x-tenant-id,x-tenant-code','User-Agent':UA}});
console.log('preflight',r.status,'ACAO=',r.headers.get('access-control-allow-origin'),'ACAH=',r.headers.get('access-control-allow-headers'),'ACAM=',r.headers.get('access-control-allow-methods'),'ACAC=',r.headers.get('access-control-allow-credentials'));
