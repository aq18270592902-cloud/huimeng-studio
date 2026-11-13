
const B='https://api.dimnx.com/api';
const T=(process.env.HM_TOKEN||'');
const H={authorization:'Bearer '+T,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
(async()=>{
  try{
    const r=await fetch(B+'/billing/points',{headers:H});
    console.log('points',r.status,(await r.text()).slice(0,200));
  }catch(e){console.log('points ERR',e.message)}
  try{
    const r=await fetch(B+'/styles/image/prepare',{method:'POST',headers:H,body:JSON.stringify({fileName:'a.png',contentType:'image/png'})});
    console.log('prepare',r.status,(await r.text()).slice(0,300));
  }catch(e){console.log('prepare ERR',e.message)}
})();
