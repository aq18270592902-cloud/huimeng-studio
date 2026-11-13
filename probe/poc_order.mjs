
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const B='https://platform.huimengi.com';
const H={'Content-Type':'application/json','User-Agent':UA,'Origin':B,'Referer':B+'/login/'};
async function j(p){const r=await p;const t=await r.text();try{return JSON.parse(t);}catch{return t.slice(0,300);}}
const cases=[
  {name:'no-captcha + invalid-format phone', body:{phone:'00000000000',scene:'login'}},
  {name:'garbage-captcha + invalid-format phone', body:{phone:'00000000000',scene:'login',captchaVerification:'AAAA'}},
  {name:'garbage-captcha + valid-format phone', body:{phone:'19900000000',scene:'login',captchaVerification:'AAAA'}},
  {name:'garbage-captcha + short', body:{phone:'199',scene:'login',captchaVerification:'AAAA'}},
];
for (const c of cases){
  const r=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify(c.body)}));
  console.log(c.name,'->',JSON.stringify(r));
}
