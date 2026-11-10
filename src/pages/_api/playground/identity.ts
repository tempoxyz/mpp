import { proxy } from "../../../identity-playground-proxy.ts";

/**
 * The page, built with mpp.dev (scripts/copy-identity-playground.ts copies its assets to
 * public/), so Vercel's edge serves it. Each deploy is atomic, so the page and the assets it
 * names always match, and the edge keeps it until the next deploy. Without a build of the
 * playground (local dev), the page is proxied to the Worker like its API.
 */
const built = Object.values(
  (
    import.meta as ImportMeta & {
      glob: (
        pattern: string,
        options: { eager: true; import: "default"; query: "?raw" },
      ) => Record<string, string>;
    }
  ).glob(
    "../../../../workers/identity-playground/dist/client/playground/identity/index.html",
    { eager: true, import: "default", query: "?raw" },
  ),
)[0];

function page(request: Request) {
  // Previews keep 404ing like the API, which only runs on mpp.dev.
  if (!built || process.env.VERCEL_ENV === "preview") return proxy(request);
  return new Response(request.method === "HEAD" ? null : built, {
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": "text/html; charset=utf-8",
      "vercel-cdn-cache-control": "max-age=31536000",
    },
  });
}

export const GET = page;
export const HEAD = page;
export const POST = proxy;
