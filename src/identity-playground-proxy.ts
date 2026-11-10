/** The deployed identity playground Worker (workers/identity-playground). */
const DEFAULT_WORKER_ORIGIN =
  "https://mpp-identity-playground.porto.workers.dev";

/** Headers for one connection only (RFC 9110, section 7.6.1). */
const HOP_BY_HOP = [
  "connection",
  "keep-alive",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

/** Where mpp.dev serves the playground. */
const BASE = "/playground/identity";

/**
 * Proxies a request under /playground/identity to the playground Worker.
 * A route, not a vercel.ts rewrite: Vocs's catch-all route answers before external rewrites.
 */
export async function proxy(request: Request) {
  // Production only: attestations are bound to https://mpp.dev, so preview hosts can't verify.
  if (process.env.VERCEL_ENV === "preview")
    return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  // Vercel drops trailing slashes, so the unslashed base serves the page itself
  // instead of following the Worker's redirect back to the slashed path.
  const path = url.pathname === BASE ? `${BASE}/` : url.pathname;
  const headers = new Headers(request.headers);
  for (const name of [...HOP_BY_HOP, "host"]) headers.delete(name);

  const init: RequestInit = {
    headers,
    method: request.method,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD")
    init.body = await request.arrayBuffer();

  const upstream = await fetch(`${workerOrigin()}${path}${url.search}`, init);
  const responseHeaders = new Headers(upstream.headers);
  // fetch already decoded the body; hop-by-hop headers don't cross the proxy.
  for (const name of [...HOP_BY_HOP, "content-encoding", "content-length"])
    responseHeaders.delete(name);
  return new Response(upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
    statusText: upstream.statusText,
  });
}

/** The Worker's origin: IDENTITY_PLAYGROUND_WORKER_ORIGIN overrides the deployed one. */
function workerOrigin() {
  const url = new URL(
    process.env.IDENTITY_PLAYGROUND_WORKER_ORIGIN?.trim() ||
      DEFAULT_WORKER_ORIGIN,
  );
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error(
      "IDENTITY_PLAYGROUND_WORKER_ORIGIN must be an HTTP(S) origin",
    );
  return url.origin;
}
