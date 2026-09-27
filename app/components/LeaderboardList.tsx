"use client";
import { ComponentType } from "react";
import { LeaderboardEntry } from "../../lib/types";
import { C, FONT_MONO, TNUM } from "../../lib/theme";
import { Card } from "./ui";
import { Avatar, DisplayName } from "./Identity";

export function LeaderboardList({ title, Icon, entries }: { title: string; Icon: ComponentType<{ size?: number; color?: string }>; entries: LeaderboardEntry[] }) {
  return (
    <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
        <Icon size={15} color={C.textDim} /> {title}
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 13, color: C.textDim, padding: "6px 0" }}>No entries yet</div>
      ) : entries.slice(0, 5).map((e, i) => (
        <div key={e.address} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.hairline}` : "none" }}>
          <span style={{ ...TNUM, width: 18, fontFamily: FONT_MONO, fontSize: 11, color: i < 3 ? C.text : C.textFaint, fontWeight: 600 }}>{i + 1}</span>
          <Avatar address={e.address} size={24} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><DisplayName address={e.address} /></span>
          <span style={{ ...TNUM, fontSize: 13, fontWeight: 600 }}>${e.total.toFixed(2)}</span>
        </div>
      ))}
    </Card>
  );
}
