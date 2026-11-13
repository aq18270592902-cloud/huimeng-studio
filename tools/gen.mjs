// 直接出图（不需要注册/爆破，用已有的主站 token）
// 用法: node gen.mjs "画面描述" [--out a.png] [--model z-image-turbo] [--tasktype TEXT_TO_IMAGE_Z_IMAGE_TURBO] [--scene]
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const prompt = argv[0] && !argv[0].startsWith('--') ? argv[0] : arg('prompt', '一只赛博朋克风格的黑猫，霓虹灯，电影感');
const MODEL = arg('model', 'z-image-turbo');
const TASKTYPE = arg('tasktype', 'TEXT_TO_IMAGE_Z_IMAGE_TURBO');
const OUT = arg('out', 'out.png');
const SCENE = argv.includes('--scene');
const ENTITY_TYPE = SCENE ? 'scene' : 'character';
const ENTITY_ID = SCENE ? '910141757731164776' : '910141757437563478';

// 已在 prod_credentials.txt 中的可用主站 token
const TK = arg('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOjIxMTk2NDQzMTY2NTUwNzk0MjYsInJuU3RyIjoiRDlMSjdER0h2OWFRT2V5dEZFcUpqN2N6NENhSVlRN2UiLCJpcCI6IjE4My4yMTguMzYuMTczIiwiYWRkcmVzcyI6IuS4reWbvXzmsZ_opb_nnIF85a6c5pil5biCfOenu-WKqCIsImJyb3dzZXIiOiJDaHJvbWUgMTQwIiwib3MiOiJVbmtub3duIiwibG9naW5UaW1lIjoxNzk0MTk3OTA0fQ.93wIBQY-nNKWQo44B0qiXLprBwjRBfKSscycDxdpKRE');
const TID = arg('tid', '2119644316638302210');
const TCODE = arg('tcode', 'THtf7Yx14fgV');
const H = { Authorization: 'Bearer ' + TK, 'x-tenant-id': TID, 'x-tenant-code': TCODE, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' };

console.log('[1] 提交:', prompt);
const sub = await fetch('https://api.dimnx.com/api/aigc/text-to-image/' + MODEL, {
  method: 'POST', headers: H,
  body: JSON.stringify({ taskType: TASKTYPE, entityType: ENTITY_TYPE, entityId: ENTITY_ID, count: 1, config: { prompt, aspectRatio: '16:9' } })
}).then(r => r.json());
const taskId = sub?.data?.[0];
if (!taskId) { console.log('提交失败:', JSON.stringify(sub)); process.exit(1); }
console.log('    任务ID', taskId);

console.log('[2] 等出图（通常 40-80 秒）');
let img = null;
for (let i = 0; i < 60; i++) {
  await new Promise(z => setTimeout(z, 4000));
  const d = (await (await fetch('https://api.dimnx.com/api/tasks/' + taskId, { headers: H })).json())?.data || {};
  const rr = d.output_data?.result_response?.result;
  const u = rr?.image_url || rr?.image_urls?.[0];
  if (u) img = u;
  if (d.status === 'FAILED' || d.status === 'COMPLETED') { console.log('    状态:', d.status, '|', d.error_message || 'ok'); break; }
  if (i % 4 === 0) process.stdout.write('\r    ' + (d.status || '?') + ' ' + (i * 4) + 's');
}
if (!img) { console.log('\n没拿到图（可能上游超时，重跑一次即可）'); process.exit(2); }
const bin = Buffer.from(await (await fetch(img)).arrayBuffer());
writeFileSync(OUT, bin);
const pts = (await (await fetch('https://api.dimnx.com/api/billing/points/overview', { headers: H })).json())?.data?.balance?.totalPoints;
console.log('[3] 已保存', OUT, bin.length, 'bytes | 当前积分', pts);
