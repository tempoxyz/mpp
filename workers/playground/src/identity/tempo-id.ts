// The Tempo ID tier: a person signs in with Tempo ID (a passkey), and the haiku API reads the
// access token's user, email and compliance states before it names a price.
//
// The playground is a Tempo ID app with no registration: its client ID is the URL of the
// metadata document below, which Tempo ID fetches from mpp.dev. Tokens of an unregistered app carry
// an empty `compliance` claim; once Tempo ID registers mpp.dev, set TEMPO_ID_CLIENT_ID to the
// registered client ID and accounts that screen as `blocked` or `exit_only` are refused before
// any payment.
import * as TempoId from "mppx/extensions/identity/tempo";
import type { Store } from "mppx/server";

/** Tempo ID's origin. */
export const issuer = "https://id.tempo.xyz";

/** The playground's client ID: the URL of its OAuth client metadata document. */
export const clientId = "https://mpp.dev/playground/identity/api/tempo-id.json";

/** Where Tempo ID returns the sign-in: the playground itself, which hands the code to its opener. */
export const redirectUri = "https://mpp.dev/playground/identity/";

export type Env = {
  /** The registered Tempo ID client ID, once Tempo ID registers mpp.dev. Optional. */
  TEMPO_ID_CLIENT_ID?: string | undefined;
};

/** The client ID the page signs in with: the registered one when set, else the metadata document. */
export function client(env: Env) {
  return env.TEMPO_ID_CLIENT_ID?.trim() || clientId;
}

/** The metadata document Tempo ID reads at {@link clientId}. */
export function metadata(): Response {
  return Response.json({
    client_id: clientId,
    client_name: "MPP Playground",
    client_uri: "https://mpp.dev/playground/identity",
    grant_types: ["authorization_code"],
    redirect_uris: [redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
}

/** Compliance states that refuse a payment. A missing state (an unregistered app) refuses nothing. */
const refused = new Set<string>(["blocked", "exit_only"]);

/** The Tempo ID verifier: any token of the playground's app, refusing flagged accounts. */
export function create(parameters: { env: Env; store: Store.AtomicStore }) {
  const { env, store } = parameters;
  return TempoId.Server.create({
    // A flagged account is refused (403) before the 402, so no money moves.
    allow: (user) =>
      !Object.values(user.compliance).some((state) => refused.has(state)),
    chainId: 42431,
    // Once registered, only the registered app's tokens count: the unregistered app's carry
    // no compliance states, so accepting them would skip the screening.
    clientId: [client(env)],
    issuer,
    store,
  }).verifier;
}
