// MPP Identity Playground (mpp.dev/playground/identity): a paid haiku API on Cloudflare Workers that gets cheaper and more
// personal the more the caller proves about themselves.
//
//   GET /api/haiku   402 at the price of the best tier the request's proofs verify (an email
//                    attestation the client got up front, an API key).
//       ?topic=      a custom topic: verified callers only (403 for anonymous).
//                    Anonymous callers get Tiers.anonymousDailyLimit haikus a day (429 after).
//
// The email issuer (the "email worker") runs under /issuer in this same Worker.
import { Receipt } from "mppx";
import { Mppx, Store, tempo } from "mppx/server";
import { createClient, type Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain } from "viem/tempo";

import * as Haiku from "./haiku.js";
import * as Issuer from "./issuer.js";
import * as Keys from "./keys.js";
import * as Tiers from "./tiers.js";
import * as Trace from "./trace.js";

// The Durable Object class that stores spent credentials and pending codes, bound as `MPPX_STORE`.
export class MppxStore extends Store.DurableObjectStore {
  // Each key lives in its own object: schedule its deletion when an issuer record expires.
  protected override onWrite(
    key: string,
    _previous: unknown,
    next: unknown,
    storage: Store.DurableObjectStore.Storage,
  ) {
    const at = Issuer.expiry(key, next);
    if (at !== undefined) return storage.setAlarm?.(at);
  }

  override async alarm() {
    await super.alarm();
    if (this.isReplayShard()) return;
    const key = this.state.id?.name;
    if (!key) return;
    // Values are stored as JSON text; a later write may have pushed the expiry out.
    const raw = await this.storage.get(key);
    const at = Issuer.expiry(
      key,
      typeof raw === "string" ? JSON.parse(raw) : raw,
    );
    if (at === undefined || at <= Date.now()) await this.storage.delete(key);
    else await this.storage.setAlarm?.(at);
  }
}

type Env = Issuer.Env &
  Haiku.Env & {
    /** Durable Object namespace of {@link MppxStore}. */
    MPPX_STORE: Store.durableObject.Namespace;
    /** Payee account key: receives payments and pays gas as the fee payer. */
    MPP_PRIVATE_KEY: string;
    /** Secret that binds challenge IDs. Optional: derived from MPP_PRIVATE_KEY. */
    MPP_SECRET_KEY?: string | undefined;
    /** This deployment's public origin, when the request URL is not it (behind a proxy). */
    PUBLIC_ORIGIN?: string | undefined;
    /** Local development behind a proxy only: take the origin from X-Forwarded-Host. */
    TRUST_FORWARDED_HOST?: string | undefined;
    /** Behind mpp.dev's Vercel rewrite only: take the caller's IP from X-Real-IP. */
    TRUST_PROXY_IP?: string | undefined;
    /** Optional Tempo RPC URL. Defaults to the public testnet RPC. */
    TEMPO_RPC_URL?: string | undefined;
  };

const apps = new Map<string, ReturnType<typeof createApp>>();
function createApp(env: Env, origin: string) {
  console.log(`Serving ${origin}`);
  const issuer = `${origin}${base}${Issuer.path}`;
  const store = Store.durableObject(env.MPPX_STORE);
  const account = privateKeyToAccount(env.MPP_PRIVATE_KEY as Hex);
  const client = createClient({
    chain: Chain.testnet,
    transport: http(env.TEMPO_RPC_URL),
  });
  const mppx = Mppx.create({
    secretKey:
      env.MPP_SECRET_KEY?.trim() || Keys.secretKey(env.MPP_PRIVATE_KEY),
    methods: [
      tempo({
        account,
        chainId: Chain.testnet.id,
        currency: "0x20c0000000000000000000006a37DA5C996874BE", // OUSD on Tempo
        // No feePayer: the payer pays its own network fee in pathUSD (OUSD can't pay fees).
        // Moderato's sponsored simulation rejects fee-payer transactions as of 2026-11-09.
        getClient: () => client,
        recipient: account.address,
        store,
      }),
    ],
  });
  const tiers = Tiers.create({ audience: origin, env, issuer });
  return { issuer, mppx, store: store as unknown as Issuer.Store, tiers };
}

/** The path mpp.dev serves the playground under. */
const base = "/playground/identity";

export default {
  async fetch(incoming: Request, env: Env): Promise<Response> {
    // Behind the Vercel rewrite every request comes from Vercel: rate limits key on the
    // caller's IP Vercel saw, under the address that forwarded it (Issuer.clientKey).
    const request = (() => {
      const forwarded =
        incoming.headers.get("x-real-ip") ??
        incoming.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = env.TRUST_PROXY_IP === "true" && forwarded;
      if (!ip) return incoming;
      const headers = new Headers(incoming.headers);
      headers.set(
        "x-playground-via",
        incoming.headers.get("cf-connecting-ip") ?? "local",
      );
      headers.set("cf-connecting-ip", ip);
      return new Request(incoming, { headers });
    })();
    const url = new URL(request.url);
    if (!url.pathname.startsWith(`${base}/`))
      return new Response("Not found", { status: 404 });
    url.pathname = url.pathname.slice(base.length);
    const origin = publicOrigin(request, env);
    const app = apps.get(origin) ?? createApp(env, origin);
    apps.set(origin, app);
    const trace = Trace.create();

    if (url.pathname === "/api/health") return Response.json({ status: "ok" });

    if (url.pathname === "/api/config")
      return Response.json({
        issuer: app.issuer,
        limit: Tiers.anonymousDailyLimit,
        origin,
        prices: Tiers.prices,
      });

    // The demo inbox: the message the issuer would have emailed, while the code is pending.
    if (url.pathname.startsWith("/api/inbox/")) {
      const message = await Issuer.inbox(
        app.store,
        url.pathname.slice("/api/inbox/".length),
      );
      return message
        ? Response.json(message)
        : Response.json({ error: "No message." }, { status: 404 });
    }

    if (url.pathname.startsWith(`${Issuer.path}/`)) {
      // The issuer routes on its own paths, without the playground prefix.
      const response = await Issuer.handle(new Request(url, request), {
        env,
        issuer: app.issuer,
        store: app.store,
        trace,
      });
      return trace.attach(
        response ?? Response.json({ error: "Not found." }, { status: 404 }),
      );
    }

    if (url.pathname === "/api/haiku")
      return trace.attach(await haiku(request, { app, env, trace }));

    return new Response("Not found", { status: 404 });
  },
};

async function haiku(
  request: Request,
  parameters: {
    app: ReturnType<typeof createApp>;
    env: Env;
    trace: Trace.Trace;
  },
): Promise<Response> {
  const { app, env, trace } = parameters;
  const { mppx, tiers } = app;
  const url = new URL(request.url);
  const paid = request.headers.has("Authorization");
  // step: request
  trace.step(
    "request",
    `${request.method} ${url.pathname}${url.search}${paid ? " with payment" : ""}`,
  );

  // The best tier the caller's proofs reach: the server infers it, the client never asks.
  // step: tier
  const tier = await tiers.resolve(request, trace);
  // A proof that was sent but failed (an unknown key) is rejected, never priced as anonymous.
  // step: identity.rejected
  const rejected = await tiers.rejection(request);
  if (rejected) {
    trace.step("identity.rejected", rejected.reason);
    return Response.json({ error: rejected.reason }, { status: rejected.code });
  }
  trace.step("tier", `${tier} at ${Tiers.prices[tier]} OUSD`);

  // step: topic
  // Custom topics are for callers who proved something: refused before any charge.
  const raw = url.searchParams.get("topic");
  const topic = Tiers.topic(raw);
  if (raw !== null && !topic)
    return Response.json(
      { error: "A topic is up to 40 letters, digits and spaces." },
      { status: 400 },
    );
  if (topic && tier === "anonymous") {
    trace.step("topic", "refused: anonymous");
    return Response.json(
      {
        error:
          "Custom topics are for verified buyers: verify an email or use an API key.",
      },
      { status: 403 },
    );
  }

  // step: quota
  // Anonymous callers get a few haikus a day per IP; any verified proof lifts the limit.
  const quota = tier === "anonymous" ? quotaKey(request) : undefined;
  // A paid request reserves its haiku atomically, so concurrent ones can't pass the limit
  // together; the reservation is released if the payment doesn't go through.
  let reserved: number | undefined;
  if (quota) {
    const used = paid
      ? await reserve(app.store, quota)
      : await usedToday(app.store, quota);
    if (paid && used !== undefined) reserved = used;
    if (used === undefined || (!paid && used >= Tiers.anonymousDailyLimit)) {
      const count = Tiers.anonymousDailyLimit;
      trace.step("quota", `refused: ${count} of ${count} today`);
      return Response.json(
        {
          error: `Anonymous buyers get ${count} haikus a day. Verify an email or use an API key for more.`,
        },
        { status: 429 },
      );
    }
  }
  // step: charge
  const verifier = tiers.verifiers[tier];
  const result = await mppx
    .charge({
      amount: Tiers.prices[tier],
      description: `A ${tier} haiku`,
      ...(verifier && { identity: [verifier] }),
    })(request)
    .catch(async (error: unknown) => {
      if (quota && reserved !== undefined) await release(app.store, quota);
      throw error;
    });
  if (result.status === 402 && quota && reserved !== undefined)
    await release(app.store, quota);

  // step: identity.required
  if (result.status === 402 && result.rejection) {
    trace.step(
      "identity.required",
      `${result.rejection.status}: ${result.rejection.reason}`,
    );
    return result.challenge;
  }
  // step: charge.challenge
  if (result.status === 402) {
    trace.step("charge.challenge", `402: pay ${Tiers.prices[tier]} OUSD`);
    const challenge = new Response(result.challenge.body, result.challenge);
    // Tells callers what proving more would get them.
    const upgrades = Object.entries(Tiers.prices)
      .filter(([name]) => Tiers.above(name as Tiers.Tier, tier))
      .map(([name, price]) => `${name};price="${price}"`);
    if (upgrades.length > 0)
      challenge.headers.set("Haiku-Upgrades", upgrades.join(", "));
    return challenge;
  }

  // step: haiku
  const profile = tiers.profile(result.identity);
  const poem = await Haiku.write(profile, { env, topic, trace });

  // step: charge.settled
  // Reserved before payment: only paid haikus use up the day's allowance.
  const remaining =
    reserved !== undefined ? Tiers.anonymousDailyLimit - reserved : undefined;
  const response = result.withReceipt(
    Response.json({
      remaining,
      topic,
      tier,
      price: Tiers.prices[tier],
      haiku: poem.lines,
      model: poem.model,
      prompt: poem.prompt,
      seen: profile.seen,
      profile,
    }),
  );
  const receipt = Receipt.fromResponse(response);
  trace.step("charge.settled", `${receipt.status}: ${receipt.reference}`);
  return response;
}

/** Today's quota counter for the caller's IP (or IPv6 /64). */
function quotaKey(request: Request) {
  return `quota:${Issuer.clientKey(request)}`;
}

type Quota = { day: string; used: number };

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Haikus the key bought today. */
async function usedToday(store: Issuer.Store, key: string) {
  const value = (await store.get(key)) as Quota | null | undefined;
  return value?.day === today() ? value.used : 0;
}

/** Reserves one more haiku today and returns the new total, or undefined at the limit. */
function reserve(store: Issuer.Store, key: string) {
  const day = today();
  return store.update(key, (current) => {
    const value = current as Quota | null | undefined;
    const used = value?.day === day ? value.used : 0;
    if (used >= Tiers.anonymousDailyLimit)
      return { op: "noop", result: undefined };
    return { op: "set", result: used + 1, value: { day, used: used + 1 } };
  });
}

/** Releases a reservation whose payment didn't go through. */
function release(store: Issuer.Store, key: string) {
  const day = today();
  return store.update(key, (current) => {
    const value = current as Quota | null | undefined;
    if (value?.day !== day || value.used === 0)
      return { op: "noop", result: undefined };
    return {
      op: "set",
      result: undefined,
      value: { day, used: value.used - 1 },
    };
  });
}

/** The origin attestations are bound to: this deployment's public origin. */
function publicOrigin(request: Request, env: Env): string {
  if (env.PUBLIC_ORIGIN) return new URL(env.PUBLIC_ORIGIN).origin;
  const host =
    env.TRUST_FORWARDED_HOST === "true" &&
    request.headers.get("X-Forwarded-Host");
  if (host)
    return `${request.headers.get("X-Forwarded-Proto") ?? new URL(request.url).protocol.slice(0, -1)}://${host.split(",")[0]!.trim()}`;
  return new URL(request.url).origin;
}
