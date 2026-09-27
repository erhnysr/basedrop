"use client";
import { useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { USDC_ADDRESS, USDC_ABI, ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, DURATIONS, DropInfo, parseDropInfo } from "../lib/contract";
import { View, LeaderboardEntry } from "../lib/types";
import { shortAddr, formatUSDC, timeLeft } from "../lib/format";
import { resolveInput } from "../lib/resolve";
import { rpc } from "../lib/rpc";
import { haptic } from "../lib/haptics";
import { C, FONT_MONO, FONT_SERIF, RADIUS, TNUM } from "../lib/theme";
import { BottomNav } from "./components/BottomNav";
import { TopBar } from "./components/TopBar";
import { DropCard, ProgressBar, claimedPct } from "./components/DropCard";
import { MyDropCard } from "./components/MyDropCard";
import { LeaderboardList } from "./components/LeaderboardList";
import { Activity } from "./components/Activity";
import { ConnectPill } from "./components/ConnectPill";
import { Avatar, DisplayName } from "./components/Identity";
import { Card, Button, Eyebrow, Money, SectionHead, LinkButton, PageHead, inputStyle } from "./components/ui";
import { TicketSkeleton, EmptyTicket, TxSteps, Receipt, AgentCard, Chip } from "./components/States";
import { IconTrophy, IconGem, IconSend, IconCopy, IconCheck, IconLink, IconArrowUpRight, IconRefresh } from "./components/Icon";

const BUILDER_CODE: `0x${string}` = "0x62635f646e33726c353437";
const TIP_AMOUNTS = [0.5, 1, 2, 5] as const;
const KPI_MIN_USD = 100; // hide platform totals until they mean something

const usd = (units: bigint) => Number(units) / 10 ** USDC_DECIMALS;

// Accepts "12", "#12", or any link containing ?claim=12
function parseDropRef(input: string): string | null {
  const t = input.trim();
  const m = t.match(/[?&]claim=(\d+)/);
  if (m) return m[1];
  const n = t.replace(/^#/, "");
  return /^\d+$/.test(n) ? n : null;
}

function Segmented<T extends string | number>({ options, value, onChange, disabled, label }: { options: readonly T[]; value: T | null; onChange: (v: T) => void; disabled?: boolean; label: (v: T) => ReactNode }) {
  return (
    <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4, padding: 4, background: C.sunken, borderRadius: RADIUS.ctl }}>
      {options.map(o => {
        const on = o === value;
        return (
          <button key={String(o)} role="radio" aria-checked={on} disabled={disabled} onClick={() => { haptic.tap("light"); onChange(o); }} className="bd-press"
            style={{ ...TNUM, height: 40, borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600,
              background: on ? C.surface : "transparent", color: on ? C.text : C.textDim, boxShadow: on ? "0 1px 3px rgba(16,18,40,.12)" : "none" }}>
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "block", marginBottom: 8 }}><Eyebrow>{label}</Eyebrow></label>
      {children}
    </div>
  );
}

export default function HomeClient() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<View>("home");

  const [amountPerClaim, setAmountPerClaim] = useState("1");
  const [totalClaims, setTotalClaims] = useState("10");
  const [duration, setDuration] = useState("24h");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "creating" | "done">("idle");
  const [createdDropId, setCreatedDropId] = useState<string | null>(null);
  const [createTx, setCreateTx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimDropId, setClaimDropId] = useState("");
  const [claimInput, setClaimInput] = useState("");
  const [claimInputError, setClaimInputError] = useState(false);
  const [claimStep, setClaimStep] = useState<"idle" | "signing" | "sending" | "done">("idle");
  const [claimTx, setClaimTx] = useState<string | null>(null);
  const [claimBlock, setClaimBlock] = useState<bigint | null>(null);
  const [claimError, setClaimError] = useState("");
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
  const [tipStep, setTipStep] = useState<"idle" | "signing" | "sending" | "done">("idle");
  const [tipTxHash, setTipTxHash] = useState("");
  const [tipBlock, setTipBlock] = useState<bigint | null>(null);
  const [tipSentAmount, setTipSentAmount] = useState(0);

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
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);

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
      const nextId = await rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
      const count = Number(nextId);
      const ids: number[] = [];
      for (let i = count - 1; i >= 0 && i >= count - 20; i--) ids.push(i);
      const results = await Promise.allSettled(ids.map(i =>
        rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(i)] })
          .then(info => parseDropInfo(i, info as readonly unknown[]))));
      setAllDrops(results.flatMap(r => r.status === "fulfilled" ? [r.value] : []));
    } catch (e) { console.error(e); }
    setLoadingDrops(false);
  }, []);

  useEffect(() => { fetchAllDrops(); }, [fetchAllDrops]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setTopCreators((data.creators || []).map((c: { creator_address: string; total_dropped: number }) => ({ address: c.creator_address, total: Number(c.total_dropped) || 0 })));
      setTopClaimers((data.claimers || []).map((c: { claimer_address: string; total_claimed: number }) => ({ address: c.claimer_address, total: Number(c.total_claimed) || 0 })));
      setTopTippers((data.tippers || []).map((t: { tipper_address: string; total_tipped: number }) => ({ address: t.tipper_address, total: Number(t.total_tipped) || 0 })));
    } catch {}
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  useEffect(() => {
    if (!claimDropId || isNaN(Number(claimDropId))) return;
    const id = parseInt(claimDropId) || 0;
    rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "getDropInfo", args: [BigInt(id)] }).then(info => setDropInfo(parseDropInfo(id, info as readonly unknown[]))).catch(() => {});
  }, [claimDropId, claimStep]);

  const { writeContractAsync } = useWriteContract();

  const handleCreate = async () => {
    if (!isConnected || !address) return;
    try {
      const amt = amountRef.current, claims = claimsRef.current, dur = durationRef.current, msg = messageRef.current;
      const amtUnits = BigInt(Math.round(parseFloat(amt) * 10 ** USDC_DECIMALS));
      const totalAmt = amtUnits * BigInt(claims);
      setStep("approving");
      await writeContractAsync({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "approve", args: [ESCROW_ADDRESS, totalAmt], dataSuffix: BUILDER_CODE });
      for (let i = 0; i < 30; i++) {
        const a = await rpc.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "allowance", args: [address, ESCROW_ADDRESS] });
        if ((a as bigint) >= totalAmt) break;
        await new Promise(r => setTimeout(r, 2000));
      }
      setStep("creating");
      const prevId = await rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
      const tx = await writeContractAsync({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "createDrop", args: [amtUnits, BigInt(claims), BigInt(DURATIONS[dur]), msg], dataSuffix: BUILDER_CODE });
      setCreateTx(tx);
      for (let i = 0; i < 30; i++) {
        const nId = await rpc.readContract({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "nextDropId" }) as bigint;
        if (nId > prevId) {
          setCreatedDropId(String(Number(prevId))); setStep("done"); haptic.notify("success"); fetchAllDrops();
          fetch("/api/drops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creator_address: address,
              amount_per_claim: amt,
              total_claims: claims,
              expires_at: new Date(Date.now() + DURATIONS[dur] * 1000).toISOString(),
              message: msg,
              tx_hash: tx,
              onchain_id: Number(prevId),
            }),
          }).catch(() => {});
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      setStep("done"); setCreatedDropId("0");
    } catch (e) { console.error(e); setStep("idle"); haptic.notify("error"); }
  };

  const handleClaim = async () => {
    if (!claimDropId) return;
    try {
      setClaimError("");
      setClaimStep("signing");
      const tx = await writeContractAsync({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "claim", args: [BigInt(parseInt(claimDropId) || 0)], dataSuffix: BUILDER_CODE });
      setClaimTx(tx);
      setClaimStep("sending");
      const receipt = await rpc.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      setClaimBlock(receipt.blockNumber);
      setClaimStep("done"); haptic.notify("success"); fetchAllDrops();

      // Record claim in Supabase
      fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_id: claimDropId, claimer_address: address, tx_hash: tx }),
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
    } catch (e) {
      console.error(e);
      setClaimStep("idle"); haptic.notify("error");
      const msg = e instanceof Error ? e.message : "";
      setClaimError(/reject|denied/i.test(msg) ? "You cancelled the request in your wallet." : "The claim didn't go through. You may have already claimed this drop, or it just ran out.");
    }
  };

  const handleCancel = async (dropId: number) => {
    if (!isConnected) return;
    try {
      setCancellingId(dropId);
      const tx = await writeContractAsync({ address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "cancelDrop", args: [BigInt(dropId)], dataSuffix: BUILDER_CODE });
      await rpc.waitForTransactionReceipt({ hash: tx });
      haptic.notify("success");
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
    if (!addr) { setTipError("We couldn't find that address or name. Check the spelling, or paste the 0x address."); return; }
    setTipRecipient(addr);
    setTipRecipientName(q);
  };

  const changeTipRecipient = () => {
    setTipRecipient(null); setTipRecipientName(""); setTipInput(""); setTipError("");
    setTipStep("idle"); setTipCustom(""); setTipPreset(1); setTipTxHash(""); setTipBlock(null);
  };

  const handleSendTip = async () => {
    const amt = tipCustom ? parseFloat(tipCustom) : tipPreset;
    if (!isConnected || !address || !tipRecipient || !amt || amt <= 0 || isNaN(amt)) return;
    try {
      setTipStep("signing");
      const tx = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [tipRecipient, parseUnits(amt.toFixed(6), USDC_DECIMALS)],
        dataSuffix: BUILDER_CODE,
      });
      setTipTxHash(tx);
      setTipStep("sending");
      const receipt = await rpc.waitForTransactionReceipt({ hash: tx });
      setTipBlock(receipt.blockNumber);
      setTipSentAmount(amt);
      setTipStep("done"); haptic.notify("success");
      fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipper_address: address, recipient_address: tipRecipient, amount: amt, tx_hash: tx }),
      }).then(() => fetchLeaderboard()).catch(() => {});
    } catch (e) { console.error(e); setTipStep("idle"); haptic.notify("error"); }
  };

  const shareLink = createdDropId !== null ? `${BASE_URL}?claim=${createdDropId}` : "";
  const handleCopy = () => { navigator.clipboard.writeText(shareLink).catch(() => {}); setCopied(true); haptic.tap("light"); setTimeout(() => setCopied(false), 2000); };
  const openClaim = (id: number) => { setClaimDropId(String(id)); setClaimStep("idle"); setClaimTx(null); setClaimBlock(null); setClaimError(""); setDropInfo(null); setView("claim"); };
  const submitClaimInput = () => {
    const id = parseDropRef(claimInput);
    if (id === null) { setClaimInputError(true); return; }
    setClaimInputError(false); setClaimInput(""); openClaim(Number(id));
  };
  const castUrl = (text: string, embed: string) => `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embed)}`;

  const now = Date.now() / 1000;
  const liveDrops = allDrops.filter(d => d.active && d.expiresAt > now && d.claimedCount < d.totalClaims);
  const recentDrops = allDrops.filter(d => !liveDrops.includes(d));
  const myDrops = address ? allDrops.filter(d => d.creator.toLowerCase() === address.toLowerCase()) : [];
  const totalDropped = allDrops.reduce((s, d) => s + usd(d.amountPerClaim) * d.claimedCount, 0);
  const totalClaimed = allDrops.reduce((s, d) => s + d.claimedCount, 0);

  const shell = (children: ReactNode, narrow = true) => (
    <div className="bd-shell">
      <svg className="bd-rings" viewBox="0 0 1100 1100" aria-hidden>
        {[90, 170, 260, 360, 470, 590, 720].map(r => <circle key={r} cx="550" cy="550" r={r} />)}
      </svg>
      <div className="bd-page">
        <TopBar view={view} onNavigate={setView} address={address} referralPoints={referralPoints} />
        {narrow ? <div className="bd-narrow">{children}</div> : children}
      </div>
      <BottomNav view={view} onNavigate={setView} />
    </div>
  );

  const stamp = (text: string) => <div className="bd-stamp">{text}</div>;

  // ─── CREATE ───
  if (view === "create") {
    if (step === "done" && createdDropId !== null) return shell(
      <>
        <Card className="bd-fade bd-torn" style={{ position: "relative", padding: "28px 20px 20px", marginBottom: 16 }}>
          {stamp("LIVE")}
          <Eyebrow>Drop #{createdDropId}</Eyebrow>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em", margin: "8px 0 8px" }}>Your drop is live</h1>
          <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5, marginBottom: 20 }}>The USDC is in escrow on Base. Share the link; every claim is paid out instantly.</p>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textDim, background: C.surfaceHi, border: `1px solid ${C.hairline}`, borderRadius: RADIUS.ctl, padding: "12px 14px", wordBreak: "break-all", marginBottom: 12 }}>{shareLink}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button variant="ghost" onClick={handleCopy}>{copied ? <><IconCheck size={16} /> Copied</> : <><IconCopy size={16} /> Copy link</>}</Button>
            <Button onClick={() => window.open(castUrl("I just created a USDC drop on Basedrop. Claim yours", shareLink), "_blank")}><IconArrowUpRight size={16} /> Share</Button>
          </div>
        </Card>
        <Receipt tx={createTx} />
        <div style={{ height: 12 }} />
        <Button variant="ghost" onClick={() => { setStep("idle"); setCreatedDropId(null); setCreateTx(null); setView("home"); }}>Back to home</Button>
      </>
    );

    const total = (parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0")) || 0;
    const busy = step !== "idle";
    return shell(
      <>
        <PageHead title="Create a drop" sub="USDC that anyone can claim, human or agent. Funds sit in escrow until claimed, and you can cancel for a refund." onBack={() => { setView("home"); setStep("idle"); }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="amt" label="Amount each (USDC)">
            <input id="amt" value={amountPerClaim} onChange={e => setAmountPerClaim(e.target.value)} type="number" inputMode="decimal" min="0.01" step="0.01" disabled={busy} style={{ ...inputStyle, ...TNUM, fontWeight: 600 }} />
          </Field>
          <Field id="claims" label="Recipients">
            <input id="claims" value={totalClaims} onChange={e => setTotalClaims(e.target.value)} type="number" inputMode="numeric" min="1" step="1" disabled={busy} style={{ ...inputStyle, ...TNUM, fontWeight: 600 }} />
          </Field>
        </div>
        <Field id="dur" label="Expires in">
          <Segmented options={Object.keys(DURATIONS)} value={duration} onChange={v => !busy && setDuration(v)} disabled={busy} label={v => v} />
        </Field>
        <Field id="msg" label="Message (optional)">
          <input id="msg" value={message} onChange={e => setMessage(e.target.value)} disabled={busy} maxLength={120} placeholder="Thanks for testing the agent flow" style={inputStyle} />
        </Field>
        <Card style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 4px" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Total to deposit</div>
            <div style={{ ...TNUM, fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 4 }}>{totalClaims || 0} × ${amountPerClaim || 0} USDC</div>
          </div>
          <Money value={total} size={30} />
        </Card>
        <TxSteps steps={["Approve USDC", "Create drop"]} current={step === "approving" ? 1 : step === "creating" ? 2 : 0} />
        <div style={{ marginTop: 16 }}>
          {!isConnected ? <ConnectPill full /> : (
            <Button size="lg" onClick={handleCreate} disabled={busy || total <= 0}>
              {step === "idle" ? `Launch drop · $${total.toFixed(2)}` : step === "approving" ? "Approve USDC in your wallet…" : "Creating drop on Base…"}
            </Button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16, fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, flexWrap: "wrap" }}>
          <span>Zero platform fees · Base</span>
          <span style={{ color: C.accent, background: C.accentDim, borderRadius: 999, padding: "1px 8px" }}>MCP</span>
          {process.env.NEXT_PUBLIC_X402_ENABLED === "true" && <span style={{ color: C.accent, background: C.accentDim, borderRadius: 999, padding: "1px 8px" }}>x402</span>}
        </div>
      </>
    );
  }

  // ─── CLAIM ───
  if (view === "claim") {
    const di = dropInfo;
    const isExpired = di ? di.expiresAt <= now : false;
    const isLive = di ? di.active && !isExpired && di.claimedCount < di.totalClaims : false;
    const done = claimStep === "done";
    const busy = claimStep === "signing" || claimStep === "sending";
    const myRefLink = `${BASE_URL}?claim=${claimDropId}&ref=${address}`;

    return shell(
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setView("home"); setClaimStep("idle"); }} aria-label="Back" className="bd-press" style={{ width: 40, height: 40, borderRadius: RADIUS.ctl, background: C.surface, border: `1px solid ${C.hairline}`, display: "grid", placeItems: "center", cursor: "pointer", color: C.text }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textDim }}>{claimDropId ? `Drop #${claimDropId}` : "Claim a drop"}</span>
        </div>

        {referrerAddress && (
          <Chip><IconLink size={12} color={C.accent} /> Referred by <DisplayName address={referrerAddress} /></Chip>
        )}

        {di ? (
          <Card className={`bd-fade${done ? " bd-torn" : ""}`} style={{ position: "relative" }}>
            {stamp("CLAIMED")}
            <div style={{ padding: "24px 20px 20px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textDim, marginBottom: 16 }}>
                <Avatar address={di.creator} size={24} /><span><b style={{ color: C.text, fontWeight: 500 }}><DisplayName address={di.creator} /></b> sent a drop</span>
              </div>
              {di.message && <p style={{ fontSize: 19, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 20, textWrap: "balance" }}>&ldquo;{di.message}&rdquo;</p>}
              <Money value={usd(di.amountPerClaim)} size={64} style={{ letterSpacing: "-0.06em" }} />
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 8 }}>USDC per claim</div>
            </div>
            <div className="bd-stub">
              <div className="bd-perf" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "16px 20px" }}>
                {([["Claimed", `${di.claimedCount} / ${di.totalClaims}`], [isExpired ? "Status" : "Expires", isExpired ? "Expired" : timeLeft(di.expiresAt)], ["Network", "Base"]] as const).map(([k, v], i) => (
                  <div key={k} style={{ borderLeft: i ? `1px solid ${C.hairline}` : "none", paddingLeft: i ? 12 : 0 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>{k}</div>
                    <div style={{ ...TNUM, fontSize: 15, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 4, color: k === "Status" ? C.danger : C.text }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 20px 20px", display: "flex" }}><ProgressBar pct={claimedPct(di)} height={6} /></div>
            </div>
          </Card>
        ) : claimDropId ? (
          <TicketSkeleton count={1} />
        ) : (
          <Field id="dropid" label="Drop link or ID">
            <input id="dropid" value={claimInput} onChange={e => { setClaimInput(e.target.value); setClaimInputError(false); }} onKeyDown={e => e.key === "Enter" && submitClaimInput()} placeholder="Paste a drop link or #ID" style={inputStyle} />
          </Field>
        )}

        <TxSteps steps={["Sign", "Send", "Confirmed"]} current={claimStep === "signing" ? 1 : claimStep === "sending" ? 2 : done ? 4 : 0} />
        {claimError && <p role="alert" style={{ fontSize: 13, color: C.danger, margin: "12px 0" }}>{claimError}</p>}

        <div style={{ marginTop: 16 }}>
          {!di && !claimDropId ? (
            <Button size="lg" onClick={submitClaimInput} disabled={!claimInput.trim()}>Find drop</Button>
          ) : done ? null : di && !isLive ? (
            <EmptyTicket text={!di.active && di.claimedCount >= di.totalClaims ? "Every claim in this drop has been taken." : isExpired ? "This drop has expired." : "This drop is closed."} cta="Explore live drops" onCta={() => setView("explore")} />
          ) : !isConnected ? (
            <ConnectPill full />
          ) : isLive ? (
            <Button size="lg" onClick={handleClaim} disabled={busy}>
              {claimStep === "signing" ? "Confirm in your wallet…" : claimStep === "sending" ? "Sending on Base…" : `Claim ${di ? formatUSDC(di.amountPerClaim) : ""}`}
            </Button>
          ) : null}
        </div>
        {claimInputError && <p role="alert" style={{ fontSize: 13, color: C.danger, marginTop: 8 }}>Paste a Basedrop link or a drop number like #12.</p>}

        {done && di && (
          <>
            <Receipt block={claimBlock} tx={claimTx} />
            <Card className="bd-fade" style={{ padding: 16, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <IconLink size={15} color={C.accent} /><span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>Share & earn</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.accent, background: C.accentDim, borderRadius: 999, padding: "1px 8px" }}>+1 pt / referral</span>
              </div>
              <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5, marginBottom: 12 }}>Every friend who claims through your link earns you a leaderboard point.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(myRefLink).catch(() => {}); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000); }}>
                  {refCopied ? <><IconCheck size={15} /> Copied</> : <><IconCopy size={15} /> Copy link</>}
                </Button>
                <Button size="sm" onClick={() => window.open(castUrl(`I just claimed ${formatUSDC(di.amountPerClaim)} USDC on Basedrop. Claim yours too`, myRefLink), "_blank")}><IconArrowUpRight size={15} /> Share</Button>
              </div>
            </Card>
            <div style={{ height: 12 }} />
            <Button variant="ghost" onClick={() => { setClaimStep("idle"); setView("home"); }}>Back to drops</Button>
          </>
        )}
      </>
    );
  }

  // ─── EXPLORE ───
  if (view === "explore") return shell(
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <PageHead title="Explore" sub={`${liveDrops.length} live drop${liveDrops.length === 1 ? "" : "s"} on Base`} />
        <div style={{ marginBottom: 24 }}><LinkButton onClick={() => { setLoadingDrops(true); fetchAllDrops(); fetchLeaderboard(); }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconRefresh size={14} /> Refresh</span></LinkButton></div>
      </div>
      {(topCreators.length + topClaimers.length + topTippers.length) > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", columnGap: 16, marginBottom: 16 }}>
          {topCreators.length > 0 && <LeaderboardList title="Top creators" Icon={IconTrophy} entries={topCreators} />}
          {topClaimers.length > 0 && <LeaderboardList title="Top claimers" Icon={IconGem} entries={topClaimers} />}
          {topTippers.length > 0 && <LeaderboardList title="Top tippers" Icon={IconSend} entries={topTippers} />}
        </div>
      )}
      <SectionHead title="All drops" />
      {loadingDrops ? <TicketSkeleton count={3} /> :
        allDrops.length === 0 ? <EmptyTicket text="No drops yet. The first one shows up here for everyone on Base." cta="Create the first drop" onCta={() => setView("create")} /> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", columnGap: 16 }}>{allDrops.map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}</div>}
    </>, false
  );

  // ─── PROFILE ───
  if (view === "profile") return shell(
    <>
      <PageHead title="Your drops" sub={isConnected ? "Drops you've created, with live status and refunds." : undefined} />
      {!isConnected ? (
        <Card style={{ padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: C.textDim, marginBottom: 16 }}>Connect your wallet to see and manage your drops.</p>
          <ConnectPill full />
        </Card>
      ) : loadingDrops ? <TicketSkeleton count={2} />
        : myDrops.length === 0 ? <EmptyTicket text="You haven't created a drop yet." cta="Create your first drop" onCta={() => setView("create")} />
        : myDrops.map(d => <MyDropCard key={d.id} d={d} onCancel={handleCancel} cancelling={cancellingId === d.id} />)}
    </>
  );

  // ─── TIP ───
  if (view === "tip") {
    const tipAmt = tipCustom ? parseFloat(tipCustom) : tipPreset;
    const busy = tipStep === "signing" || tipStep === "sending";

    if (tipStep === "done") return shell(
      <>
        <Card className="bd-fade bd-torn" style={{ position: "relative", padding: "28px 20px 24px", textAlign: "center" }}>
          {stamp("SENT")}
          {tipRecipient && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textDim, marginBottom: 16 }}><Avatar address={tipRecipient} size={24} /> To <b style={{ color: C.text, fontWeight: 500 }}>{tipRecipientName || <DisplayName address={tipRecipient} />}</b></div>}
          <div><Money value={tipSentAmount} size={64} style={{ letterSpacing: "-0.06em" }} /></div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 8 }}>USDC · straight to their wallet</div>
        </Card>
        <Receipt block={tipBlock} tx={tipTxHash} />
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <Button onClick={() => window.open(castUrl(`I just tipped ${tipRecipientName || shortAddr(tipRecipient || "")} $${tipSentAmount} USDC on Basedrop`, BASE_URL), "_blank")}><IconArrowUpRight size={16} /> Share</Button>
          <Button variant="ghost" onClick={() => { setTipStep("idle"); setTipCustom(""); setTipPreset(1); setTipTxHash(""); setTipBlock(null); }}>Send another tip</Button>
        </div>
      </>
    );

    return shell(
      <>
        <PageHead title="Send a tip" sub="USDC straight to any wallet, ENS name or Basename. No platform fee." onBack={() => setView("home")} />
        {!tipRecipient ? (
          <>
            <Field id="recipient" label="Recipient">
              <div style={{ display: "flex", gap: 8 }}>
                <input id="recipient" value={tipInput} onChange={e => { setTipInput(e.target.value); setTipError(""); }} onKeyDown={e => e.key === "Enter" && handleResolveTip()} placeholder="name.base.eth or 0x…" autoComplete="off" autoCapitalize="off" spellCheck={false} style={{ ...inputStyle, flex: 1 }} />
                <Button full={false} onClick={handleResolveTip} disabled={!tipInput.trim() || tipResolving} style={{ height: 52 }}>{tipResolving ? "…" : "Next"}</Button>
              </div>
            </Field>
            {tipError && <p role="alert" style={{ fontSize: 13, color: C.danger, marginBottom: 8 }}>{tipError}</p>}
          </>
        ) : (
          <>
            <Card style={{ padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar address={tipRecipient} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tipRecipientName}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 2 }}>{shortAddr(tipRecipient)}</div>
              </div>
              <Button variant="soft" size="sm" full={false} onClick={changeTipRecipient} disabled={busy}>Change</Button>
            </Card>
            <Field id="tipamt" label="Amount">
              <Segmented options={TIP_AMOUNTS} value={tipCustom ? null : tipPreset} onChange={a => { if (!busy) { setTipPreset(a); setTipCustom(""); } }} disabled={busy} label={a => `$${a}`} />
            </Field>
            <input aria-label="Custom amount" value={tipCustom} onChange={e => setTipCustom(e.target.value)} type="number" inputMode="decimal" min="0.01" step="0.01" disabled={busy} placeholder="Custom amount" style={{ ...inputStyle, ...TNUM, borderColor: tipCustom ? "var(--bd-blue)" : undefined }} />
            <TxSteps steps={["Sign", "Send", "Confirmed"]} current={tipStep === "signing" ? 1 : tipStep === "sending" ? 2 : 0} />
            <div style={{ marginTop: 16 }}>
              {!isConnected ? <ConnectPill full /> : (
                <Button size="lg" onClick={handleSendTip} disabled={busy || !tipAmt || tipAmt <= 0}>
                  {tipStep === "signing" ? "Confirm in your wallet…" : tipStep === "sending" ? "Sending on Base…" : `Send $${tipAmt || "?"}`}
                </Button>
              )}
            </div>
            <p style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 12 }}>100% goes to {shortAddr(tipRecipient)} · zero platform fees</p>
          </>
        )}
      </>
    );
  }

  // ─── HOME ───
  const showKpi = totalDropped >= KPI_MIN_USD;
  return shell(
    <div className="bd-home">
      <div>
        <Chip><span className="bd-dot" />Live on Base</Chip>
        <h1 className="bd-hero-title" style={{ fontSize: 34, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-0.045em", marginBottom: 20, textWrap: "balance" }}>
          USDC rewards, sent by anyone&nbsp;— <em style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontWeight: 400, color: C.accent, letterSpacing: "-0.015em", fontSize: "1.1em" }}>human or agent.</em>
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 52, padding: "0 6px 0 16px", background: C.surface, border: `1px solid ${claimInputError ? "var(--bd-danger)" : C.hairlineStrong}`, borderRadius: RADIUS.ctl, boxShadow: C.shadowCard, marginBottom: 8, maxWidth: 560 }}>
          <input aria-label="Drop link or ID" value={claimInput} onChange={e => { setClaimInput(e.target.value); setClaimInputError(false); }} onKeyDown={e => e.key === "Enter" && submitClaimInput()} placeholder="Paste a drop link or #ID" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 15 }} />
          <button onClick={submitClaimInput} className="bd-press" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: C.accentDim, color: C.accent, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Claim</button>
        </div>
        {claimInputError && <p role="alert" style={{ fontSize: 13, color: C.danger, marginBottom: 8 }}>Paste a Basedrop link or a drop number like #12.</p>}
        <div style={{ display: "flex", gap: 8, maxWidth: 560, marginTop: 12 }}>
          <Button onClick={() => setView("create")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Create a drop
          </Button>
          <Button variant="ghost" onClick={() => setView("explore")} style={{ maxWidth: 160 }}>Explore</Button>
        </div>

        {showKpi && (
          <div style={{ display: "flex", gap: 32, marginTop: 28 }}>
            <div><Money value={totalDropped} size={28} /><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 4 }}>distributed</div></div>
            <div><span style={{ ...TNUM, fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em" }}>{totalClaimed.toLocaleString("en-US")}</span><div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 4 }}>claims</div></div>
          </div>
        )}

        <div style={{ maxWidth: 560 }}><AgentCard liveCount={loadingDrops ? null : liveDrops.length} /></div>
      </div>

      <div>
        <Activity />
        <SectionHead title="Live drops" right={liveDrops.length > 3 ? <LinkButton onClick={() => setView("explore")}>See all</LinkButton> : undefined} />
        {loadingDrops ? <TicketSkeleton count={2} /> :
          liveDrops.length === 0
            ? <EmptyTicket text="No live drops right now. The next one shows up here for everyone on Base." cta="Create a drop" onCta={() => setView("create")} />
            : liveDrops.slice(0, 3).map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
        {!loadingDrops && liveDrops.length < 3 && recentDrops.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <SectionHead title="Recent drops" right={<LinkButton onClick={() => setView("explore")}>See all</LinkButton>} />
            <div style={{ opacity: 0.72 }}>
              {recentDrops.slice(0, 3).map(d => <DropCard key={d.id} d={d} onOpen={openClaim} />)}
            </div>
          </div>
        )}
      </div>
    </div>, false
  );
}
