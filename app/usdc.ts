// Base Mainnet USDC Contract
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const

export const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const

// Convert dollar amount to USDC units (6 decimals)
export function usdcAmount(dollars: number): bigint {
  return BigInt(Math.round(dollars * 1_000_000))
}
