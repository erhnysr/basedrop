"use client";
import { View } from "../../lib/types";
import { C, RADIUS } from "../../lib/theme";
import { ConnectPill } from "./ConnectPill";
import { IconLink } from "./Icon";
import { Mark, Wordmark } from "./Mark";
import { ThemeToggle } from "./ThemeToggle";
import { WalletMenu } from "./WalletMenu";

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
          <WalletMenu address={address} onProfile={() => onNavigate("profile")} />
        </div>
      ) : <ConnectPill />}
      </div>
    </header>
  );
}
