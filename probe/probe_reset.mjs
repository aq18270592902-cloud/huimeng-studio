import {B,H,j,aes,solveV2} from './lib_captcha.mjs';
import crypto from 'node:crypto';
const MKD=(b)=>({...H,'Content-Type':'application/json'});
async function cv(base){
  const uid=crypto.randomUUID();
  const cap=await j(fetch(base+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap?.data; if(!d?.originalImageBase64) return {err:'cap:'+JSON.stringify(cap).slice(0,120)};
  const r=solveV2(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const pj=aes(JSON.stringify({x:r.nccTop[0].dx,y:5}),d.secretKey);
  const chk=await j(fetch(base+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson:pj,clientUid:uid,ts:Date.now()})}));
  if(chk?.data?.repCode!=='0000') return {err:'check:'+JSON.stringify(chk).slice(0,120)};
  return {v:aes(d.token+'---'+pj,d.secretKey)};
}
async function send(base,phone,n=4){
  const c=await cv(base); if(c.err) return c.err;
  const o=[];
  for(let i=0;i<n;i++){
    const r=await j(fetch(base+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone,scene:'login',captchaVerification:c.v})}));
    o.push(r.code+':'+r.msg); if(r.code!=='400')break;
    await new Promise(z=>setTimeout(z,250));
  }
  return o.join(' | ');
}
const now=new Date().toISOString();
console.log('['+now+'] platform sms:', await send(B,'19900000401'));
console.log('['+now+'] dimnx   sms:', await send('https://api.dimnx.com','19900000402'));
console.log('['+now+'] dimnx captcha:', await j(fetch('https://api.dimnx.com/api/auth/captcha/behavior?captchaType=blockPuzzle&clientUid=x&ts='+Date.now(),{headers:H})).then(x=>JSON.stringify(x).slice(0,100)).catch(e=>'ERR '+e));
