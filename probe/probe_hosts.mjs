const hosts=['admin.dimnx.com','app.dimnx.com','data.muchcloud.com','grafana.muchcloud.com','mq.dimnx.com','www.fachcloud.com','www.huimengi.com','www.yunxiacn.com','gitlab.muchcloud.com','gitlab.yunxiacn.com','jenkins.yunxiacn.com','doc.muchcloud.com','doc.yunxiacn.com','bi.muchcloud.com','canvas.huimengi.com','admin.dreamo.tv','mail.yunxiacn.com','static.yunxiacn.com','cdn.yunxiacn.com','image.yunxiacn.com','oss.dimnx.com','api-test.huimengi.com'];
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
for(const h of hosts){
  for(const scheme of ['https','http']){
    try{
      const ctl=AbortSignal.timeout(9000);
      const r=await fetch(scheme+'://'+h+'/',{headers:{'User-Agent':UA},redirect:'manual',signal:ctl});
      const t=await r.text();
      const title=(t.match(/<title[^>]*>([\s\S]{0,120}?)<\/title>/i)||[])[1]?.replace(/\s+/g,' ').trim();
      const server=r.headers.get('server'),xa=r.headers.get('x-powered-by');
      console.log([h,scheme,r.status,server||'-',xa||'-','loc='+(r.headers.get('location')||'-'),'title='+(title||'-'),'len='+t.length].join(' | '));
      if(h==='gitlab.muchcloud.com'||h==='gitlab.yunxiacn.com'||h==='jenkins.yunxiacn.com'||h==='grafana.muchcloud.com'||h==='mq.dimnx.com'||h==='admin.dimnx.com'){
        fs.writeFileSync('./_data/host_'+h.replace(/\./g,'_')+'_'+scheme+'.html',t,'utf8');
      }
      break;
    }catch(e){ console.log(h,scheme,'ERR',String(e).slice(0,70)); }
  }
}
