// Linking a Tempo Wallet with the Tempo Accounts SDK. The access key lets each charge be paid
// without a prompt: it may transfer a little OUSD, plus pathUSD for network fees. It is the same
// key the identity playground asks for, so one approval covers every charge playground.
import { QueryClient } from "@tanstack/react-query";
import { Expiry } from "accounts";
import { parseUnits } from "viem";
import { createConfig, http } from "wagmi";
import { tempoModerato } from "wagmi/chains";
import { tempoWallet } from "wagmi/connectors";

import { ousd, pathUsd } from "./wallet-state.js";

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
          scopes: [
            { address: ousd, selector: "transfer(address,uint256)" },
            {
              address: ousd,
              selector: "transferWithMemo(address,uint256,bytes32)",
            },
          ],
        }),
      },
      // The page composes its own mppx client.
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
