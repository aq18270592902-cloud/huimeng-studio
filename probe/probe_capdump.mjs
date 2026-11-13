import {B,H,j,aes} from './lib_captcha.mjs';
import crypto from 'node:crypto';
const uid=crypto.randomUUID();
const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
const d=cap.data;
const slim={};
for(const [k,v] of Object.entries(d)){
  if(typeof v==='string' && v.length>120) slim[k]=v.slice(0,60)+'…(len '+v.length+')';
  else slim[k]=v;
}
console.log(JSON.stringify(slim,null,1));
