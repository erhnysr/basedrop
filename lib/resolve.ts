import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

// L1 client — resolves .eth and .base.eth names via CCIP-Read
const l1 = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

// Resolves a raw input (0x address, ENS name, or basename) to a checksummed-lowercased address.
// Bare names (no dot) are treated as basenames and get a `.base.eth` suffix.
export async function resolveInput(input: string): Promise<`0x${string}` | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isAddress(trimmed)) return trimmed.toLowerCase() as `0x${string}`;

  const name = trimmed.includes(".") ? trimmed : `${trimmed}.base.eth`;

  try {
    const addr = await l1.getEnsAddress({ name: normalize(name) });
    return addr;
  } catch {
    return null;
  }
}
