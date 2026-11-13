# 绘梦工坊 Studio · 在线出图 / 图生视频

浏览器直连上游 API 的文生图 + 图生视频工具，附桌面版 exe、完整逆向报告、40+ 模型目录和 88 个探测脚本。

> **在线直接用**：<https://aq18270592902-cloud.github.io/huimeng-studio/>
> 打开就能出图，不用装东西、不用注册。

---

## 这是什么

[绘梦工坊](https://huimengi.com)（后端域名 `api.dimnx.com`）是一个 AI 绘画 / 视频生成站。本仓库是它的逆向工程产物 + 一个不依赖任何后端的网页版客户端。

| 部分 | 说明 |
|---|---|
| `index.html` | 网页版 Studio。纯静态，浏览器直接请求上游，可直接托管在 GitHub Pages |
| `tools/DreamVideo.exe` | C# WinForms 桌面客户端，4 个文生图模型 + 图生视频 |
| `tools/gen.mjs` | 命令行文生图，`node gen.mjs "一只橘猫"` |
| `tools/gen_video.mjs` | 命令行图生视频 |
| `docs/report.md` | 完整逆向报告（鉴权、签名、OSS、计费、风控） |
| `docs/prod_models.json` | 40+ 模型的参数 schema 与计价表 |
| `probe/` | 88 个实测脚本，覆盖登录、SSO、验证码、上传、限流 |
| `demo/` | 实测产物：图片 + 视频 |

---

## 网页版用法

1. 打开 <https://aq18270592902-cloud.github.io/huimeng-studio/>
2. 写画面描述 → 选模型 → 点「开始生成」
3. 等 40~80 秒，产物出现在右侧，可下载原文件

**文生图**（4 个模型）

| 模型 | 内部 ID | 特点 | 价格 |
|---|---|---|---|
| Z-Image Turbo | `z-image-turbo` | 最快，日常够用 | ≈1.7 积分/张 |
| Seedream 4.5 | `seedream-4-5` | 写实细腻，人像强 | ≈4.25 积分/张 |
| NanoBanana 2.1 | `nanobana-2-1` | 创意风格化 | ≈4 积分/张 |
| Midjourney v8.2 | `mj-8-2` | 艺术氛围 | ≈5 积分/张 |

**图生视频**（2 个模型）：`seedance-2-0-mini` / `seedance-2-0-fast`，支持 4~15 秒、480p/720p，需要先给一张首帧图片 URL。

---

## 已知的上游怪癖（重要）

**任务最终返回 `FAILED`，但图片其实已经生成了。**

```
状态: FAILED | 结果处理链执行失败
```

此时 `output_data.result_response.result.image_url` 已经可以取到，文件 2~5MB、magic 正确、尺寸正常，**积分也不扣**。网页版已经处理了这个情况：看到 FAILED 会继续读产物，不要重跑。

---

## 自己跑（用自己的 token）

页面内置的是仓库所有者的测试账号 token（30 积分，用完即止）。换成自己的：

1. 登录 <https://huimengi.com>，F12 → Application → Local Storage，找业务 token
2. 页面里三种换法任选：
   - 控制台执行 `localStorage.setItem('hm_token', '你的token')` 后刷新
   - 直接改 `index.html` 里的 `DEFAULT_TOKEN`
   - 改 `tools/gen.mjs` 里的 `const TK`

还需要两个租户参数（在页面顶部常量里）：

```js
const TENANT_ID   = '2119644316638302210';
const TENANT_CODE = 'THtf7Yx14fgV';
```

---

## 接口速查

```
POST https://api.dimnx.com/api/aigc/text-to-image/{model}
POST https://api.dimnx.com/api/aigc/image-to-video/{model}
GET  https://api.dimnx.com/api/tasks/{taskId}
GET  https://api.dimnx.com/api/billing/points
```

请求头三件套：

```
authorization:  Bearer <token>
x-tenant-id:    <TENANT_ID>
x-tenant-code:  <TENANT_CODE>
```

文生图 body：

```json
{
  "taskType": "TEXT_TO_IMAGE_Z_IMAGE_TURBO",
  "entityType": "character",
  "entityId": "910141757437563478",
  "count": 1,
  "config": { "prompt": "一只橘猫", "aspectRatio": "16:9" }
}
```

图生视频 body：

```json
{
  "taskType": "IMAGE_TO_VIDEO_SEEDANCE_2_0_MINI",
  "entityType": "storyboard",
  "entityId": "910141757995405936",
  "count": 1,
  "config": { "prompt": "...", "duration": 10, "resolution": "720p", "firstImage": "https://..." }
}
```

提交返回 `{"data":["<taskId>"]}`，轮询 `/tasks/{id}` 取：

```
output_data.result_response.result.image_url      // 单图
output_data.result_response.result.image_urls[0]  // 多图
output_data.result_response.result.video_url      // 视频
```

**CORS**：上游对任意 Origin 回显 `Access-Control-Allow-Origin`，预检 200，所以纯静态页能直连，不需要自建代理。

---

## 桌面版

`tools/DreamVideo.exe`（75KB，需 .NET Framework 4.x，Win10/11 自带）双击即用，token 存在同目录 `cfg.ini`。

从源码重新编译：

```bat
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:DreamVideo.exe DreamVideo.cs
```

---

## 目录

```
huimeng-studio/
├── index.html          网页版（GitHub Pages 入口）
├── tools/              gen.mjs / gen_video.mjs / DreamVideo.cs / DreamVideo.exe / Studio2.exe / 出图.bat
├── docs/               report.md / prod_models.json / endpoints.txt / free_creations.md / prod_credentials.txt
├── demo/               实测图片与视频
├── assets/             UI 截图
└── probe/              88 个探测脚本
```

---

## 一句话

浏览器打开就能出图，不用装、不用注册；桌面版和命令行版在同目录，接口和模型表都在 `docs/`。
