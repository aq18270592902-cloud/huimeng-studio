const TK=(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':(process.env.HM_TID||''),'x-tenant-code':(process.env.HM_TCODE||''),'content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const IMG='https://dreamore.oss-cn-hongkong.aliyuncs.com/dreamore/results/d8689b99-33a3-4c8b-ab5f-350840fe08a6/0966432604d0.png?OSSAccessKeyId=LTAI5tF6fhtPZ5cDtBWuANJD&Expires=1794286865&Signature=a2hi8ZI04jo9qv%2BzZyX24ZMNRXw%3D';
 const SB='910141757995405936';
 const slug='seedance-2-0', tt='IMAGE_TO_VIDEO_SEEDANCE_2_0';
 const base={taskType:tt,entityType:'storyboard',entityId:SB,count:1};
 const cases={
  c1:{prompt:'黑猫眨眼',duration:5,firstImage:IMG},
  c2:{prompt:'黑猫眨眼',duration:'5',firstImage:IMG},
  c3:{prompt:'黑猫眨眼',duration:'5s',firstImage:IMG},
  c4:{prompt:'黑猫眨眼',duration:5,ratio:'16:9',firstImage:IMG},
  c5:{prompt:'黑猫眨眼',duration:5,resolution:'720p',firstImage:IMG},
  c6:{prompt:'黑猫眨眼',duration:5,model:'seedance-2-0',firstImage:IMG},
  c7:{prompt:'黑猫眨眼',duration:5,firstImage:[IMG]},
  c8:{prompt:'黑猫眨眼',duration:5,firstImage:IMG,lastImage:''},
 };
 for(const [k,cfg] of Object.entries(cases)){
  const r=await fetch(BASE+'/aigc/image-to-video/'+slug,{method:'POST',headers:H,body:JSON.stringify({...base,config:cfg})});
  const t=await r.text(); console.log(k,r.status,t.slice(0,200));
 }
})();