import { Mppx, tempo } from "mppx/server";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

const realm = import.meta.env.VITE_REALM ?? "mpp.tempo.xyz";

export const mppx = Mppx.create({
  realm,
  methods: [
    tempo.charge({
      ...(import.meta.env.VITE_FEE_PAYER_PRIVATE_KEY
        ? {
            feePayer: privateKeyToAccount(
              import.meta.env.VITE_FEE_PAYER_PRIVATE_KEY as `0x${string}`,
            ),
          }
        : {}),
      getClient() {
        const user = import.meta.env.VITE_RPC_AUTH_USER;
        const pass = import.meta.env.VITE_RPC_AUTH_PASS;
        const url = (() => {
          if (user && pass)
            return `https://${user}:${pass}@rpc.moderato.tempo.xyz`;
          return "https://rpc.moderato.tempo.xyz";
        })();
        return createClient({
          chain: tempoModerato,
          transport: http(url),
        });
      },
      testnet: true,
    }),
  ],
});
