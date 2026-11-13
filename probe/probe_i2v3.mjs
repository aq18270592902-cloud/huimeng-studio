const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const IMG='https://dreamore.oss-cn-hongkong.aliyuncs.com/dreamore/results/d8689b99-33a3-4c8b-ab5f-350840fe08a6/0966432604d0.png?OSSAccessKeyId=LTAI5tF6fhtPZ5cDtBWuANJD&Expires=1794286865&Signature=a2hi8ZI04jo9qv%2BzZyX24ZMNRXw%3D';
 const CHAR='910141757437563478', IMGID='910141758536471233';
 const slug='seedance-2-0-mini', tt='IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI';
 const mk=(fi)=>({taskType:tt,entityType:'character',entityId:CHAR,count:1,config:{prompt:'黑猫眨眼',aspectRatio:'16:9',duration:5,firstImage:fi}});
 const cases={
  F:mk([{url:IMG}]), G:mk([{imageUrl:IMG}]), H:mk([{imageId:IMGID}]), I:mk([{id:IMGID}]),
  J:mk([{url:IMG,imageId:IMGID}]), K:mk(IMG), L:mk({url:IMG}), M:mk({imageUrl:IMG}),
 };
 for(const [k,b] of Object.entries(cases)){
  const r=await fetch(BASE+'/aigc/image-to-video/'+slug,{method:'POST',headers:H,body:JSON.stringify(b)});
  const t=await r.text(); console.log(k,r.status,t.slice(0,200));
 }
})();