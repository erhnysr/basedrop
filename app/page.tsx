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
import { C, FONT_DISPLAY, FONT_BODY, TNUM } from "../lib/theme";
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
      setConfetti(true); setTimeout(() => setConfetti(false), 4000);

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

  const S: React.CSSProperties = { fontFamily: FONT_BODY, background: C.bg, color: C.text, minHeight: "100vh", width: "100%", maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" };

  // ─── SUCCESS (CREATE) ───
  if (view === "create" && step === "done" && createdDropId !== null) return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.8, marginBottom: 4, fontFamily: FONT_DISPLAY }}>Drop #{createdDropId} launched!</div>
      <div style={{ fontSize: 12, color: C.textDim, marginBottom: 24 }}>USDC deposited to escrow. Share to start getting claims.</div>
      <div style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: "10px 14px", width: "100%", marginBottom: 16, fontSize: 11, color: C.textDim, wordBreak: "break-all", fontFamily: "var(--font-source-code-pro), monospace" }}>{shareLink}</div>
      <button onClick={handleCopy} style={{ width: "100%", background: copied ? C.accent : C.surface, color: copied ? C.accentInk : C.text, border: `1px solid ${copied ? C.accent : C.hairlineStrong}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>{copied ? "✅ Copied!" : "📋 Copy Link"}</button>
      <button onClick={() => { const t = encodeURIComponent("I just created a USDC drop on Basedrop! Claim yours"); const u = encodeURIComponent(shareLink); window.open("https://warpcast.com/~/compose?text=" + t + "&embeds[]=" + u, "_blank"); }} style={{ width: "100%", background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>🟣 Share on Warpcast</button>
      <button onClick={() => { setStep("idle"); setCreatedDropId(null); setView("home"); }} style={{ width: "100%", background: "transparent", color: C.textDim, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to Home</button>
    </div>
  );

  // ─── SUCCESS (CLAIM) ───
  if (view === "claim" && claimStep === "done" && dropInfo) {
    const myRefLink = `${BASE_URL}?claim=${claimDropId}&ref=${address}`;
    const shareRefText = encodeURIComponent(`I just claimed ${formatUSDC(dropInfo.amountPerClaim)} USDC on Basedrop!\n\nClaim yours too 👇`);
    const shareRefUrl = encodeURIComponent(myRefLink);

    return (
      <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <Confetti active={confetti} />
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.8, marginBottom: 4, fontFamily: FONT_DISPLAY }}>You claimed it!</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 24 }}>USDC sent to your wallet</div>
        <div style={{ ...TNUM, fontSize: 60, fontWeight: 700, color: C.accent, letterSpacing: -2, marginBottom: 4, fontFamily: FONT_DISPLAY }}>+{formatUSDC(dropInfo.amountPerClaim)}</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 28 }}>USDC · Base Mainnet</div>

        <div style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 16, padding: 16, width: "100%", marginBottom: 20 }}>
          {([["From", shortAddr(dropInfo.creator)], ["Amount", `${formatUSDC(dropInfo.amountPerClaim)} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]] as const).map(([l, v], i, arr) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.hairline}` : "none" }}>
              <span style={{ fontSize: 11, color: C.textDim }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" || l === "Status" ? C.accent : C.text }}>{v}</span>
            </div>
          ))}
        </div>

        {/* ─── Share & Earn ─── */}
        <div style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 16, padding: "18px 16px", width: "100%", marginBottom: 16, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 20 }}>🔗</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT_DISPLAY }}>Share & Earn</div>
            <div style={{ background: C.accentDim, color: C.accent, fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "2px 6px", letterSpacing: 0.4 }}>+1 PT / REFERRAL</div>
          </div>
          <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6, marginBottom: 12 }}>
            Share your referral link. Every friend who claims earns you a point on the leaderboard.
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.hairline}`, borderRadius: 10, padding: "8px 10px", fontSize: 10, color: C.textDim, fontFamily: "var(--font-source-code-pro), monospace", wordBreak: "break-all", marginBottom: 10 }}>
            {myRefLink}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(myRefLink); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000); }}
              style={{ flex: 1, background: refCopied ? C.accent : C.surfaceHi, color: refCopied ? C.accentInk : C.text, border: `1px solid ${refCopied ? C.accent : C.hairlineStrong}`, borderRadius: 12, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {refCopied ? "✅ Copied!" : "📋 Copy link"}
            </button>
            <button
              onClick={() => window.open(`https://warpcast.com/~/compose?text=${shareRefText}&embeds[]=${shareRefUrl}`, "_blank")}
              style={{ flex: 1, background: C.accent, color: C.accentInk, border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🟣 Warpcast
            </button>
          </div>
        </div>

        <button onClick={() => { setClaimStep("idle"); setView("home"); }} style={{ width: "100%", background: "transparent", color: C.textDim, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to drops</button>
      </div>
    );
  }

  // ─── CREATE ───
  if (view === "create") {
    const total = (parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0"));
    return (
      <div style={S}>
        <div style={{ padding: "14px 18px 18px", borderBottom: `1px solid ${C.hairline}` }}>
          <div onClick={() => { setView("home"); setStep("idle"); }} style={{ color: C.textDim, fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>← Back</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.8, marginBottom: 3, fontFamily: FONT_DISPLAY }}>Create a drop 💧</div>
          <div style={{ fontSize: 11, color: C.textDim }}>Rewards any human or agent can claim</div>
        </div>
        <div style={{ padding: "16px 18px 100px" }}>
          {!isConnected && <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><ConnectWallet /></div>}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {([["Amount each ($)", amountPerClaim, setAmountPerClaim, "0.01"], ["Recipients", totalClaims, setTotalClaims, "1"]] as const).map(([l, v, fn, min]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>{l}</div>
                <input value={v} onChange={e => (fn as any)(e.target.value)} type="number" min={min} step={l === "Amount each ($)" ? "0.01" : "1"} disabled={step !== "idle"} style={{ ...TNUM, width: "100%", background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: C.text, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Expires in</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.keys(DURATIONS).map(t => (
                <div key={t} onClick={() => step === "idle" && setDuration(t)} style={{ flex: 1, border: `1px solid ${t === duration ? C.accent : C.hairline}`, borderRadius: 10, padding: "9px 4px", fontSize: 11, fontWeight: 700, color: t === duration ? C.accent : C.textDim, textAlign: "center", cursor: "pointer", background: t === duration ? C.accentDim : C.surface }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Message</div>
            <input value={message} onChange={e => setMessage(e.target.value)} disabled={step !== "idle"} placeholder="Thanks for the support! 🙏" style={{ width: "100%", background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.text, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ padding: "14px 2px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.hairline}`, borderBottom: `1px solid ${C.hairline}` }}>
            <div><div style={{ fontSize: 11, color: C.textDim }}>Total to deposit</div><div style={{ ...TNUM, fontSize: 9, color: C.textFaint, marginTop: 2 }}>{totalClaims} × ${amountPerClaim} USDC</div></div>
            <div style={{ ...TNUM, fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.8, fontFamily: FONT_DISPLAY }}>${total.toFixed(2)}</div>
          </div>
          <button onClick={handleCreate} disabled={!isConnected || step !== "idle" || total <= 0} style={{ width: "100%", background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: step === "idle" && isConnected ? "pointer" : "not-allowed", opacity: !isConnected || total <= 0 || step !== "idle" ? 0.6 : 1, marginBottom: 10 }}>
            {step === "idle" && "Launch drop 🚀"}{step === "approving" && "Approving USDC..."}{step === "creating" && "Creating drop..."}
          </button>
          <div style={{ textAlign: "center", fontSize: 10, color: C.textDim, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>Zero platform fees · Powered by Base</span>
            {process.env.NEXT_PUBLIC_X402_ENABLED === "true" && (
              <span style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.hairline}`, fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.4 }}>x402 enabled</span>
            )}
            <span style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.hairline}`, fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.4 }}>MCP enabled</span>
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
        <div style={{ padding: "14px 18px 22px", textAlign: "center", borderBottom: `1px solid ${C.hairline}` }}>
          <div onClick={() => setView("home")} style={{ textAlign: "left", color: C.textDim, fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>← Back</div>
          {di ? (<>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.surfaceHi, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: `1px solid ${C.hairline}` }}>{EMOJIS[parseInt(claimDropId) % EMOJIS.length]}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: "var(--font-source-code-pro), monospace" }}>{shortAddr(di.creator)}</div>
            {di.message && <div style={{ fontSize: 10, color: C.textDim, marginBottom: 14, fontStyle: "italic" }}>"{di.message}"</div>}
            <div style={{ ...TNUM, fontSize: 44, fontWeight: 700, color: C.accent, letterSpacing: -1.5, fontFamily: FONT_DISPLAY }}>{formatUSDC(di.amountPerClaim)}</div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>USDC per claim</div>
          </>) : <div style={{ color: C.textDim, fontSize: 12 }}>Enter a Drop ID below</div>}
        </div>
        <div style={{ padding: "14px 18px 100px" }}>
          {/* Show referrer attribution */}
          {referrerAddress && (
            <div style={{ background: C.accentDim, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>🔗</span>
              <span style={{ fontSize: 11, color: C.accent }}>Referred by <strong>{shortAddr(referrerAddress)}</strong></span>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Drop ID</div>
            <input value={claimDropId} onChange={e => { setClaimDropId(e.target.value); setClaimStep("idle"); }} placeholder="e.g. 0" style={{ ...TNUM, width: "100%", background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: C.text, outline: "none", boxSizing: "border-box" }} />
          </div>
          {di && (<>
            <div style={{ background: isExpired ? C.dangerDim : C.surface, border: `1px solid ${isExpired ? "rgba(255,84,112,0.4)" : C.hairline}`, borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: isExpired ? C.danger : C.textDim, fontWeight: 600 }}>⏰ {isExpired ? "Expired" : "Expires in"}</div>
              <div style={{ ...TNUM, fontSize: 18, fontWeight: 700, color: isExpired ? C.danger : C.text, fontFamily: FONT_DISPLAY }}>{timeLeft(di.expiresAt)}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ ...TNUM, fontSize: 12, fontWeight: 700, color: C.text }}>{di.claimedCount} of {di.totalClaims} claimed</span>
                <span style={{ ...TNUM, fontSize: 12, color: C.textDim }}>{di.totalClaims - di.claimedCount} left</span>
              </div>
              <div style={{ height: 4, background: C.hairline, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(di.claimedCount / di.totalClaims) * 100}%`, background: C.accent }} />
              </div>
            </div>
          </>)}
          {isLive && (
            <button onClick={handleClaim} disabled={!isConnected || claimStep === "claiming"} style={{ width: "100%", background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: isConnected && claimStep !== "claiming" ? "pointer" : "not-allowed", opacity: !isConnected || claimStep === "claiming" ? 0.6 : 1, marginBottom: 10 }}>
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
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, fontFamily: FONT_DISPLAY }}>Explore</div>
        <div onClick={fetchAllDrops} style={{ fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>↻ Refresh</div>
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <LeaderboardList title="Top Creators" icon="🏆" entries={topCreators} />
          <LeaderboardList title="Top Claimers" icon="💎" entries={topClaimers} />
          <LeaderboardList title="Top Tippers" icon="💸" entries={topTippers} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1, textTransform: "uppercase" }}>All drops</div>
          <div style={{ ...TNUM, fontSize: 11, color: C.accent, fontWeight: 600 }}>{liveDrops.length} live</div>
        </div>
        {loadingDrops ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: C.textDim }}>Loading...</div> :
          allDrops.length === 0 ? <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: C.textDim }}>No drops yet. Be the first! 🚀</div> :
          allDrops.map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
      </div>
      <BottomNav view={view} onNavigate={setView} />
    </div>
  );

  // ─── PROFILE ───
  if (view === "profile") return (
    <div style={S}>
      <div style={{ padding: "16px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, fontFamily: FONT_DISPLAY }}>Your drops</div>
        {isConnected && <div onClick={fetchAllDrops} style={{ fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>↻ Refresh</div>}
      </div>
      <div style={{ padding: "14px 18px 100px" }}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, marginBottom: 16 }}>Connect wallet to see your drops</div>
            <div style={{ display: "flex", justifyContent: "center" }}><ConnectWallet /></div>
          </div>
        ) : loadingDrops ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 12, color: C.textDim }}>Loading...</div>
        ) : myDrops.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>You haven't created any drops yet</div>
            <button onClick={() => setView("create")} style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Create your first →</button>
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
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.8, marginBottom: 4, fontFamily: FONT_DISPLAY }}>Tip sent!</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 24 }}>USDC sent directly to their wallet</div>
        <div style={{ ...TNUM, fontSize: 60, fontWeight: 700, color: C.accent, letterSpacing: -2, marginBottom: 4, fontFamily: FONT_DISPLAY }}>${tipSentAmount.toFixed(2)}</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 28 }}>USDC · Base Mainnet</div>

        <div style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 16, padding: 16, width: "100%", marginBottom: 20 }}>
          {([["To", tipRecipientName || shortAddr(tipRecipient || "")], ["Amount", `$${tipSentAmount.toFixed(2)} USDC`], ["Network", "Base"], ["Fee", "$0.00 🎉"], ["Status", "✓ Confirmed"]] as const).map(([l, v], i, arr) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.hairline}` : "none" }}>
              <span style={{ fontSize: 11, color: C.textDim }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: l === "Fee" || l === "Status" ? C.accent : C.text }}>{v}</span>
            </div>
          ))}
        </div>

        {tipTxHash && (
          <a href={`https://basescan.org/tx/${tipTxHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, fontWeight: 600, fontFamily: "var(--font-source-code-pro), monospace", textDecoration: "none", marginBottom: 16 }}>
            {tipTxHash.slice(0, 10)}…{tipTxHash.slice(-8)} ↗
          </a>
        )}

        <button onClick={() => { const t = encodeURIComponent(`I just tipped ${tipRecipientName || shortAddr(tipRecipient || "")} $${tipSentAmount} USDC on Basedrop 💸\n\nSupport builders onchain 👇`); const u = encodeURIComponent(BASE_URL); window.open("https://warpcast.com/~/compose?text=" + t + "&embeds[]=" + u, "_blank"); }} style={{ width: "100%", background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>🟣 Share on Warpcast</button>
        <button onClick={() => { setTipStep("idle"); setTipCustom(""); setTipPreset(1); setTipTxHash(""); }} style={{ width: "100%", background: C.surface, color: C.text, border: `1px solid ${C.hairlineStrong}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Send another tip</button>
        <button onClick={() => { changeTipRecipient(); setView("home"); }} style={{ width: "100%", background: "transparent", color: C.textDim, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back to Home</button>
      </div>
    );

    // Form
    return (
      <div style={S}>
        <div style={{ padding: "14px 18px 18px", borderBottom: `1px solid ${C.hairline}` }}>
          <div onClick={() => setView("home")} style={{ color: C.textDim, fontSize: 11, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>← Back</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.8, marginBottom: 3, fontFamily: FONT_DISPLAY }}>Send a tip 💸</div>
          <div style={{ fontSize: 11, color: C.textDim }}>USDC straight to any wallet, ENS or basename</div>
        </div>
        <div style={{ padding: "16px 18px 100px" }}>
          {!tipRecipient ? (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Recipient</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={tipInput} onChange={e => { setTipInput(e.target.value); setTipError(""); }} onKeyDown={e => e.key === "Enter" && handleResolveTip()} placeholder="0x… or name.base.eth" autoComplete="off" autoCapitalize="off" spellCheck={false} style={{ flex: 1, background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-source-code-pro), monospace" }} />
                <button onClick={handleResolveTip} disabled={!tipInput.trim() || tipResolving} style={{ background: C.accent, color: C.accentInk, border: "none", borderRadius: 12, padding: "0 16px", fontSize: 15, fontWeight: 700, cursor: tipInput.trim() && !tipResolving ? "pointer" : "not-allowed", opacity: !tipInput.trim() ? 0.5 : 1 }}>{tipResolving ? "…" : "→"}</button>
              </div>
              {tipError && <div style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginBottom: 8 }}>{tipError}</div>}
              <div style={{ fontSize: 10, color: C.textFaint }}>Enter an address, ENS (.eth) or basename (.base.eth).</div>
            </>
          ) : (
            <>
              <div style={{ background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Tipping</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{tipRecipientName}</div>
                  <div style={{ fontSize: 10, color: C.textDim, fontFamily: "var(--font-source-code-pro), monospace", marginTop: 1 }}>{shortAddr(tipRecipient)}</div>
                </div>
                <button onClick={changeTipRecipient} disabled={tipStep !== "idle"} style={{ background: C.surfaceHi, color: C.accent, border: `1px solid ${C.hairline}`, borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: tipStep === "idle" ? "pointer" : "not-allowed" }}>Change</button>
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Amount</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {TIP_AMOUNTS.map(a => {
                  const selected = !tipCustom && tipPreset === a;
                  return (
                    <div key={a} onClick={() => { if (tipStep === "idle") { setTipPreset(a); setTipCustom(""); } }} style={{ ...TNUM, flex: 1, border: `1px solid ${selected ? C.accent : C.hairline}`, borderRadius: 10, padding: "11px 4px", fontSize: 13, fontWeight: 700, color: selected ? C.accent : C.textDim, textAlign: "center", cursor: tipStep === "idle" ? "pointer" : "not-allowed", background: selected ? C.accentDim : C.surface }}>${a}</div>
                  );
                })}
              </div>
              <input value={tipCustom} onChange={e => setTipCustom(e.target.value)} type="number" min="0.01" step="0.01" disabled={tipStep !== "idle"} placeholder="Custom amount" style={{ ...TNUM, width: "100%", background: C.surface, border: `1px solid ${tipCustom ? C.accent : C.hairline}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: C.text, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

              <button onClick={handleSendTip} disabled={!isConnected || tipStep !== "idle" || !tipAmt || tipAmt <= 0} style={{ width: "100%", background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: tipStep === "idle" && isConnected ? "pointer" : "not-allowed", opacity: !isConnected || !tipAmt || tipAmt <= 0 || tipStep !== "idle" ? 0.6 : 1, marginBottom: 8 }}>
                {tipStep === "sending" ? "Sending tip..." : `Send $${tipAmt || "?"} 💸`}
              </button>
              {!isConnected && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><ConnectWallet /></div>}
              <div style={{ textAlign: "center", fontSize: 10, color: C.textFaint }}>100% goes to {shortAddr(tipRecipient)} · Zero platform fees</div>
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
      {/* Top bar */}
      <div style={{ padding: "14px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 11, background: C.accentInk, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: -0.5, fontFamily: FONT_DISPLAY }}>basedrop</span>
        </div>
        {isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {referralPoints > 0 && (
              <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, background: C.accentDim, border: `1px solid ${C.hairline}`, padding: "4px 8px", borderRadius: 8 }}>
                🔗 {referralPoints} pts
              </div>
            )}
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, background: C.surface, border: `1px solid ${C.hairline}`, padding: "4px 8px", borderRadius: 8, fontFamily: "var(--font-source-code-pro), monospace" }}>{shortAddr(address!)}</div>
          </div>
        ) : <ConnectWallet />}
      </div>

      {/* Hero */}
      <div style={{ padding: "22px 18px 4px" }}>
        <div onClick={() => window.open("/api/mcp", "_blank")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.accent}`, color: C.accent, background: C.accentDim, borderRadius: 999, padding: "5px 11px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, cursor: "pointer", marginBottom: 18 }}>
          🤖 Agent-callable · MCP
        </div>
        <div style={{ fontSize: 29, fontWeight: 700, color: C.text, letterSpacing: -1, lineHeight: 1.12, fontFamily: FONT_DISPLAY }}>
          USDC rewards, distributed by anyone — <span style={{ color: C.accent }}>human or agent.</span>
        </div>

        {/* Hero number */}
        <div style={{ marginTop: 26, paddingBottom: 16, borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ ...TNUM, fontSize: 52, fontWeight: 700, color: C.text, letterSpacing: -2, lineHeight: 1, fontFamily: FONT_DISPLAY }}>
            <span style={{ color: C.accent }}>$</span>{totalDropped.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: 1, marginTop: 8, textTransform: "uppercase" }}>Total USDC distributed</div>
        </div>

        {/* Stat row — hairline-separated, no cards */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0 4px" }}>
          {([[String(totalClaimed), "claims"], [String(liveDrops.length), "live"], ["∞", "agents"]] as const).map(([v, l], i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {i > 0 && <div style={{ width: 1, height: 22, background: C.hairline }} />}
              <div>
                <span style={{ ...TNUM, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT_DISPLAY }}>{v}</span>
                <span style={{ fontSize: 11, color: C.textDim, marginLeft: 5 }}>{l}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => setView("create")} style={{ flex: 1, background: C.accent, color: C.accentInk, border: "none", borderRadius: 14, padding: "13px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create a drop</button>
          <button onClick={() => setView("explore")} style={{ flex: 1, background: "transparent", color: C.text, border: `1px solid ${C.hairlineStrong}`, borderRadius: 14, padding: "13px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Explore</button>
        </div>
      </div>

      {/* Live drops */}
      <div style={{ padding: "22px 18px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1, textTransform: "uppercase" }}>Live drops</div>
          <div onClick={() => setView("explore")} style={{ fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer" }}>See all →</div>
        </div>
        {loadingDrops ? <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: C.textDim }}>Loading...</div> :
          liveDrops.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, border: `1px solid ${C.hairline}`, borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10 }}>No live drops right now</div>
              <button onClick={() => setView("create")} style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 12, padding: "8px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Be the first →</button>
            </div>
          ) : liveDrops.slice(0, 3).map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
      </div>

      <BottomNav view={view} onNavigate={setView} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>
    </div>
  );
}
