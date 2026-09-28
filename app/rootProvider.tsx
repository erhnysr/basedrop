"use client";
import { ReactNode } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { baseTransport, mainnetRpc } from "../lib/rpc";
import { useResolvedTheme } from "../lib/theme-mode";
import { mainnet } from "wagmi/chains";
import { base } from "wagmi/chains";
import { coinbaseWallet, metaMask, injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "Basedrop" }),
  ],
  transports: {
    [base.id]: baseTransport,
  },
});

export function RootProvider({ children }: { children: ReactNode }) {
  const mode = useResolvedTheme(); // wallet modal follows the in-app theme
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider defaultPublicClients={{ [mainnet.id]: mainnetRpc }} apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} chain={base} config={{ appearance: { name: "Basedrop", logo: "/mark.svg", mode, theme: "default" }, wallet: { display: "modal" } }} miniKit={{ enabled: true, autoConnect: true }}>
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
