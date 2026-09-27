"use client";
import { View } from "../../lib/types";
import { C } from "../../lib/theme";
import { haptic } from "../../lib/haptics";
import { IconHome, IconSearch, IconSend, IconUser } from "./Icon";

const PlusIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);

const ITEMS = [
  { Icon: IconHome, sc: "home" as View, label: "Home" },
  { Icon: IconSearch, sc: "explore" as View, label: "Explore" },
  null,
  { Icon: IconSend, sc: "tip" as View, label: "Tip" },
  { Icon: IconUser, sc: "profile" as View, label: "Profile" },
];

// Floating glass tab bar (mobile); hidden on desktop where TopBar carries the nav.
export function BottomNav({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const go = (v: View) => { haptic.tap("light"); onNavigate(v); };
  return (
    <nav className="bd-tabbar" aria-label="Primary">
      {ITEMS.map(it => it === null ? (
        <div key="fab" style={{ display: "grid", placeItems: "center" }}>
          <button aria-label="Create a drop" onClick={() => go("create")} className="bd-press"
            style={{ width: 44, height: 44, borderRadius: 14, border: "none", background: C.solid, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 8px 16px -6px rgba(14,13,20,.5)" }}>
            <PlusIcon color={view === "create" ? "var(--bd-blue)" : "var(--bd-solid-ink)"} />
          </button>
        </div>
      ) : (
        <button key={it.label} onClick={() => go(it.sc)} aria-current={view === it.sc ? "page" : undefined}
          style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: view === it.sc ? C.accent : C.textFaint, fontSize: 11, fontWeight: 500, height: "100%", justifyContent: "center" }}>
          <it.Icon size={20} color="currentColor" strokeWidth={view === it.sc ? 2 : 1.8} />
          {it.label}
        </button>
      ))}
    </nav>
  );
}
