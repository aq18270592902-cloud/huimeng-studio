import crypto from 'node:crypto';
import zlib from 'node:zlib';
export const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
export const B='https://platform.huimengi.com';
export const H={'Content-Type':'application/json','User-Agent':UA,'Origin':B,'Referer':B+'/login/'};
export function decodePNG(buf){
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
export const aes=(plain,key)=>{const k=Buffer.from(key,'utf8');const c=crypto.createCipheriv(k.length===16?'aes-128-ecb':'aes-256-ecb',k,null);c.setAutoPadding(true);return Buffer.concat([c.update(Buffer.from(plain)),c.final()]).toString('base64');};
export async function j(p){const r=await p;const t=await r.text();try{return JSON.parse(t);}catch{return t;}}
export function solveNCC(origBuf,jigBuf){
  const O=decodePNG(origBuf), J=decodePNG(jigBuf);
  let x0=1e9,x1=-1,y0=1e9,y1=-1;
  for(let y=0;y<J.h;y++)for(let x=0;x<J.w;x++){ if(J.data[(y*J.w+x)*4+3]>250){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;} }
  const g=(img,x,y)=>{const o=(y*img.w+x)*4;return img.data[o]*0.299+img.data[o+1]*0.587+img.data[o+2]*0.114;};
  const pts=[];
  for(let y=y0+3;y<=y1-3;y++)for(let x=x0+3;x<=x1-3;x++){ if(J.data[(y*J.w+x)*4+3]>250) pts.push([x-x0, y-y0, g(J,x,y)]); }
  let best=-2,bestX=-1; const scores=[];
  for(let dx=0;dx<=O.w-(x1-x0+1);dx++){
    let sa=0,sb=0,saa=0,sbb=0,sab=0,n=0;
    for(const [px,py,pv] of pts){ const ov=g(O,dx+px,py); n++; sa+=pv; sb+=ov; saa+=pv*pv; sbb+=ov*ov; sab+=pv*ov; }
    const ma=sa/n, mb=sb/n;
    const va=saa/n-ma*ma, vb=sbb/n-mb*mb, cov=sab/n-ma*mb;
    const r=cov/Math.sqrt(Math.max(va,1e-6)*Math.max(vb,1e-6));
    scores.push([dx,r]); if(r>best){best=r;bestX=dx;}
  }
  scores.sort((a,b)=>b[1]-a[1]);
  return {x:bestX, ncc:Number(best.toFixed(4)), top:scores.slice(0,4).map(([d,r])=>d+':'+r.toFixed(3))};
}
export async function captchaVerification(log=(...a)=>{}){
  const uid=crypto.randomUUID();
  for(let attempt=1;attempt<=6;attempt++){
    const cap=await j(fetch(B+'/api/auth/captcha/behavior?'+new URLSearchParams({captchaType:'blockPuzzle',clientUid:uid,ts:String(Date.now())}),{headers:H}));
    const d=cap?.data||{};
    const s=solveNCC(Buffer.from(d.originalImageBase64,'base64'),Buffer.from(d.jigsawImageBase64,'base64'));
    const pointJson=aes(JSON.stringify({x:s.x,y:5}),d.secretKey);
    const chk=await j(fetch(B+'/api/auth/captcha/behavior',{method:'POST',headers:H,body:JSON.stringify({captchaType:'blockPuzzle',token:d.token,pointJson,clientUid:uid,ts:Date.now()})}));
    const rep=chk?.data?.repCode;
    log('attempt',attempt,'x',s.x,'ncc',s.ncc,'->',rep,chk?.data?.repMsg||'');
    if(rep==='0000') return aes(d.token+'---'+JSON.stringify({x:s.x,y:5}),d.secretKey);
  }
  return null;
}

// --- v2 solver: hole-darkness + NCC on full piece ---
export function solveV2(origBuf,jigBuf){
  const O=decodePNG(origBuf), J=decodePNG(jigBuf);
  let x0=1e9,x1=-1,y0=1e9,y1=-1;
  for(let y=0;y<J.h;y++)for(let x=0;x<J.w;x++){ if(J.data[(y*J.w+x)*4+3]>250){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;} }
  const pw=x1-x0+1, ph=y1-y0+1;
  const gO=(x,y)=>{const o=(y*O.w+x)*4;return O.data[o]*0.299+O.data[o+1]*0.587+O.data[o+2]*0.114;};
  const gJ=(x,y)=>{const o=(y*J.w+x)*4;return J.data[o]*0.299+J.data[o+1]*0.587+J.data[o+2]*0.114;};
  // row means of original for the piece's y band (whole image width)
  const rowMean=new Float64Array(O.h);
  for(let y=0;y<O.h;y++){let s=0;for(let x=0;x<O.w;x++)s+=gO(x,y);rowMean[y]=s/O.w;}
  const scores=[];
  for(let dx=0;dx<=O.w-pw;dx++){
    // hole: box darker than its row baseline
    let boxS=0,cnt=0,baseS=0;
    for(let y=y0+2;y<=y1-2;y++){
      for(let x=dx+2;x<dx+pw-2;x++){boxS+=gO(x,y);cnt++;}
      baseS+=rowMean[y]*cnt/Math.max(1,(pw-4));
    }
    const boxM=boxS/cnt, baseM=baseS/(ph-4);
    const hole=baseM-boxM; // positive if gap darker
    // NCC interior of piece
    let sa=0,sb=0,saa=0,sbb=0,sab=0,n=0;
    for(let y=y0+4;y<=y1-4;y+=2)for(let x=x0+4;x<=x1-4;x+=2){
      if(J.data[(y*J.w+x)*4+3]<=250)continue;
      const pv=gJ(x,y), ov=gO(dx+(x-x0),y);
      n++; sa+=pv; sb+=ov; saa+=pv*pv; sbb+=ov*ov; sab+=pv*ov;
    }
    const ma=sa/n, mb=sb/n, va=saa/n-ma*ma, vb=sbb/n-mb*mb, cov=sab/n-ma*mb;
    const ncc=cov/Math.sqrt(Math.max(va,1e-6)*Math.max(vb,1e-6));
    scores.push({dx,hole:Number(hole.toFixed(2)),ncc:Number(ncc.toFixed(4))});
  }
  const holes=[...scores].sort((a,b)=>b.hole-a.hole);
  const nccs=[...scores].sort((a,b)=>b.ncc-a.ncc);
  const cands=[];
  const push=(dx,why)=>{ if(!cands.find(c=>c.dx===dx)) cands.push({dx,why}); };
  holes.slice(0,3).forEach(h=>push(h.dx,'hole'));
  nccs.slice(0,3).forEach(h=>push(h.dx,'ncc'));
  // combined top
  const comb=[...scores].map(s=>({...s,z: (s.hole*0.5)+(s.ncc*50)})).sort((a,b)=>b.z-a.z);
  comb.slice(0,2).forEach(h=>push(h.dx,'comb'));
  return {cands, pw, ph, holesTop:holes.slice(0,3), nccTop:nccs.slice(0,3), combTop:comb.slice(0,3).map(s=>s.dx)};
}
