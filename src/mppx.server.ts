import { Redis } from "@upstash/redis";
import { Mppx, Store, tempo } from "mppx/server";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

const realm = process.env.REALM ?? "mpp.tempo.xyz";
const account = process.env.FEE_PAYER_PRIVATE_KEY
  ? privateKeyToAccount(process.env.FEE_PAYER_PRIVATE_KEY as `0x${string}`)
  : undefined;

const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const distributed = !!(kvUrl && kvToken);
const store = distributed
  ? Store.upstash(new Redis({ url: kvUrl, token: kvToken }))
  : Store.memory();

export const mppx = Mppx.create({
  methods: [
    tempo({
      account: account!,
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
      sse: distributed ? { poll: true } : true,
      store,
      testnet: true,
    }),
  ],
  realm,
  secretKey: "demo",
});
