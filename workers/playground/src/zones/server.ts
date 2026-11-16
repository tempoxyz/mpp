// MPP Zones Playground (mpp.dev/playground/zones): pay for a fortune from a private Zone balance,
// and see what each party learns.
//
//   GET  /api/config      where the Tempo chain and the Zone are, the price and the merchant.
//   POST /api/rpc/tempo   Tempo JSON-RPC for the page: reads, sends and the testnet faucet.
//   POST /api/rpc/zone    Zone JSON-RPC for the page. The Zone answers only with the caller's
//                         X-Authorization-Token, so each visitor reads only their own account.
//   GET  /api/fortune     402 with a charge Challenge that accepts the Zone; with a zone
//                         Credential, a fortune, what the merchant saw and a Receipt.
//   GET  /api/ledger      the merchant's latest Zone payments, as anyone reads them on Tempo.
//   POST /api/crowd       a few decoy buyers pay from the same Zone at once.
import { Challenge, Credential } from "mppx";
import { Mppx, Store, tempo } from "mppx/server";
import {
  type Address,
  concat,
  createClient,
  type Hex,
  http,
  keccak256,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getLogs } from "viem/actions";
import { Abis, Actions, Addresses, Chain } from "viem/tempo";

import * as Fortunes from "../charge/fortunes.js";
import { ChargeStore } from "../shared/charge-server.js";
import * as Keys from "../shared/keys.js";
import { price } from "./prices.js";
import * as Zone from "./zone.js";

export { ChargeStore };

export type Env = {
  /** Spent Credentials and sender tags, shared with the charge playground's store. */
  CHARGE_STORE: Store.durableObject.Namespace;
  /** Payee account key: receives every payment, and derives the decoy buyers' keys. */
  MPP_PRIVATE_KEY: string;
  /** The host buyers pay at. Defaults to mpp.dev. */
  MPP_REALM?: string | undefined;
  /** Tempo RPC URL. Defaults to Moderato's public RPC. */
  TEMPO_RPC_URL?: string | undefined;
  /** Tempo chain ID. Defaults to Moderato (42431). */
  TEMPO_CHAIN_ID?: string | undefined;
  /** The Zone's ID: without it the page says no Zone is configured. */
  ZONE_ID?: string | undefined;
  /** The Zone's chain ID. */
  ZONE_CHAIN_ID?: string | undefined;
  /** The Zone's redacted (account-scoped) RPC URL. */
  ZONE_RPC_URL?: string | undefined;
  /** Optional Tempo API key for a Zone RPC behind api.tempo.xyz. */
  ZONE_RPC_API_KEY?: string | undefined;
  /** The token the Zone holds and the merchant is paid in. Defaults to pathUSD. */
  ZONE_CURRENCY?: string | undefined;
  /** Shown on the page. Defaults to "Playground Zone". */
  ZONE_NAME?: string | undefined;
};

/** The path mpp.dev serves the playground under. */
const base = "/playground/zones";
/** pathUSD: every Zone on Tempo can hold it, and it pays Zone gas. */
const pathUsd = "0x20c0000000000000000000000000000000000000";
/** How many decoy buyers pay with each crowd. */
const crowdSize = 3;

/** JSON-RPC methods the page may send through the proxy: reads, sends and the testnet faucet. */
const methods = {
  common: new Set([
    "eth_blockNumber",
    "eth_call",
    "eth_chainId",
    "eth_estimateGas",
    "eth_feeHistory",
    "eth_fillTransaction",
    "eth_gasPrice",
    "eth_getBalance",
    "eth_getBlockByNumber",
    "eth_getLogs",
    "eth_getTransactionByHash",
    "eth_getTransactionCount",
    "eth_getTransactionReceipt",
    "eth_maxPriorityFeePerGas",
    "eth_sendRawTransaction",
    "eth_sendRawTransactionSync",
  ]),
  tempo: new Set(["tempo_fundAddress"]),
  zone: new Set([
    "zone_getAuthorizationTokenInfo",
    "zone_getWithdrawalFee",
    "zone_getZoneInfo",
  ]),
};

type App = ReturnType<typeof create>;
let app: App | undefined;

function create(env: Env) {
  const account = privateKeyToAccount(env.MPP_PRIVATE_KEY as Hex);
  const tempoRpc =
    env.TEMPO_RPC_URL?.trim() || "https://rpc.moderato.tempo.xyz";
  const chainId = Number(env.TEMPO_CHAIN_ID ?? 42431);
  const zoneId = env.ZONE_ID ? Number(env.ZONE_ID) : undefined;
  const currency = (env.ZONE_CURRENCY?.trim() || pathUsd) as Address;
  const config: Zone.Config = {
    chainId,
    currency,
    payee: account.address,
    portal: zoneId ? Addresses.zonePortal(zoneId) : Addresses.zonePortal(1),
    price,
    zone:
      zoneId && env.ZONE_CHAIN_ID && env.ZONE_RPC_URL
        ? {
            chainId: Number(env.ZONE_CHAIN_ID),
            id: zoneId,
            name: env.ZONE_NAME?.trim() || "Playground Zone",
          }
        : undefined,
  };
  const client = createClient({
    chain: { ...Chain.testnet, id: chainId } as typeof Chain.testnet,
    transport: http(tempoRpc),
  });
  const mppx = Mppx.create({
    methods: [
      tempo.charge({
        chainId,
        currency,
        getClient: () => client,
        recipient: account.address,
        // Each sender tag pays once, across every Worker instance.
        store: Store.durableObject(env.CHARGE_STORE),
        // Accept payments from this Zone; others still pay on Tempo.
        ...(config.zone ? { zones: [config.zone.id] } : {}),
      }),
    ],
    realm: env.MPP_REALM?.trim() || "mpp.dev",
    secretKey: Keys.secretKey(env.MPP_PRIVATE_KEY, "zones"),
  });

  async function fortune(request: Request) {
    const result = await mppx.charge({
      amount: price,
      description: "A private fortune",
    })(request);
    if (result.status === 402) return result.challenge;
    // What the merchant learned from the Credential: no payer, only the Zone's withdrawal.
    const credential = Credential.fromRequest<Record<string, unknown>>(request);
    const payload = credential.payload;
    const seen = {
      hash: payload.hash,
      senderTag: payload.senderTag,
      source: credential.source ?? null,
      type: payload.type,
      zoneId: payload.zoneId,
    };
    return result.withReceipt(Response.json({ ...Fortunes.draw(), seen }));
  }

  return { account, chainId, client, config, env, fortune, tempoRpc };
}

export default {
  async fetch(
    request: Request,
    env: Env,
    context?: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === base)
      return Response.redirect(new URL(`${base}/`, url), 302);
    if (!url.pathname.startsWith(`${base}/`))
      return new Response("Not found", { status: 404 });
    const path = url.pathname.slice(base.length);
    app ??= create(env);

    if (path === "/api/health") return Response.json({ status: "ok" });
    if (path === "/api/config") return Response.json(app.config);
    if (path === "/api/fortune") return app.fortune(request);
    if (path === "/api/ledger") return ledger(app);
    if (path === "/api/rpc/tempo" && request.method === "POST")
      return relay(request, app.tempoRpc, methods.tempo);
    if (path === "/api/rpc/zone" && request.method === "POST") {
      if (!env.ZONE_RPC_URL) return new Response("No Zone", { status: 404 });
      return relay(request, env.ZONE_RPC_URL, methods.zone, {
        ...(env.ZONE_RPC_API_KEY
          ? { "tempo-api-key": env.ZONE_RPC_API_KEY }
          : {}),
        // The caller's own token: the Zone scopes every answer to that account.
        ...(request.headers.get("x-authorization-token")
          ? {
              "x-authorization-token": request.headers.get(
                "x-authorization-token",
              )!,
            }
          : {}),
      });
    }
    if (path === "/api/crowd" && request.method === "POST") {
      const running = crowd(app, url);
      context?.waitUntil(running);
      return Response.json({ buyers: crowdSize });
    }
    return new Response("Not found", { status: 404 });
  },
};

/** Forwards allowed JSON-RPC calls to url. */
async function relay(
  request: Request,
  url: string,
  extra: Set<string>,
  headers: Record<string, string> = {},
) {
  const body = (await request.json().catch(() => undefined)) as
    | { method?: unknown }
    | { method?: unknown }[]
    | undefined;
  const calls = Array.isArray(body) ? body : [body];
  if (
    !body ||
    calls.length > 20 ||
    !calls.every(
      (call) =>
        typeof call?.method === "string" &&
        (methods.common.has(call.method) || extra.has(call.method)),
    )
  )
    return Response.json(
      {
        error: { code: -32601, message: "Method not allowed" },
        id: null,
        jsonrpc: "2.0",
      },
      { status: 400 },
    );
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
  });
  return new Response(response.body, {
    headers: { "content-type": "application/json" },
    status: response.status,
  });
}

/** The merchant's latest Zone payments, read from Tempo like anyone can. */
async function ledger(app: App) {
  const latest = await app.client.request({ method: "eth_blockNumber" });
  const toBlock = BigInt(latest);
  const fromBlock = toBlock > 5_000n ? toBlock - 5_000n : 0n;
  const event = Abis.zonePortal.find(
    (item) => item.type === "event" && item.name === "WithdrawalProcessed",
  ) as never;
  const logs = (await getLogs(app.client, {
    address: app.config.portal,
    args: { to: app.config.payee },
    event,
    fromBlock,
    toBlock,
  } as never)) as unknown as {
    args: { amount: bigint; senderTag: Hex; token: Address };
    blockNumber: bigint;
    logIndex: number;
    transactionHash: Hex;
  }[];
  const payments = logs
    .slice(-12)
    .reverse()
    .map((log) => ({
      amount: log.args.amount.toString(),
      block: log.blockNumber.toString(),
      from: app.config.portal,
      senderTag: log.args.senderTag,
      transaction: log.transactionHash,
    }));
  return Response.json(
    { payments },
    { headers: { "cache-control": "no-store" } },
  );
}

/**
 * Decoy buyers: a few accounts that buy from the same Zone at the same moment, so the
 * merchant's ledger shows several identical payments from the portal. A buyer with too little
 * in the Zone tops itself up (testnet faucet, then a deposit) and sits this crowd out.
 */
async function crowd(app: App, url: URL) {
  const zone = app.config.zone;
  if (!zone || !app.env.ZONE_RPC_URL) return;
  const fortuneUrl = new URL(`${base}/api/fortune`, url);
  await Promise.allSettled(
    Array.from({ length: crowdSize }, async (_, index) => {
      const account = privateKeyToAccount(
        keccak256(
          concat([
            app.env.MPP_PRIVATE_KEY as Hex,
            toHex(`mpp-zones-playground/decoy/${index}`),
          ]),
        ),
      );
      const tempoClient = Zone.tempoClient(app.config, app.tempoRpc, account);
      const { authorize, client } = Zone.zoneClient(
        app.config,
        app.env.ZONE_RPC_URL!,
        account,
      );
      await authorize();
      const balance = await Zone.zoneBalance(client, app.config.currency);
      if (balance < 50_000n) {
        await tempoClient.request({
          method: "tempo_fundAddress",
          params: [account.address],
        } as never);
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        await Zone.deposit(tempoClient, app.config, 5_000_000n);
        return;
      }
      // A little jitter, so the decoys and the visitor land in any order.
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 1_500),
      );
      const challengeResponse = await app.fortune(new Request(fortuneUrl));
      const challenge = Challenge.fromResponse(challengeResponse);
      const paid = await Zone.payFromZone({
        challenge,
        config: app.config,
        tempo: tempoClient,
        zone: client,
      });
      await app.fortune(
        new Request(fortuneUrl, {
          headers: { authorization: paid.credential },
        }),
      );
    }),
  );
}
