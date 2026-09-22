"use client";
import { LeaderboardEntry } from "../../lib/types";
import { shortAddr, RANK_EMOJI } from "../../lib/format";

export function LeaderboardList({ title, icon, entries }: { title: string; icon: string; entries: LeaderboardEntry[] }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", padding: 14, marginBottom: 10, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 8 }}>{icon} {title}</div>
      {entries.length === 0 ? <div style={{ fontSize: 11, color: "#bbb", padding: "8px 0" }}>No data yet</div> :
        entries.map((e, i) => (
          <div key={e.address} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < entries.length - 1 ? "0.5px solid #F5F5F5" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 18, textAlign: "center", fontSize: i < 3 ? 14 : 10, fontWeight: 700, color: i < 3 ? "#111" : "#ccc" }}>{i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{shortAddr(e.address)}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#111" }}>${e.total.toFixed(2)}</div>
          </div>
        ))}
    </div>
  );
}
