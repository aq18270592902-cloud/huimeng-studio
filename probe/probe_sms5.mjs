import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
async function ticket(){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const best=r.nccTop[0];
  const pointJson=aes(JSON.stringify({x:best.dx,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
  if(chk?.data?.repCode!=='0000') return null;
  return {token:d.token,clientUid:uid,ts:Date.now(),captchaVerification:aes(d.token+'---'+pointJson,d.secretKey)};
}
for(const ph of ['19900000020','19900000021','19900000022']){
  const c=await ticket();
  if(!c){console.log(ph,'ticket-fail');continue;}
  const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:ph,scene:'login',captchaType:'blockPuzzle',token:c.token,clientUid:c.clientUid,ts:c.ts,captchaVerification:c.captchaVerification})}));
  console.log(ph,'->',JSON.stringify(r));
  await new Promise(r=>setTimeout(r,1500));
}
