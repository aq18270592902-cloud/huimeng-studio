#!/usr/bin/env node
/**
 * scripts/validate.js —— 零依赖站点自检
 * 跑法：node scripts/validate.js
 * 检查项：
 *   1) index.html / 404.html 的必备 head 标签是否齐（canonical、og:title、og:image、manifest、theme-color）
 *   2) 页面里引用的本地相对资源是否真实存在（漏文件 = 404）
 *   3) 仓库内所有 .json 能否解析
 *   4) sw.js / 页面内联脚本之外的关键 .js 语法是否合法
 * 退出码：0 通过，1 有错
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warns = [];
const fail = (m) => errors.push(m);
const warn = (m) => warns.push(m);

function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

/* ---------- 1. head 必备标签 ---------- */
const HEAD_RULES = [
  [/<link[^>]+rel=["']canonical["'][^>]*>/i, '缺少 <link rel="canonical">'],
  [/<meta[^>]+property=["']og:title["'][^>]*>/i, "缺少 og:title"],
  [/<meta[^>]+property=["']og:image["'][^>]*>/i, "缺少 og:image"],
  [/<meta[^>]+name=["']twitter:card["'][^>]*>/i, "缺少 twitter:card"],
  [/<link[^>]+rel=["']manifest["'][^>]*>/i, "缺少 manifest 声明"],
  [/<meta[^>]+name=["']theme-color["'][^>]*>/i, "缺少 theme-color"],
  [/<meta[^>]+name=["']description["'][^>]*>/i, "缺少 description"],
];
for (const page of ["index.html", "404.html"]) {
  if (!exists(page)) { fail(page + " 不存在"); continue; }
  const html = read(page);
  if (page === "index.html") {
    for (const [re, msg] of HEAD_RULES) if (!re.test(html)) fail(page + " " + msg);
  }
  if (!/<meta[^>]+name=["']viewport["'][^>]*>/i.test(html)) fail(page + " 缺少 viewport");
  if (!/<html[^>]+lang=/i.test(html)) warn(page + " <html> 没有 lang 属性");
  if (!/<title>[^<]{4,}<\/title>/i.test(html)) fail(page + " <title> 缺失或过短");
}

/* ---------- 2. 本地资源存在性 ---------- */
/* 站点绝对路径（以 / 开头）按 canonical 的 base 折算成仓库内相对路径 */
let SITE_BASE = "/";
if (exists("index.html")) {
  const cm = read("index.html").match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (cm) {
    try { SITE_BASE = new URL(cm[1]).pathname; } catch (_) {}
    if (!SITE_BASE.endsWith("/")) SITE_BASE = SITE_BASE.replace(/[^/]*$/, "");
  }
}
function toRepoPath(ref) {
  if (ref.startsWith("/")) {
    if (SITE_BASE !== "/" && ref.startsWith(SITE_BASE)) return ref.slice(SITE_BASE.length) || ".";
    return null; // 站点根以外，无法判定
  }
  return ref;
}
const SCAN = ["index.html", "404.html", "site.webmanifest"].filter(exists);
const skipExt = /\.(?:json|png|jpg|jpeg|webp|gif|svg|ico|mp4|css|js|webmanifest|txt|xml)$/i;
for (const file of SCAN) {
  const src = read(file);
  const refs = new Set();
  for (const m of src.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.add(m[1]);
  if (file === "site.webmanifest") {
    for (const m of src.matchAll(/"src"\s*:\s*"([^"]+)"/g)) refs.add(m[1]);
  }
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref)) continue;
    let clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    clean = toRepoPath(clean);
    if (clean === null || clean === "" || clean === ".") continue;
    if (!exists(clean)) fail(file + " 引用了不存在的文件: " + clean);
  }
}

/* ---------- 3. JSON 可解析 ---------- */
function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const rel = dir ? dir + "/" + e.name : e.name;
    if (e.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}
const all = walk("", []);
for (const f of all) {
  if (!f.endsWith(".json")) continue;
  const size = fs.statSync(path.join(ROOT, f)).size;
  if (size > 40 * 1024 * 1024) { warn(f + " 超过 40MB，跳过解析"); continue; }
  try { JSON.parse(read(f)); } catch (e) { fail(f + " JSON 解析失败: " + e.message); }
}

/* ---------- 4. JS 语法 ---------- */
for (const f of all) {
  if (!/\.(?:js|mjs|cjs)$/.test(f)) continue;
  if (/^(?:frontend|client|docs)\//.test(f)) continue; // 打包产物/第三方不查
  try {
    execFileSync(process.execPath, ["--check", path.join(ROOT, f)], { stdio: "pipe" });
  } catch (e) {
    fail(f + " 语法错误: " + String(e.stderr || e.message).split("\n").slice(0, 3).join(" "));
  }
}

/* ---------- 输出 ---------- */
for (const w of warns) console.log("::warning::" + w);
for (const e of errors) console.log("::error::" + e);
console.log(`检查完成：${all.length} 个文件，${errors.length} 个错误，${warns.length} 个警告`);
if (errors.length) process.exit(1);
