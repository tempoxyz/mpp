import { Mppx, tempo } from "mppx/server";
import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

const realm = process.env.REALM ?? "mpp.tempo.xyz";
const account = privateKeyToAccount(
  (process.env.FEE_PAYER_PRIVATE_KEY ??
    "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`,
);

export const mppx = Mppx.create({
  methods: [
    tempo({
      account,
      currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
      feePayer: true,
      getClient() {
        return createClient({
          chain: tempoModerato,
          transport: http(
            import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
          ),
        });
      },
      html: {
        theme: {
          logo: { dark: "/logo-dark.svg", light: "/logo-light.svg" },
          accent: ["#000000", "#ffffff"],
          background: ["#ffffff", "#0a0a0a"],
          border: ["#e5e5e5", "#262626"],
          colorScheme: "light dark",
          fontFamily: "'Geist', system-ui, sans-serif",
          fontSizeBase: "16px",
          foreground: ["#0a0a0a", "#fafafa"],

          muted: ["#737373", "#a3a3a3"],
          negative: ["#ef4444", "#f87171"],
          positive: ["#22c55e", "#4ade80"],
          radius: "8px",
          spacingUnit: "4px",
          surface: ["#f5f5f5", "#171717"],
        },
        text: {
          title: "Payment link demo",
        },
      },
      sse: true,
      testnet: true,
    }),
  ],
  realm,
  secretKey: "demo",
});
