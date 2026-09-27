"use client";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { C } from "../../lib/theme";

const WalletIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M16 12.5h2" /><path d="M3 9h15a3 3 0 0 0-3-3" /></svg>
);

// OnchainKit's connect flow, rendered in Basedrop's own style.
export function ConnectPill({ full = false, label = "Connect" }: { full?: boolean; label?: string }) {
  return (
    <ConnectWallet
      render={({ onClick, isLoading }) => (
        <button onClick={onClick} disabled={isLoading} className={full ? "bd-press bd-btn-primary" : "bd-press"}
          style={full
            ? { width: "100%", height: 52, borderRadius: 14, border: "none", color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }
            : { height: 36, padding: "0 14px", borderRadius: 999, border: "none", background: C.solid, color: C.solidInk, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <WalletIcon />{isLoading ? "Connecting…" : full ? "Connect wallet" : label}
        </button>
      )}
    />
  );
}
