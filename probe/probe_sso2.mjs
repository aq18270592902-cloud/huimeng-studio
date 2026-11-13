
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const P='https://platform.huimengi.com';
async function j(path, body){
  try{
    const r=await fetch(P+path,{method:'POST',headers:{'User-Agent':UA,'Content-Type':'application/json','Accept':'application/json','Origin':P,'Referer':P+'/login/'},body:JSON.stringify(body),redirect:'manual'});
    const t=await r.text();
    return r.status+' '+(t.length>180?t.slice(0,180):t).replace(/\s+/g,' ');
  }catch(e){return 'ERR '+e.message;}
}
const base={phone:'19900000001',password:'Test123456'};
const cands=[
 ['base',{}],
 ['+client',{client:'platform'}],
 ['+state',{state:'0123456789abcdef0123456789abcdef'}],
 ['+redirect',{redirect:'https://huimengi.com/home'}],
 ['+client+redirect',{client:'platform',redirect:'https://huimengi.com/home'}],
 ['+all',{client:'platform',redirect:'https://huimengi.com/home',state:'0123456789abcdef0123456789abcdef',brand:'huimeng',inviteCode:''}],
 ['+code',{code:'000000'}],
 ['+tenantId',{tenantId:'1'}],
 ['+preferredTenantId',{preferredTenantId:'1'}],
 ['pwd key',{pwd:'Test123456'}],
 ['passwd key',{passwd:'Test123456'}],
 ['passwordMd5',{passwordMd5:'098f6bcd4621d373cade4e832627b4f6'}],
 ['only phone+empty pwd',{password:''}],
];
for(const [tag,extra] of cands){
  const b={...base,...extra};
  console.log(tag.padEnd(22), JSON.stringify(await j('/sso/doLogin/password', b)));
}
