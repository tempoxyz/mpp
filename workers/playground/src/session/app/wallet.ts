// Linking a Tempo Wallet with the Tempo Accounts SDK. The access key lets the page open, top up
// and close a session without a prompt: it may move a little OUSD into a payment channel, plus
// pathUSD for network fees.
import { QueryClient } from "@tanstack/react-query";
import { Expiry } from "accounts";
import { type Address, createClient, parseUnits } from "viem";
import { Actions } from "viem/tempo";
import { createConfig, http } from "wagmi";
import { tempoModerato } from "wagmi/chains";
import { tempoWallet } from "wagmi/connectors";

import { channels, ousd, pathUsd } from "./wallet-state.js";

/** The access key the page asks for: OUSD into payment channels, pathUSD for fees, for a day. */
function keyRequest() {
  return {
    expiry: Expiry.days(1),
    limits: [
      { limit: parseUnits("1", 6), token: ousd },
      { limit: parseUnits("0.5", 6), token: pathUsd },
    ],
    // The TIP-1034 channel precompile: open, top up and close.
    scopes: [{ address: channels }],
  };
}

export const config = createConfig({
  chains: [tempoModerato],
  connectors: [
    tempoWallet({
      accessKey: { authorize: keyRequest },
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

/** The parts of the Tempo Accounts provider the page uses. */
export type Provider = {
  getMppxParameters(options?: { accessKey?: Address }): unknown;
  request(args: { method: string; params?: unknown }): Promise<unknown>;
  store: {
    accessKeys: {
      list(query: { account: Address; chainId: number }): readonly KeyRecord[];
    };
  };
};

type KeyRecord = {
  address: Address;
  expiry?: number | undefined;
  limits?: readonly { limit: bigint; token: Address }[] | undefined;
  scopes?: readonly { address: Address; selector?: unknown }[] | undefined;
};

const rpc = createClient({ chain: tempoModerato, transport: http() });

/**
 * The mppx parameters that pay a session of up to `budget` OUSD with the page's access key.
 *
 * The page names its key: the Accounts SDK picks a scoped key by the calls it will make, and a
 * channel open or voucher names none, so it would fall back to the account itself and ask the
 * wallet to approve the open and every voucher. Without a usable key (expired, spent, or another
 * page's), it asks the wallet for a new one: one approval.
 */
export async function sessionParameters(
  provider: Provider,
  account: Address,
  budget: string,
) {
  const needed = parseUnits(budget, 6);
  const key =
    (await usableKey(provider, account, needed)) ??
    (await provider
      .request({
        method: "wallet_authorizeAccessKey",
        params: [encode(keyRequest())],
      })
      .then(() => usableKey(provider, account, needed)));
  if (!key) throw new Error("Tempo Wallet didn't authorize a payment key.");
  return provider.getMppxParameters({ accessKey: key });
}

/** The newest unexpired channel key with at least `needed` OUSD left to spend. */
async function usableKey(provider: Provider, account: Address, needed: bigint) {
  const now = Date.now() / 1000;
  const keys = provider.store.accessKeys
    .list({ account, chainId: tempoModerato.id })
    .filter(
      (key) =>
        (!key.expiry || key.expiry > now) &&
        // Only this page's key: the identity playground's may only transfer OUSD.
        key.scopes?.some(
          (scope) =>
            scope.address.toLowerCase() === channels.toLowerCase() &&
            !scope.selector,
        ),
    );
  for (const key of [...keys].reverse())
    if ((await remaining(account, key)) >= needed) return key.address;
  return undefined;
}

/** OUSD the key may still move: the chain's count once a transaction published it, else its limit. */
async function remaining(account: Address, key: KeyRecord) {
  try {
    const { address, isRevoked } = await Actions.accessKey.getMetadata(rpc, {
      accessKey: key.address,
      account,
    });
    if (isRevoked) return 0n;
    // The keychain answers the zero address for a key it hasn't seen yet.
    if (BigInt(address) === 0n)
      return (
        key.limits?.find((l) => l.token.toLowerCase() === ousd.toLowerCase())
          ?.limit ?? 0n
      );
    const { remaining } = await Actions.accessKey.getRemainingLimit(rpc, {
      accessKey: key.address,
      account,
      token: ousd,
    });
    return remaining;
  } catch {
    return 0n;
  }
}

/** `wallet_authorizeAccessKey` parameters as JSON-RPC carries them. */
function encode(request: ReturnType<typeof keyRequest>) {
  return {
    chainId: `0x${tempoModerato.id.toString(16)}`,
    expiry: request.expiry,
    limits: request.limits.map(({ limit, token }) => ({
      limit: `0x${limit.toString(16)}`,
      token,
    })),
    scopes: request.scopes,
  };
}
