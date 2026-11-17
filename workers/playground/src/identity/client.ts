// The browser client: an mppx client that pays with your linked Tempo Wallet, plus the
// identity provers you plug in. Each prover lets it answer the server's identity requests,
// so it can ask for a cheaper tier.
import { Mppx, tempo } from "mppx/client";
import * as EmailOtp from "mppx/extensions/identity/email-otp";
import * as Erc8004 from "mppx/extensions/identity/erc8004";
import * as Poppy from "mppx/extensions/identity/poppy";
import * as WebBotAuth from "mppx/extensions/identity/web-bot-auth";
import type * as Identity from "mppx/identity";

export type Options = {
  /** How to pay: the linked wallet's `provider.getMppxParameters()`, or `{ account }`. */
  wallet: NonNullable<Parameters<typeof tempo>[0]>;
  /** This app's origin, the only one the provers may answer. */
  origin: string;
  /** The paid haiku endpoint. @default origin + '/api/haiku' */
  endpoint?: string | undefined;
  /** The email issuer the address may be sent to. */
  issuer: string;
  /** Plug in email: the address, and how to ask for the emailed code. */
  email?:
    | {
        address: string;
        code: (request: {
          email: string;
          id: string;
        }) => Promise<string | undefined>;
      }
    | undefined;
  /** Plug in an API key. */
  apiKey?: string | undefined;
  /** Plug in an agent's proof. */
  agent?: Agent | undefined;
  /**
   * Most to pay per haiku, in base units (OUSD has 6 decimals): the selected tier's price, so a
   * proof that fails (a wrong code, an unknown key) never turns into a dearer purchase.
   */
  maxAmount?: bigint | undefined;
  /** Fetch used for every HTTP hop, so the page can show them. */
  fetch?: typeof globalThis.fetch | undefined;
};

/** Creates the client and returns a function that buys one haiku. */
export function create(
  options: Options,
): (topic?: string) => Promise<Response> {
  const {
    agent,
    apiKey,
    email,
    fetch = globalThis.fetch,
    issuer,
    maxAmount,
    origin,
    wallet,
  } = options;
  const endpoint = options.endpoint ?? `${origin}/api/haiku`;
  // An empty key would silently buy the anonymous tier.
  if (apiKey === "") throw new Error("apiKey is empty");
  let mppx: Promise<ReturnType<typeof Mppx.create>> | undefined;
  // When the email attestation expires: the client is rebuilt, verifying again, before then.
  let expiresAt = Number.POSITIVE_INFINITY;

  // Builds the client once: with email, it verifies the address first, so every request
  // carries the attestation and the server prices it as email from the first 402.
  async function build() {
    const identity: Identity.Prover[] = [];

    // prover: email
    if (email) {
      const { id } = await EmailOtp.Client.sendCode({
        audience: origin,
        email: email.address,
        fetch,
        issuer,
      });
      const code = await email.code({ email: email.address, id });
      if (!code) throw new Error("No code entered.");
      const verified = await EmailOtp.Client.verifyCode({
        code,
        fetch,
        id,
        issuer,
      });
      const { attestation } = verified;
      expiresAt = verified.expiresAt.getTime();
      identity.push(
        EmailOtp.Client.prover({
          attestations: [attestation],
          email: email.address,
          code: ({ email: address, id }) => email.code({ email: address, id }),
          issuers: [issuer],
          scope: [origin],
          fetch,
        }),
      );
    }

    // prover: API key
    if (apiKey) identity.push(apiKeyProver(apiKey, origin));

    // prover: agent
    if (agent) identity.push(agentProver(agent, origin));

    return Mppx.create({
      ...(identity.length > 0 && { identity }),
      methods: [tempo(wallet)],
      fetch,
      polyfill: false,
      // Refuses a 402 above the selected tier's price instead of paying it.
      onChallenge: async (challenge, { createCredential }) => {
        const amount = BigInt(
          String((challenge.request as { amount?: unknown }).amount ?? 0),
        );
        if (maxAmount !== undefined && amount > maxAmount) throw refused;
        return createCredential();
      },
    });
  }

  // The server picks the tier from the proofs the provers attach.
  return async (topic?: string) => {
    // An attestation about to expire is replaced before the server prices the request as anonymous.
    if (Date.now() > expiresAt - 60_000) {
      mppx = undefined;
      expiresAt = Number.POSITIVE_INFINITY;
    }
    // A failed verification (a wrong code) builds again on the next purchase.
    mppx ??= build().catch((error) => {
      mppx = undefined;
      throw error;
    });
    const client = mppx;
    try {
      const url = new URL(endpoint);
      if (topic) url.searchParams.set("topic", topic);
      return await (await client).fetch(url.toString());
    } catch (error) {
      // The server priced the proof out (an attestation it no longer accepts): verify again next
      // time. Other failures, such as a dismissed wallet prompt, keep the attestation.
      if (isRefused(error) && mppx === client) mppx = undefined;
      throw error;
    }
  };
}

/** Thrown when the server asks for more than the selected tier's price. */
const refused = new Error(
  "Identity not verified: the server asked for the higher price.",
);

/** Whether `error` is `refused`, also when mppx wraps it as a cause. */
function isRefused(error: unknown): boolean {
  for (let e = error; e instanceof Error; e = e.cause)
    if (e === refused) return true;
  return false;
}

/** A prover for the server's own identity system: an API key in a header. */
function apiKeyProver(key: string, origin: string): Identity.Prover {
  return {
    scope: [origin],
    // A bearer secret: never sent across origins on a redirect.
    headers: ["x-api-key"],
    prove(request) {
      const headers = new Headers(request.headers);
      headers.set("X-Api-Key", key);
      return new Request(request, { headers });
    },
  };
}

/** Sign as an agent: the proof a Personal Agent, a registered agent or a bot attaches. */
export type Agent =
  | {
      kind: "poppy";
      /** A current delegation of the browser's key from the demo Personal Agent. */
      delegation: () => Promise<string>;
      clientId: string;
      key: CryptoKeyPair;
      jwk: JsonWebKey;
      /** The pseudonymous user the agent acts for. */
      userId: string;
    }
  | {
      kind: "erc8004";
      /** The agent's wallet, as the registry lists it. */
      account: Parameters<typeof Erc8004.Client.prover>[0]["account"];
      agentId: bigint;
      chainId: number;
      registry: `0x${string}`;
    }
  | {
      kind: "webBotAuth";
      key: CryptoKeyPair;
      /** The bot's HTTPS key directory. */
      signatureAgent: string;
    };

/** The prover for an agent. */
function agentProver(agent: Agent, origin: string): Identity.Prover {
  // step: prover.poppy
  if (agent.kind === "poppy")
    return Poppy.Client.prover({
      audience: origin,
      clientId: agent.clientId,
      delegation: agent.delegation,
      key: { jwk: agent.jwk, privateKey: agent.key.privateKey },
      scope: [origin],
      userId: agent.userId,
    });
  // step: prover.erc8004
  if (agent.kind === "erc8004")
    return Erc8004.Client.prover({
      account: agent.account,
      agentId: agent.agentId,
      chainId: agent.chainId,
      registry: agent.registry,
      scope: [origin],
    });
  // step: prover.webBotAuth
  return WebBotAuth.Client.prover({
    key: agent.key,
    scope: [origin],
    signatureAgent: agent.signatureAgent,
  });
}

/** Asks the demo Personal Agent to delegate a new browser key. */
export async function poppyAgent(parameters: {
  delegationUrl: string;
  fetch?: typeof globalThis.fetch | undefined;
  userId: string;
}): Promise<Agent> {
  const { delegationUrl, fetch = globalThis.fetch, userId } = parameters;
  const key = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const { crv, kty, x, y } = await crypto.subtle.exportKey(
    "jwk",
    key.publicKey,
  );
  const jwk = { crv, kty, x, y };
  async function request() {
    const response = await fetch(delegationUrl, {
      body: JSON.stringify({ publicKey: jwk }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok)
      throw new Error(`The agent refused the delegation (${response.status}).`);
    return (await response.json()) as {
      clientId: string;
      delegation: string;
      expiresAt: number;
    };
  }
  let current = await request();
  // Ask again a minute before the delegation expires, so a long visit keeps signing.
  async function delegation() {
    if (Date.now() > current.expiresAt - 60_000) current = await request();
    return current.delegation;
  }
  return {
    clientId: current.clientId,
    delegation,
    jwk,
    key,
    kind: "poppy",
    userId,
  };
}

/** Cloudflare's demo bot signs with the RFC 9421 test key, which its directory publishes. */
export async function demoBot(signatureAgent: string): Promise<Agent> {
  const x = "JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs";
  // RFC 9421 appendix B.1.4 test-key-ed25519: public by design, never a real credential.
  const d = "n4Ni-HpISpVObnQMW0wOhCKROaIKqKtW_2ZYb2p9KcU";
  const key = {
    privateKey: await crypto.subtle.importKey(
      "jwk",
      { crv: "Ed25519", d, kty: "OKP", x },
      { name: "Ed25519" },
      false,
      ["sign"],
    ),
    publicKey: await crypto.subtle.importKey(
      "jwk",
      { crv: "Ed25519", kty: "OKP", x },
      { name: "Ed25519" },
      true,
      ["verify"],
    ),
  };
  return { key, kind: "webBotAuth", signatureAgent };
}
