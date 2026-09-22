"use client";
import { View } from "../../lib/types";

export function BottomNav({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #F0F0F0", display: "flex", padding: "10px 8px 28px", zIndex: 100 }}>
      {([["🏠","home","Home"],["🔍","explore","Explore"],["💧","create","Drop"],["👤","home","Profile"]] as const).map(([icon, sc, label]) => (
        <div key={label} onClick={() => onNavigate(sc as View)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: view === sc ? "#F0F0F0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: view === sc ? "#111" : "#999", letterSpacing: 0.2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
