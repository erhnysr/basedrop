"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { createPublicClient, http, parseUnits } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS, USDC_ABI, ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, DURATIONS, DropInfo, parseDropInfo } from "../lib/contract";
import { View, LeaderboardEntry } from "../lib/types";
import { shortAddr, formatUSDC, timeLeft, EMOJIS } from "../lib/format";
import { resolveInput } from "../lib/resolve";
import { BottomNav } from "./components/BottomNav";
import { DropCard } from "./components/DropCard";
import { MyDropCard } from "./components/MyDropCard";
import { LeaderboardList } from "./components/LeaderboardList";
import { Confetti } from "./components/Confetti";

const rpc = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });

const BUILDER_CODE: `0x${string}` = "0x62635f646e33726c353437";
const TIP_AMOUNTS = [0.5, 1, 2, 5] as const;

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
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);
  const [allDrops, setAllDrops] = useState<DropInfo[]>([]);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [topCreators, setTopCreators] = useState<LeaderboardEntry[]>([]);
  const [topClaimers, setTopClaimers] = useState<LeaderboardEntry[]>([]);
  const [topTippers, setTopTippers] = useState<LeaderboardEntry[]>([]);
  const [, setTick] = useState(0);

  // ─── Referral state ───
  const [referrerAddress, setReferrerAddress] = useState("");
  const [referralPoints, setReferralPoints] = useState(0);
  const [refCopied, setRefCopied] = useState(false);

  // ─── Tip state ───
  const [tipInput, setTipInput] = useState("");
  const [tipRecipient, setTipRecipient] = useState<`0x${string}` | null>(null);
  const [tipRecipientName, setTipRecipientName] = useState("");
  const [tipResolving, setTipResolving] = useState(false);
  const [tipError, setTipError] = useState("");
  const [tipPreset, setTipPreset] = useState<number>(1);
  const [tipCustom, setTipCustom] = useState("");
  const [tipStep, setTipStep] = useState<"idle" | "sending" | "done">("idle");
  const [tipTxHash, setTipTxHash] = useState("");
  const [tipSentAmount, setTipSentAmount] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://basedrop-chi.vercel.app";

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

  // Parse ?claim= and ?ref= from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("claim");
    const ref = p.get("ref");
    if (id) { setClaimDropId(id); setView("claim"); }
    if (ref) { setReferrerAddress(ref); }
  }, []);

  // Fetch referral points for connected wallet
  useEffect(() => {
    if (!address) { setReferralPoints(0); return; }
    fetch(`/api/referrals?address=${address}`)
      .then(r => r.json())
      .then(d => setReferralPoints(Number(d.total_points) || 0))
      .catch(() => {});
  }, [address]);

  const fetchAllDrops = useCallback(async () => {
    try {
      const nextId = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
      const count = Number(nextId);
      const drops: DropInfo[] = [];
      for (let i = count - 1; i >= 0 && i >= count - 20; i--) {
        try {
          const info = await rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(i)] }) as readonly unknown[];
          drops.push(parseDropInfo(i, info));
        } catch {}
      }
      setAllDrops(drops);
    } catch (e) { console.error(e); }
    setLoadingDrops(false);
  }, []);

  useEffect(() => { fetchAllDrops(); }, [fetchAllDrops]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setTopCreators((data.creators || []).map((c: any) => ({ address: c.creator_address, total: Number(c.total_dropped) || 0 })));
      setTopClaimers((data.claimers || []).map((c: any) => ({ address: c.claimer_address, total: Number(c.total_claimed) || 0 })));
      setTopTippers((data.tippers || []).map((t: any) => ({ address: t.tipper_address, total: Number(t.total_tipped) || 0 })));
    } catch {}
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    if (!claimDropId || isNaN(Number(claimDropId))) return;
    const id = parseInt(claimDropId) || 0;
    rpc.readContract({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(id)] }).then(info => setDropInfo(parseDropInfo(id, info as readonly unknown[]))).catch(() => {});
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
        if (nId > prevId) {
          setCreatedDropId(String(Number(prevId))); setStep("done"); fetchAllDrops();
          fetch("/api/drops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creator_address: address,
              amount_per_claim: amt,
              total_claims: claims,
              expires_at: new Date(Date.now() + DURATIONS[dur] * 1000).toISOString(),
              message: msg,
              tx_hash: "onchain",
            }),
          }).catch(() => {});
          return;
        }
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

      // Record claim in Supabase
      fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_id: claimDropId, claimer_address: address, tx_hash: "onchain" }),
      }).catch(() => {});

      // Record referral if link came from a referrer
      if (referrerAddress && address && referrerAddress.toLowerCase() !== address.toLowerCase()) {
        fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referrer_address: referrerAddress,
            referee_address: address,
            drop_id: parseInt(claimDropId) || 0,
          }),
        }).catch(() => {});
      }
    } catch (e) { console.error(e); setClaimStep("idle"); }
  };

  const handleCancel = async (dropId: number) => {
    if (!isConnected) return;
    try {
      setCancellingId(dropId);
      const tx = await writeContractAsync({ address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "cancelDrop", args: [BigInt(dropId)], dataSuffix: BUILDER_CODE });
      await rpc.waitForTransactionReceipt({ hash: tx });
      await fetchAllDrops();
    } catch (e) { console.error(e); }
    setCancellingId(null);
  };

  const handleResolveTip = async () => {
    const q = tipInput.trim();
    if (!q || tipResolving) return;
    setTipResolving(true); setTipError("");
    const addr = await resolveInput(q);
    setTipResolving(false);
    if (!addr) { setTipError("Couldn't find that address or name"); return; }
    setTipRecipient(addr);
    setTipRecipientName(q);
  };

  const changeTipRecipient = () => {
    setTipRecipient(null); setTipRecipientName(""); setTipInput(""); setTipError("");
    setTipStep("idle"); setTipCustom(""); setTipPreset(1); setTipTxHash("");
  };

  const handleSendTip = async () => {
    const amt = tipCustom ? parseFloat(tipCustom) : tipPreset;
    if (!isConnected || !address || !tipRecipient || !amt || amt <= 0 || isNaN(amt)) return;
    try {
      setTipStep("sending");
      const tx = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [tipRecipient, parseUnits(amt.toFixed(6), USDC_DECIMALS)],
        dataSuffix: BUILDER_CODE,
      });
      await rpc.waitForTransactionReceipt({ hash: tx });
      setTipTxHash(tx);
      setTipSentAmount(amt);
      setTipStep("done");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
      fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipper_address: address, recipient_address: tipRecipient, amount: amt, tx_hash: tx }),
      }).then(() => fetchLeaderboard()).catch(() => {});
    } catch (e) { console.error(e); setTipStep("idle"); }
  };

  const shareLink = createdDropId !== null ? `${BASE_URL}?claim=${createdDropId}` : "";
  const handleCopy = () => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const openClaim = (id: number) => { setClaimDropId(String(id)); setClaimStep("idle"); setDropInfo(null); setView("claim"); };

  const liveDrops = allDrops.filter(d => d.active && d.expiresAt > Date.now() / 1000 && d.claimedCount < d.totalClaims);
  const myDrops = address ? allDrops.filter(d => d.creator.toLowerCase() === address.toLowerCase()) : [];
  const totalDropped = allDrops.reduce((s, d) => s + Number(d.amountPerClaim) * d.claimedCount / 10 ** USDC_DECIMALS, 0);
  const totalClaimed = allDrops.reduce((s, d) => s + d.claimedCount, 0);

  const S: React.CSSProperties = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", background: "#FAFAFA", minHeight: "100vh", width: "100%", maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" };

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
  if (view === "claim" && claimStep === "done" && dropInfo) {
    const myRefLink = `${BASE_URL}?claim=${claimDropId}&ref=${address}`;
    const shareRefText = encodeURIComponent(`I just claimed ${formatUSDC(dropInfo.amountPerClaim)} USDC on Basedrop!\n\nClaim yours too 👇`);
    const shareRefUrl = encodeURIComponent(myRefLink);

    return (
      <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -0.8, marginBottom: 4 }}>You claimed it!</div>
        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 24 }}>USDC sent to your wallet</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#111", letterSpacing: -2, marginBottom: 4 }}>+{formatUSDC(dropInfo.amountPerClaim)}</div>
        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 28 }}>USDC · Base Mainnet</div>

        <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 20, padding: 16, width: "100%", marginBottom: 20 }}>
          {([["From", shortAddr(dropInfo.creator)], ["Amount", `${formatUSDC(dropInfo.amountPerClaim)} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]] as const).map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #F5F5F5" }}>
              <span style={{ fontSize: 11, color: "#bbb" }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" || l === "Status" ? "#10B981" : "#111" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* ─── Share & Earn ─── */}
        <div style={{ background: "linear-gradient(135deg, #F8F7FF, #F0FDF4)", border: "1.5px solid #EBEBFF", borderRadius: 20, padding: "18px 16px", width: "100%", marginBottom: 16, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 20 }}>🔗</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Share & Earn</div>
            <div style={{ background: "#10B981", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "2px 6px", letterSpacing: 0.4 }}>+1 PT / REFERRAL</div>
          </div>
          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6, marginBottom: 12 }}>
            Share your referral link. Every friend who claims earns you a point on the leaderboard.
          </div>
          <div style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 10px", fontSize: 10, color: "#555", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 10 }}>
            {myRefLink}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(myRefLink); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000); }}
              style={{ flex: 1, background: refCopied ? "#10B981" : "#111", color: "#fff", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {refCopied ? "✅ Copied!" : "📋 Copy link"}
            </button>
            <button
              onClick={() => window.open(`https://warpcast.com/~/compose?text=${shareRefText}&embeds[]=${shareRefUrl}`, "_blank")}
              style={{ flex: 1, background: "#7C3AED", color: "#fff", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🟣 Warpcast
            </button>
          </div>
        </div>

        <button onClick={() => { setClaimStep("idle"); setView("home"); }} style={{ width: "100%", background: "#F0F0F0", color: "#333", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to drops</button>
      </div>
    );
  }

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
          {!isConnected && <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><ConnectWallet /></div>}
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
          <div style={{ textAlign: "center", fontSize: 10, color: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>Zero platform fees · Powered by Base</span>
            {process.env.NEXT_PUBLIC_X402_ENABLED === "true" && (
              <span style={{ background: "#0052FF", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.4 }}>x402 enabled</span>
            )}
            <span style={{ background: "#7C3AED", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.4 }}>MCP enabled</span>
          </div>
        </div>
        <BottomNav view={view} onNavigate={setView} />
      </div>
    );
  }

  // ─── CLAIM (DETAIL) ───
  if (view === "claim") {
    const di = dropInfo;
    const isExpired = di ? di.expiresAt <= Date.now() / 1000 : false;
    const isLive = di ? di.active && !isExpired && di.claimedCount < di.totalClaims : false;
    return (
      <div style={S}>
        <div style={{ background: "#111", padding: "14px 18px 22px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)", top: -40, left: "50%", transform: "translateX(-50%)" }} />
          <div onClick={() => setView("home")} style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
          {di ? (<>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.1)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1.5px solid rgba(255,255,255,0.2)", position: "relative" }}>{EMOJIS[parseInt(claimDropId) % EMOJIS.length]}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4, position: "relative" }}>{shortAddr(di.creator)}</div>
            {di.message && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 14, fontStyle: "italic", position: "relative" }}>"{di.message}"</div>}
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1.5, position: "relative" }}>{formatUSDC(di.amountPerClaim)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", position: "relative", marginTop: 2 }}>USDC per claim</div>
          </>) : <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, position: "relative" }}>Enter a Drop ID below</div>}
        </div>
        <div style={{ padding: "14px 18px 100px" }}>
          {/* Show referrer attribution */}
          {referrerAddress && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>🔗</span>
              <span style={{ fontSize: 11, color: "#166534" }}>Referred by <strong>{shortAddr(referrerAddress)}</strong></span>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Drop ID</div>
            <input value={claimDropId} onChange={e => { setClaimDropId(e.target.value); setClaimStep("idle"); }} placeholder="e.g. 0" style={{ width: "100%", background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", boxSizing: "border-box" }} />
          </div>
          {di && (<>
            <div style={{ background: isExpired ? "#FEE2E2" : "#FFFBEB", border: `1px solid ${isExpired ? "#FECACA" : "#FDE68A"}`, borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: isExpired ? "#DC2626" : "#92400E", fontWeight: 600 }}>⏰ {isExpired ? "Expired" : "Expires in"}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isExpired ? "#DC2626" : "#F59E0B" }}>{timeLeft(di.expiresAt)}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{di.claimedCount} of {di.totalClaims} claimed</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>{di.totalClaims - di.claimedCount} left</span>
              </div>
              <div style={{ height: 4, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(di.claimedCount / di.totalClaims) * 100}%`, background: "#6366F1" }} />
              </div>
            </div>
          </>)}
          {isLive && (
            <button onClick={handleClaim} disabled={!isConnected || claimStep === "claiming"} style={{ width: "100%", background: claimStep === "claiming" ? "#6366F1" : "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: isConnected && claimStep !== "claiming" ? "pointer" : "not-allowed", opacity: !isConnected ? 0.5 : 1, marginBottom: 10 }}>
              {claimStep === "claiming" ? "Claiming..." : `Claim ${di ? formatUSDC(di.amountPerClaim) : ""} USDC 💧`}
            </button>
          )}
          {!isConnected && <div style={{ textAlign: "center", marginBottom: 10 }}><ConnectWallet /></div>}
        </div>
        <BottomNav view={view} onNavigate={setView} />
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
        <div style={{ display: "flex", gap: 8 }}>
          <LeaderboardList title="Top Creators" icon="🏆" entries={topCreators} />
          <LeaderboardList title="Top Claimers" icon="💎" entries={topClaimers} />
          <LeaderboardList title="Top Tippers" icon="💸" entries={topTippers} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>All drops</div>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>{liveDrops.length} live</div>
        </div>
        {loadingDrops ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: "#bbb" }}>Loading...</div> :
          allDrops.length === 0 ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: "#bbb" }}>No drops yet. Be the first! 🚀</div> :
          allDrops.map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
      </div>
      <BottomNav view={view} onNavigate={setView} />
    </div>
  );

  // ─── PROFILE ───
  if (view === "profile") return (
    <div style={S}>
      <div style={{ padding: "16px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>Your drops</div>
        {isConnected && <div onClick={fetchAllDrops} style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>↻ Refresh</div>}
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 16 }}>Connect wallet to see your drops</div>
            <div style={{ display: "flex", justifyContent: "center" }}><ConnectWallet /></div>
          </div>
        ) : loadingDrops ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: "#bbb" }}>Loading...</div>
        ) : myDrops.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 8 }}>You haven't created any drops yet</div>
            <button onClick={() => setView("create")} style={{ background: "#F8F7FF", color: "#6366F1", border: "1px solid #EBEBFF", borderRadius: 12, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Create your first →</button>
          </div>
        ) : (
          myDrops.map(d => <MyDropCard key={d.id} d={d} onCancel={handleCancel} cancelling={cancellingId === d.id} />)
        )}
      </div>
      <BottomNav view={view} onNavigate={setView} />
    </div>
  );

  // ─── TIP ───
  if (view === "tip") {
    const tipAmt = tipCustom ? parseFloat(tipCustom) : tipPreset;

    // Success screen
    if (tipStep === "done") return (
      <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <Confetti active={confetti} />
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: -0.8, marginBottom: 4 }}>Tip sent!</div>
        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 24 }}>USDC sent directly to their wallet</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#111", letterSpacing: -2, marginBottom: 4 }}>${tipSentAmount.toFixed(2)}</div>
        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 28 }}>USDC · Base Mainnet</div>

        <div style={{ background: "#fff", border: "1px solid #F0F0F0", borderRadius: 20, padding: 16, width: "100%", marginBottom: 20 }}>
          {([["To", tipRecipientName || shortAddr(tipRecipient || "")], ["Amount", `$${tipSentAmount.toFixed(2)} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]] as const).map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #F5F5F5" }}>
              <span style={{ fontSize: 11, color: "#bbb" }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" || l === "Status" ? "#10B981" : "#111" }}>{v}</span>
            </div>
          ))}
        </div>

        {tipTxHash && (
          <a href={`https://basescan.org/tx/${tipTxHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, fontFamily: "monospace", textDecoration: "none", marginBottom: 16 }}>
            {tipTxHash.slice(0, 10)}…{tipTxHash.slice(-8)} ↗
          </a>
        )}

        <button onClick={() => { const t = encodeURIComponent(`I just tipped ${tipRecipientName || shortAddr(tipRecipient || "")} $${tipSentAmount} USDC on Basedrop 💸\n\nSupport builders onchain 👇`); const u = encodeURIComponent(BASE_URL); window.open("https://warpcast.com/~/compose?text=" + t + "&embeds[]=" + u, "_blank"); }} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>🟣 Share on Warpcast</button>
        <button onClick={() => { setTipStep("idle"); setTipCustom(""); setTipPreset(1); setTipTxHash(""); }} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Send another tip</button>
        <button onClick={() => { changeTipRecipient(); setView("home"); }} style={{ width: "100%", background: "#F0F0F0", color: "#333", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to Home</button>
      </div>
    );

    // Form
    return (
      <div style={S}>
        <div style={{ background: "#111", padding: "14px 18px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)", top: -40, right: -20 }} />
          <div onClick={() => setView("home")} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer", position: "relative" }}>← Back</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.8, marginBottom: 3, position: "relative" }}>Send a tip 💸</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", position: "relative" }}>USDC straight to any wallet, ENS or basename</div>
        </div>
        <div style={{ padding: "16px 18px 100px" }}>
          {!tipRecipient ? (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Recipient</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={tipInput} onChange={e => { setTipInput(e.target.value); setTipError(""); }} onKeyDown={e => e.key === "Enter" && handleResolveTip()} placeholder="0x… or name.base.eth" autoComplete="off" autoCapitalize="off" spellCheck={false} style={{ flex: 1, background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#111", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                <button onClick={handleResolveTip} disabled={!tipInput.trim() || tipResolving} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: tipInput.trim() && !tipResolving ? "pointer" : "not-allowed", opacity: !tipInput.trim() ? 0.5 : 1 }}>{tipResolving ? "…" : "→"}</button>
              </div>
              {tipError && <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, marginBottom: 8 }}>{tipError}</div>}
              <div style={{ fontSize: 10, color: "#ccc" }}>Enter an address, ENS (.eth) or basename (.base.eth).</div>
            </>
          ) : (
            <>
              <div style={{ background: "#F8F7FF", border: "1.5px solid #EBEBFF", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Tipping</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{tipRecipientName}</div>
                  <div style={{ fontSize: 10, color: "#bbb", fontFamily: "monospace", marginTop: 1 }}>{shortAddr(tipRecipient)}</div>
                </div>
                <button onClick={changeTipRecipient} disabled={tipStep !== "idle"} style={{ background: "#fff", color: "#6366F1", border: "1px solid #EBEBFF", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: tipStep === "idle" ? "pointer" : "not-allowed" }}>Change</button>
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: "#bbb", letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Amount</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {TIP_AMOUNTS.map(a => {
                  const selected = !tipCustom && tipPreset === a;
                  return (
                    <div key={a} onClick={() => { if (tipStep === "idle") { setTipPreset(a); setTipCustom(""); } }} style={{ flex: 1, border: `1.5px solid ${selected ? "#111" : "#F0F0F0"}`, borderRadius: 10, padding: "10px 4px", fontSize: 13, fontWeight: 700, color: selected ? "#111" : "#bbb", textAlign: "center", cursor: tipStep === "idle" ? "pointer" : "not-allowed", background: "#fff" }}>${a}</div>
                  );
                })}
              </div>
              <input value={tipCustom} onChange={e => setTipCustom(e.target.value)} type="number" min="0.01" step="0.01" disabled={tipStep !== "idle"} placeholder="Custom amount" style={{ width: "100%", background: tipCustom ? "#F8F7FF" : "#fff", border: `1.5px solid ${tipCustom ? "#EBEBFF" : "#F0F0F0"}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

              <button onClick={handleSendTip} disabled={!isConnected || tipStep !== "idle" || !tipAmt || tipAmt <= 0} style={{ width: "100%", background: tipStep === "idle" ? "#111" : "#7C3AED", color: "#fff", border: "none", borderRadius: 16, padding: 14, fontSize: 14, fontWeight: 800, cursor: tipStep === "idle" && isConnected ? "pointer" : "not-allowed", opacity: !isConnected || !tipAmt || tipAmt <= 0 ? 0.5 : 1, marginBottom: 8 }}>
                {tipStep === "sending" ? "Sending tip..." : `Send $${tipAmt || "?"} 💸`}
              </button>
              {!isConnected && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><ConnectWallet /></div>}
              <div style={{ textAlign: "center", fontSize: 10, color: "#ccc" }}>100% goes to {shortAddr(tipRecipient)} · Zero platform fees</div>
            </>
          )}
        </div>
        <BottomNav view={view} onNavigate={setView} />
      </div>
    );
  }

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
            {referralPoints > 0 && (
              <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, background: "#ECFDF5", border: "1px solid #BBF7D0", padding: "4px 8px", borderRadius: 8 }}>
                🔗 {referralPoints} pts
              </div>
            )}
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
          ) : liveDrops.slice(0, 3).map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
      </div>

      <BottomNav view={view} onNavigate={setView} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>
    </div>
  );
}
