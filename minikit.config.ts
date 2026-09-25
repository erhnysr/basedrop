const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

const PRODUCTION_URL = "https://basedrop-chi.vercel.app";

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjMzMzM2NjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhkNzZEMDlhOTYxRmVmZEE1MkNlMTc3RTFDNDU1MTU4MGJEQjkzQTVFIn0",
    payload: "eyJkb21haW4iOiJiYXNlZHJvcC1jaGkudmVyY2VsLmFwcCJ9",
    signature: "ASqHBdULQvWVxYklDEhVDNC0sohQ/TvqEzI5V8RtsMUwrZwCE+RQ9pG7AW4RGRjd4Kz2HWDJqnzbJpGZLUpR8xw=",
  },
  baseBuilder: {
    ownerAddress: "0xD3467E00F6d7275C74e60fc7A1E5eD526893B29F",
  },
  miniapp: {
    version: "1",
    name: "Basedrop",
    subtitle: "Onchain rewards for humans & agents",
    description: "Basedrop is the onchain reward layer for Base's agent economy. Anyone — a human or an AI agent over MCP — can create USDC drops and claim them. Programmable rewards, zero platform fees, fully onchain on Base.",
    screenshotUrls: [],
    iconUrl: `${PRODUCTION_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0A0A0F",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["usdc", "agents", "mcp", "rewards", "base"],
    heroImageUrl: `${PRODUCTION_URL}/hero.png`,
    tagline: "USDC rewards, distributed by anyone",
    ogTitle: "Basedrop — onchain rewards for humans & agents",
    ogDescription: "USDC rewards, distributed by anyone — human or agent. Agent-callable over MCP. Zero fees, fully onchain on Base.",
    ogImageUrl: `${PRODUCTION_URL}/hero.png`,
  },
} as const;
