import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { rpc } from "@/lib/rpc";
import { getBasename } from "@/lib/basename";
import { ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, parseDropInfo, DropInfo } from "@/lib/contract";
import { shortAddr, timeLeft } from "@/lib/format";

// Share card for a drop — 1200×800 (3:2, required by Farcaster mini app embeds).
const W = 1200, H = 800;
const BG = "#0A0B0F", CARD = "#14151C", INK = "#F3F4F7", INK2 = "#B4B6C4", INK3 = "#8B8D9E", BLUE = "#3D7DFF", LINE = "rgba(255,255,255,0.13)";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))]).catch(() => null);
}

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");
  const id = idParam !== null && /^\d+$/.test(idParam) ? Number(idParam) : null;

  let d: DropInfo | null = null;
  let name: string | null = null;
  if (id !== null) {
    const info = await withTimeout(rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(id)] }), 8000);
    if (info) d = parseDropInfo(id, info as readonly unknown[]);
    if (d) name = await withTimeout(getBasename(d.creator as `0x${string}`), 4000);
  }

  const amount = d ? (Number(d.amountPerClaim) / 10 ** USDC_DECIMALS).toFixed(2) : null;
  const [whole, cents] = amount ? amount.split(".") : ["", ""];
  const left = d ? Math.max(0, d.totalClaims - d.claimedCount) : 0;
  const pct = d && d.totalClaims ? Math.round((d.claimedCount / d.totalClaims) * 100) : 0;
  const expired = d ? d.expiresAt <= Date.now() / 1000 : false;
  const live = !!d && d.active && !expired && d.claimedCount < d.totalClaims;
  const status = !d ? "" : !d.active ? (d.claimedCount >= d.totalClaims ? "FULLY CLAIMED" : "CLOSED") : expired ? "EXPIRED" : `${left} OF ${d.totalClaims} LEFT · ${timeLeft(d.expiresAt).toUpperCase()}`;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", background: BG, backgroundImage: `radial-gradient(900px 620px at 100% 0%, rgba(61,125,255,0.30), transparent 65%)`, padding: 80, color: INK, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1.15, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#0052FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="32" viewBox="0 0 12 15"><path d="M6 .8C8.6 4 11 6.8 11 9.6A5 5 0 0 1 1 9.6C1 6.8 3.4 4 6 .8Z" fill="#fff" /></svg>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>basedrop</div>
          </div>
          {d ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 30, color: INK2, marginBottom: 20 }}>{`${name || shortAddr(d.creator)} sent a drop`}</div>
              <div style={{ display: "flex", alignItems: "flex-end", fontSize: 180, fontWeight: 700, letterSpacing: -10, lineHeight: 0.9 }}>
                ${whole}<span style={{ fontSize: 80, color: INK3, letterSpacing: -2, marginBottom: 12 }}>.{cents}</span>
              </div>
              <div style={{ fontSize: 26, color: INK3, marginTop: 20 }}>USDC per claim · Base</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>USDC rewards, sent by anyone.</div>
              <div style={{ fontSize: 30, color: INK2, marginTop: 24 }}>Humans and agents, onchain on Base.</div>
            </div>
          )}
          <div style={{ display: "flex" }} />
        </div>
        {d && (
          <div style={{ display: "flex", flexDirection: "column", width: 420, alignSelf: "center", background: CARD, borderRadius: 32, border: `1px solid ${LINE}` }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "36px 36px 32px" }}>
              <div style={{ fontSize: 20, color: INK3, letterSpacing: 2 }}>{`DROP #${d.id}`}</div>
              <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.2, marginTop: 14 }}>{d.message ? `“${d.message.slice(0, 70)}”` : "A USDC drop on Base"}</div>
            </div>
            <div style={{ display: "flex", borderTop: `3px dashed ${LINE}`, margin: "0 28px" }} />
            <div style={{ display: "flex", flexDirection: "column", padding: "28px 36px 36px" }}>
              <div style={{ fontSize: 20, color: INK3, letterSpacing: 1.5 }}>{status}</div>
              <div style={{ display: "flex", height: 10, borderRadius: 10, background: "#262733", marginTop: 16 }}>
                <div style={{ display: "flex", width: `${pct}%`, height: 10, borderRadius: 10, background: BLUE }} />
              </div>
              <div style={{ display: "flex", marginTop: 28, height: 76, borderRadius: 20, background: live ? "#2F6BFF" : "#262733", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700 }}>{live ? "Claim on Base" : "View on Basedrop"}</div>
            </div>
          </div>
        )}
      </div>
    ),
    { width: W, height: H, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
