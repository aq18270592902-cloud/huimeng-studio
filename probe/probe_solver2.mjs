import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
let hit=0, total=8;
for(let i=0;i<total;i++){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap.data;
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  let ok=false, used=null;
  for(const c of r.cands.slice(0,3)){
    const pointJson=aes(JSON.stringify({x:c.dx,y:5}),d.secretKey);
    const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
    const rep=chk?.data?.repCode;
    console.log('#'+i,'pw',r.pw,'cand',JSON.stringify(c),'holes',JSON.stringify(r.holesTop),'ncc',JSON.stringify(r.nccTop),'->',rep);
    if(rep==='0000'){ok=true;used=c;break;}
  }
  if(ok)hit++;
}
console.log('HIT RATE', hit+'/'+total);
