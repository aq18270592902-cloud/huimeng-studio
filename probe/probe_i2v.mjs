const TK="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE";
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':'2119644316638302210','x-tenant-code':'THtf7Yx14fgV','content-type':'application/json'};
const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return t.slice(0,300)}};
(async()=>{
 const CHAR='910141757437563478';
 const cases=[
  ['seedance-2-0-mini','IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI','character',CHAR],
  ['seedance-1-0','IMAGE_TO_VIDEO_SEEDANCE_1_0','character',CHAR],
  ['wan-2-6-flash','IMAGE_TO_VIDEO_WAN_2_6_FLASH','character',CHAR],
 ];
 for(const [slug,tt,et,eid] of cases){
  const b={taskType:tt,entityType:et,entityId:eid,count:1,config:{prompt:'黑猫眨眼，霓虹灯闪烁，电影感',aspectRatio:'16:9',duration:5}};
  const r=await fetch(BASE+'/aigc/image-to-video/'+slug,{method:'POST',headers:H,body:JSON.stringify(b)});
  const t=await r.text(); console.log(slug,tt,r.status,t.slice(0,400));
 }
})();