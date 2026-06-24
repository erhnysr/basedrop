/**
 * x402 protocol test — pays for /api/analytics on Base Sepolia
 *
 * Usage:
 *   TEST_PRIVATE_KEY=0x... npx tsx scripts/test-x402.ts
 */
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

const ENDPOINT = "https://basedrop-chi.vercel.app/api/analytics";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;
const USDC_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
] as const;

async function main() {
  const rawKey = process.env.TEST_PRIVATE_KEY;
  if (!rawKey) {
    console.error("❌  TEST_PRIVATE_KEY env var is required");
    process.exit(1);
  }

  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  console.log("─────────────────────────────────────────");
  console.log(`🔑  Wallet  : ${account.address}`);
  console.log(`🌐  Network : Base Sepolia (eip155:84532)`);
  console.log(`🎯  Target  : ${ENDPOINT}`);
  console.log("─────────────────────────────────────────\n");

  // Check balances first
  const rpc = createPublicClient({ chain: baseSepolia, transport: http(BASE_SEPOLIA_RPC) });
  const [ethBalance, usdcBalance] = await Promise.all([
    rpc.getBalance({ address: account.address }),
    rpc.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf", args: [account.address] }),
  ]);
  console.log(`💰  ETH     : ${formatUnits(ethBalance, 18)} ETH`);
  console.log(`💵  USDC    : ${formatUnits(usdcBalance as bigint, 6)} USDC`);
  console.log("");

  if ((usdcBalance as bigint) === 0n) {
    console.error("❌  Wallet has 0 USDC on Base Sepolia.");
    console.error("    Get test USDC: https://faucet.circle.com  (select Base Sepolia)");
    process.exit(1);
  }

  // ─── Step 1: Initial request (expect 402) ───
  console.log("📡  Step 1 — Initial request (expect 402)...");
  const firstRes = await fetch(ENDPOINT);
  console.log(`    Status: ${firstRes.status}`);

  if (firstRes.status !== 402) {
    console.log("    (No payment required — reading body)");
    console.log(await firstRes.text());
    return;
  }

  const paymentRequiredHeader = firstRes.headers.get("payment-required");
  if (!paymentRequiredHeader) {
    console.error("❌  402 but no payment-required header");
    process.exit(1);
  }

  const paymentRequired = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf8"));
  console.log(`    Payment scheme : ${paymentRequired.accepts?.[0]?.scheme}`);
  console.log(`    Network        : ${paymentRequired.accepts?.[0]?.network}`);
  console.log(`    Amount (USDC)  : ${Number(paymentRequired.accepts?.[0]?.amount) / 1e6}`);
  console.log(`    Pay to         : ${paymentRequired.accepts?.[0]?.payTo}`);
  console.log("");

  // ─── Step 2: Create payment payload ───
  console.log("💳  Step 2 — Creating payment payload...");
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer: account,
    schemeOptions: { rpcUrl: BASE_SEPOLIA_RPC },
  });

  let paymentPayload;
  try {
    paymentPayload = await client.createPaymentPayload(paymentRequired);
    console.log("    ✓ Payment payload created");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌  Failed to create payment payload: ${msg}`);
    process.exit(1);
  }

  // ─── Step 3: Retry with payment header ───
  console.log("\n🔄  Step 3 — Retrying with payment header...");
  const httpClient = new x402HTTPClient(client);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  const secondRes = await fetch(ENDPOINT, { headers: paymentHeaders });
  console.log(`    Status: ${secondRes.status}`);

  const body = await secondRes.text();
  const paymentResponseHeader = secondRes.headers.get("payment-response") ?? secondRes.headers.get("x-payment-response");
  if (paymentResponseHeader) {
    console.log(`    Payment response header: ${paymentResponseHeader.slice(0, 80)}...`);
  }

  console.log("\n─────────────────────────────────────────");
  if (secondRes.status === 200) {
    console.log("✅  SUCCESS — payment accepted, response:");
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body.slice(0, 500));
    }
  } else {
    console.log(`❌  Final status ${secondRes.status}:`);
    console.log(body.slice(0, 500));
  }
  console.log("─────────────────────────────────────────");
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
