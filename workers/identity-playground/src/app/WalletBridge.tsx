// The wallet stack (wagmi, the Tempo Accounts SDK and its mppx client), loaded after first
// paint: it is most of the page's JavaScript and opens the wallet's iframe.
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useConnect, useConnection, useConnectors, WagmiProvider } from "wagmi";
import { tempoModerato } from "wagmi/chains";
import { config, queryClient } from "./wallet.js";
import type { Wallet } from "./wallet-state.js";

/** Reports the linked Tempo Wallet to the page; renders nothing. */
export default function WalletBridge({
  onChange,
}: {
  onChange: (wallet: Wallet) => void;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Bridge onChange={onChange} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Bridge({ onChange }: { onChange: (wallet: Wallet) => void }) {
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();

  const connected = connection.status === "connected";
  const connector = connection.connector;
  const first = connectors[0];
  // biome-ignore lint/correctness/useExhaustiveDependencies: report only when what the page reads changes
  useEffect(() => {
    onChange({
      address: connected ? connection.address : undefined,
      connected,
      error: connect.error ?? undefined,
      link: () => {
        if (first)
          connect.mutate({ chainId: tempoModerato.id, connector: first });
      },
      linking: connect.isPending || connection.status === "reconnecting",
      mppx: async () => {
        if (!connected || !connector) return undefined;
        const provider = (await connector.getProvider()) as {
          getMppxParameters(): unknown;
        };
        return provider.getMppxParameters();
      },
      ready: Boolean(first),
    });
  }, [
    connection.address,
    connection.status,
    connected,
    connector,
    first,
    connect.error,
    connect.isPending,
  ]);
  return null;
}
