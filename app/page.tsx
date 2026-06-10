"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS, USDC_ABI, ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, DURATIONS } from "../lib/contract";

const rpc = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });

// Base Builder Code attribution suffix (bc_dn3rl547), appended to tx calldata
const BUILDER_CODE: `0x${string}` = "0x62635f646e33726c353437";

type View = "home" | "create" | "claim" | "explore";

interface DropInfo {
  id: number;
  creator: string;
  amountPerClaim: bigint;
  totalClaims: number;
  claimedCount: number;
  expiresAt: number;
  message: string;
  active: boolean;
}

const COLORS = ["#EEF2FF", "#F5F3FF", "#ECFDF5", "#FEF3C7", "#FEE2E2", "#F0F9FF"];
const EMOJIS = ["🔵", "⚡", "🎨", "💎", "🚀", "🌊", "✨", "🎯", "💧", "🔥"];

function shortAddr(a: string) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ""; }
function formatUSDC(a: bigint) { return `$${(Number(a) / 10 ** USDC_DECIMALS).toFixed(2)}`; }
function timeLeft(exp: number) {
  const d = exp - Math.floor(Date.now() / 1000);
  if (d <= 0) return "Expired";
  const h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function Page() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<View>("home");

  const [amountPerClaim, setAmountPerClaim] = useState("1");
  const [totalClaims, setTotalClaims] = useState("10");
  const [duration, setDuration] = useState("24h");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "creating" | "done">("idle");
  const [createdDropId, setCreatedDropId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimDropId, setClaimDropId] = useState("");
  const [claimStep, setClaimStep] = useState<"idle" | "claiming" | "done">("idle");
  const [dropInfo, setDropInfo] = useState<any>(null);
  const [allDrops, setAllDrops] = useState<DropInfo[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [, setTick] = useState(0);

  const amountRef = useRef(amountPerClaim);
  const claimsRef = useRef(totalClaims);
  const durationRef = useRef(duration);
  const messageRef = useRef(message);
  useEffect(() => { amountRef.current = amountPerClaim; }, [amountPerClaim]);
  useEffect(() => { claimsRef.current = totalClaims; }, [totalClaims]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { messageRef.current = message; }, [message]);

  useEffect(() => { if (!isFrameReady) setFrameReady(); }, [setFrameReady, isFrameReady]);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("claim");
    if (id) { setClaimDropId(id); setView("claim"); }
  }, []);

  const fetchAllDrops = useCallback(async () => {
    try {
      const nextId = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
      const count = Number(nextId);
      const drops: DropInfo[] = [];
      for (let i = count - 1; i >= 0 && i >= count - 20; i--) {
        try {
          const info = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(i)] }) as any;
          drops.push({ id: i, creator: info[0], amountPerClaim: info[1], totalClaims: Number(info[2]), claimedCount: Number(info[3]), expiresAt: Number(info[4]), message: info[5], active: info[6] });
        } catch {}
      }
      setAllDrops(drops);
    } catch (e) { console.error(e); }
    setLoadingDrops(false);
  }, []);

  useEffect(() => { fetchAllDrops(); }, [fetchAllDrops]);

  useEffect(() => {
    if (!claimDropId || isNaN(Number(claimDropId))) return;
    rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(parseInt(claimDropId) || 0)] }).then(setDropInfo).catch(() => {});
  }, [claimDropId]);

  const { writeContractAsync } = useWriteContract();

  const handleCreate = async () => {
    if (!isConnected || !address) return;
    try {
      const amt = amountRef.current, claims = claimsRef.current, dur = durationRef.current, msg = messageRef.current;
      const amtUnits = BigInt(Math.round(parseFloat(amt) * 10 ** USDC_DECIMALS));
      const totalAmt = amtUnits * BigInt(claims);
      setStep("approving");
      await writeContractAsync({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "approve", args: [ESCROW_ADDRESS as `0x${string}`, totalAmt], dataSuffix: BUILDER_CODE });
      for (let i = 0; i < 30; i++) {
        const a = await rpc.readContract({ address: USDC_ADDRESS as `0x${string}`, abi: USDC_ABI, functionName: "allowance", args: [address, ESCROW_ADDRESS as `0x${string}`] });
        if ((a as bigint) >= totalAmt) break;
        await new Promise(r => setTimeout(r, 2000));
      }
      setStep("creating");
      const prevId = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
      await writeContractAsync({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "createDrop", args: [amtUnits, BigInt(claims), BigInt(DURATIONS[dur]), msg], dataSuffix: BUILDER_CODE });
      for (let i = 0; i < 30; i++) {
        const nId = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
        if (nId > prevId) { setCreatedDropId(String(Number(prevId))); setStep("done"); fetchAllDrops(); return; }
        await new Promise(r => setTimeout(r, 2000));
      }
      setStep("done"); setCreatedDropId("0");
    } catch (e) { console.error(e); setStep("idle"); }
  };

  const handleClaim = async () => {
    if (!claimDropId) return;
    try {
      setClaimStep("claiming");
      const tx = await writeContractAsync({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "claim", args: [BigInt(parseInt(claimDropId) || 0)], dataSuffix: BUILDER_CODE });
      await rpc.waitForTransactionReceipt({ hash: tx });
      setClaimStep("done"); fetchAllDrops();
    } catch (e) { console.error(e); setClaimStep("idle"); }
  };

  const shareLink = createdDropId !== null ? `${process.env.NEXT_PUBLIC_URL || "https://basedrop-chi.vercel.app"}?claim=${createdDropId}` : "";
  const handleCopy = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openClaim = (id: number) => { setClaimDropId(String(id)); setClaimStep("idle"); setDropInfo(null); setView("claim"); };

  const liveDrops = allDrops.filter(d => d.active && d.expiresAt > Date.now() / 1000 && d.claimedCount < d.totalClaims);
  const totalDropped = allDrops.reduce((s, d) => s + Number(d.amountPerClaim) * d.claimedCount / 10 ** USDC_DECIMALS, 0);
  const totalClaimed = allDrops.reduce((s, d) => s + d.claimedCount, 0);

  const S: React.CSSProperties = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", background: "#FAFAFA", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" };

  const BottomNav = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #F0F0F0", display: "flex", padding: "10px 8px 28px", zIndex: 100 }}>
      {([["🏠","home","Home"],["🔍","explore","Explore"],["💧","create","Drop"],["👤","home","Profile"]] as const).map(([icon, sc, label]) => (
        <div key={label} onClick={() => setView(sc as View)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: view === sc ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: view === sc ? "#111" : "#ccc", letterSpacing: 0.2 }}>{label}</div>
        </div>
      ))}
    </div>
  );

  const DropCard = ({ d }: { d: DropInfo }) => {
    const left = d.totalClaims - d.claimedCount;
    const isLive = d.active && d.expiresAt > Date.now() / 1000 && left > 0;
    return (
      <div onClick={() => openClaim(d.id)} style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 10, border: "1px solid #F0F0F0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          {isLive ? (<><div style={{ width: 6, height: 6, background: "#EF4444", borderRadius: "50%", animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: 9, fontWeight: 700, color: "#EF4444" }}>LIVE</span><span style={{ fontSize: 9, color: "#ccc" }}> · {left} left · {timeLeft(d.expiresAt)}</span></>) : (<span style={{ fontSize: 9, fontWeight: 700, color: "#aaa" }}>ENDED</span>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[d.id % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{EMOJIS[d.id % EMOJIS.length]}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{shortAddr(d.creator)}</div>
              <div style={{ fontSize: 9, color: "#ccc" }}>Drop #{d.id}</div>
            </div>
          </div>
          <div style={{ background: "#111", borderRadius: 10, padding: "6px 10px", textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{formatUSDC(d.amountPerClaim)}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>USDC</div>
          </div>
        </div>
        {d.message && <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 10, fontStyle: "italic" }}>"{d.message}"</div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#111" }}>{d.claimedCount} claimed</span>
          <span style={{ fontSize: 10, color: "#ddd" }}>of {d.totalClaims}</span>
        </div>
        <div style={{ height: 3, background: "#F0F0F0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(d.claimedCount / d.totalClaims) * 100}%`, background: "#6366F1", borderRadius: 3 }} />
        </div>
      </div>
    );
  };

  // ─── SUCCESS (CREATE) ───
  if (view === "create" && step === "done" && createdDropId !== null) return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -0.8, marginBottom: 4 }}>Drop #{createdDropId} launched!</div>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 24 }}>USDC deposited to escrow. Share to start getting claims.</div>
      <div style={{ background: "#F8F7FF", border: "1px solid #EBEBFF", borderRadius: 14, padding: "10px 14px", width: "100%", marginBottom: 16, fontSize: 11, color: "#666", wordBreak: "break-all", fontFamily: "monospace" }}>{shareLink}</div>
      <button onClick={handleCopy} style={{ width: "100%", background: copied ? "#10B981" : "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>{copied ? "✅ Copied!" : "📋 Copy Link"}</button>
      <button onClick={() => { const t = encodeURIComponent("I just created a USDC drop on Basedrop! Claim yours"); const u = encodeURIComponent(shareLink); window.open("https://warpcast.com/~/compose?text=" + t + "&embeds[]=" + u, "_blank"); }} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>🟣 Share on Warpcast</button>
      <button onClick={() => { setStep("idle"); setCreatedDropId(null); setView("home"); }} style={{ width: "100%", background: "#F0F0F0", color: "#333", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to Home</button>
    </div>
  );

  // ─── SUCCESS (CLAIM) ───
  if (view === "claim" && claimStep === "done" && dropInfo) return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -0.8, marginBottom: 4 }}>You claimed it!</div>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 24 }}>USDC sent to your wallet</div>
      <div style={{ fontSize: 60, fontWeight: 800, color: "#111", letterSpacing: -2, marginBottom: 4 }}>+{formatUSDC(dropInfo[1])}</div>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 28 }}>USDC · Base Mainnet</div>
      <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 20, padding: 16, width: "100%", marginBottom: 20 }}>
        {([["From", shortAddr(String(dropInfo[0]))], ["Amount", `${formatUSDC(dropInfo[1])} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]] as const).map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #F5F5F5" }}>
            <span style={{ fontSize: 11, color: "#bbb" }}>{l}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" || l === "Status" ? "#10B981" : "#111" }}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setClaimStep("idle"); setView("home"); }} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Back to drops</button>
    </div>
  );

  // ─── CREATE ───
  if (view === "create") {
    const total = (parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0"));
    return (
      <div style={S}>
        <div style={{ background: "#111", padding: "14px 18px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", top: -40, right: -20 }} />
          <div onClick={() => { setView("home"); setStep("idle"); }} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.8, marginBottom: 3, position: "relative" }}>Create a drop 💧</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", position: "relative" }}>Send USDC to your community</div>
        </div>
        <div style={{ padding: "16px 18px 100px" }}>
          {!isConnected && <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 12, color: "#92400E", fontWeight: 600, textAlign: "center" }}><ConnectWallet /></div>}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {([["Amount each ($)", amountPerClaim, setAmountPerClaim, "0.01"], ["Recipients", totalClaims, setTotalClaims, "1"]] as const).map(([l, v, fn, min]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>{l}</div>
                <input value={v} onChange={e => (fn as any)(e.target.value)} type="number" min={min} step={l === "Amount each ($)" ? "0.01" : "1"} disabled={step !== "idle"} style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Expires in</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.keys(DURATIONS).map(t => (
                <div key={t} onClick={() => step === "idle" && setDuration(t)} style={{ flex: 1, border: `1.5px solid ${t === duration ? "#111" : "#F0F0F0"}`, borderRadius: 10, padding: "8px 4px", fontSize: 11, fontWeight: 700, color: t === duration ? "#111" : "#bbb", textAlign: "center", cursor: "pointer", background: "#fff" }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Message</div>
            <input value={message} onChange={e => setMessage(e.target.value)} disabled={step !== "idle"} placeholder="Thanks for the support! 🙏" style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#111", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: "#F8F7FF", border: "1.5px solid #EBEBFF", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 11, color: "#bbb" }}>Total to deposit</div><div style={{ fontSize: 9, color: "#ccc", marginTop: 2 }}>{totalClaims} × ${amountPerClaim} USDC</div></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.8 }}>${total.toFixed(2)}</div>
          </div>
          <button onClick={handleCreate} disabled={!isConnected || step !== "idle" || total <= 0} style={{ width: "100%", background: step === "idle" ? "#111" : "#6366F1", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: step === "idle" && isConnected ? "pointer" : "not-allowed", opacity: !isConnected || total <= 0 ? 0.5 : 1, marginBottom: 8 }}>
            {step === "idle" && "Launch drop 🚀"}{step === "approving" && "Approving USDC..."}{step === "creating" && "Creating drop..."}
          </button>
          <div style={{ textAlign: "center", fontSize: 10, color: "#ccc" }}>Zero platform fees · Powered by Base</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── CLAIM (DETAIL) ───
  if (view === "claim") {
    const di = dropInfo;
    const isExpired = di ? Number(di[4]) <= Date.now() / 1000 : false;
    const isLive = di ? di[6] && !isExpired && Number(di[3]) < Number(di[2]) : false;
    return (
      <div style={S}>
        <div style={{ background: "#111", padding: "14px 18px 22px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)", top: -40, left: "50%", transform: "translateX(-50%)" }} />
          <div onClick={() => setView("home")} style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
          {di ? (<>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.1)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1.5px solid rgba(255,255,255,0.2)", position: "relative" }}>{EMOJIS[parseInt(claimDropId) % EMOJIS.length]}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4, position: "relative" }}>{shortAddr(String(di[0]))}</div>
            {di[5] && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 14, fontStyle: "italic", position: "relative" }}>"{String(di[5])}"</div>}
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1.5, position: "relative" }}>{formatUSDC(di[1])}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", position: "relative", marginTop: 2 }}>USDC per claim</div>
          </>) : <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, position: "relative" }}>Enter a Drop ID below</div>}
        </div>
        <div style={{ padding: "14px 18px 100px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Drop ID</div>
            <input value={claimDropId} onChange={e => { setClaimDropId(e.target.value); setClaimStep("idle"); }} placeholder="e.g. 0" style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", boxSizing: "border-box" }} />
          </div>
          {di && (<>
            <div style={{ background: isExpired ? "#FEE2E2" : "#FFFBEB", border: `1px solid ${isExpired ? "#FECACA" : "#FDE68A"}`, borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: isExpired ? "#DC2626" : "#92400E", fontWeight: 600 }}>⏰ {isExpired ? "Expired" : "Expires in"}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isExpired ? "#DC2626" : "#F59E0B" }}>{timeLeft(Number(di[4]))}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{String(di[3])} of {String(di[2])} claimed</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>{Number(di[2]) - Number(di[3])} left</span>
              </div>
              <div style={{ height: 4, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(Number(di[3]) / Number(di[2])) * 100}%`, background: "#6366F1" }} />
              </div>
            </div>
          </>)}
          {isLive && (
            <button onClick={handleClaim} disabled={!isConnected || claimStep === "claiming"} style={{ width: "100%", background: claimStep === "claiming" ? "#6366F1" : "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: isConnected && claimStep !== "claiming" ? "pointer" : "not-allowed", opacity: !isConnected ? 0.5 : 1, marginBottom: 10 }}>
              {claimStep === "claiming" ? "Claiming..." : `Claim ${di ? formatUSDC(di[1]) : ""} USDC 💧`}
            </button>
          )}
          {!isConnected && <div style={{ textAlign: "center", marginBottom: 10 }}><ConnectWallet /></div>}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── EXPLORE ───
  if (view === "explore") return (
    <div style={S}>
      <div style={{ padding: "16px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Explore</div>
        <div onClick={fetchAllDrops} style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>↻ Refresh</div>
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>All drops</div>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>{liveDrops.length} live</div>
        </div>
        {loadingDrops ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: "#bbb" }}>Loading...</div> :
          allDrops.length === 0 ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: "#bbb" }}>No drops yet. Be the first! 🚀</div> :
          allDrops.map(d => <DropCard key={d.id} d={d} />)}
      </div>
      <BottomNav />
    </div>
  );

  // ─── HOME ───
  return (
    <div style={S}>
      <div style={{ padding: "14px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#111", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 9, height: 12, background: "#fff", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>basedrop</span>
        </div>
        {isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 700, background: "#F8F7FF", padding: "4px 8px", borderRadius: 8 }}>{shortAddr(address!)}</div>
          </div>
        ) : <ConnectWallet />}
      </div>

      <div style={{ margin: "16px 14px 0", background: "#111", borderRadius: 24, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", top: -50, right: -30 }} />
        <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)", bottom: -20, left: 10 }} />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 0.8, marginBottom: 4, position: "relative" }}>LIVE DROPS</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1.5, lineHeight: 1, marginBottom: 18, position: "relative" }}>{liveDrops.length}</div>
        <div style={{ display: "flex", gap: 10, position: "relative" }}>
          <button onClick={() => setView("create")} style={{ flex: 1, background: "#6366F1", color: "#fff", border: "none", borderRadius: 14, padding: "12px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Create drop</button>
          <button onClick={() => setView("explore")} style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 14, padding: "12px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Explore</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "14px 14px 0" }}>
        {([[`$${totalDropped.toFixed(0)}`, "Total dropped"], [String(totalClaimed), "Claims"], [String(liveDrops.length), "Live"]] as const).map(([v, l]) => (
          <div key={l} style={{ flex: 1, padding: "12px 10px", background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: -0.3 }}>{v}</div>
            <div style={{ fontSize: 9, color: "#bbb", fontWeight: 500, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 14px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Live drops</div>
          <div onClick={() => setView("explore")} style={{ fontSize: 12, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>See all →</div>
        </div>
        {loadingDrops ? <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: "#bbb" }}>Loading...</div> :
          liveDrops.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 12, color: "#bbb", marginBottom: 8 }}>No live drops right now</div>
              <button onClick={() => setView("create")} style={{ background: "#F8F7FF", color: "#6366F1", border: "1px solid #EBEBFF", borderRadius: 12, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Be the first →</button>
            </div>
          ) : liveDrops.slice(0, 3).map(d => <DropCard key={d.id} d={d} />)}
      </div>

      <BottomNav />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>
    </div>
  );
}
