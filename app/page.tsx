"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { USDC_ADDRESS, USDC_ABI, ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS, DURATIONS } from "../lib/contract";

type View = "home" | "create" | "claim";

export default function Page() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<View>("home");

  // Create Drop form state
  const [amountPerClaim, setAmountPerClaim] = useState("1");
  const [totalClaims, setTotalClaims] = useState("10");
  const [duration, setDuration] = useState("24h");
  const [message, setMessage] = useState("");
  const [dropId, setDropId] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "creating" | "done">("idle");
  const [createdDropId, setCreatedDropId] = useState<string | null>(null);

  // Claim state
  const [claimDropId, setClaimDropId] = useState("");

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  const totalAmount = Math.round(parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0") * 10 ** USDC_DECIMALS);
  const amountPerClaimUnits = Math.round(parseFloat(amountPerClaim || "0") * 10 ** USDC_DECIMALS);

  // Step 1: Approve USDC
  const { writeContract: approve, data: approveTxHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Step 2: Create Drop
  const { writeContract: createDrop, data: createTxHash } = useWriteContract();
  const { isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createTxHash });

  // Claim
  const { writeContract: claim, data: claimTxHash } = useWriteContract();
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimTxHash });

  // Drop info for claim view
  const { data: dropInfo } = useReadContract({
    address: ESCROW_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "getDropInfo",
    args: claimDropId ? [BigInt(claimDropId)] : undefined,
    query: { enabled: !!claimDropId },
  });

  useEffect(() => {
    if (approveSuccess && step === "approving") {
      setStep("creating");
      createDrop({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "createDrop",
        args: [BigInt(amountPerClaimUnits), BigInt(totalClaims), BigInt(DURATIONS[duration]), message],
      });
    }
  }, [approveSuccess, step]);

  useEffect(() => {
    if (createSuccess && step === "creating") {
      setStep("done");
      setCreatedDropId("(drop oluşturuldu — dropId için tx'i kontrol et)");
    }
  }, [createSuccess, step]);

  const handleCreate = () => {
    if (!isConnected || !address) return;
    setStep("approving");
    approve({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [ESCROW_ADDRESS as `0x${string}`, BigInt(totalAmount)],
    });
  };

  const handleClaim = () => {
    if (!claimDropId) return;
    claim({
      address: ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: "claim",
      args: [BigInt(claimDropId)],
    });
  };

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#0052FF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, sans-serif" },
    card: { background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
    title: { fontSize: 28, fontWeight: 800, color: "#0052FF", marginBottom: 4 },
    sub: { fontSize: 14, color: "#666", marginBottom: 24 },
    btn: { width: "100%", padding: "14px 0", borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 },
    btnBlue: { background: "#0052FF", color: "#fff" },
    btnGray: { background: "#f0f0f0", color: "#333" },
    input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const },
    label: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" },
    row: { display: "flex", gap: 10, marginBottom: 12 },
    tag: { background: "#e8f0ff", color: "#0052FF", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    tagActive: { background: "#0052FF", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    back: { fontSize: 13, color: "#0052FF", cursor: "pointer", marginBottom: 16, fontWeight: 600 },
    success: { background: "#e8f9f0", border: "1px solid #4caf50", borderRadius: 10, padding: 14, fontSize: 13, color: "#2e7d32", marginTop: 12 },
  };

  if (view === "home") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>💧 Basedrop</div>
        <div style={s.sub}>Drop USDC to your community — instantly, onchain.</div>
        {!isConnected ? (
          <ConnectWallet />
        ) : (
          <>
            <button style={{ ...s.btn, ...s.btnBlue }} onClick={() => setView("create")}>🚀 Create Drop</button>
            <button style={{ ...s.btn, ...s.btnGray }} onClick={() => setView("claim")}>💰 Claim Drop</button>
            <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8 }}>{address?.slice(0,6)}...{address?.slice(-4)}</div>
          </>
        )}
      </div>
    </div>
  );

  if (view === "create") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.back} onClick={() => { setView("home"); setStep("idle"); setCreatedDropId(null); }}>← Back</div>
        <div style={s.title}>Create Drop</div>
        <div style={s.sub}>Lock USDC for your community to claim.</div>

        {step === "done" && createdDropId ? (
          <div style={s.success}>
            ✅ Drop created! Share this with your community.<br /><br />
            <strong>{createdDropId}</strong>
          </div>
        ) : (
          <>
            <label style={s.label}>Amount per claim (USDC)</label>
            <input style={s.input} type="number" min="0.01" step="0.01" value={amountPerClaim} onChange={e => setAmountPerClaim(e.target.value)} placeholder="1.00" />

            <label style={s.label}>Number of claims</label>
            <input style={s.input} type="number" min="1" value={totalClaims} onChange={e => setTotalClaims(e.target.value)} placeholder="10" />

            <label style={s.label}>Duration</label>
            <div style={s.row}>
              {Object.keys(DURATIONS).map(d => (
                <span key={d} style={duration === d ? s.tagActive : s.tag} onClick={() => setDuration(d)}>{d}</span>
              ))}
            </div>

            <label style={s.label}>Message (optional)</label>
            <input style={s.input} value={message} onChange={e => setMessage(e.target.value)} placeholder="Thanks for being part of the community!" />

            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Total locked: <strong>${(parseFloat(amountPerClaim || "0") * parseInt(totalClaims || "0")).toFixed(2)} USDC</strong>
            </div>

            <button
              style={{ ...s.btn, ...s.btnBlue, opacity: step !== "idle" ? 0.6 : 1 }}
              onClick={handleCreate}
              disabled={step !== "idle"}
            >
              {step === "idle" && "Launch Drop 🚀"}
              {step === "approving" && "Approving USDC..."}
              {step === "creating" && "Creating Drop..."}
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (view === "claim") return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.back} onClick={() => setView("home")}>← Back</div>
        <div style={s.title}>Claim Drop</div>
        <div style={s.sub}>Enter a drop ID to claim your USDC.</div>

        <label style={s.label}>Drop ID</label>
        <input style={s.input} value={claimDropId} onChange={e => setClaimDropId(e.target.value)} placeholder="e.g. 1" />

        {dropInfo && (
          <div style={{ background: "#f8f8f8", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>
            <div>💬 {String((dropInfo as any)[5])}</div>
            <div>💵 ${(Number((dropInfo as any)[1]) / 10 ** USDC_DECIMALS).toFixed(2)} per claim</div>
            <div>👥 {String((dropInfo as any)[2])} total / {String((dropInfo as any)[3])} claimed</div>
          </div>
        )}

        <button
          style={{ ...s.btn, ...s.btnBlue }}
          onClick={handleClaim}
          disabled={!claimDropId}
        >
          Claim 💧
        </button>

        {claimSuccess && <div style={s.success}>✅ Claimed successfully!</div>}
      </div>
    </div>
  );

  return null;
}