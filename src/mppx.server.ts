import { Mppx, tempo } from "mppx/server";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";
import { mppxSecretKey } from "./mppx-secret.server";

const realm = process.env.REALM ?? "mpp.tempo.xyz";
// The well-known key is only a local/build placeholder. Production must supply
// FEE_PAYER_PRIVATE_KEY, otherwise fee sponsorship would run under a public key.
const privateKey =
  process.env.FEE_PAYER_PRIVATE_KEY ??
  (import.meta.env.DEV || process.env.npm_lifecycle_event === "build"
    ? "0x0000000000000000000000000000000000000000000000000000000000000001"
    : undefined);
if (!privateKey) {
  throw new Error("FEE_PAYER_PRIVATE_KEY is required to initialize the MPP server.");
}
const account = privateKeyToAccount(privateKey as `0x${string}`);

export const mppx = Mppx.create({
  methods: [
    tempo({
      account,
      feePayer: true,
      currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
      getClient() {
        return createClient({
          chain: tempoModerato,
          transport: http(
            import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
          ),
        });
      },
      sse: true,
      testnet: true,
    }),
  ],
  realm,
  secretKey: mppxSecretKey,
});
