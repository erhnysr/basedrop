"use client";
import { DropInfo } from "../../lib/contract";
import { formatUSDC, timeLeft } from "../../lib/format";
import { C, FONT_MONO } from "../../lib/theme";
import { Ticket } from "./DropCard";
import { Button } from "./ui";

// Status derivation (matches on-chain semantics):
// active=false only on full claim or cancel; an active drop past expiry still
// holds unclaimed funds until the creator cancels.
function statusFor(d: DropInfo): { label: string; color: string; bg: string } {
  const now = Date.now() / 1000;
  if (!d.active) {
    return d.claimedCount >= d.totalClaims
      ? { label: "Fully claimed", color: C.live, bg: C.liveDim }
      : { label: "Cancelled", color: C.textDim, bg: C.surfaceHi };
  }
  if (d.expiresAt <= now) return { label: "Expired · funds locked", color: C.danger, bg: C.dangerDim };
  return { label: `Live · ${timeLeft(d.expiresAt)} left`, color: C.accent, bg: C.accentDim };
}

export function MyDropCard({ d, onCancel, cancelling }: { d: DropInfo; onCancel: (id: number) => void; cancelling: boolean }) {
  const st = statusFor(d);
  const refund = d.amountPerClaim * BigInt(Math.max(0, d.totalClaims - d.claimedCount));
  return (
    <Ticket
      d={d}
      meta={<span style={{ fontFamily: FONT_MONO, color: st.color, background: st.bg, borderRadius: 999, padding: "1px 8px" }}>{st.label}</span>}
      footer={d.active ? (
        <Button variant="danger" size="sm" disabled={cancelling} onClick={() => onCancel(d.id)}>
          {cancelling ? "Cancelling…" : `Cancel & refund ${formatUSDC(refund)}`}
        </Button>
      ) : undefined}
    />
  );
}
