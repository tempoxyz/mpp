// The browser's charge client: pays each 402 once with the linked Tempo Wallet or a test wallet.
import { Mppx, tempo } from "mppx/client";

/** What pays: the linked wallet's `provider.getMppxParameters()`, or `{ account }`. */
export type Wallet = NonNullable<Parameters<typeof tempo>[0]>;

export function create(options: {
  wallet: Wallet;
  /** Fetch used for every HTTP hop, so the page can show them. */
  fetch: typeof globalThis.fetch;
  /** Most to pay, in base units: a Challenge above it is refused instead of paid. */
  maxAmount?: bigint | undefined;
}) {
  const { fetch, maxAmount, wallet } = options;
  return Mppx.create({
    fetch,
    methods: [tempo(wallet)],
    polyfill: false,
    onChallenge: async (challenge, { createCredential }) => {
      const amount = BigInt(
        String((challenge.request as { amount?: unknown }).amount ?? 0),
      );
      if (maxAmount !== undefined && amount > maxAmount)
        throw new Error(
          "The 402 asked for more than the advertised price, so the page didn't pay.",
        );
      return createCredential();
    },
  });
}
