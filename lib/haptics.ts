// Haptic feedback inside a Farcaster / Base mini app host. No-op on the plain web.
type Impact = "light" | "medium" | "heavy" | "soft" | "rigid";
type Notice = "success" | "warning" | "error";

async function withSdk(fn: (sdk: typeof import("@farcaster/miniapp-sdk").sdk) => Promise<unknown>) {
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk");
    if (!(await sdk.isInMiniApp())) return;
    const caps = await sdk.getCapabilities().catch(() => [] as string[]);
    if (!caps.some(c => c.startsWith("haptics."))) return;
    await fn(sdk);
  } catch { /* haptics are best-effort */ }
}

export const haptic = {
  tap: (style: Impact = "light") => withSdk(sdk => sdk.haptics.impactOccurred(style)),
  notify: (type: Notice) => withSdk(sdk => sdk.haptics.notificationOccurred(type)),
};
