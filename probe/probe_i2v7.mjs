const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const IMG='https://dreamore.oss-cn-hongkong.aliyuncs.com/dreamore/results/d8689b99-33a3-4c8b-ab5f-350840fe08a6/0966432604d0.png?OSSAccessKeyId=LTAI5tF6fhtPZ5cDtBWuANJD&Expires=1794286865&Signature=a2hi8ZI04jo9qv%2BzZyX24ZMNRXw%3D';
 const SB='910141757995405936';
 const list=[['seedance-2-0-mini','IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI'],['wan-2-6-flash','IMAGE_TO_VIDEO_WAN_2_6_FLASH'],['seedance-2-0','IMAGE_TO_VIDEO_SEEDANCE_2_0']];
 for(const [slug,tt] of list){
  for(const res of ['480p','720p','1080p']){
   const b={taskType:tt,entityType:'storyboard',entityId:SB,count:1,config:{prompt:'黑猫眨眼',duration:4,resolution:res,firstImage:IMG}};
   const r=await fetch(BASE+'/aigc/image-to-video/'+slug,{method:'POST',headers:H,body:JSON.stringify(b)});
   const t=await r.text();
   console.log(slug,res,t.slice(0,150));
  }
 }
})();