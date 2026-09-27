import type { Metadata } from "next";
import { minikitConfig } from "@/minikit.config";
import HomeClient from "./HomeClient";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Per-drop share metadata: a ?claim=ID link unfurls as that drop's ticket card
// on Farcaster, Base App and X.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const raw = Array.isArray(sp.claim) ? sp.claim[0] : sp.claim;
  const id = raw && /^\d+$/.test(raw) ? raw : null;
  const root = process.env.NEXT_PUBLIC_URL || "https://basedrop-chi.vercel.app";
  const image = id ? `${root}/api/og?id=${id}` : minikitConfig.miniapp.heroImageUrl;
  const title = id ? `Drop #${id} · Basedrop` : minikitConfig.miniapp.name;

  return {
    title,
    description: minikitConfig.miniapp.description,
    openGraph: { title, description: minikitConfig.miniapp.ogDescription, images: [{ url: image, width: 1200, height: 800 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
    other: {
      "base:app_id": "6a19d6401c5aec425c51b7c9",
      "fc:miniapp": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: image,
        button: {
          title: id ? "Claim USDC" : `Launch ${minikitConfig.miniapp.name}`,
          action: {
            name: minikitConfig.miniapp.name,
            type: "launch_miniapp",
            ...(id ? { url: `${root}?claim=${id}` } : {}),
          },
        },
      }),
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
