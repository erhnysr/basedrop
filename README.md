This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).

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
