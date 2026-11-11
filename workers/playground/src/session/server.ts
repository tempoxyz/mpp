// MPP Session Playground (mpp.dev/playground/session): a story API on Cloudflare Workers that
// bills per word over a Tempo payment session.
//
//   GET  /api/story[/<topic>]   402 with a session Challenge; with a Credential, an SSE stream
//                               of a short story, one word per event, each paid with a voucher.
//   POST /api/story[/<topic>]   Session updates (open, voucher, top-up, close) on the same route.
//
// The topic is a path segment, not a query: the client posts vouchers to the stream's URL, and
// mppx treats a POST with a query string as a paid content request rather than a voucher.
//
// The buyer reserves a deposit once (open), pays each word with a voucher, and closes to settle
// what it spent and get the rest back.
import { Mppx, Store, tempo } from "mppx/server";
import { createClient, type Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";

import * as Keys from "./keys.js";
import { price, suggestedDeposit, unit } from "./prices.js";
import * as Story from "./story.js";
import * as Topic from "./topic.js";

// The Durable Object class that stores session channels, bound as `MPPX_STORE`.
export class MppxStore extends Store.DurableObjectStore {}

type Env = Story.Env & {
  /** Durable Object namespace of {@link MppxStore}. */
  MPPX_STORE: Store.durableObject.Namespace;
  /** Payee account key: receives payments and signs settlement and close transactions. */
  MPP_PRIVATE_KEY: string;
  /** The host buyers pay at, which session clients check Challenges against. Defaults to mpp.dev. */
  MPP_REALM?: string | undefined;
  /** Secret that binds challenge IDs. Optional: derived from MPP_PRIVATE_KEY. */
  MPP_SECRET_KEY?: string | undefined;
  /** Optional Tempo RPC URL. Defaults to the public testnet RPC. */
  TEMPO_RPC_URL?: string | undefined;
};

/** OUSD on Tempo: what words are priced in. */
const ousd = "0x20c0000000000000000000006a37DA5C996874BE";
/** pathUSD on Moderato: pays the payee's settlement and close fees (OUSD can't pay fees). */
const pathUsd = "0x20c0000000000000000000000000000000000000";

let app: ReturnType<typeof createApp> | undefined;
function createApp(env: Env) {
  const account = privateKeyToAccount(env.MPP_PRIVATE_KEY as Hex);
  const client = createClient({
    chain: Chain.testnet,
    transport: http(env.TEMPO_RPC_URL),
  });
  const mppx = Mppx.create({
    methods: [
      tempo.session({
        account,
        chainId: Chain.testnet.id,
        currencies: [ousd],
        feeToken: pathUsd,
        getClient: () => client,
        // Workers can't resolve a promise across requests: the stream polls the store for the
        // next voucher instead.
        sse: { poll: true },
        store: Store.durableObject(env.MPPX_STORE),
        // A word is a voucher: accept each against channel state read in the last minute
        // instead of reading the chain per word. Far inside Tempo's 900-second close grace period.
        voucherStateMaxAge: 60_000,
      }),
    ],
    // Buyers reach the Worker through mpp.dev's proxy, so the request hostname is the Worker's own.
    realm: env.MPP_REALM?.trim() || "mpp.dev",
    secretKey:
      env.MPP_SECRET_KEY?.trim() || Keys.secretKey(env.MPP_PRIVATE_KEY),
  });
  return {
    account,
    client,
    funded: undefined as Promise<void> | undefined,
    mppx,
  };
}

/** The path mpp.dev serves the playground under. */
const base = "/playground/session";

export default {
  async fetch(
    request: Request,
    env: Env,
    context: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<Response> {
    const url = new URL(request.url);
    // The bare Worker and the unslashed path open the playground.
    if (url.pathname === "/" || url.pathname === base)
      return Response.redirect(new URL(`${base}/`, url), 302);
    if (!url.pathname.startsWith(`${base}/`))
      return new Response("Not found", { status: 404 });
    const path = url.pathname.slice(base.length);
    app ??= createApp(env);

    if (path === "/api/health") return Response.json({ status: "ok" });

    if (path === "/api/config")
      return Response.json({
        chainId: Chain.testnet.id,
        currency: ousd,
        payee: app.account.address,
        price,
        suggestedDeposit,
        unit,
      });

    if (path === "/api/story" || path.startsWith("/api/story/")) {
      // The payee signs settlement and close transactions: keep it in testnet gas.
      app.funded ??= fund(app).catch(() => {
        if (app) app.funded = undefined;
      });
      context.waitUntil(app.funded);
      return story(request, { env, mppx: app.mppx });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function story(
  request: Request,
  parameters: { env: Env; mppx: ReturnType<typeof createApp>["mppx"] },
): Promise<Response> {
  const { env, mppx } = parameters;
  const { pathname } = new URL(request.url);
  const at = pathname.indexOf("/api/story/");
  const raw =
    at === -1 ? null : safeDecode(pathname.slice(at + "/api/story/".length));
  const topic = Topic.topic(raw);

  const result = await mppx.session({
    amount: price,
    // Enough for most of a story: buyers reserve this once (up to their maxDeposit) and top up
    // when a stream runs past it, instead of a transaction per word.
    suggestedDeposit,
    unitType: unit,
  })(request);
  if (result.status === 402) return result.challenge;

  // Session updates (open, voucher, top-up, close) carry their own response.
  try {
    return await result.withReceipt();
  } catch (error) {
    if (!Mppx.isMissingReceiptResponseError(error)) throw error;
  }

  // The story is written before the first word is charged, so a slow model never holds a voucher.
  const words = await Story.write({ env, topic });
  return result.withReceipt(async function* (stream) {
    for (const word of words) {
      await stream.charge();
      yield word;
    }
  });
}

/** A percent-decoded path segment, or an empty string when it doesn't decode. */
function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}

/** Tops the payee up from the testnet faucet when its gas runs low. */
async function fund(app: ReturnType<typeof createApp>) {
  const { amount } = await Actions.token.getBalance(app.client, {
    account: app.account.address,
    token: pathUsd,
  });
  if (amount >= 10_000_000n) return;
  await Actions.faucet.fund(app.client, { account: app.account.address });
}
