import { createPublicClient, fallback, http } from "viem";
import { base, mainnet } from "viem/chains";

// Coinbase Developer Platform node (keyed by the OnchainKit client key, which is
// already in .env) first, public Base RPC as fallback. The public endpoint alone
// rate-limits quickly ("over rate limit").
const cdpKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
const PUBLIC_RPC = "https://mainnet.base.org";

export const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL
  || (cdpKey ? `https://api.developer.coinbase.com/rpc/v1/base/${cdpKey}` : PUBLIC_RPC);

export const baseTransport = BASE_RPC_URL === PUBLIC_RPC
  ? http(PUBLIC_RPC)
  : fallback([http(BASE_RPC_URL), http(PUBLIC_RPC)]);

export const rpc = createPublicClient({ chain: base, transport: baseTransport });

// L1 client for ENS / Basename forward verification. viem's default mainnet RPC
// rejects browser (CORS) requests, which silently hides every Basename.
export const mainnetRpc = createPublicClient({
  chain: mainnet,
  transport: fallback([http("https://ethereum-rpc.publicnode.com"), http("https://eth.llamarpc.com")]),
});
