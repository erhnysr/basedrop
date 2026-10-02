import { isAddress, namehash, parseAbi } from "viem";
import { normalize } from "viem/ens";
import { rpc, mainnetRpc } from "./rpc";

// Basenames live on Base: their L2 resolver answers addr(node) directly, so a
// .base.eth name never needs the slow L1 CCIP-Read round trip (which used to go
// through a single public RPC and failed often on mobile).
// The registry is asked which resolver a name uses, since names registered at
// different times point at different resolver contracts.
const BASENAME_REGISTRY = "0xB94704422c2a1E396835A571837Aa5AE53285a95" as const;
const REGISTRY_ABI = parseAbi(["function resolver(bytes32 node) view returns (address)"]);
const RESOLVER_ABI = parseAbi(["function addr(bytes32 node) view returns (address)"]);
const ZERO = /^0x0{40}$/i;

// Resolves a raw input (0x address, ENS name, or Basename) to a lowercased address.
// Bare names (no dot) are treated as Basenames and get a `.base.eth` suffix.
export async function resolveInput(input: string): Promise<`0x${string}` | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isAddress(trimmed)) return trimmed.toLowerCase() as `0x${string}`;

  let name: string;
  try {
    name = normalize(trimmed.includes(".") ? trimmed : `${trimmed}.base.eth`);
  } catch {
    return null; // not a valid name at all
  }

  if (name.endsWith(".base.eth")) {
    const node = namehash(name);
    const resolver = await rpc
      .readContract({ address: BASENAME_REGISTRY, abi: REGISTRY_ABI, functionName: "resolver", args: [node] })
      .catch(() => null);
    const addr = resolver && !ZERO.test(resolver)
      ? await rpc.readContract({ address: resolver, abi: RESOLVER_ABI, functionName: "addr", args: [node] }).catch(() => null)
      : null;
    if (addr && !ZERO.test(addr)) return addr.toLowerCase() as `0x${string}`;
  }

  // Other ENS names (and a Basename the L2 read missed) go through L1, with RPC fallback.
  const addr = await mainnetRpc.getEnsAddress({ name }).catch(() => null);
  return addr && !ZERO.test(addr) ? (addr.toLowerCase() as `0x${string}`) : null;
}
