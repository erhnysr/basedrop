"use client";
import { useId } from "react";

// Basedrop mark: a white drop on Base Blue.
export function Mark({ size = 28 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden style={{ display: "block", flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(0,82,255,.35))" }}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A63FF" /><stop offset="1" stopColor="#0049E6" /></linearGradient>
      </defs>
      <rect width="96" height="96" rx="26" fill={`url(#${id}g)`} />
      <path d="M48 18c11 13.5 21 25.3 21 35.4A21 21 0 0 1 27 53.4C27 43.3 37 31.5 48 18Z" fill="#fff" />
    </svg>
  );
}

// Wordmark: "base" light and muted, "drop" bold — Base connection without an extra colour.
export function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: "-0.035em", lineHeight: 1 }}>
      <span style={{ fontWeight: 400, color: "var(--bd-ink2)" }}>base</span><span style={{ fontWeight: 700, color: "var(--bd-ink)" }}>drop</span>
    </span>
  );
}
