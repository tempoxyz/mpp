import { Mppx, stripe } from "mppx/server";
import { mppxSecretKey } from "./mppx-secret.server";

const realm = process.env.REALM ?? "mpp.tempo.xyz";

export const stripeMppx = Mppx.create({
  methods: [
    stripe.spt({
      networkId: process.env.STRIPE_NETWORK_ID!,
      paymentMethodTypes: ["card"],
      secretKey: process.env.STRIPE_SECRET_KEY!,
    }),
  ],
  realm,
  secretKey: mppxSecretKey,
});
