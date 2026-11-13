import {B,H,j,captchaVerification} from './lib_captcha.mjs';
// 1) bootstrap anonymous session cookie from the login page
const boot=await fetch(B+'/login/',{headers:{'User-Agent':H['User-Agent'],'Accept':'text/html'},redirect:'manual'});
const sc=boot.headers.getSetCookie?boot.headers.getSetCookie():[];
console.log('login page', boot.status, 'set-cookie:', JSON.stringify(sc));
const jar={};
for(const line of sc){const [kv]=line.split(';'); const i=kv.indexOf('='); jar[kv.slice(0,i).trim()]=kv.slice(i+1).trim();}
const cookie=Object.entries(jar).map(([k,v])=>k+'='+v).join('; ');
console.log('cookie =', cookie||'(none)');
// 2) session with cookie
const sess=await j(fetch(B+'/api/auth/session',{headers:{...H,Cookie:cookie}}));
console.log('session with cookie ->', JSON.stringify(sess));
// 3) captcha flow WITH cookie
const uid=crypto.randomUUID();
const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:{...H,Cookie:cookie}}));
console.log('captcha keys', cap?.data?Object.keys(cap.data):cap);
const {solveNCC,aes}=await import('./lib_captcha.mjs');
const s=solveNCC(Buffer.from(cap.data.originalImageBase64,'base64'),Buffer.from(cap.data.jigsawImageBase64,'base64'));
const pointJson=aes(JSON.stringify({x:s.x,y:5}),cap.data.secretKey);
const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:{...H,Cookie:cookie},body:JSON.stringify({captchaType:'blockPuzzle',token:cap.data.token,pointJson,clientUid:uid,ts:Date.now()})}));
console.log('check', s.x, s.ncc, '->', JSON.stringify(chk));
const cv=aes(cap.data.token+'---'+pointJson,cap.data.secretKey);
const sms=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:{...H,Cookie:cookie},body:JSON.stringify({phone:'19900000009',scene:'login',captchaVerification:cv})}));
console.log('sms WITH cookie ->', JSON.stringify(sms));
