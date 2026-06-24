import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import { supabase } from "@/lib/supabase";
import { ESCROW_ADDRESS, ESCROW_ABI, USDC_DECIMALS } from "@/lib/contract";

const rpc = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_drops",
    description:
      "List all active USDC drops on Basedrop (Base Mainnet). Returns up to 20 most recent drops with creator, amount, claims remaining, and expiry.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max number of drops to return (default 20, max 20)",
        },
      },
    },
  },
  {
    name: "get_drop",
    description:
      "Get details for a specific drop by its on-chain ID. Returns creator, amount per claim, total/claimed counts, expiry, message, and active status.",
    inputSchema: {
      type: "object",
      properties: {
        dropId: { type: "number", description: "The on-chain drop ID" },
      },
      required: ["dropId"],
    },
  },
  {
    name: "get_analytics",
    description:
      "Get platform-wide statistics: total drops created, total claims made, and total USDC distributed. Equivalent HTTP access costs $0.005 USDC via x402.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_leaderboard",
    description:
      "Get top creators (by USDC dropped) and top claimers (by USDC claimed). Returns top 10 for each category. Equivalent HTTP access costs $0.002 USDC via x402.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ─── Tool handlers ───────────────────────────────────────────────────────────

async function listDrops(limit = 20) {
  const nextId = await rpc.readContract({
    address: ESCROW_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "nextDropId",
  }) as bigint;

  const count = Number(nextId);
  const results = [];

  for (let i = count - 1; i >= 0 && results.length < Math.min(limit, 20); i--) {
    try {
      const info = await rpc.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "getDropInfo",
        args: [BigInt(i)],
      }) as [string, bigint, bigint, bigint, bigint, string, boolean];

      const expiresAt = Number(info[4]);
      const active = info[6];
      const claimedCount = Number(info[3]);
      const totalClaims = Number(info[2]);
      const isLive = active && expiresAt > Math.floor(Date.now() / 1000) && claimedCount < totalClaims;

      results.push({
        dropId: i,
        creator: info[0],
        amountPerClaim: formatUnits(info[1], USDC_DECIMALS) + " USDC",
        totalClaims,
        claimedCount,
        remaining: totalClaims - claimedCount,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        message: info[5] || null,
        active,
        isLive,
      });
    } catch {
      // skip unreadable drops
    }
  }

  return results;
}

async function getDrop(dropId: number) {
  const info = await rpc.readContract({
    address: ESCROW_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: "getDropInfo",
    args: [BigInt(dropId)],
  }) as [string, bigint, bigint, bigint, bigint, string, boolean];

  const expiresAt = Number(info[4]);
  const claimedCount = Number(info[3]);
  const totalClaims = Number(info[2]);

  return {
    dropId,
    creator: info[0],
    amountPerClaim: formatUnits(info[1], USDC_DECIMALS) + " USDC",
    totalClaims,
    claimedCount,
    remaining: totalClaims - claimedCount,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    message: info[5] || null,
    active: info[6],
    isLive:
      info[6] &&
      expiresAt > Math.floor(Date.now() / 1000) &&
      claimedCount < totalClaims,
    claimUrl: `https://basedrop-chi.vercel.app?claim=${dropId}`,
  };
}

async function getAnalytics() {
  const [dropsResult, claimsResult, amountsResult] = await Promise.all([
    supabase.from("drops").select("*", { count: "exact", head: true }),
    supabase.from("claims").select("*", { count: "exact", head: true }),
    supabase.from("drops").select("amount_per_claim, claimed_count"),
  ]);

  if (dropsResult.error) throw new Error(dropsResult.error.message);
  if (claimsResult.error) throw new Error(claimsResult.error.message);
  if (amountsResult.error) throw new Error(amountsResult.error.message);

  const totalUsdc = (amountsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_per_claim) * row.claimed_count,
    0,
  );

  return {
    total_drops: dropsResult.count ?? 0,
    total_claims: claimsResult.count ?? 0,
    total_usdc_dropped: Number(totalUsdc.toFixed(6)),
  };
}

async function getLeaderboard() {
  const [creatorsRes, claimersRes] = await Promise.all([
    supabase
      .from("leaderboard_creators")
      .select("creator_address, total_dropped, drop_count")
      .order("total_dropped", { ascending: false })
      .limit(10),
    supabase
      .from("leaderboard_claimers")
      .select("claimer_address, total_claimed, claim_count")
      .order("total_claimed", { ascending: false })
      .limit(10),
  ]);

  if (creatorsRes.error) throw new Error(creatorsRes.error.message);
  if (claimersRes.error) throw new Error(claimersRes.error.message);

  return {
    top_creators: creatorsRes.data,
    top_claimers: claimersRes.data,
  };
}

// ─── JSON-RPC 2.0 handler ────────────────────────────────────────────────────

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(req: NextRequest) {
  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: unknown };
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, "Parse error");
  }

  const { id, method, params } = body;

  if (body.jsonrpc !== "2.0" || typeof method !== "string") {
    return err(id ?? null, -32600, "Invalid Request");
  }

  try {
    switch (method) {
      case "initialize":
        return ok(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "basedrop-mcp", version: "1.0.0" },
        });

      case "notifications/initialized":
        return new NextResponse(null, { status: 204 });

      case "tools/list":
        return ok(id, { tools: TOOLS });

      case "tools/call": {
        const p = params as { name?: string; arguments?: Record<string, unknown> };
        const args = p?.arguments ?? {};

        switch (p?.name) {
          case "list_drops": {
            const drops = await listDrops(Number(args.limit) || 20);
            return ok(id, {
              content: [{ type: "text", text: JSON.stringify(drops, null, 2) }],
            });
          }
          case "get_drop": {
            if (typeof args.dropId !== "number") {
              return err(id, -32602, "dropId (number) is required");
            }
            const drop = await getDrop(args.dropId);
            return ok(id, {
              content: [{ type: "text", text: JSON.stringify(drop, null, 2) }],
            });
          }
          case "get_analytics": {
            const analytics = await getAnalytics();
            return ok(id, {
              content: [{ type: "text", text: JSON.stringify(analytics, null, 2) }],
            });
          }
          case "get_leaderboard": {
            const leaderboard = await getLeaderboard();
            return ok(id, {
              content: [{ type: "text", text: JSON.stringify(leaderboard, null, 2) }],
            });
          }
          default:
            return err(id, -32601, `Unknown tool: ${p?.name}`);
        }
      }

      default:
        return err(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return err(id, -32603, message);
  }
}

export async function GET() {
  return NextResponse.json({
    name: "basedrop-mcp",
    version: "1.0.0",
    protocol: "MCP/2024-11-05",
    transport: "http",
    tools: TOOLS.map((t) => t.name),
    endpoint: "https://basedrop-chi.vercel.app/api/mcp",
  });
}
