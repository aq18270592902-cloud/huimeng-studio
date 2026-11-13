import {B,H,j,aes,solveNCC} from './lib_captcha.mjs';
import crypto from 'node:crypto';
async function ticket(){
  const uid=crypto.randomUUID();
  for(let a=1;a<=6;a++){
    const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
    const d=cap.data;
    const s=solveNCC(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
    const pointJson=aes(JSON.stringify({x:s.x,y:5}),d.secretKey);
    const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
    if(chk?.data?.repCode==='0000') return {token:d.token,clientUid:uid,ts:Date.now(),captchaVerification:aes(d.token+'---'+pointJson,d.secretKey)};
    console.log('  retry',a,chk?.data?.repCode);
  }
  return null;
}
const phones=['19900000011','19900000012','19900000013'];
for(const ph of phones){
  const c=await ticket();
  if(!c){console.log(ph,'no ticket');continue;}
  const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:ph,scene:'login',captchaType:'blockPuzzle',token:c.token,clientUid:c.clientUid,ts:c.ts,captchaVerification:c.captchaVerification})}));
  console.log(ph,'->',JSON.stringify(r));
  await new Promise(r=>setTimeout(r,800));
}
