"use client";
import { DropInfo } from "../../lib/contract";
import { formatUSDC, timeLeft, EMOJIS } from "../../lib/format";
import { C, FONT_DISPLAY, TNUM } from "../../lib/theme";

// Status badge derivation (matches the on-chain contract semantics):
// - active becomes false ONLY on full claim or on cancel.
// - So an inactive drop is "Fully claimed" if every claim was taken, otherwise it was "Cancelled".
// - An active drop past its expiry still holds unclaimed funds locked until the creator cancels.
function statusFor(d: DropInfo): { label: string; color: string; bg: string } {
  const now = Date.now() / 1000;
  if (!d.active) {
    return d.claimedCount >= d.totalClaims
      ? { label: "Fully claimed", color: C.accent, bg: C.accentDim }
      : { label: "Cancelled", color: C.textDim, bg: C.hairline };
  }
  if (d.expiresAt <= now) {
    return { label: "Expired · funds locked", color: C.danger, bg: C.dangerDim };
  }
  return { label: "Live", color: C.accent, bg: C.accentDim };
}

export function MyDropCard({ d, onCancel, cancelling }: { d: DropInfo; onCancel: (id: number) => void; cancelling: boolean }) {
  const st = statusFor(d);
  const left = d.totalClaims - d.claimedCount;
  const refund = d.amountPerClaim * BigInt(left);
  const endsIn = d.active && d.expiresAt > Date.now() / 1000;
  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.hairline}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: "3px 8px", borderRadius: 6, letterSpacing: 0.3 }}>{st.label}</span>
        <span style={{ fontSize: 9, color: C.textDim }}>Drop #{d.id}{endsIn ? ` · ${timeLeft(d.expiresAt)}` : ""}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.surfaceHi, border: `1px solid ${C.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{EMOJIS[d.id % EMOJIS.length]}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{formatUSDC(d.amountPerClaim)} <span style={{ color: C.textDim, fontWeight: 600 }}>each</span></div>
            <div style={{ ...TNUM, fontSize: 9, color: C.textDim }}>{left} of {d.totalClaims} unclaimed</div>
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
      {d.active && (
        <button
          onClick={() => onCancel(d.id)}
          disabled={cancelling}
          style={{ width: "100%", marginTop: 14, background: cancelling ? C.hairline : C.dangerDim, color: cancelling ? C.textDim : C.danger, border: `1px solid ${cancelling ? C.hairline : "rgba(255,84,112,0.4)"}`, borderRadius: 12, padding: "10px", fontSize: 12, fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer" }}
        >
          {cancelling ? "Cancelling..." : `Cancel & refund ${formatUSDC(refund)}`}
        </button>
      )}
    </div>
  );
}
