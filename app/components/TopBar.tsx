"use client";
import { View } from "../../lib/types";
import { C, RADIUS } from "../../lib/theme";
import { ConnectPill } from "./ConnectPill";
import { Avatar, DisplayName } from "./Identity";
import { IconLink } from "./Icon";

const NAV: { v: View; label: string }[] = [
  { v: "home", label: "Home" }, { v: "explore", label: "Explore" }, { v: "tip", label: "Tip" }, { v: "profile", label: "Profile" },
];

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: C.text }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: C.accent, display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,.28), 0 2px 8px -2px var(--bd-blue)" }}>
        <svg width="12" height="15" viewBox="0 0 12 15" aria-hidden><path d="M6 .8C8.6 4 11 6.8 11 9.6A5 5 0 0 1 1 9.6C1 6.8 3.4 4 6 .8Z" fill="#fff" /></svg>
      </span>
      <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.035em" }}>basedrop</span>
    </button>
  );
}

export function TopBar({ view, onNavigate, address, referralPoints }: { view: View; onNavigate: (v: View) => void; address?: string; referralPoints: number }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
      <Brand onClick={() => onNavigate("home")} />
      <nav className="bd-topnav" aria-label="Primary">
        {NAV.map(n => (
          <button key={n.v} onClick={() => onNavigate(n.v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: view === n.v ? C.text : C.textDim }}>{n.label}</button>
        ))}
      </nav>
      {address ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {referralPoints > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 32, padding: "0 10px", borderRadius: RADIUS.pill, background: C.accentDim, color: C.accent, fontSize: 12, fontWeight: 600 }}>
              <IconLink size={12} /> {referralPoints} pts
            </span>
          )}
          <button onClick={() => onNavigate("profile")} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px 0 4px", borderRadius: RADIUS.pill, background: C.surface, border: `1px solid ${C.hairline}`, fontSize: 13, fontWeight: 500, color: C.text, cursor: "pointer", maxWidth: 190 }}>
            <Avatar address={address} size={28} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><DisplayName address={address} /></span>
          </button>
        </div>
      ) : <ConnectPill />}
    </header>
  );
}
