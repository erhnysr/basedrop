"use client";
import { useEffect, useState } from "react";
import type { ActivityItem } from "../api/activity/route";
import { C, FONT_MONO, TNUM } from "../../lib/theme";
import { Card, SectionHead } from "./ui";
import { Avatar, DisplayName } from "./Identity";

function ago(ts: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Row({ it }: { it: ActivityItem }) {
  const verb = it.kind === "claim" ? <>claimed Drop #{it.dropId}</>
    : it.kind === "drop" ? <>created Drop #{it.dropId} · {it.claims} claims</>
    : <>tipped <DisplayName address={it.counterparty!} mono={false} /></>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
      <Avatar address={it.actor} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><DisplayName address={it.actor} /></div>
        <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{verb}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ ...TNUM, fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>{it.kind === "claim" ? "+" : ""}${it.amount.toFixed(2)}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>{ago(it.ts)}</div>
      </div>
    </div>
  );
}

export function Activity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/activity").then(r => r.json()).then(d => { if (alive) setItems(d.items ?? []); }).catch(() => { if (alive) setItems([]); });
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (items !== null && items.length === 0) return null; // nothing real to show yet — no filler
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionHead title="Activity" live />
      <Card>
        {items === null
          ? [0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? `1px solid ${C.hairline}` : "none" }}>
              <span className="bd-sk" style={{ width: 36, height: 36, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}><div className="bd-sk" style={{ height: 12, width: "60%" }} /><div className="bd-sk" style={{ height: 10, width: "40%", marginTop: 8 }} /></div>
            </div>))
          : items.map((it, i) => (
            <div key={`${it.tx}-${i}`} className="bd-fade" style={{ borderTop: i ? `1px solid ${C.hairline}` : "none" }}><Row it={it} /></div>
          ))}
      </Card>
    </div>
  );
}
