import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
const uid=crypto.randomUUID();
const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
const d=cap.data;
const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
const best=r.nccTop[0];
const pointJson=aes(JSON.stringify({x:best.dx,y:5}),d.secretKey);
const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
console.log('check', best.dx, best.ncc, JSON.stringify(chk));
const cv=aes(d.token+'---'+pointJson,d.secretKey);
const phone='19900000030';
const send=(body)=>j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify(body)}));
const V={
 '1 bare':{phone,scene:'login',captchaVerification:cv},
 '2 +clientUid':{phone,scene:'login',captchaVerification:cv,clientUid:uid},
 '3 +all':{phone,scene:'login',captchaVerification:cv,clientUid:uid,captchaType:'blockPuzzle',token:d.token,ts:Date.now()},
 '4 +all again':{phone,scene:'login',captchaVerification:cv,clientUid:uid,captchaType:'blockPuzzle',token:d.token,ts:Date.now()},
};
for(const [k,v] of Object.entries(V)) console.log(k.padEnd(14),'->',JSON.stringify(await send(v)));
