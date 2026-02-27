import { Mppx, tempo } from "mppx/client";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

let _proxyFetch: typeof globalThis.fetch | null = null;

export function getProxyFetch(): typeof globalThis.fetch | null {
  if (_proxyFetch) return _proxyFetch;

  const privateKey = process.env.FEE_PAYER_PRIVATE_KEY;
  if (!privateKey) return null;

  let account: ReturnType<typeof privateKeyToAccount>;
  try {
    account = privateKeyToAccount(privateKey as `0x${string}`);
  } catch {
    return null;
  }

  const { fetch } = Mppx.create({
    polyfill: false,
    methods: [
      tempo({
        account,
        maxDeposit: "1",
        getClient: () =>
          createClient({
            chain: tempoModerato,
            transport: http(
              import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
            ),
          }),
      }),
    ],
  });

  _proxyFetch = fetch;
  return fetch;
}
