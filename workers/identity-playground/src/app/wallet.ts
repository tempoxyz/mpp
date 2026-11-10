// Linking a Tempo Wallet with the Tempo Accounts SDK. The access key lets each haiku be
// paid without a prompt: it may spend a little OUSD, plus pathUSD for network fees.
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
      // The page composes its own mppx client with the identity provers.
      mpp: false,
    }),
  ],
  multiInjectedProviderDiscovery: false,
  transports: { [tempoModerato.id]: http() },
});

export const queryClient = new QueryClient();

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
