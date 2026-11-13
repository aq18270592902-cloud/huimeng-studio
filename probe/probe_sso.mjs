import PWD from './lib_pwd.mjs';

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const P='https://platform.huimengi.com';
async function req(path, body, ct){
  try{
    const r=await fetch(P+path,{method:'POST',headers:{'User-Agent':UA,'Content-Type':ct,'Accept':'application/json','Origin':P,'Referer':P+'/login/'},body:ct.includes('json')?JSON.stringify(body):new URLSearchParams(body).toString(),redirect:'manual'});
    const t=await r.text();
    return r.status+' | '+(t.length>220?t.replace(/\s+/g,' ').slice(0,220)+'…':t.replace(/\s+/g,' '));
  }catch(e){return 'ERR '+e.message;}
}
const F='application/x-www-form-urlencoded', J='application/json';
console.log('=== /sso/doLogin/password : form vs json ===');
const cases=[
 [{phone:'19900000001',password:PWD},F],
 [{phone:'19900000001',password:PWD},J],
 [{username:'19900000001',password:PWD},F],
 [{mobile:'19900000001',password:PWD},F],
 [{account:'19900000001',password:PWD},F],
 [{client:'platform',phone:'19900000001',password:PWD},F],
 [{client:'platform',redirect:'https://huimengi.com/home',phone:'19900000001',password:PWD},F],
 [{phone:'19900000001',password:'x',client:'platform',redirect:'https://huimengi.com/home',state:'0123456789abcdef0123456789abcdef',brand:'huimeng'},F],
];
for(const [b,ct] of cases) console.log((ct===F?'form ':'json ')+JSON.stringify(b).padEnd(140), await req('/sso/doLogin/password',b,ct));
console.log('\n=== /sso/getRedirectUrl 参考（已知可用）===');
console.log(await req('/sso/getRedirectUrl',{client:'platform',redirect:'https://huimengi.com/home',brand:'huimeng'},F));
console.log(await req('/sso/getRedirectUrl',{client:'platform',redirect:'https://huimengi.com/home'},J));
