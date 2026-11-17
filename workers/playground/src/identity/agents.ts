// The agent tiers: three ways an automated caller proves who it is, each an mppx verifier.
//
//   poppy       a Personal Agent's Session (Poppy-Session): a pseudonymous user, through an agent
//   erc8004     an agent in the ERC-8004 Identity Registry on Moderato, signing with its wallet
//   webBotAuth  a bot signing requests (RFC 9421) with a key from its HTTPS directory
//
// The Personal Agent is a demo one this Worker runs: its key is derived from MPP_PRIVATE_KEY,
// and it delegates a key to each browser that asks (POST /api/poppy/delegation). The bot is
// Cloudflare's research demo bot, whose directory publishes the RFC 9421 test key.
import * as Erc8004 from "mppx/extensions/identity/erc8004";
import * as Poppy from "mppx/extensions/identity/poppy";
import * as WebBotAuth from "mppx/extensions/identity/web-bot-auth";
import type { Store } from "mppx/server";
import { concat, toBytes } from "viem";

import * as Keys from "./keys.js";

/** The ERC-8004 Identity Registry on Tempo Moderato (the address every testnet uses). */
export const registry = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
/** Tempo Moderato. */
export const chainId = 42431;

/** The demo Personal Agent's client_id. This Worker serves its metadata and keys in process. */
export const poppyClientId =
  "https://mpp.dev/playground/identity/api/agent.json";
const poppyJwksUri = "https://mpp.dev/playground/identity/api/agent-jwks.json";
const poppyKid = "playground-agent-1";

/** Cloudflare's demo bot directory: it publishes the RFC 9421 test key (test-key-ed25519). */
export const botDirectory =
  "https://http-message-signatures-example.research.cloudflare.com";

/** The demo bot's public key, as its directory publishes it, for when the directory is unreachable. */
const botKey = {
  crv: "Ed25519",
  kty: "OKP",
  x: "JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs",
} as const;

export type Env = {
  MPP_PRIVATE_KEY: string;
  TEMPO_RPC_URL?: string | undefined;
};

/** PKCS#8 header of a P-256 private key without its public key; the 32-byte scalar follows it. */
const p256Pkcs8 = toBytes(
  "0x3041020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420",
);

type AgentKey = { privateKey: CryptoKey; publicJwk: JsonWebKey };
// Resolved values only, never pending promises: a promise one request created can't be awaited by another.
let agentKey: AgentKey | undefined;
let botPublicKey: CryptoKey | undefined;

/** The demo Personal Agent's ES256 key, derived from the payee key like the issuer's. */
async function poppyKey(env: Env): Promise<AgentKey> {
  if (agentKey) return agentKey;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(
      concat([p256Pkcs8, Keys.derive(env.MPP_PRIVATE_KEY, "poppy-agent-p256")]),
    ),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );
  const { crv, kty, x, y } = (await crypto.subtle.exportKey(
    "jwk",
    privateKey,
  )) as JsonWebKey;
  agentKey = {
    privateKey,
    publicJwk: {
      alg: "ES256",
      crv,
      kid: poppyKid,
      kty,
      use: "sig",
      x,
      y,
    } as JsonWebKey,
  };
  return agentKey;
}

/**
 * The demo Personal Agent's client metadata and JWKS, which any verifier fetches from
 * https://mpp.dev/playground/identity/api/agent.json and agent-jwks.json.
 */
export async function metadata(
  env: Env,
  url: string,
): Promise<Response | undefined> {
  if (url === poppyClientId)
    return Response.json({
      client_id: poppyClientId,
      client_name: "MPP Playground Agent",
      jwks_uri: poppyJwksUri,
    });
  if (url === poppyJwksUri)
    return Response.json({ keys: [(await poppyKey(env)).publicJwk] });
  return undefined;
}

/** The agent verifiers of one deployment, bound to its origin. */
export function create(parameters: {
  audience: string;
  env: Env;
  store: Store.AtomicStore;
}) {
  const { audience, env, store } = parameters;

  // step: identity.poppy
  // The agent's metadata and keys come from this Worker: a Worker can't fetch its own URL.
  const poppy = Poppy.Server.verifier({
    audience,
    clients: [poppyClientId],
    fetch: async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      return (
        (await metadata(env, url)) ?? new Response("Not found", { status: 404 })
      );
    },
  });

  // step: identity.erc8004
  const erc8004 = Erc8004.Server.create({
    chainId,
    registry,
    rpcUrl: env.TEMPO_RPC_URL ?? "https://rpc.moderato.tempo.xyz",
    store,
  }).verifier;

  // step: identity.webBotAuth
  // Trusts one directory, Cloudflare's demo bot, and never fetches one a caller names.
  const webBotAuth = WebBotAuth.Server.verifier({
    async keyResolver({ keyId, signatureAgent }) {
      if (signatureAgent !== botDirectory) return undefined;
      if (keyId !== (await Keys.thumbprint(botKey))) return undefined;
      botPublicKey ??= await loadBotKey();
      return botPublicKey;
    },
    nonceStore: store,
  });

  return { erc8004, poppy, webBotAuth };
}

/** The demo bot's key from its directory, else the RFC 9421 test key it publishes. */
async function loadBotKey(): Promise<CryptoKey> {
  const listed = await fetch(
    botDirectory + "/.well-known/http-message-signatures-directory",
    { signal: AbortSignal.timeout(3_000) },
  )
    .then((r) => (r.ok ? r.json() : undefined))
    .then((d) =>
      (d as { keys?: JsonWebKey[] } | undefined)?.keys?.find(
        (k) => k.kty === "OKP" && k.x === botKey.x,
      ),
    )
    .catch(() => undefined);
  const { crv, kty, x } = listed ?? botKey;
  return crypto.subtle.importKey(
    "jwk",
    { crv, kty, x },
    { name: "Ed25519" },
    true,
    ["verify"],
  );
}

/**
 * Signs a delegation from the demo Personal Agent to a browser's ES256 key, for an hour.
 * Any visitor may ask: the agent vouches for a key, not for a person.
 */
export async function delegate(env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => undefined)) as
    | { publicKey?: JsonWebKey }
    | undefined;
  const jwk = body?.publicKey;
  if (
    !jwk ||
    jwk.kty !== "EC" ||
    jwk.crv !== "P-256" ||
    typeof jwk.x !== "string" ||
    typeof jwk.y !== "string" ||
    "d" in jwk
  )
    return Response.json(
      { error: "Send the public half of a P-256 key as publicKey." },
      { status: 400 },
    );
  const { privateKey } = await poppyKey(env);
  const expiresIn = 3600;
  const delegation = await Poppy.Client.delegate({
    clientId: poppyClientId,
    expiresIn,
    key: { kid: poppyKid, privateKey },
    publicKey: { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y },
  });
  return Response.json({
    clientId: poppyClientId,
    delegation,
    expiresAt: Date.now() + expiresIn * 1000,
  });
}
