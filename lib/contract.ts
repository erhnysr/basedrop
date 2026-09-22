// Base Mainnet USDC
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

export interface DropInfo {
  id: number;
  creator: string;
  amountPerClaim: bigint;
  totalClaims: number;
  claimedCount: number;
  expiresAt: number;
  message: string;
  active: boolean;
}

// Maps the raw `getDropInfo` tuple returned by the escrow contract into a typed DropInfo.
export function parseDropInfo(id: number, info: readonly unknown[]): DropInfo {
  return {
    id,
    creator: info[0] as string,
    amountPerClaim: info[1] as bigint,
    totalClaims: Number(info[2]),
    claimedCount: Number(info[3]),
    expiresAt: Number(info[4]),
    message: info[5] as string,
    active: info[6] as boolean,
  };
}

// TODO: Deploy contract and paste address here
export const ESCROW_ADDRESS = "0x6077F3f9c3d8D68eD5cE95998B36F24Aaff4AcfE" as const;

// Duration options in seconds
export const DURATIONS: Record<string, number> = {
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
  "48h": 172800,
};

export const USDC_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const ESCROW_ABI = [
  {
    name: "createDrop",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountPerClaim", type: "uint256" },
      { name: "totalClaims", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "message", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "dropId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelDrop",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "dropId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getDropInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "dropId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "amountPerClaim", type: "uint256" },
      { name: "totalClaims", type: "uint256" },
      { name: "claimedCount", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "message", type: "string" },
      { name: "active", type: "bool" },
    ],
  },
  {
    name: "hasUserClaimed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "dropId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "nextDropId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "DropCreated",
    type: "event",
    inputs: [
      { name: "dropId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "amountPerClaim", type: "uint256", indexed: false },
      { name: "totalClaims", type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
      { name: "message", type: "string", indexed: false },
    ],
  },
  {
    name: "Claimed",
    type: "event",
    inputs: [
      { name: "dropId", type: "uint256", indexed: true },
      { name: "claimer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
