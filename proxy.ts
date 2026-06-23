import { paymentProxy, x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const PAY_TO = "0xD3467E00F6d7275C74e60fc7A1E5eD526893B29F";
const NETWORK = "eip155:8453"; // Base Mainnet

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

const resourceServer = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme()
);

export const proxy = paymentProxy(
  {
    "/api/drops": {
      accepts: {
        scheme: "exact",
        price: "$0.001",
        network: NETWORK,
        payTo: PAY_TO,
      },
      description: "Access to live USDC drops feed",
    },
    "/api/leaderboard": {
      accepts: {
        scheme: "exact",
        price: "$0.002",
        network: NETWORK,
        payTo: PAY_TO,
      },
      description: "Access to Basedrop leaderboard",
    },
    "/api/analytics": {
      accepts: {
        scheme: "exact",
        price: "$0.005",
        network: NETWORK,
        payTo: PAY_TO,
      },
      description: "Access to Basedrop analytics data",
    },
  },
  resourceServer
);

export const config = {
  matcher: ["/api/drops", "/api/leaderboard", "/api/analytics"],
};
