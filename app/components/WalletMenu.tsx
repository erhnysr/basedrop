"use client";
import { useEffect, useRef, useState } from "react";
import { useDisconnect } from "wagmi";
import { C, FONT_MONO, RADIUS } from "../../lib/theme";
import { Avatar, DisplayName } from "./Identity";
import { IconCheck, IconCopy, IconUser } from "./Icon";

function IconLogout({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  );
}

// Wallet chip with a small menu: profile, copy address, disconnect.
export function WalletMenu({ address, onProfile }: { address: string; onProfile: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, width: "100%", height: 40, padding: "0 12px", borderRadius: 10, background: "none", border: "none", fontSize: 14, fontWeight: 500, color: C.text, cursor: "pointer", textAlign: "left" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px 0 4px", borderRadius: RADIUS.pill, background: C.surface, border: `1px solid ${C.hairline}`, fontSize: 13, fontWeight: 500, color: C.text, cursor: "pointer", maxWidth: 190 }}>
        <Avatar address={address} size={28} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><DisplayName address={address} /></span>
      </button>
      {open && (
        <div role="menu" className="bd-fade" style={{ position: "absolute", right: 0, top: 44, zIndex: 50, width: 232, padding: 6, borderRadius: 16, background: C.surface, border: `1px solid ${C.hairline}`, boxShadow: C.shadowCard }}>
          <div style={{ padding: "8px 12px 10px", fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address.slice(0, 6)}…{address.slice(-4)} · Base</div>
          <button role="menuitem" className="bd-press" style={item} onClick={() => { setOpen(false); onProfile(); }}><IconUser size={16} /> Your drops</button>
          <button role="menuitem" className="bd-press" style={item} onClick={copy}>{copied ? <IconCheck size={16} /> : <IconCopy size={16} />} {copied ? "Copied" : "Copy address"}</button>
          <div style={{ height: 1, background: C.hairline, margin: "4px 6px" }} />
          <button role="menuitem" className="bd-press" style={{ ...item, color: C.danger }} onClick={() => { setOpen(false); disconnect(); }}><IconLogout /> Disconnect</button>
        </div>
      )}
    </div>
  );
}
