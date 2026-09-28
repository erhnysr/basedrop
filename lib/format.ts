import { USDC_DECIMALS } from "./contract";

export function shortAddr(a: string) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ""; }
export function formatUSDC(a: bigint) { return `$${(Number(a) / 10 ** USDC_DECIMALS).toFixed(2)}`; }
export function timeLeft(exp: number) {
  const d = exp - Math.floor(Date.now() / 1000);
  if (d <= 0) return "Expired";
  const h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
