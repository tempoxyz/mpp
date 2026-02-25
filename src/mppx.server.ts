import { Mppx, tempo } from "mppx/server";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

const realm = process.env.REALM ?? "mpp.tempo.xyz";
const account = privateKeyToAccount(
  process.env.FEE_PAYER_PRIVATE_KEY as `0x${string}`,
);

export const mppx = Mppx.create({
  realm,
  methods: [
    tempo({
      account,
      feePayer: true,
      currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
      sse: true,
      getClient() {
        return createClient({
          chain: tempoModerato,
          transport: http(
            import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
          ),
        });
      },
      testnet: true,
    }),
  ],
});
