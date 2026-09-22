"use client";
import { DropInfo } from "../../lib/contract";
import { shortAddr, formatUSDC, timeLeft, COLORS, EMOJIS } from "../../lib/format";

export function DropCard({ d, onOpen }: { d: DropInfo; onOpen: (id: number) => void }) {
  const left = d.totalClaims - d.claimedCount;
  const isLive = d.active && d.expiresAt > Date.now() / 1000 && left > 0;
  return (
    <div onClick={() => onOpen(d.id)} style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 10, border: "1px solid #F0F0F0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        {isLive ? (<><div style={{ width: 6, height: 6, background: "#EF4444", borderRadius: "50%", animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444" }}>LIVE</span><span style={{ fontSize: 9, color: "#ccc" }}> · {left} left · {timeLeft(d.expiresAt)}</span></>) : (<span style={{ fontSize: 9, fontWeight: 700, color: "#aaa" }}>ENDED</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[d.id % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{EMOJIS[d.id % EMOJIS.length]}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{shortAddr(d.creator)}</div>
            <div style={{ fontSize: 9, color: "#ccc" }}>Drop #{d.id}</div>
          </div>
        </div>
        <div style={{ background: "#111", borderRadius: 10, padding: "6px 10px", textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{formatUSDC(d.amountPerClaim)}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>USDC</div>
        </div>
      </div>
      {d.message && <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 10, fontStyle: "italic" }}>"{d.message}"</div>}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#111" }}>{d.claimedCount} claimed</span>
        <span style={{ fontSize: 10, color: "#ddd" }}>of {d.totalClaims}</span>
      </div>
      <div style={{ height: 3, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(d.claimedCount / d.totalClaims) * 100}%`, background: "#6366F1", borderRadius: 3 }} />
      </div>
    </div>
  );
}
