"use client";
import { DropInfo } from "../../lib/contract";
import { shortAddr, formatUSDC, timeLeft, EMOJIS } from "../../lib/format";
import { C, FONT_DISPLAY, TNUM } from "../../lib/theme";

export function DropCard({ d, onOpen }: { d: DropInfo; onOpen: (id: number) => void }) {
  const left = d.totalClaims - d.claimedCount;
  const isLive = d.active && d.expiresAt > Date.now() / 1000 && left > 0;
  return (
    <div onClick={() => onOpen(d.id)} style={{ background: C.surface, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.hairline}`, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        {isLive ? (<><div style={{ width: 6, height: 6, background: C.accent, borderRadius: "50%", animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: 9, fontWeight: 700, color: C.accent, letterSpacing: 0.4 }}>LIVE</span><span style={{ fontSize: 9, color: C.textDim }}> · {left} left · {timeLeft(d.expiresAt)}</span></>) : (<span style={{ fontSize: 9, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4 }}>ENDED</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.surfaceHi, border: `1px solid ${C.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{EMOJIS[d.id % EMOJIS.length]}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "var(--font-source-code-pro), monospace" }}>{shortAddr(d.creator)}</div>
            <div style={{ fontSize: 9, color: C.textDim }}>Drop #{d.id}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...TNUM, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.5, fontFamily: FONT_DISPLAY }}>{formatUSDC(d.amountPerClaim)}</div>
          <div style={{ fontSize: 7, color: C.textDim, letterSpacing: 0.5, marginTop: -1 }}>USDC / CLAIM</div>
        </div>
      </div>
      {d.message && <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6, marginBottom: 12, fontStyle: "italic" }}>"{d.message}"</div>}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ ...TNUM, fontSize: 10, fontWeight: 700, color: C.text }}>{d.claimedCount} claimed</span>
        <span style={{ ...TNUM, fontSize: 10, color: C.textDim }}>of {d.totalClaims}</span>
      </div>
      <div style={{ height: 3, background: C.hairline, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(d.claimedCount / d.totalClaims) * 100}%`, background: C.accent, borderRadius: 3 }} />
      </div>
    </div>
  );
}
