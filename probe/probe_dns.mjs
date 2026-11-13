import dns from 'node:dns/promises';
const words=['www','api','app','admin','test','dev','pre','staging','stage','uat','prod','prod-api','gateway','open','openapi','pay','payment','order','user','auth','sso','login','passport','account','m','h5','static','cdn','img','image','images','video','media','asset','assets','oss','file','files','upload','download','docs','doc','wiki','help','status','monitor','grafana','kibana','jenkins','git','gitlab','gitea','svn','ci','registry','harbor','nexus','db','mysql','redis','mq','kafka','es','selenium','phpmyadmin','druid','actuator','swagger','internal','intranet','vpn','mail','smtp','pop','ns1','ns2','dns','canvas','dreamo','ai','aigc','model','models','console','dashboard','panel','ops','ops-api','log','logs','track','analysis','data','datav','bi','report','jupyter','notebook','lab','beta','alpha','demo','sandbox','old','new','v2','v3','beta-api','monitor-api','manage','manager','backend','server','service','srv','node','node1','k8s','docker','harbor2','oss-test','test-oss','test-api','api-test','api-dev'];
const apex=['huimengi.com','dimnx.com','muchcloud.com','fachcloud.com','yunxiacn.com','dreamo.tv'];
const found=[];
async function probe(host){
  try{
    const a=await dns.resolve4(host).catch(()=>[]);
    const c=await dns.resolveCname(host).catch(()=>[]);
    if(a.length||c.length) return {a,c};
  }catch{}
  return null;
}
for(const ap of apex){
  const jobs=[];
  for(const w of words) jobs.push((async()=>{
    const h=w===ap?ap:w+'.'+ap;
    const r=await probe(h);
    if(r) found.push({h,...r});
  })());
  await Promise.all(jobs);
}
found.sort((x,y)=>x.h.localeCompare(y.h));
console.log('RESOLVED '+found.length);
for(const f of found) console.log(f.h.padEnd(42), 'A='+f.a.join(',')||'-', 'CNAME='+(f.c.join(',')||'-'));
// dangling check: CNAME target that does not resolve
console.log('\n--- dangling CNAME check ---');
for(const f of found){
  if(!f.c.length)continue;
  const t=f.c[0];
  const a=await dns.resolve4(t.replace(/\.$/,'')).catch(()=>null);
  console.log(f.h,'->',t, a?('OK '+a.join(',')):'*** UNRESOLVED ***');
}
