This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).

## x402 Payment Protocol

Basedrop implements the [x402 protocol](https://x402.org) to enable AI agents and autonomous clients to pay for API access using USDC on Base Mainnet — no API keys, no subscriptions.

### Protected Endpoints

| Route | Price | Description |
|-------|-------|-------------|
| `GET /api/drops` | $0.001 USDC | Live USDC drops feed |
| `GET /api/leaderboard` | $0.002 USDC | Top creators & claimers |
| `GET /api/analytics` | $0.005 USDC | Analytics data |

### How AI Agents Can Use This

Any x402-compatible client can call these endpoints autonomously. The server returns HTTP 402 Payment Required with the payment details; the client pays on-chain via Base, then retries with the payment header.

```typescript
import { wrapFetch } from "@x402/fetch";

const fetch402 = wrapFetch(fetch, walletClient);

const data = await fetch402("https://basedrop-chi.vercel.app/api/drops");
```

Payment is settled on **Base Mainnet** using the `exact` EVM scheme with the x402.org facilitator.

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
