<div align="center">

<img src="./assets/og.png" alt="绘梦工坊 Studio" width="720">

# 绘梦工坊 Studio · 在线出图 / 图生视频

浏览器直连上游 API 的文生图 + 图生视频工具，附桌面客户端、完整逆向报告、40+ 模型目录和 88 个探测脚本。

[![Pages](https://img.shields.io/badge/demo-online-7c5cff?style=flat-square&logo=githubpages&logoColor=white)](https://aq18270592902-cloud.github.io/huimeng-studio/)
[![Release](https://img.shields.io/github/v/release/aq18270592902-cloud/huimeng-studio?style=flat-square&color=f59e0b&label=release)](https://github.com/aq18270592902-cloud/huimeng-studio/releases)
[![License](https://img.shields.io/github/license/aq18270592902-cloud/huimeng-studio?style=flat-square&color=34d399)](./LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-22d3ee?style=flat-square)](./index.html)
[![Stars](https://img.shields.io/github/stars/aq18270592902-cloud/huimeng-studio?style=flat-square&color=7c5cff)](https://github.com/aq18270592902-cloud/huimeng-studio/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/aq18270592902-cloud/huimeng-studio?style=flat-square&color=9aa3b8)](https://github.com/aq18270592902-cloud/huimeng-studio/commits/main)

**[在线直接用](https://aq18270592902-cloud.github.io/huimeng-studio/)** ·
**[桌面版下载](https://github.com/aq18270592902-cloud/huimeng-studio/releases)** ·
**[逆向报告](./docs/report.md)** ·
**[模型表](./docs/prod_models.json)**

</div>

---

## 三十秒上手

打开 <https://aq18270592902-cloud.github.io/huimeng-studio/> → 写画面描述 → 选模型 → 点「开始生成」→ 等 40~80 秒 → 产物出现在右侧，可下载原文件。

不用装东西、不用注册、不用后端。整个页面就一个 `index.html`，浏览器直接向上游发请求。

---

## 能做什么

| 能力 | 模型 | 说明 |
|---|---|---|
| 文生图 | `z-image-turbo` | 最快，日常够用，≈1.7 积分/张 |
| 文生图 | `seedream-4-5` | 写实细腻，人像强，≈4.25 积分/张 |
| 文生图 | `nanobana-2-1` | 创意风格化，≈4 积分/张 |
| 文生图 | `mj-8-2` | Midjourney 风格，艺术氛围，≈5 积分/张 |
| 图生视频 | `seedance-2-0-mini` | 4~15 秒，480p/720p，最省 |
| 图生视频 | `seedance-2-0-fast` | 同参数，出片更快 |

图生视频需要先给一张首帧图片 URL。

---

## 仓库结构

```
huimeng-studio/
├── index.html              网页版 Studio（单文件，GitHub Pages 入口）
├── site.webmanifest        PWA 清单
├── sw.js                   离线缓存（可选注册）
├── 404.html                自定义错误页
├── assets/                 og.png 分享图 + 4 尺寸图标 + UI 截图
├── tools/                  gen.mjs / gen_video.mjs / DreamVideo.cs / *.exe / *.bat（cfg.ini 本地放 token，不入库）
├── docs/                   report.md / prod_models.json / endpoints.txt / free_creations.md
├── demo/                   实测产物：3 张图 + 3 段视频
└── probe/                  88 个探测脚本（登录 / SSO / 验证码 / 上传 / 限流）
```

---

## 网页版怎么接上游

三件套请求头：

```
authorization:  Bearer <token>
x-tenant-id:    <TENANT_ID>
x-tenant-code:  <TENANT_CODE>
```

文生图：

```http
POST https://api.dimnx.com/api/aigc/text-to-image/{model}
Content-Type: application/json

{
  "taskType": "TEXT_TO_IMAGE_Z_IMAGE_TURBO",
  "entityType": "character",
  "entityId": "910141757437563478",
  "count": 1,
  "config": { "prompt": "一只橘猫", "aspectRatio": "16:9" }
}
```

图生视频：

```http
POST https://api.dimnx.com/api/aigc/image-to-video/{model}

{
  "taskType": "IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI",
  "entityType": "storyboard",
  "entityId": "910141757995405936",
  "count": 1,
  "config": { "prompt": "...", "duration": 10, "resolution": "720p", "firstImage": "https://..." }
}
```

提交返回 `{"data":["<taskId>"]}`，然后轮询 `GET /api/tasks/{id}`：

```
output_data.result_response.result.image_url       // 单图
output_data.result_response.result.image_urls[0]   // 多图
output_data.result_response.result.video_url       // 视频
```

**CORS**：上游对任意 Origin 回显 `Access-Control-Allow-Origin`，预检 200 —— 所以纯静态页能直连，不需要自建代理。这是整个项目能做成单文件的前提。

---

## 已知的上游怪癖（重要）

**任务最终返回 `FAILED`，但图片其实已经生成了。**

```
状态: FAILED | 结果处理链执行失败
```

此时 `output_data.result_response.result.image_url` 已经可以取到，文件 2~5MB、magic 正确、尺寸正常，**积分也不扣**。网页版已经处理了这个情况：看到 FAILED 会继续读产物，不要重跑。

---

## 换成自己的 token

网页版内置的是仓库所有者的测试账号 token（30 积分，用完即止）。换成自己的：

1. 登录 <https://huimengi.com> → F12 → Application → Local Storage，找业务 token
2. 网页版换法：控制台执行 `localStorage.setItem('hm_token', '你的token')` 后刷新（会覆盖内置值，优先级更高）
3. 命令行换法（`tools/gen.mjs` **不再内置任何凭据**，三种给法任选）：

```bash
# A. 参数
node tools/gen.mjs "一只橘猫" --token <jwt> --tid <tenantId> --tcode <tenantCode>

# B. 环境变量
set HM_TOKEN=<jwt>            # PowerShell: $env:HM_TOKEN="<jwt>"
set HM_TENANT_ID=<tenantId>
set HM_TENANT_CODE=<tenantCode>

# C. 同目录 cfg.ini（已被 .gitignore 忽略）
# token=<jwt>
# tenant_id=<tenantId>
# tenant_code=<tenantCode>
```

缺任一凭据时脚本直接 `exit 3` 并打印上面三种给法，不会带着空 token 去请求。

---

## 桌面版

`tools/DreamVideo.exe`（75KB，需 .NET Framework 4.x，Win10/11 自带）双击即用，token 存在同目录 `cfg.ini`。

从源码重编译：

```bat
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:DreamVideo.exe DreamVideo.cs
```

---

## 本地预览

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000/
```

不要用 `file://` 直接双击 `index.html` —— 上游的 CORS 预检在 `null` Origin 下会被拒。

---

## 排障

| 现象 | 原因 | 处理 |
|---|---|---|
| 打开页面提示「离线」 | `/billing/points` 请求失败，token 过期或被风控 | 换自己的 token；或忽略（不影响出图） |
| 提交后一直轮询不结束 | 上游排队，通常 40~80 秒，长尾可到 6 分钟 | 等，别重复提交（会重复扣积分） |
| 状态 `FAILED` 但没图 | 真失败，不是那个「误报」怪癖 | 换模型或改 prompt 重试 |
| 图生视频报 `missing first image` | 首帧 URL 为空 | 先上传一张图拿到直链，再填进去 |
| 控制台报 CORS | 用了 `file://` 打开 | 起本地 HTTP 服务 |
| 生成按钮一直灰 | 上一次任务还在跑（`busy` 锁） | 等它结束，或刷新页面 |

---

## 目录之外的资料

- [`docs/report.md`](./docs/report.md) —— 完整逆向报告：鉴权、签名、OSS 上传、计费、风控
- [`docs/prod_models.json`](./docs/prod_models.json) —— 40+ 模型的参数 schema 与计价表
- [`probe/`](./probe) —— 88 个实测脚本，从匿名面探测到验证码绕过

---

## 一句话

浏览器打开就能出图，不用装、不用注册；桌面版和命令行版在同目录，接口和模型表都在 `docs/`。
