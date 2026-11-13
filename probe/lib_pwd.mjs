// 测试口令统一从环境变量读取，仓库里不留明文。
// 用法: PROBE_PWD='你的测试口令' node probe_xxx.mjs
const PWD = String(process.env.PROBE_PWD || '').trim();
if (!PWD) {
  console.error('[!] 缺少环境变量 PROBE_PWD —— 这是针对测试站的一次性验证脚本，口令不写进仓库。');
  console.error("    例: PROBE_PWD='***' node probe_auth.mjs");
  process.exit(2);
}
export default PWD;
export const PHONE = String(process.env.PROBE_PHONE || '19900000001').trim();
