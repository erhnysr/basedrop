import { NextResponse } from "next/server";
import { formatUnits, parseAbiItem } from "viem";
import { rpc } from "@/lib/rpc";
import { supabase } from "@/lib/supabase";
import { ESCROW_ADDRESS, USDC_DECIMALS } from "@/lib/contract";

// Recent activity: escrow events read straight from Base (source of truth),
// plus direct USDC tips recorded by the app. Base produces a block every 2s,
// so event times are derived from block distance instead of one RPC per block.
export type ActivityItem = {
  kind: "drop" | "claim" | "tip";
  actor: string;
  counterparty?: string;
  amount: number;          // USDC
  claims?: number;         // drops: number of claims funded
  dropId?: number;
  ts: number;              // unix seconds
  tx?: string;
};

const DROP_CREATED = parseAbiItem("event DropCreated(uint256 indexed dropId, address indexed creator, uint256 amountPerClaim, uint256 totalClaims, uint256 expiresAt, string message)");
const CLAIMED = parseAbiItem("event Claimed(uint256 indexed dropId, address indexed claimer, uint256 amount)");
const BLOCK_SECONDS = 2;
const WANT = 8;

async function escrowEvents(): Promise<ActivityItem[]> {
  const latest = await rpc.getBlockNumber();
  const now = Math.floor(Date.now() / 1000);
  const tsOf = (bn: bigint) => now - Number(latest - bn) * BLOCK_SECONDS;

  for (const chunk of [BigInt(10000), BigInt(2000)]) {
    try {
      const out: ActivityItem[] = [];
      let to = latest;
      for (let i = 0; i < 6 && out.length < WANT; i++) {
        const from = to - chunk + BigInt(1);
        const logs = await rpc.getLogs({ address: ESCROW_ADDRESS, events: [DROP_CREATED, CLAIMED], fromBlock: from, toBlock: to });
        for (const l of logs) {
          if (l.eventName === "DropCreated") {
            const a = l.args as { dropId: bigint; creator: string; amountPerClaim: bigint; totalClaims: bigint };
            out.push({ kind: "drop", actor: a.creator, amount: Number(formatUnits(a.amountPerClaim, USDC_DECIMALS)), claims: Number(a.totalClaims), dropId: Number(a.dropId), ts: tsOf(l.blockNumber!), tx: l.transactionHash ?? undefined });
          } else {
            const a = l.args as { dropId: bigint; claimer: string; amount: bigint };
            out.push({ kind: "claim", actor: a.claimer, amount: Number(formatUnits(a.amount, USDC_DECIMALS)), dropId: Number(a.dropId), ts: tsOf(l.blockNumber!), tx: l.transactionHash ?? undefined });
          }
        }
        to = from - BigInt(1);
      }
      return out;
    } catch {
      // range too wide for this RPC — retry with smaller chunks
    }
  }
  return [];
}

async function tips(): Promise<ActivityItem[]> {
  const { data, error } = await supabase.from("tips").select("tipper_address, recipient_address, amount, tx_hash, created_at").order("created_at", { ascending: false }).limit(WANT);
  if (error || !data) return [];
  return data.map(t => ({ kind: "tip" as const, actor: t.tipper_address, counterparty: t.recipient_address, amount: Number(t.amount), ts: Math.floor(new Date(t.created_at).getTime() / 1000), tx: t.tx_hash }));
}

export async function GET() {
  const [ev, tp] = await Promise.all([escrowEvents().catch(() => []), tips().catch(() => [])]);
  const items = [...ev, ...tp].sort((a, b) => b.ts - a.ts).slice(0, WANT);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
}
