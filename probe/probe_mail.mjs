const R=async(u,o)=>{const r=await fetch(u,o);const t=await r.text();try{return {s:r.status,j:JSON.parse(t)}}catch{return {s:r.status,t:t.slice(0,200)}}};
let d=await R('https://api.mail.tm/domains?page=1');
console.log('domains',d.s,JSON.stringify(d.j).slice(0,300));
