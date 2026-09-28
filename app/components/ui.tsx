"use client";
import { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { C, FONT_MONO, RADIUS, TNUM } from "../../lib/theme";
import { haptic } from "../../lib/haptics";

export function Card({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: RADIUS.card, boxShadow: C.shadowCard, ...style }}>
      {children}
    </div>
  );
}

type Variant = "primary" | "ghost" | "soft" | "danger" | "solid";
export function Button({ variant = "primary", size = "md", full = true, style, children, onClick, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; full?: boolean }) {
  const h = size === "lg" ? 56 : size === "sm" ? 40 : 48;
  const base: CSSProperties = {
    height: h, width: full ? "100%" : undefined, padding: full ? 0 : "0 18px",
    borderRadius: RADIUS.ctl, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontSize: size === "lg" ? 15.5 : size === "sm" ? 13.5 : 14.5, fontWeight: 600, letterSpacing: "-0.015em",
    cursor: rest.disabled ? "not-allowed" : "pointer", border: "none", whiteSpace: "nowrap",
  };
  const v: Record<Variant, CSSProperties> = {
    primary: { color: "#fff" },
    ghost: { background: C.surface, color: C.text, border: `1px solid ${C.hairlineStrong}`, boxShadow: "0 1px 2px rgba(16,18,40,.04)" },
    soft: { background: C.accentDim, color: C.accent },
    danger: { background: C.dangerDim, color: C.danger },
    solid: { background: C.solid, color: C.solidInk },
  };
  return (
    <button
      {...rest}
      onClick={e => { if (variant === "primary") haptic.tap("medium"); onClick?.(e); }}
      className={`bd-press${variant === "primary" ? " bd-btn-primary" : ""} ${rest.className ?? ""}`}
      style={{ ...base, ...v[variant], opacity: rest.disabled && variant !== "primary" ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, letterSpacing: "0.04em", textTransform: "uppercase", ...style }}>{children}</div>;
}

export const inputStyle: CSSProperties = {
  width: "100%", height: 52, background: C.surface, border: `1px solid ${C.hairlineStrong}`, borderRadius: RADIUS.ctl,
  padding: "0 16px", fontSize: 15, fontWeight: 500, color: C.text, outline: "none",
};

export function Money({ value, size = 18, style }: { value: number; size?: number; style?: CSSProperties }) {
  const [whole, cents] = value.toFixed(2).split(".");
  return (
    <span style={{ ...TNUM, fontSize: size, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, ...style }}>
      ${Number(whole).toLocaleString("en-US")}<span style={{ fontSize: "0.5em", color: C.textFaint, letterSpacing: "-0.02em" }}>.{cents}</span>
    </span>
  );
}

export function SectionHead({ title, live, right }: { title: string; live?: boolean; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: 8 }}>
        {live && <span className="bd-dot" />}{title}
      </h3>
      {right}
    </div>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{children}</button>;
}

export function PageHead({ title, sub, onBack, backDisabled }: { title: string; sub?: string; onBack?: () => void; backDisabled?: boolean }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {onBack && (
        <button onClick={onBack} disabled={backDisabled} aria-label="Back" className="bd-press" style={{ width: 40, height: 40, borderRadius: RADIUS.ctl, background: C.surface, border: `1px solid ${C.hairline}`, display: "grid", placeItems: "center", marginBottom: 20, cursor: backDisabled ? "not-allowed" : "pointer", opacity: backDisabled ? 0.4 : 1, color: C.text }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.1 }}>{title}</h1>
      {sub && <p style={{ fontSize: 14, color: C.textDim, marginTop: 6, lineHeight: 1.45 }}>{sub}</p>}
    </div>
  );
}
