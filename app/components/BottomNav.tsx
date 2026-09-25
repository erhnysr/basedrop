"use client";
import { View } from "../../lib/types";
import { C } from "../../lib/theme";

export function BottomNav({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.surface, borderTop: `1px solid ${C.hairline}`, display: "flex", padding: "10px 8px 28px", zIndex: 100 }}>
      {([["🏠","home","Home"],["🔍","explore","Explore"],["💧","create","Drop"],["💸","tip","Tip"],["👤","profile","Profile"]] as const).map(([icon, sc, label]) => {
        const active = view === sc;
        return (
          <div key={label} onClick={() => onNavigate(sc as View)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: active ? C.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, filter: active ? "none" : "grayscale(0.4)", opacity: active ? 1 : 0.7 }}>{icon}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: active ? C.accent : C.textDim, letterSpacing: 0.2 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
