# probe/_data/ —— 运行时数据目录（不入库）

`probe/` 下的脚本会从 `./_data/` 读写运行时产物。这个目录**故意不进 git**：里面放的是本机抓到的 token、账号、页面存档，属于中间状态。

## 脚本期望的文件

| 文件 | 谁写 | 谁读 | 内容 |
|---|---|---|---|
| `apitest_acct.json` | `probe_mailflow.mjs` / `probe_verify.mjs` | `probe_authed.mjs` / `probe_verify2.mjs` | `{addr,mp,username,password,userId}` 测试账号 |
| `apitest_token.txt` | `probe_authed.mjs` | `probe_gateway.mjs` / `probe_keys.mjs` / `probe_massassign.mjs` | 裸 JWT 字符串 |
| `apitest_token.json` | `probe_mailflow.mjs` / `probe_verify2.mjs` | — | 登录响应原文 |
| `apitest_session.json` | `probe_apitest_login.mjs` | — | `{email,username,password,...loginResp}` |
| `apitest_api.js` / `apitest_index.js` | `probe_api_js.mjs` / `probe_apitest.mjs` | — | 前端 bundle 存档 |
| `asset_*` | `probe_authjs.mjs` / `probe_router.mjs` / `probe_ve.mjs` | — | 静态资源存档 |
| `host_*.html` | `probe_hosts.mjs` / `probe_hosts2.mjs` | — | 各主机首页存档 |
| `probe_anon_surface.json` | `probe_anon_surface.mjs` | — | 未授权接口探测结果 |

## 跑之前

```bash
mkdir -p probe/_data
cd probe
node probe_mailflow.mjs      # 先造账号，写出 _data/apitest_acct.json
node probe_authed.mjs        # 登录，写出 _data/apitest_token.txt
node probe_anon_surface.mjs  # 未授权面扫描（不需要账号）
```

## 依赖

- `probe/lib_captcha.mjs`（仓库内）—— 滑块验证码求解，被 `probe_oss.mjs` 等引用。
- `docs/endpoints.txt`（仓库内）—— 接口清单，被 `probe_anon_surface.mjs` 引用。
- 其余脚本不依赖仓库外文件。

> 全部脚本只跑 GET/POST 探测，不修改上游数据；密码字段里的 `Passw0rd!23` / `Test123456` 是测试环境固定口令，不是真实凭据。
