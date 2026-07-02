This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).

## MCP Server

Basedrop exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at `/api/mcp` so AI agents can interact with on-chain drop data without writing smart contract code.

### Endpoint

```
POST https://basedrop-chi.vercel.app/api/mcp
```

### Available Tools

| Tool | Description |
|------|-------------|
| `list_drops` | List up to 20 most recent drops (Base Mainnet, live data) |
| `get_drop` | Get details for a specific drop by `dropId` |
| `get_analytics` | Platform stats: total drops, claims, USDC distributed |
| `get_leaderboard` | Top 10 creators and claimers by USDC volume |

### Usage Example (Claude Desktop / MCP client)

Add to your MCP client config:

```json
{
  "mcpServers": {
    "basedrop": {
      "transport": "http",
      "url": "https://basedrop-chi.vercel.app/api/mcp"
    }
  }
}
```

Or call directly:

```bash
curl -X POST https://basedrop-chi.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

curl -X POST https://basedrop-chi.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_drops","arguments":{}}}'
```

Agent discovery: [`/.well-known/agent-card.json`](https://basedrop-chi.vercel.app/.well-known/agent-card.json)

---

## x402 Payment Protocol

Basedrop implements the [x402 protocol](https://x402.org) to enable AI agents and autonomous clients to pay for API access using USDC — no API keys, no subscriptions.

### Protected Endpoints

| Route | Price | Network | Description |
|-------|-------|---------|-------------|
| `GET /api/analytics` | $0.005 USDC | Base Sepolia | Analytics data |

> **Note:** The public `x402.org/facilitator` currently supports Base Sepolia (`eip155:84532`). Mainnet support requires a self-hosted facilitator.

### How AI Agents Can Use This

Any x402-compatible client can call these endpoints autonomously. The server returns HTTP 402 Payment Required with the payment details; the client pays on-chain, then retries with the payment header.

```typescript
import { wrapFetch } from "@x402/fetch";

const fetch402 = wrapFetch(fetch, walletClient);

const data = await fetch402("https://basedrop-chi.vercel.app/api/analytics");
```

Payment is settled on **Base Sepolia** using the `exact` EVM scheme with the x402.org facilitator.

---

## Getting Started

First, install dependencies:

```bash
npm install
```

Next, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about OnchainKit, see our [documentation](https://docs.base.org/onchainkit).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).

// deploy trigger  2 Tem 2026 Per +03 14:38:46
