export function shortAddr(addr?: string) {
  if (!addr) return "";
  const s = String(addr);
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

export function formatNumber(x: any, dp = 2) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: dp });
}
