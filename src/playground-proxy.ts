/** The deployed playground Worker (workers/playground). */
const DEFAULT_WORKER_ORIGIN = "https://mpp-playground.porto.workers.dev";

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

/** Where mpp.dev serves the playgrounds, and each playground's page. */
const BASE = "/playground";
const PAGES = [
  "/playground/identity",
  "/playground/session",
  "/playground/charge",
  "/playground/discovery",
];

/**
 * How long browsers and Vercel's CDN keep each response, so repeat visits skip the
 * function and the Worker. Vite's assets are content-hashed, so they never change;
 * the fonts rarely do. The page is never cached: a Worker deploy replaces the assets
 * it names, so a stale copy would load chunks that no longer exist.
 */
function cacheControl(pathname: string) {
  if (pathname.startsWith(`${BASE}/assets/`))
    return {
      browser: "public, max-age=31536000, immutable",
      cdn: "max-age=31536000",
    };
  if (pathname.startsWith(`${BASE}/fonts/`))
    return { browser: "public, max-age=86400", cdn: "max-age=604800" };
  if (PAGES.some((page) => pathname === page || pathname === `${page}/`))
    return { browser: "no-cache", cdn: "no-store" };
  return undefined;
}

/**
 * Proxies a request under /playground (a playground, its API or the pages' shared assets) to
 * the playground Worker.
 * A route, not a vercel.ts rewrite: Vocs's catch-all route answers before external rewrites.
 */
export async function proxy(request: Request) {
  // Production only: identity attestations are bound to https://mpp.dev and session Challenges
  // name it as their realm, so preview hosts can't use them.
  if (process.env.VERCEL_ENV === "preview")
    return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  // Vercel drops trailing slashes, so the unslashed base serves the page itself
  // instead of following the Worker's redirect back to the slashed path.
  const path = PAGES.includes(url.pathname) ? `${url.pathname}/` : url.pathname;
  const headers = new Headers(request.headers);
  // fetch decodes only the encodings it asks for itself (no zstd), so let it negotiate.
  for (const name of [...HOP_BY_HOP, "accept-encoding", "host"])
    headers.delete(name);

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
  const cache =
    request.method === "GET" && upstream.status === 200
      ? cacheControl(url.pathname)
      : undefined;
  if (cache) {
    responseHeaders.set("cache-control", cache.browser);
    responseHeaders.set("vercel-cdn-cache-control", cache.cdn);
  }
  return new Response(upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
    statusText: upstream.statusText,
  });
}

/** The Worker's origin: PLAYGROUND_WORKER_ORIGIN overrides the deployed one. */
function workerOrigin() {
  const url = new URL(
    process.env.PLAYGROUND_WORKER_ORIGIN?.trim() || DEFAULT_WORKER_ORIGIN,
  );
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("PLAYGROUND_WORKER_ORIGIN must be an HTTP(S) origin");
  return url.origin;
}
