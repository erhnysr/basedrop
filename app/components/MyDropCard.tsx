"use client";
import { DropInfo } from "../../lib/contract";
import { formatUSDC, timeLeft, COLORS, EMOJIS } from "../../lib/format";

// Status badge derivation (matches the on-chain contract semantics):
// - active becomes false ONLY on full claim or on cancel.
// - So an inactive drop is "Fully claimed" if every claim was taken, otherwise it was "Cancelled".
// - An active drop past its expiry still holds unclaimed funds locked until the creator cancels.
function statusFor(d: DropInfo): { label: string; color: string; bg: string } {
  const now = Date.now() / 1000;
  if (!d.active) {
    return d.claimedCount >= d.totalClaims
      ? { label: "Fully claimed", color: "#10B981", bg: "#ECFDF5" }
      : { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" };
  }
  if (d.expiresAt <= now) {
    return { label: "Expired · funds locked", color: "#DC2626", bg: "#FEE2E2" };
  }
  return { label: "Live", color: "#EF4444", bg: "#FEF2F2" };
}

export function MyDropCard({ d, onCancel, cancelling }: { d: DropInfo; onCancel: (id: number) => void; cancelling: boolean }) {
  const st = statusFor(d);
  const left = d.totalClaims - d.claimedCount;
  const refund = d.amountPerClaim * BigInt(left);
  const endsIn = d.active && d.expiresAt > Date.now() / 1000;
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 10, border: "1px solid #F0F0F0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: "3px 8px", borderRadius: 6, letterSpacing: 0.3 }}>{st.label}</span>
        <span style={{ fontSize: 9, color: "#ccc" }}>Drop #{d.id}{endsIn ? ` · ${timeLeft(d.expiresAt)}` : ""}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[d.id % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{EMOJIS[d.id % EMOJIS.length]}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{formatUSDC(d.amountPerClaim)} <span style={{ color: "#bbb", fontWeight: 600 }}>each</span></div>
            <div style={{ fontSize: 9, color: "#ccc" }}>{left} of {d.totalClaims} unclaimed</div>
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
      {d.active && (
        <button
          onClick={() => onCancel(d.id)}
          disabled={cancelling}
          style={{ width: "100%", marginTop: 12, background: cancelling ? "#F0F0F0" : "#FEF2F2", color: cancelling ? "#999" : "#DC2626", border: `1px solid ${cancelling ? "#F0F0F0" : "#FECACA"}`, borderRadius: 12, padding: "10px", fontSize: 12, fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer" }}
        >
          {cancelling ? "Cancelling..." : `Cancel & refund ${formatUSDC(refund)}`}
        </button>
      )}
    </div>
  );
}
