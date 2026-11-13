const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const IMG='https://dreamore.oss-cn-hongkong.aliyuncs.com/dreamore/results/d8689b99-33a3-4c8b-ab5f-350840fe08a6/0966432604d0.png?OSSAccessKeyId=LTAI5tF6fhtPZ5cDtBWuANJD&Expires=1794286865&Signature=a2hi8ZI04jo9qv%2BzZyX24ZMNRXw%3D';
 const CHAR='910141757437563478', IMGID='910141758536471233';
 const slug='seedance-2-0-mini', tt='IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI';
 const cases={
  A:{taskType:tt,entityType:'character',entityId:CHAR,count:1,firstImage:[IMG],lastImage:[],config:{prompt:'黑猫眨眼，霓虹灯闪烁，电影感',aspectRatio:'16:9',duration:5}},
  B:{taskType:tt,entityType:'character',entityId:CHAR,count:1,config:{prompt:'黑猫眨眼，霓虹灯闪烁',aspectRatio:'16:9',duration:5,firstImage:[IMG]}},
  C:{taskType:tt,entityType:'character',entityId:CHAR,count:1,firstImage:IMG,config:{prompt:'黑猫眨眼',aspectRatio:'16:9',duration:5}},
  D:{taskType:tt,entityType:'character',entityId:CHAR,count:1,firstImage:[IMGID],lastImage:[],config:{prompt:'黑猫眨眼',aspectRatio:'16:9',duration:5}},
  E:{taskType:tt,entityType:'character',entityId:CHAR,count:1,firstImage:[{url:IMG}],config:{prompt:'黑猫眨眼',aspectRatio:'16:9',duration:5}},
 };
 for(const [k,b] of Object.entries(cases)){
  const r=await fetch(BASE+'/aigc/image-to-video/'+slug,{method:'POST',headers:H,body:JSON.stringify(b)});
  const t=await r.text(); console.log(k,r.status,t.slice(0,260));
 }
})();