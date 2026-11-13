const paths=["/dict/api_model","/dict/","/dict/list","/dict/data","/dict/type/api_model","/system/dict/data/type/api_model","/config/configKey/sys.index.title","/config/","/common/download","/common/upload","/common/ip","/common/status","/notice/list","/notice/1","/article/list","/article/1","/article/hot","/article/category","/app/version","/version","/app/version/latest","/system/version","/upgrade/check","/agreement","/agreement/list","/agreement/privacy","/agreement/service","/protocol","/protocol/list","/region","/region/list","/region/tree","/area","/area/list","/city/list","/industry","/industry/list","/category","/category/list","/tag","/tag/list","/tags","/style","/styles","/style/list","/style/public","/styles/public","/styles/recommend","/model","/model/list","/models","/model/config","/model/pricing","/ai/model/list","/aigc/models","/template","/template/list","/templates","/effect","/effect/list","/music","/music/list","/sound","/sound/list","/price","/pricing","/vip/config","/vip/plan","/vip/plans/public","/point/package/list","/help","/help/list","/faq","/faq/list","/feedback/config","/contact","/user/agreement","/tenant/config","/tenant/list/public","/tenant/info","/tenant/public","/system/config/public","/system/info","/system/status","/system/time","/time","/ping","/health","/ready","/i18n","/i18n/zh_CN","/lang","/language/list","/banner","/banner/list","/operation/resource/banner","/operation/resource/float","/operation/resource/popup","/task/enums","/task/config/list","/task/permission/task-types","/tasks/enums","/share","/share/list","/creations/public","/creations/recommend","/creations/hot","/website-creation/list","/canvas/config","/canvas/list","/dreamo/config","/dreamo/list"];
const base='https://api.dimnx.com/api';
const H={'Content-Type':'application/json','Accept':'application/json, text/plain, */*','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36','Origin':'https://huimengi.com','Referer':'https://huimengi.com/'};
const out=[];
for(const p of paths){
  try{
    const r=await fetch(base+p,{headers:H});
    const txt=await r.text();
    let o=null; try{o=JSON.parse(txt)}catch(o2){}
    const code=o?.code, msg=o?.msg||(txt.slice(0,40).replace(/\s+/g,' '));
    if(code==='0') out.push({p,http:r.status,code,msg,d:JSON.stringify(o.data).slice(0,300)});
    else out.push({p,http:r.status,code,msg:msg.slice(0,60)});
  }catch(e){out.push({p,err:String(e).slice(0,60)})}
  await new Promise(z=>setTimeout(z,60));
}
const anon=out.filter(x=>x.code==='0');
console.log('ANON('+anon.length+'):'); anon.forEach(x=>console.log(' ',x.p,'->',x.d));
const interesting=out.filter(x=>x.code!=='0'&&x.msg&&!/不存在/.test(x.msg)&&!/登录/.test(x.msg));
console.log('\nOTHER('+interesting.length+'):'); interesting.forEach(x=>console.log(' ',x.p,'->',x.code,x.msg));
