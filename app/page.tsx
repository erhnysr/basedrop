"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS, USDC_ABI, ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, DURATIONS } from "../lib/contract";

const rpc = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });

type View = "home" | "create" | "claim";

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

function shortAddr(a: string) {
  return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
}
function timeLeft(expiresAt: number) {
  const diff = expiresAt - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
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

  const amountRef = useRef(amountPerClaim);
  const claimsRef = useRef(totalClaims);
  const durationRef = useRef(duration);
  const messageRef = useRef(message);
  useEffect(() => { amountRef.current = amountPerClaim; }, [amountPerClaim]);
  useEffect(() => { claimsRef.current = totalClaims; }, [totalClaims]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { messageRef.current = message; }, [message]);

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("claim");
    if (id) { setClaimDropId(id); setView("claim"); }
  }, []);

  const fetchAllDrops = useCallback(async () => {
    try {
      const nextId = await rpc.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "nextDropId",
      }) as bigint;
      const count = Number(nextId);
      const drops: DropInfo[] = [];
      for (let i = count - 1; i >= 0 && i >= count - 20; i--) {
        try {
          const info = await rpc.readContract({
            address: ESCROW_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: "getDropInfo",
            args: [BigInt(i)],
          }) as any;
          drops.push({
            id: i,
            creator: info[0],
            amountPerClaim: info[1],
            totalClaims: Number(info[2]),
            claimedCount: Number(info[3]),
            expiresAt: Number(info[4]),
            message: info[5],
            active: info[6],
          });
        } catch {}
      }
      setAllDrops(drops);
    } catch (e) {
      console.error(e);
    }
    setLoadingDrops(false);
  }, []);

  useEffect(() => { fetchAllDrops(); }, [fetchAllDrops]);

  useEffect(() => {
    if (!claimDropId || isNaN(Number(claimDropId))) return;
    rpc.readContract({
      address: ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "getDropInfo",
      args: [BigInt(parseInt(claimDropId) || 0)],
    }).then(setDropInfo).catch(() => {});
  }, [claimDropId]);

  const { writeContractAsync } = useWriteContract();

  const handleCreate = async () => {
    if (!isConnected || !address) return;
    try {
      const amt = amountRef.current;
      const claims = claimsRef.current;
      const dur = durationRef.current;
      const msg = messageRef.current;

      const amtUnits = BigInt(Math.round(parseFloat(amt) * 10 ** USDC_DECIMALS));
      const totalAmt = amtUnits * BigInt(claims);

      setStep("approving");
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [ESCROW_ADDRESS as `0x${string}`, totalAmt],
      });
      for (let i = 0; i < 30; i++) {
        const a = await rpc.readContract({
          address: USDC_ADDRESS as `0x${string}`, abi: USDC_ABI,
          functionName: "allowance", args: [address, ESCROW_ADDRESS as `0x${string}`],
        });
        if ((a as bigint) >= totalAmt) break;
        await new Promise(r => setTimeout(r, 2000));
      }

      setStep("creating");
      const prevId = await rpc.readContract({
        address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId",
      }) as bigint;
      await writeContractAsync({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createDrop",
        args: [amtUnits, BigInt(claims), BigInt(DURATIONS[dur]), msg],
      });
      for (let i = 0; i < 30; i++) {
        const nId = await rpc.readContract({
          address: ESCROW_ADDRESS as `0x${string}`, abi: ESCROW_ABI, functionName: "nextDropId",
        }) as bigint;
        if (nId > prevId) { setCreatedDropId(String(Number(prevId))); setStep("done"); fetchAllDrops(); return; }
        await new Promise(r => setTimeout(r, 2000));
      }
      setStep("done"); setCreatedDropId("0");
    } catch (e) {
      console.error(e);
      setStep("idle");
    }
  };

  const handleClaim = async () => {
    if (!claimDropId) return;
    try {
      setClaimStep("claiming");
      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "claim",
        args: [BigInt(parseInt(claimDropId) || 0)],
      });
      await rpc.waitForTransactionReceipt({ hash: tx });
      setClaimStep("done");
      fetchAllDrops();
    } catch (e) {
      console.error(e);
      setClaimStep("idle");
    }
  };

  const shareLink = createdDropId !== null
    ? `${process.env.NEXT_PUBLIC_URL || "https://basedrop-chi.vercel.app"}?claim=${createdDropId}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openClaim = (id: number) => {
    setClaimDropId(String(id));
    setClaimStep("idle");
    setView("claim");
  };

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#0052FF", display: "flex", flexDirection: "column", alignItems: "center", padding: 24, fontFamily: "Inter, sans-serif" },
    card: { background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", marginTop: 40 },
    title: { fontSize: 28, fontWeight: 800, color: "#0052FF", marginBottom: 4 },
    sub: { fontSize: 14, color: "#666", marginBottom: 24 },
    btn: { width: "100%", padding: "14px 0", borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 },
    btnBlue: { background: "#0052FF", color: "#fff" },
    btnGray: { background: "#f0f0f0", color: "#333" },
    btnGreen: { background: "#22c55e", color: "#fff" },
    input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const },
    label: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" },
    row: { display: "flex", gap: 10, marginBottom: 12 },
    tag: { background: "#e8f0ff", color: "#0052FF", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    tagActive: { background: "#0052FF", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    back: { fontSize: 13, color: "#0052FF", cursor: "pointer", marginBottom: 16, fontWeight: 600 },
    success: { background: "#e8f9f0", border: "1px solid #4caf50", borderRadius: 10, padding: 14, fontSize: 13, color: "#2e7d32", marginTop: 12 },
    linkBox: { background: "#f0f4ff", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#333", wordBreak: "break-all" as const, marginBottom: 10, fontFamily: "monospace" },
    dropCard: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", transition: "transform 0.1s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  };

  const liveDrops = allDrops.filter(d => d.active && d.expiresAt > Date.now() / 1000 && d.claimedCount < d.totalClaims);

  // ─── HOME ───
  if (view === "home") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>💧 Basedrop</div>
        <div style={s.sub}>Drop USDC to your community — instantly, onchain.</div>
        {!isConnected ? <ConnectWallet /> : (
          <>
            <button style={{ ...s.btn, ...s.btnBlue }} onClick={() => setView("create")}>🚀 Create Drop</button>
            <button style={{ ...s.btn, ...s.btnGray }} onClick={() => setView("claim")}>💰 Claim by ID</button>
            <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8 }}>{shortAddr(address!)}</div>
          </>
        )}
      </div>

      {/* Live Drops List */}
      <div style={{ ...s.card, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>🔴 Live Drops</div>
          <div onClick={fetchAllDrops} style={{ fontSize: 12, color: "#0052FF", fontWeight: 600, cursor: "pointer" }}>↻ Refresh</div>
        </div>
        {loadingDrops ? (
          <div style={{ textAlign: "center", padding: 20, color: "#aaa", fontSize: 13 }}>Loading drops...</div>
        ) : liveDrops.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#aaa", fontSize: 13 }}>
            No live drops right now.<br />Be the first to create one! 🚀
          </div>
        ) : (
          liveDrops.map(d => {
            const left = d.totalClaims - d.claimedCount;
            const pct = (d.claimedCount / d.totalClaims) * 100;
            return (
              <div key={d.id} style={s.dropCard} onClick={() => openClaim(d.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{shortAddr(d.creator)}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>Drop #{d.id} · {timeLeft(d.expiresAt)}</div>
                  </div>
                  <div style={{ background: "#0052FF", color: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 15, fontWeight: 800 }}>
                    ${(Number(d.amountPerClaim) / 10 ** USDC_DECIMALS).toFixed(2)}
                  </div>
                </div>
                {d.message && <div style={{ fontSize: 12, color: "#888", fontStyle: "italic", marginBottom: 8 }}>"{d.message}"</div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 4 }}>
                  <span>{d.claimedCount} claimed</span>
                  <span>{left} left</span>
                </div>
                <div style={{ height: 4, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#0052FF" }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── CREATE ───
  if (view === "create") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.back} onClick={() => { setView("home"); setStep("idle"); setCreatedDropId(null); }}>← Back</div>
        <div style={s.title}>Create Drop</div>
        <div style={s.sub}>Lock USDC for your community to claim.</div>
        {step === "done" && createdDropId !== null ? (
          <div>
            <div style={s.success}>✅ Drop #{createdDropId} created!</div>
            <div style={{ height: 12 }} />
            <label style={s.label}>Share link</label>
            <div style={s.linkBox}>{shareLink}</div>
            <button style={{ ...s.btn, ...(copied ? s.btnGreen : s.btnBlue) }} onClick={handleCopy}>
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
            <button style={{ ...s.btn, background: "#7C3AED", color: "#fff" }} onClick={() => {
              const text = encodeURIComponent("I just created a USDC drop on Basedrop! Claim yours");
              const url = encodeURIComponent(shareLink);
              window.open("https://warpcast.com/~/compose?text=" + text + "&embeds[]=" + url, "_blank");
            }}>Share on Warpcast</button>
            <button style={{ ...s.btn, ...s.btnGray }} onClick={() => { setStep("idle"); setCreatedDropId(null); setView("home"); }}>Back to Home</button>
          </div>
        ) : (
          <>
            <label style={s.label}>Amount per claim (USDC)</label>
            <input style={s.input} type="number" min="0.01" step="0.01" value={amountPerClaim} onChange={e => setAmountPerClaim(e.target.value)} />
            <label style={s.label}>Number of claims</label>
            <input style={s.input} type="number" min="1" value={totalClaims} onChange={e => setTotalClaims(e.target.value)} />
            <label style={s.label}>Duration</label>
            <div style={s.row}>
              {Object.keys(DURATIONS).map(d => (
                <span key={d} style={duration === d ? s.tagActive : s.tag} onClick={() => setDuration(d)}>{d}</span>
              ))}
            </div>
            <label style={s.label}>Message (optional)</label>
            <input style={s.input} value={message} onChange={e => setMessage(e.target.value)} placeholder="Thanks for being part of the community!" />
            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Total: <strong>${(parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0")).toFixed(2)} USDC</strong>
            </div>
            <button style={{ ...s.btn, ...s.btnBlue, opacity: step !== "idle" ? 0.6 : 1 }} onClick={handleCreate} disabled={step !== "idle"}>
              {step === "idle" && "Launch Drop 🚀"}
              {step === "approving" && "Approving USDC..."}
              {step === "creating" && "Creating Drop..."}
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ─── CLAIM ───
  if (view === "claim") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.back} onClick={() => setView("home")}>← Back</div>
        <div style={s.title}>Claim Drop</div>
        <div style={s.sub}>Enter a drop ID to claim your USDC.</div>
        <label style={s.label}>Drop ID</label>
        <input style={s.input} value={claimDropId} onChange={e => setClaimDropId(e.target.value)} placeholder="e.g. 0" />
        {dropInfo && (
          <div style={{ background: "#f8f8f8", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>
            <div>💬 {String(dropInfo[5])}</div>
            <div>💵 ${(Number(dropInfo[1]) / 10 ** USDC_DECIMALS).toFixed(2)} per claim</div>
            <div>👥 {String(dropInfo[3])}/{String(dropInfo[2])} claimed</div>
            <div>⏰ {new Date(Number(dropInfo[4]) * 1000).toLocaleString()}</div>
          </div>
        )}
        {claimStep === "done" ? (
          <div style={s.success}>✅ Claimed! USDC sent to your wallet.</div>
        ) : (
          <button style={{ ...s.btn, ...s.btnBlue, opacity: !claimDropId || claimStep === "claiming" ? 0.6 : 1 }} onClick={handleClaim} disabled={!claimDropId || claimStep === "claiming"}>
            {claimStep === "claiming" ? "Claiming..." : "Claim 💧"}
          </button>
        )}
      </div>
    </div>
  );

  return null;
}
