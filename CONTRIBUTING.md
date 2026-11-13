# 参与开发

## 这个仓库是什么

绘梦工坊的**纯静态前端** + 桌面版（WinForms）源码。没有构建步骤、没有 npm 依赖、没有打包器：`index.html` 双击就能跑，改完刷新就生效。

## 本地怎么跑

```bash
# 方式一：直接开（file:// 也能跑，但 fetch 上游会被 CORS 拦）
start index.html

# 方式二：起个静态服务器（推荐，行为和线上一致）
npx --yes serve . -l 5173
# 或者
python -m http.server 5173
```

打开 <http://127.0.0.1:5173/>。

## 提交前必须跑的校验

CI 就跑这两条，本地跑通基本不会红：

```bash
node scripts/validate.js
```

它会检查：JSON 能解析、页面引用的资源都真实存在、head 里 canonical/og/twitter/icon/manifest 都在、robots/sitemap 没有死链。

再加一条语法检查：

```bash
for f in scripts/*.js *.js; do [ -e "$f" ] || continue; node --check "$f"; done
```

## 改代码时的约定

| 位置 | 约定 |
|---|---|
| `index.html` | 单文件，CSS/JS 内联。加外链资源前先想清楚——这个仓库的卖点之一就是零外链 |
| `scripts/validate.js` | 新增页面资源时同步加进检查清单，否则以后 404 没人发现 |
| `assets/` | 图标用 PNG，截图用 WebP 无损（体积差 45%）。新增图片先压缩再提交 |
| `docs/prod_models.json` | 上游模型清单，改它要同时改 README 的模型表 |
| Token | **任何情况下不要提交真实 Token**，源码里不许出现。测试用自己的，放 localStorage 或 cfg.ini |

## 改完要同步的地方

1. **README 的目录树**——新增/改名文件必须同步，否则下一个人找不到
2. **`sitemap.xml` 的 `lastmod`**——改了页面就更新
3. **`sw.js` 的 `CACHE` 版本号**——不改版本号，老访客永远看到旧文件
4. **`assets/og.png`**——改了标题或卖点的话

## 提交信息

用 Conventional Commits 前缀，中文正文：

```
fix(ui): 出图失败时不再整页白屏，改成弹窗提示
feat(models): 新增 nanobana-2-1
docs(readme): 补桌面版的 csc 编译命令
perf(assets): og.png 量化到 34KB
ci: 加 dependabot 每周检查 action 版本
```

## 不要做的事

- 不要提交 `node_modules/`、`.env`、`*.log`
- 不要把上游返回的原始响应体整段贴进代码注释（里面有 token 字段）
- 不要为了「兼容」加 polyfill 或外链 CDN——这个页面只支持现代浏览器，这是有意的
- 不要删 `.nojekyll`——删了 GitHub Pages 会开始跑 Jekyll，下划线开头的文件全挂

## 报问题

开 issue 用模板。安全问题走 [SECURITY.md](./SECURITY.md)，**不要开公开 issue**。
