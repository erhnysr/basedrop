import { formatUnits, isHash, parseAbi, parseEventLogs, type TransactionReceipt } from "viem";
import { rpc } from "./rpc";
import { ESCROW_ABI, ESCROW_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from "./contract";

// Server-side proof for every row the app records: the tx must exist on Base,
// have succeeded, and emit the matching event from the right contract.
// Values stored in Supabase are taken from the event, never from the request body.

const TRANSFER_ABI = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]);

async function receipt(hash: unknown): Promise<TransactionReceipt | null> {
  if (typeof hash !== "string" || !isHash(hash)) return null;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await rpc.getTransactionReceipt({ hash });
      return r.status === "success" ? r : null;
    } catch {
      await new Promise(res => setTimeout(res, 1500)); // node may lag a block behind the wallet
    }
  }
  return null;
}

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export async function verifyDropCreated(hash: unknown) {
  const r = await receipt(hash);
  if (!r) return null;
  const log = parseEventLogs({ abi: ESCROW_ABI, logs: r.logs, eventName: "DropCreated" }).find(l => same(l.address, ESCROW_ADDRESS));
  if (!log) return null;
  const a = log.args;
  return {
    txHash: r.transactionHash,
    dropId: Number(a.dropId),
    creator: a.creator.toLowerCase(),
    amountPerClaim: formatUnits(a.amountPerClaim, USDC_DECIMALS),
    totalClaims: Number(a.totalClaims),
    expiresAt: new Date(Number(a.expiresAt) * 1000).toISOString(),
    message: a.message,
  };
}

export async function verifyClaim(hash: unknown) {
  const r = await receipt(hash);
  if (!r) return null;
  const log = parseEventLogs({ abi: ESCROW_ABI, logs: r.logs, eventName: "Claimed" }).find(l => same(l.address, ESCROW_ADDRESS));
  if (!log) return null;
  return { txHash: r.transactionHash, dropId: Number(log.args.dropId), claimer: log.args.claimer.toLowerCase(), amount: formatUnits(log.args.amount, USDC_DECIMALS) };
}

export async function verifyUsdcTransfer(hash: unknown) {
  const r = await receipt(hash);
  if (!r) return null;
  const log = parseEventLogs({ abi: TRANSFER_ABI, logs: r.logs, eventName: "Transfer" }).find(l => same(l.address, USDC_ADDRESS));
  if (!log) return null;
  return { txHash: r.transactionHash, from: log.args.from.toLowerCase(), to: log.args.to.toLowerCase(), amount: Number(formatUnits(log.args.value, USDC_DECIMALS)) };
}
