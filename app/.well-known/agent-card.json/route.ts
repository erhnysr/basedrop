import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Basedrop",
    description:
      "USDC drop & claim platform on Base Mainnet. AI agents can list active drops, fetch drop details, query analytics, and read leaderboards via MCP.",
    url: "https://basedrop-chi.vercel.app",
    agentId: "56785",
    standard: "ERC-8004",
    mcp: {
      endpoint: "https://basedrop-chi.vercel.app/api/mcp",
      transport: "http",
      protocolVersion: "2024-11-05",
      tools: ["list_drops", "get_drop", "get_analytics", "get_leaderboard"],
    },
    x402: {
      supported: true,
      facilitator: "https://x402.org/facilitator",
      network: "eip155:84532",
      endpoints: [
        { path: "/api/analytics", price: "$0.005", description: "Platform analytics" },
        { path: "/api/leaderboard", price: "$0.002", description: "Leaderboard data" },
      ],
    },
    chains: [{ id: 8453, name: "Base Mainnet" }],
    contact: { github: "https://github.com/erhnysr/basedrop" },
  });
}
