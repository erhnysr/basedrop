"use client";
import { View } from "../../lib/types";
import { C, RADIUS } from "../../lib/theme";
import { ConnectPill } from "./ConnectPill";
import { Avatar, DisplayName } from "./Identity";
import { IconLink } from "./Icon";
import { Mark, Wordmark } from "./Mark";
import { ThemeToggle } from "./ThemeToggle";

const NAV: { v: View; label: string }[] = [
  { v: "home", label: "Home" }, { v: "explore", label: "Explore" }, { v: "tip", label: "Tip" }, { v: "profile", label: "Profile" },
];

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label="basedrop home" style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer" }}>
      <Mark size={30} />
      <Wordmark />
    </button>
  );
}

export function TopBar({ view, onNavigate, address, referralPoints }: { view: View; onNavigate: (v: View) => void; address?: string; referralPoints: number }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
      <Brand onClick={() => onNavigate("home")} />
      <nav className="bd-topnav" aria-label="Primary">
        {NAV.map(n => (
          <button key={n.v} onClick={() => onNavigate(n.v)} aria-current={view === n.v ? "page" : undefined} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: view === n.v ? C.text : C.textDim }}>{n.label}</button>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ThemeToggle />
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
      </div>
    </header>
  );
}
