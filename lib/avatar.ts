// Deterministic gradient orb for an address — no emoji, stable per wallet.
export function avatarGradient(seed: string): string {
  let h = 2166136261;
  const s = (seed || "0x").toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = h % 360;
  const b = (a + 35 + ((h >>> 9) % 70)) % 360;
  return `radial-gradient(circle at 30% 28%, hsl(${a} 95% 74%), hsl(${b} 82% 50%) 70%)`;
}
