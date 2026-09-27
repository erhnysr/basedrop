"use client";
import { ReactNode } from "react";
import { C, FONT_MONO, RADIUS } from "../../lib/theme";
import { Card, Button } from "./ui";

// Skeleton shaped exactly like a Ticket, so the layout doesn't jump on load.
export function TicketSkeleton({ count = 2 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => (
    <Card key={i} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px" }}>
        <span className="bd-sk" style={{ width: 40, height: 40, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}><div className="bd-sk" style={{ height: 12, width: "78%" }} /><div className="bd-sk" style={{ height: 10, width: "46%", marginTop: 8 }} /></div>
        <div className="bd-sk" style={{ width: 48, height: 18 }} />
      </div>
      <div className="bd-perf" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 16px" }}>
        <div className="bd-sk" style={{ flex: 1, height: 4 }} /><div className="bd-sk" style={{ width: 64, height: 10 }} />
      </div>
    </Card>
  ))}</>;
}

// Empty state drawn as an outlined ticket waiting to be filled.
export function EmptyTicket({ text, cta, onCta }: { text: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ border: `1.5px dashed ${C.hairlineStrong}`, borderRadius: RADIUS.card, padding: "24px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.45, marginBottom: cta ? 16 : 0 }}>{text}</p>
      {cta && <Button variant="ghost" size="sm" full={false} onClick={onCta}>{cta}</Button>}
    </div>
  );
}

export type StepState = 0 | 1 | 2 | 3; // 0 idle · 1..n active step · n+1 done
// Tx progress: each step is its own bar, active step animates, finished steps go green.
export function TxSteps({ steps, current }: { steps: string[]; current: number }) {
  if (current === 0) return null;
  return (
    <div aria-live="polite" style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 8, margin: "20px 0 16px" }}>
      {steps.map((s, i) => {
        const cls = current > i + 1 ? "ok" : current === i + 1 ? "on" : "";
        return (
          <div key={s} className={`bd-step ${cls}`} style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, fontWeight: 500, color: cls ? C.text : C.textFaint }}>
            <i />{s}
          </div>
        );
      })}
    </div>
  );
}

export function Receipt({ block, tx }: { block?: bigint | null; tx?: string | null }) {
  if (!tx) return null;
  return (
    <Card className="bd-fade" style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textDim }}>{block ? `Block ${block.toLocaleString("en-US")}` : `${tx.slice(0, 10)}…`}</span>
      <a href={`https://basescan.org/tx/${tx}`} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 500, fontSize: 13 }}>View on Basescan ↗</a>
    </Card>
  );
}

export function AgentCard({ liveCount }: { liveCount: number | null }) {
  const k = { color: "var(--bd-code-key)" };
  return (
    <a href="/api/mcp" target="_blank" rel="noopener noreferrer" className="bd-press" style={{ display: "block", background: "var(--bd-code)", color: "var(--bd-code-ink)", borderRadius: RADIUS.card, padding: 16, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.7, border: `1px solid ${C.hairline}`, margin: "24px 0 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--bd-code-dim)", fontSize: 11, marginBottom: 8 }}><span>Any MCP agent</span><span>/api/mcp ↗</span></div>
      <div><span style={k}>list_drops</span>({"{"} limit: <span style={k}>5</span> {"}"})</div>
      <div style={{ color: "var(--bd-code-dim)" }}>→ <span style={{ color: "#34D399" }}>{liveCount === null ? "…" : `${liveCount} live drop${liveCount === 1 ? "" : "s"}`}</span> · get_drop · get_analytics · get_leaderboard</div>
    </a>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 999, padding: "4px 12px 4px 8px", marginBottom: 16 }}>{children}</span>
  );
}
