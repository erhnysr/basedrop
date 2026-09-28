"use client";
import { ReactNode } from "react";
import { DropInfo, USDC_DECIMALS } from "../../lib/contract";
import { timeLeft } from "../../lib/format";
import { C, FONT_MONO, TNUM } from "../../lib/theme";
import { Card, Money } from "./ui";
import { Avatar, DisplayName } from "./Identity";

export function claimedPct(d: DropInfo) {
  return d.totalClaims > 0 ? Math.min(100, (d.claimedCount / d.totalClaims) * 100) : 0;
}

export function ProgressBar({ pct, height = 4 }: { pct: number; height?: number }) {
  return (
    <div style={{ flex: 1, height, borderRadius: 999, background: C.sunken, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: C.accent, transition: "width .8s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}

// Signature element: every drop is a claim ticket with a perforated stub.
export function Ticket({ d, meta, footer, onClick }: { d: DropInfo; meta?: ReactNode; footer?: ReactNode; onClick?: () => void }) {
  const amount = Number(d.amountPerClaim) / 10 ** USDC_DECIMALS;
  return (
    <Card className={onClick ? "bd-press bd-fade" : "bd-fade"} style={{ marginBottom: 12, cursor: onClick ? "pointer" : "default" }}>
      <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
        onKeyDown={e => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px" }}>
          <Avatar address={d.creator} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d.message || `Drop #${d.id}`}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <DisplayName address={d.creator} mono={false} /> · {meta ?? timeLeft(d.expiresAt)}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <Money value={amount} size={18} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 4 }}>per claim</div>
          </div>
        </div>
        <div className="bd-perf" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 16px" }}>
          <ProgressBar pct={claimedPct(d)} />
          <div style={{ ...TNUM, fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, whiteSpace: "nowrap" }}>{d.claimedCount} / {d.totalClaims} claimed</div>
        </div>
      </div>
      {footer && <div style={{ padding: "0 16px 16px" }}>{footer}</div>}
    </Card>
  );
}

export function DropCard({ d, onOpen }: { d: DropInfo; onOpen: (id: number) => void }) {
  const expired = d.expiresAt <= Date.now() / 1000;
  const meta = !d.active ? (d.claimedCount >= d.totalClaims ? "fully claimed" : "cancelled") : expired ? "expired" : `${timeLeft(d.expiresAt)} left`;
  return <Ticket d={d} meta={meta} onClick={() => onOpen(d.id)} />;
}
