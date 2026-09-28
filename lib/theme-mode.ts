"use client";
import { useEffect, useState } from "react";

// In-app theme choice. "system" follows the OS; "light"/"dark" pin it.
// The choice is stamped on <html data-theme> (see the inline script in layout.tsx,
// which runs before paint so there's no flash) and kept in localStorage.
export type ThemeChoice = "system" | "light" | "dark";
const KEY = "bd-theme";
const EVENT = "bd-theme-change";

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch { return "system"; }
}

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    if (choice === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, choice);
  } catch { /* private mode: still applies for this visit */ }
  window.dispatchEvent(new Event(EVENT));
}

// Resolved light/dark actually on screen, kept in sync with user choice and OS changes.
export function useResolvedTheme(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    const update = () => {
      const c = read();
      setMode(c === "system" ? (systemDark() ? "dark" : "light") : c);
    };
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    window.addEventListener(EVENT, update);
    return () => { mq.removeEventListener("change", update); window.removeEventListener(EVENT, update); };
  }, []);
  return mode;
}

export function toggleTheme(current: "light" | "dark") {
  const next = current === "dark" ? "light" : "dark";
  // Picking the same thing the OS already shows goes back to "follow the system".
  applyTheme(next === (systemDark() ? "dark" : "light") ? "system" : next);
}

// Runs in <head> before first paint.
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
