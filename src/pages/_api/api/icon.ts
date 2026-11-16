import { existsSync } from "node:fs";
import { join } from "node:path";

/** Public Vercel Blob store that scripts/sync-logos.ts uploads to. */
const LOGO_BLOB_BASE_URL =
  process.env.LOGO_BLOB_BASE_URL ??
  "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com";

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
};

const FALLBACK_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "Content-Type": "image/svg+xml",
};

function letterSvg(id: string): string {
  const letter = (id[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

async function blobGet(
  id: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  try {
    // The store is public: fetch the object directly instead of listing it.
    for (const ext of ["png", "svg"]) {
      const res = await fetch(
        `${LOGO_BLOB_BASE_URL}/logos/${encodeURIComponent(id)}.${ext}`,
      );
      if (res.ok && res.body) {
        const ct =
          res.headers.get("content-type") ??
          (ext === "svg" ? "image/svg+xml" : `image/${ext}`);
        return { body: res.body, contentType: ct };
      }
    }
  } catch (e) {
    console.error(`[icon] blob read error for ${id}:`, e);
  }
  return null;
}

async function staticIcon(
  request: Request,
  id: string,
): Promise<Response | null> {
  try {
    const path = `/icons/${encodeURIComponent(id)}.svg`;
    // Vercel hands the function an http:// request URL: probe over the
    // client's protocol so the HEAD isn't redirected, and redirect with a
    // relative Location so the browser stays on https.
    const probe = new URL(path, request.url);
    if (request.headers.get("x-forwarded-proto") === "https") {
      probe.protocol = "https:";
    }
    if (
      import.meta.env.DEV &&
      existsSync(join(process.cwd(), "public", "icons", `${id}.svg`))
    ) {
      return new Response(null, {
        status: 302,
        headers: { ...CACHE_HEADERS, Location: path },
      });
    }
    const res = await fetch(probe, { method: "HEAD" });
    if (res.ok) {
      return new Response(null, {
        status: 302,
        headers: { ...CACHE_HEADERS, Location: path },
      });
    }
  } catch {
    // static file not available
  }
  return null;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("Missing id parameter", { status: 400 });

  // 1. Static override (public/icons/*.svg) — hand-curated icons take priority
  const override = await staticIcon(request, id);
  if (override) return override;

  // 2. Vercel Blob (logo.dev sync)
  const blob = await blobGet(id);
  if (blob) {
    return new Response(blob.body, {
      headers: { "Content-Type": blob.contentType, ...CACHE_HEADERS },
    });
  }

  // 3. Letter SVG (guaranteed — never 404)
  console.warn(`[icon] no icon found for ${id}, generating letter fallback`);
  return new Response(letterSvg(id), { headers: FALLBACK_HEADERS });
}
