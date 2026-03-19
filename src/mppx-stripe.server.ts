import { Mppx, stripe } from "mppx/server";

const realm = process.env.REALM ?? "mpp.tempo.xyz";

export const stripeMppx = Mppx.create({
  realm,
  methods: [
    stripe({
      networkId: process.env.STRIPE_NETWORK_ID ?? "internal",
      paymentMethodTypes: ["card"],
      secretKey: process.env.STRIPE_SECRET_KEY!,
    }),
  ],
  secretKey: "demo",
});
