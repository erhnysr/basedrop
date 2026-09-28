import { encodePacked, keccak256, namehash, parseAbi } from "viem";
import { normalize } from "viem/ens";
import { rpc, mainnetRpc } from "./rpc";

// Server-side Basename lookup (same method as OnchainKit's getName):
// reverse record from Base's L2 resolver, then forward-verified on L1 so a
// name that doesn't point back to the address is never shown.
const L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD" as const;
const L2_RESOLVER_ABI = parseAbi(["function name(bytes32 node) view returns (string)"]);
const BASE_REVERSE_NODE = namehash("80002105.reverse"); // coinType(0x80000000 | 8453)

export async function getBasename(address: `0x${string}`): Promise<string | null> {
  const addrNode = keccak256(address.toLowerCase().substring(2) as `0x${string}`);
  const node = keccak256(encodePacked(["bytes32", "bytes32"], [BASE_REVERSE_NODE, addrNode]));
  const name = await rpc.readContract({ address: L2_RESOLVER, abi: L2_RESOLVER_ABI, functionName: "name", args: [node] }).catch(() => "");
  // Only Basenames: forward-resolving an arbitrary ENS name would follow its
  // CCIP-Read gateway, i.e. make the server fetch a URL the name owner controls.
  if (!name || !name.endsWith(".base.eth")) return null;
  const back = await mainnetRpc.getEnsAddress({ name: normalize(name) }).catch(() => null);
  return back && back.toLowerCase() === address.toLowerCase() ? name : null;
}
