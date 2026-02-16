import { QueryClient } from "@tanstack/react-query";
import { tempoModerato } from "viem/chains";
import { createConfig, webSocket } from "wagmi";
import { KeyManager, webAuthn } from "wagmi/tempo";

export const pathUsd =
  "0x20c0000000000000000000000000000000000000" as `0x${string}`;

export const queryClient = new QueryClient();

const chain = tempoModerato.extend({ feeToken: pathUsd });

const rpId = (() => {
  const hostname = globalThis.location?.hostname;
  if (!hostname) return undefined;
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  // workers.dev is a public suffix (https://publicsuffix.org/list/)
  // use 3 parts instead of 2 (e.g. porto.workers.dev)
  if (hostname.endsWith(".workers.dev")) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
})();

export const config = createConfig({
  connectors: [
    webAuthn({
      grantAccessKey: true,
      createOptions: {
        label: "MPP Demo",
      },
      keyManager: KeyManager.http("https://keys.tempo.xyz"),
      rpId,
    }),
  ],
  chains: [chain],
  multiInjectedProviderDiscovery: false,
  pollingInterval: 1_000,
  transports: {
    [tempoModerato.id]: webSocket(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
