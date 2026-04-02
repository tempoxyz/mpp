import { Mppx, stripe } from "mppx/server";

const realm = process.env.REALM ?? "mpp.tempo.xyz";

export const stripeMppx = Mppx.create({
  methods: [
    stripe({
      html: {
        createTokenUrl: "/api/demo/create-spt",
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!,
      },
      networkId: process.env.STRIPE_NETWORK_ID ?? "internal",
      paymentMethodTypes: ["card"],
      secretKey: process.env.STRIPE_SECRET_KEY!,
    }),
  ],
  realm,
  secretKey: "demo",
});
