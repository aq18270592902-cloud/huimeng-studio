#!/usr/bin/env node
// 绘梦工坊 图生视频 零成本工具
// 用法: node gen_video.mjs "提示词" --img <首帧图片URL> [--dur 4] [--res 480p] [--out out.mp4] [--model seedance-2-0-mini]
import fs from 'node:fs';
import process from 'node:process';

const TK=process.env.HM_TOKEN||(process.env.HM_TOKEN||"");
const BASE='https://api.dimnx.com/api';
const H={authorization:'Bearer '+TK,'x-tenant-id':process.env.HM_TID||(process.env.HM_TID||''),'x-tenant-code':process.env.HM_TCODE||(process.env.HM_TCODE||''),'content-type':'application/json'};

const MODELS={
 'seedance-2-0-mini':{tt:'IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI',label:'Seedance 2.0 mini(便宜,推荐)'},
 'seedance-2-0':{tt:'IMAGE_TO_VIDEO_SEEDANCE_2_0',label:'Seedance 2.0(贵,余额40不够)'},
 'seedance-2-0-fast':{tt:'IMAGE_TO_VIDEO_SEEDANCE_2_0_FAST',label:'Seedance 2.0 Fast'},
};

function arg(name,def){const i=process.argv.indexOf('--'+name);return i>0?process.argv[i+1]:def}
const prompt=process.argv[2]||'画面自然运动，电影感';
const img=arg('img',process.env.HM_IMG||'');
const dur=Number(arg('dur',4));
const res=arg('res','480p');
const model=arg('model','seedance-2-0-mini');
const out=arg('out','out.mp4');
const SB=arg('entity','910141757995405936');

if(!img){console.error('缺少 --img 首帧图片URL');process.exit(1)}
const M=MODELS[model]||MODELS['seedance-2-0-mini'];

const j=async(u,o={})=>{const r=await fetch(u,{headers:H,...o});const t=await r.text();try{return JSON.parse(t)}catch{return {raw:t.slice(0,300)}}};

const bal=async()=>{const d=await j(BASE+'/billing/points');return d?.data?.points};
console.log('提交中... 模型',model,M.label,'时长',dur+'s','分辨率',res);
const sub=await j(BASE+'/aigc/image-to-video/'+model,{method:'POST',body:JSON.stringify({taskType:M.tt,entityType:'storyboard',entityId:SB,count:1,config:{prompt,duration:dur,resolution:res,firstImage:img}})});
if(sub?.code!=='0'){console.error('提交失败:',JSON.stringify(sub));process.exit(2)}
const id=sub.data[0];
console.log('任务ID',id,'当前积分',await bal());

let vurl=null,st='';
for(let i=0;i<90;i++){
 await new Promise(r=>setTimeout(r,4000));
 const d=await j(BASE+'/tasks/'+id);
 st=d?.data?.status;
 vurl=d?.data?.output_data?.result_response?.result?.video_url;
 if(vurl)break;
 if(st==='FAILED'&&!vurl){console.log('已失败且无产物:',d?.data?.error_message);break}
 if(i%3===0)console.log('  ...',st,i*4+'s');
}
const after=await bal();
console.log('状态',st,'| 提交前积分',40,'| 现在积分',after);
if(!vurl){console.error('没拿到视频URL');process.exit(3)}
const r=await fetch(vurl);const b=Buffer.from(await r.arrayBuffer());
fs.writeFileSync(out,b);
console.log('已保存',out,(b.length/1048576).toFixed(2)+'MB');
console.log('播放: start "" "'+out+'"');
