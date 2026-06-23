/**
 * x402 protocol test — pays for /api/analytics on Base Sepolia
 *
 * Usage:
 *   TEST_PRIVATE_KEY=0x... npx tsx scripts/test-x402.ts
 */
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const ENDPOINT = "https://basedrop-chi.vercel.app/api/analytics";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";

async function main() {
  const rawKey = process.env.TEST_PRIVATE_KEY;
  if (!rawKey) {
    console.error("❌  TEST_PRIVATE_KEY env var is required");
    process.exit(1);
  }

  const privateKey = (
    rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`
  ) as `0x${string}`;

  const account = privateKeyToAccount(privateKey);
  console.log(`🔑  Wallet : ${account.address}`);
  console.log(`🌐  Network: Base Sepolia (eip155:84532)`);
  console.log(`🎯  Target : ${ENDPOINT}`);
  console.log("");

  // Build x402 client with EVM exact-payment scheme
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer: account,
    schemeOptions: {
      rpcUrl: BASE_SEPOLIA_RPC,
    },
  });

  const fetchWithPay = wrapFetchWithPayment(fetch, client);

  console.log("📡  Sending request (no payment header)...");
  const res = await fetchWithPay(ENDPOINT);

  console.log(`✅  Final status : ${res.status}`);
  console.log(`📋  Content-Type : ${res.headers.get("content-type") ?? "—"}`);

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log("📦  Response body:");
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log("📦  Response body:", text.slice(0, 500));
  }
}

main().catch((err) => {
  console.error("❌  Error:", err.message ?? err);
  process.exit(1);
});
