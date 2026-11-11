// The charge side shared by the charge and discovery playgrounds: one mppx instance that takes
// a single OUSD payment per request on Moderato testnet.
import { Mppx, Store, tempo } from "mppx/server";
import { createClient, type Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain } from "viem/tempo";

import * as Keys from "./keys.js";

/** The Durable Object class that holds spent charge credentials, bound as `CHARGE_STORE`. */
export class ChargeStore extends Store.DurableObjectStore {}

export type Env = {
  /** Durable Object namespace of {@link ChargeStore}: replay protection for charges. */
  CHARGE_STORE: Store.durableObject.Namespace;
  /** Payee account key: receives every payment. */
  MPP_PRIVATE_KEY: string;
  /** The host buyers pay at. Defaults to mpp.dev. */
  MPP_REALM?: string | undefined;
  /** Optional Tempo RPC URL. Defaults to the public testnet RPC. */
  TEMPO_RPC_URL?: string | undefined;
};

/** OUSD on Tempo: what everything is priced in. */
export const ousd = "0x20c0000000000000000000006a37DA5C996874BE";

/** Creates the mppx instance a playground charges with. */
export function create(env: Env, playground: string) {
  const account = privateKeyToAccount(env.MPP_PRIVATE_KEY as Hex);
  const client = createClient({
    chain: Chain.testnet,
    transport: http(env.TEMPO_RPC_URL),
  });
  const mppx = Mppx.create({
    methods: [
      tempo.charge({
        account,
        currency: ousd,
        // No feePayer: the payer pays its own network fee in pathUSD (OUSD can't pay fees).
        getClient: () => client,
        recipient: account.address,
        // Each payment counts once, across every Worker instance.
        store: Store.durableObject(env.CHARGE_STORE),
        testnet: true,
      }),
    ],
    // Buyers reach the Worker through mpp.dev's proxy, so the request hostname is the Worker's own.
    realm: env.MPP_REALM?.trim() || "mpp.dev",
    secretKey: Keys.secretKey(env.MPP_PRIVATE_KEY, playground),
  });
  return { account, mppx };
}
