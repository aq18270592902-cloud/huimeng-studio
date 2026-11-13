import {B,H,j,aes,solveNCC} from './lib_captcha.mjs';
import crypto from 'node:crypto';
function once(){
  const uid=crypto.randomUUID();
  return (async()=>{
    for(let a=1;a<=6;a++){
      const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
      const d=cap.data;
      const s=solveNCC(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
      const pointJson=aes(JSON.stringify({x:s.x,y:5}),d.secretKey);
      const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
      const rep=chk?.data?.repCode;
      console.log('  cap try',a,'x',s.x,'ncc',s.ncc,'->',rep);
      if(rep==='0000') return {token:d.token,secretKey:d.secretKey,pointJson,clientUid:uid,cv:aes(d.token+'---'+pointJson,d.secretKey)};
    }
    return null;
  })();
}
const c=await once();
if(!c){console.log('captcha solve failed');process.exit(1);}
const post=(body)=>j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify(body)}));
const base={phone:'19900000010',scene:'login',captchaVerification:c.cv};
console.log('A bare        ->', JSON.stringify(await post(base)));
console.log('B +clientUid  ->', JSON.stringify(await post({...base,clientUid:c.clientUid})));
console.log('C +full       ->', JSON.stringify(await post({...base,clientUid:c.clientUid,captchaType:'blockPuzzle',token:c.token,ts:Date.now()})));
console.log('D +pointJson  ->', JSON.stringify(await post({...base,clientUid:c.clientUid,pointJson:c.pointJson})));
