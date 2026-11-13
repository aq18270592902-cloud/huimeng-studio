const paths=["/dashboard/points/overview","/dashboard/points/conditions","/dashboard/points/export","/dashboard/users/export","/dashboard/creations/export","/dashboard/tasks/export","/dashboard/scripts/export","/dashboard/points/list","/dashboard/points/detail","/dashboard/points/rank","/dashboard/points/summary","/dashboard/points/statistics","/dashboard/overview","/dashboard/index","/dashboard/data","/dashboard/stat","/point/export","/vip/export","/billing/export","/billing/points/export","/users/export","/creations/export","/tasks/export","/scripts/export","/styles/export","/asset-lib/export","/team/members/export","/system/role/export","/system/dept/export","/system/user/export","/system/dict/export","/api/team/members/export","/api/tag/export","/api/project-quota/export","/log/export","/operation/log/export","/logininfor/export"];
const base='https://api.dimnx.com';
const H={'Content-Type':'application/json','Accept':'application/json, text/plain, */*','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36','Origin':'https://huimengi.com','Referer':'https://huimengi.com/'};
for(const p of paths){
  for(const m of ['POST','GET']){
    const url=base+'/api'+p;
    try{
      const r=await fetch(url,{method:m,headers:H,body:m==='POST'?JSON.stringify({startTime:'2026-01-01 00:00:00',endTime:'2026-11-08 23:59:59',pageNum:1,pageSize:10}):undefined});
      const txt=await r.text(); let o=null; try{o=JSON.parse(txt)}catch{}
      const c=o?.code,msg=(o?.msg||txt.slice(0,50)).replace(/\s+/g,' ');
      if(c!=='0'&&!/不存在/.test(msg)&&!/登录状态已过期/.test(msg)&&!/请求方式/.test(msg))
        console.log(m,p,'->',r.status,c,msg.slice(0,80));
      else if(c==='0') console.log('!!!',m,p,'->',r.status,c,JSON.stringify(o.data).slice(0,200));
    }catch(e){console.log(m,p,'ERR',String(e).slice(0,60))}
    await new Promise(z=>setTimeout(z,50));
  }
}
console.log('done');
