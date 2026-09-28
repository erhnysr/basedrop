"use client";
import { C, RADIUS } from "../../lib/theme";
import { toggleTheme, useResolvedTheme } from "../../lib/theme-mode";

export function ThemeToggle() {
  const mode = useResolvedTheme();
  const dark = mode === "dark";
  return (
    <button
      onClick={() => toggleTheme(mode)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="bd-press"
      style={{ width: 36, height: 36, borderRadius: RADIUS.pill, border: `1px solid ${C.hairline}`, background: C.surface, color: C.text, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>
      )}
    </button>
  );
}
