// The browser client: an mppx client that pays with your linked Tempo Wallet, plus the
// identity provers you plug in. Each prover lets it answer the server's identity requests,
// so it can ask for a cheaper tier.
import { Mppx, tempo } from "mppx/client";
import * as EmailOtp from "mppx/extensions/identity/email-otp";
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
