import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
let hit=0, total=8;
for(let i=0;i<total;i++){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const best=r.nccTop[0];
  const pointJson=aes(JSON.stringify({x:best.dx,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
  const rep=chk?.data?.repCode;
  console.log('#'+i,'x='+best.dx,'ncc='+best.ncc,'2nd='+r.nccTop[1].dx+':'+r.nccTop[1].ncc,'->',rep,chk?.data?.repMsg||'');
  if(rep==='0000')hit++;
}
console.log('NCC-ONLY HIT RATE', hit+'/'+total);
