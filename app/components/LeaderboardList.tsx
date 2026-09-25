"use client";
import { LeaderboardEntry } from "../../lib/types";
import { shortAddr, RANK_EMOJI } from "../../lib/format";
import { C, TNUM } from "../../lib/theme";

export function LeaderboardList({ title, icon, entries }: { title: string; icon: string; entries: LeaderboardEntry[] }) {
  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.hairline}`, padding: 12, marginBottom: 10, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>{icon} {title}</div>
      {entries.length === 0 ? <div style={{ fontSize: 11, color: C.textDim, padding: "8px 0" }}>No data yet</div> :
        entries.map((e, i) => (
          <div key={e.address} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, padding: "6px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.hairline}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div style={{ width: 16, flexShrink: 0, textAlign: "center", fontSize: i < 3 ? 13 : 10, fontWeight: 700, color: i < 3 ? C.text : C.textDim }}>{i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-source-code-pro), monospace" }}>{shortAddr(e.address)}</div>
            </div>
            <div style={{ ...TNUM, fontSize: 10.5, fontWeight: 700, color: C.accent, flexShrink: 0 }}>${e.total.toFixed(2)}</div>
          </div>
        ))}
    </div>
  );
}
