"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { ClaimButton } from "./components/ClaimButton";

type Screen = "home" | "explore" | "detail" | "create" | "success" | "notifications";

const drops = [
  { id: 1, name: "jesse.base.eth", emoji: "🔵", time: "2 min ago", amount: "$1", amountNum: 1, address: "0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1" as `0x${string}`, claimed: 23, total: 50, msg: "Thanks for 10K followers! Dropping $50 to the community 🙏", color: "#EEF2FF" },
  { id: 2, name: "vitalik.eth", emoji: "⚡", time: "15 min ago", amount: "$0.5", amountNum: 0.5, address: "0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1" as `0x${string}`, claimed: 67, total: 100, msg: "Onchain forever. Base is the future 🔵", color: "#F5F3FF" },
  { id: 3, name: "kia.base.eth", emoji: "🎨", time: "5 min ago", amount: "$0.25", amountNum: 0.25, address: "0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1" as `0x${string}`, claimed: 89, total: 200, msg: "Art drop for the community 🎨", color: "#ECFDF5" },
];

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedDrop, setSelectedDrop] = useState(drops[0]);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!isMiniAppReady) setMiniAppReady();
  }, [setMiniAppReady, isMiniAppReady]);

  const S: React.CSSProperties = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    background: "#FAFAFA",
    minHeight: "100vh",
    maxWidth: "430px",
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  };

  const DropCard = ({ drop, onClaim }: { drop: typeof drops[0], onClaim: () => void }) => (
    <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 10, border: "1px solid #F0F0F0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, background: "#EF4444", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444", letterSpacing: 0.4 }}>LIVE</span>
        <span style={{ fontSize: 9, color: "#ccc" }}> · {drop.total - drop.claimed} left</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: drop.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{drop.emoji}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111", letterSpacing: -0.2 }}>{drop.name}</div>
            <div style={{ fontSize: 9, color: "#ccc" }}>{drop.time}</div>
          </div>
        </div>
        <div style={{ background: "#111", borderRadius: 10, padding: "6px 10px", textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>{drop.amount}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>USDC</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 12, fontStyle: "italic" }}>"{drop.msg}"</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#111" }}>{drop.claimed} claimed</span>
            <span style={{ fontSize: 10, color: "#ddd" }}>of {drop.total}</span>
          </div>
          <div style={{ height: 3, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(drop.claimed / drop.total) * 100}%`, background: "#6366F1", borderRadius: 3 }} />
          </div>
        </div>
        <ClaimButton
          recipientAddress={drop.address}
          amountDollars={drop.amountNum}
          onSuccess={onClaim}
        />
      </div>
    </div>
  );

  const BottomNav = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#FAFAFA", borderTop: "1px solid #F0F0F0", display: "flex", padding: "10px 8px 24px", zIndex: 100 }}>
      {[["🏠","home","Home"],["🔍","explore","Explore"],["💧","create","Drop"],["🔔","notifications","Alerts"],["👤","home","Profile"]].map(([icon, sc, label]) => (
        <div key={label} onClick={() => setScreen(sc as Screen)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: screen === sc ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: screen === sc ? "#111" : "#ccc", letterSpacing: 0.2 }}>{label}</div>
        </div>
      ))}
    </div>
  );

  if (screen === "success") return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -0.8, marginBottom: 4 }}>You claimed it!</div>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 24, lineHeight: 1.5 }}>USDC is on its way to your wallet</div>
      <div style={{ fontSize: 60, fontWeight: 800, color: "#111", letterSpacing: -2, marginBottom: 4 }}>+{selectedDrop.amount}</div>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 28 }}>USDC · Base Mainnet</div>
      <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 20, padding: 16, width: "100%", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {[["From", selectedDrop.name], ["Amount", `${selectedDrop.amount} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #F5F5F5" }}>
            <span style={{ fontSize: 11, color: "#bbb" }}>{l}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" ? "#10B981" : l === "Status" ? "#10B981" : "#111" }}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setScreen("home"); setClaimed(false); }} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
        Back to drops
      </button>
      <button style={{ width: "100%", background: "#F8F7FF", color: "#6366F1", border: "1px solid #EBEBFF", borderRadius: 16, padding: 12, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        🔗 Share on Farcaster
      </button>
    </div>
  );

  if (screen === "create") return (
    <div style={S}>
      <div style={{ background: "#111", padding: "14px 18px 22px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", top: -40, right: -20 }} />
        <div onClick={() => setScreen("home")} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.8, marginBottom: 3, position: "relative" }}>Create a drop 💧</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", position: "relative" }}>Send USDC to your community</div>
      </div>
      <div style={{ padding: "16px 18px 100px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[["Amount each", "$1.00"], ["Recipients", "50"]].map(([l, v]) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>{l}</div>
              <input defaultValue={v} style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Expires in</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["1h", "6h", "24h", "48h"].map(t => (
              <div key={t} style={{ flex: 1, border: `1.5px solid ${t === "6h" ? "#111" : "#F0F0F0"}`, borderRadius: 10, padding: "8px 4px", fontSize: 11, fontWeight: 700, color: t === "6h" ? "#111" : "#bbb", textAlign: "center", cursor: "pointer", background: "#fff" }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Message</div>
          <input defaultValue="Thanks for the support! 🙏" style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#111", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ background: "#F8F7FF", border: "1.5px solid #EBEBFF", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#bbb" }}>Total to deposit</div>
            <div style={{ fontSize: 9, color: "#ccc", marginTop: 2 }}>50 × $1.00 USDC</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.8 }}>$50</div>
        </div>
        <button style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Launch drop 🚀</button>
        <div style={{ textAlign: "center", fontSize: 10, color: "#ccc" }}>Zero platform fees · Powered by Base</div>
      </div>
      <BottomNav />
    </div>
  );

  if (screen === "detail") return (
    <div style={S}>
      <div style={{ background: "#111", padding: "14px 18px 22px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)", top: -40, left: "50%", transform: "translateX(-50%)" }} />
        <div onClick={() => setScreen("explore")} style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.1)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1.5px solid rgba(255,255,255,0.2)", position: "relative" }}>{selectedDrop.emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4, position: "relative" }}>{selectedDrop.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 14, fontStyle: "italic", position: "relative" }}>"{selectedDrop.msg}"</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1.5, position: "relative" }}>{selectedDrop.amount}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", position: "relative", marginTop: 2 }}>USDC per claim</div>
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color: "#92400E", fontWeight: 600 }}>⏰ Expires in</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B", letterSpacing: -0.5 }}>2h 34m 12s</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{selectedDrop.claimed} of {selectedDrop.total} claimed</span>
            <span style={{ fontSize: 12, color: "#ccc" }}>{selectedDrop.total - selectedDrop.claimed} left</span>
          </div>
          <div style={{ height: 4, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(selectedDrop.claimed / selectedDrop.total) * 100}%`, background: "#6366F1", borderRadius: 4 }} />
          </div>
        </div>
        <button onClick={() => { setScreen("success"); setClaimed(true); }} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
          Claim {selectedDrop.amount} USDC 💧
        </button>
        <button style={{ width: "100%", background: "#F8F7FF", color: "#6366F1", border: "1px solid #EBEBFF", borderRadius: 16, padding: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>
          🔗 Share this drop
        </button>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 10 }}>Recent claimers</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["vitalik.eth", "kia.base", "dan.eth", "jesse.eth"].map(c => (
            <div key={c} style={{ background: "#F8F7FF", border: "1px solid #EBEBFF", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 600, color: "#6366F1" }}>{c}</div>
          ))}
          <div style={{ background: "#F5F5F5", border: "1px solid #F0F0F0", borderRadius: 8, padding: "4px 10px", fontSize: 10, color: "#bbb" }}>+19 more</div>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  if (screen === "notifications") return (
    <div style={S}>
      <div style={{ padding: "16px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Notifications</div>
        <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>Clear all</div>
      </div>
      {[
        { ic: "💧", bg: "#EEF2FF", txt: "jesse.base.eth dropped $50 — 27 spots left!", time: "2 min ago", unread: true },
        { ic: "✅", bg: "#ECFDF5", txt: "You claimed $1 USDC from jesse.base.eth", time: "15 min ago", unread: true },
        { ic: "⏰", bg: "#FFFBEB", txt: "vitalik.eth drop ending in 2h — 33 spots left", time: "1h ago", unread: true },
        { ic: "💧", bg: "#EEF2FF", txt: "kia.base.eth started a new drop — $0.25 each", time: "3h ago", unread: false },
        { ic: "✅", bg: "#ECFDF5", txt: "Your drop is complete! 50/50 claimed", time: "1d ago", unread: false },
        { ic: "👥", bg: "#EEF2FF", txt: "vitalik.eth is now following you", time: "2d ago", unread: false },
      ].map((n, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "12px 18px", borderBottom: "0.5px solid #F8F8F8", alignItems: "flex-start", background: n.unread ? "#FAFBFF" : "transparent" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.ic}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#111", lineHeight: 1.5, marginBottom: 2 }}>{n.txt}</div>
            <div style={{ fontSize: 9, color: "#ccc" }}>{n.time}</div>
          </div>
          {n.unread && <div style={{ width: 7, height: 7, background: "#6366F1", borderRadius: "50%", marginTop: 4, flexShrink: 0 }} />}
        </div>
      ))}
      <div style={{ height: 80 }} />
      <BottomNav />
    </div>
  );

  if (screen === "explore") return (
    <div style={S}>
      <div style={{ padding: "16px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Explore</div>
        <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>Filter</div>
      </div>
      <div style={{ margin: "12px 18px 0", background: "#fff", border: "1px solid #F0F0F0", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <span style={{ fontSize: 11, color: "#ccc", fontWeight: 500 }}>Search creators or drops...</span>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "12px 18px 0", overflowX: "auto" }}>
        {["All", "Big drops", "Ending soon", "Following"].map((c, i) => (
          <div key={c} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", border: `1px solid ${i === 0 ? "#111" : "#F0F0F0"}`, color: i === 0 ? "#fff" : "#aaa", background: i === 0 ? "#111" : "#fff", cursor: "pointer" }}>{c}</div>
        ))}
      </div>
      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Top creators</div>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>See all</div>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {drops.map(d => (
            <div key={d.id} style={{ minWidth: 80, background: "#fff", border: "1px solid #F0F0F0", borderRadius: 16, padding: "12px 10px", textAlign: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.color, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{d.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#111" }}>{d.name.split(".")[0]}</div>
              <div style={{ fontSize: 9, color: "#6366F1", fontWeight: 600, marginTop: 2 }}>{d.claimed} drops</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Active drops</div>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>12 live</div>
        </div>
        {drops.map(drop => (
          <div key={drop.id} onClick={() => { setSelectedDrop(drop); setScreen("detail"); }}>
            <DropCard drop={drop} onClaim={() => { setSelectedDrop(drop); setScreen("detail"); }} />
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );

  return (
    <div style={S}>
      <div style={{ padding: "14px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#111", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 9, height: 12, background: "#fff", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>basedrop</span>
        </div>
        <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 }}>E</div>
      </div>

      <div style={{ margin: "16px 14px 0", background: "#111", borderRadius: 24, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", top: -50, right: -30 }} />
        <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)", bottom: -20, left: 10 }} />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 0.8, marginBottom: 4, position: "relative" }}>AVAILABLE TO CLAIM</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1.5, lineHeight: 1, marginBottom: 18, position: "relative" }}>
          <sup style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.4)", verticalAlign: "super" }}>$</sup>0.00
        </div>
        <div style={{ display: "flex", gap: 10, position: "relative" }}>
          <button onClick={() => setScreen("create")} style={{ flex: 1, background: "#6366F1", color: "#fff", border: "none", borderRadius: 14, padding: "12px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Create drop</button>
          <button style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 14, padding: "12px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>History</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "14px 14px 0" }}>
        {[["$4.2K", "Total dropped"], ["1,891", "Claims today"], ["243", "Creators"]].map(([v, l]) => (
          <div key={l} style={{ flex: 1, padding: "12px 10px", background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: -0.3 }}>{v}</div>
            <div style={{ fontSize: 9, color: "#bbb", fontWeight: 500, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 14px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Live drops</div>
          <div onClick={() => setScreen("explore")} style={{ fontSize: 12, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>See all →</div>
        </div>
        {drops.slice(0, 2).map(drop => (
          <div key={drop.id} onClick={() => { setSelectedDrop(drop); setScreen("detail"); }}>
            <DropCard drop={drop} onClaim={() => { setSelectedDrop(drop); setScreen("success"); }} />
          </div>
        ))}
      </div>

      <BottomNav />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
