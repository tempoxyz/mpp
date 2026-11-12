// One Worker for every playground under mpp.dev/playground: each playground's server
// answers its own path, with its own Durable Object store.
import charge from "./charge/server.js";
import discovery from "./discovery/server.js";
import identity from "./identity/server.js";
import session from "./session/server.js";

export { MppxStore } from "./identity/server.js";
export { MppxStore as SessionStore } from "./session/server.js";
export { ChargeStore } from "./shared/charge-server.js";

type Env = Parameters<typeof identity.fetch>[1] &
  Omit<Parameters<typeof session.fetch>[1], "MPPX_STORE"> &
  Parameters<typeof charge.fetch>[1] & {
    /** Durable Object namespace of the session playground's store. */
    SESSION_STORE: Parameters<typeof session.fetch>[1]["MPPX_STORE"];
  };

/** The paths each playground serves. */
const playgrounds = {
  charge: "/playground/charge",
  discovery: "/playground/discovery",
  identity: "/playground/identity",
  session: "/playground/session",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    context: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    const under = (base: string) =>
      pathname === base || pathname.startsWith(`${base}/`);
    if (under(playgrounds.session))
      return session.fetch(
        request,
        { ...env, MPPX_STORE: env.SESSION_STORE },
        context,
      );
    if (under(playgrounds.charge)) return charge.fetch(request, env);
    if (under(playgrounds.discovery)) return discovery.fetch(request, env);
    // The identity playground also answers the bare Worker, as it did on its own.
    return identity.fetch(request, env);
  },
};
