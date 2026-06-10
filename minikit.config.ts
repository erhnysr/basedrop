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
    subtitle: "Drop USDC to your community",
    description: "Basedrop lets creators drop USDC to their community instantly. Create a drop, share it, and watch your community claim — all onchain on Base with zero platform fees.",
    screenshotUrls: [],
    iconUrl: `${PRODUCTION_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#FAFAFA",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "utility",
    tags: ["usdc", "tipping", "creator", "base", "onchain"],
    heroImageUrl: `${PRODUCTION_URL}/hero.png`,
    tagline: "Drop USDC to your community",
    ogTitle: "Basedrop - Drop USDC",
    ogDescription: "Create drops, share with your community, claim USDC instantly. Zero fees. Fully onchain on Base.",
    ogImageUrl: `${PRODUCTION_URL}/hero.png`,
  },
} as const;
