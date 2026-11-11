// Linking a Tempo Wallet with the Tempo Accounts SDK. The access key lets the page open, top up
// and close a session without a prompt: it may move a little OUSD into a payment channel, plus
// pathUSD for network fees.
import { QueryClient } from "@tanstack/react-query";
import { Expiry } from "accounts";
import { parseUnits } from "viem";
import { createConfig, http } from "wagmi";
import { tempoModerato } from "wagmi/chains";
import { tempoWallet } from "wagmi/connectors";

import { channels, ousd, pathUsd } from "./wallet-state.js";

export const config = createConfig({
  chains: [tempoModerato],
  connectors: [
    tempoWallet({
      accessKey: {
        authorize: () => ({
          expiry: Expiry.days(1),
          limits: [
            { limit: parseUnits("1", 6), token: ousd },
            { limit: parseUnits("0.5", 6), token: pathUsd },
          ],
          // The TIP-1034 channel precompile: open, top up and close.
          scopes: [{ address: channels }],
        }),
      },
      // The page drives its own mppx session manager.
      mpp: false,
    }),
  ],
  multiInjectedProviderDiscovery: false,
  // Hydrate once after mount: render-time reconnects loop when Bridge updates the page.
  ssr: true,
  transports: { [tempoModerato.id]: http() },
});

export const queryClient = new QueryClient();

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
