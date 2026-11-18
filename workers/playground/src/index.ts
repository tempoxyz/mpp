// One Worker for every playground under mpp.dev/playground: each playground's server
// answers its own path, with its own Durable Object store.
import identity from "./identity/server.js";
import session from "./session/server.js";

export { MppxStore } from "./identity/server.js";
export { MppxStore as SessionStore } from "./session/server.js";

type Env = Parameters<typeof identity.fetch>[1] &
  Omit<Parameters<typeof session.fetch>[1], "MPPX_STORE"> & {
    /** Durable Object namespace of the session playground's store. */
    SESSION_STORE: Parameters<typeof session.fetch>[1]["MPPX_STORE"];
  };

/** The paths each playground serves. */
const playgrounds = {
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
    // The identity playground also answers the bare Worker, as it did on its own.
    return identity.fetch(request, env);
  },
};
