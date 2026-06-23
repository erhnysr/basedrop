import { paymentProxy, x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const PAY_TO = "0xD3467E00F6d7275C74e60fc7A1E5eD526893B29F";
// x402.org public facilitator supports Base Sepolia (eip155:84532).
// Base Mainnet (eip155:8453) requires a self-hosted facilitator.
const NETWORK = "eip155:84532";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

const resourceServer = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme()
);

// Only protect /api/analytics — /api/drops and /api/leaderboard are
// called by the UI directly (no payment header), so protecting them
// would silently break the leaderboard and drop-logging features.
export const proxy = paymentProxy(
  {
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
  matcher: ["/api/analytics"],
};
