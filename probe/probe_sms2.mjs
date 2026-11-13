import {B,H,j,captchaVerification} from './lib_captcha.mjs';
const cv=await captchaVerification((...a)=>console.log(' [cap]',...a));
console.log('captchaVerification =', cv ? cv.slice(0,48)+'…' : 'FAILED');
if(!cv) process.exit(1);
const send=(phone,scene)=>j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone,scene,captchaVerification:cv})}));
for(const [ph,sc] of [['19900000006','login'],['19900000007','register'],['19900000008','changePhone']]){
  console.log('send', ph, sc, '->', JSON.stringify(await send(ph,sc)));
}
